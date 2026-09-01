import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { vi } from "vitest";

const SCRIPT_PATH = fileURLToPath(new URL("../../tambon.user.script.js", import.meta.url));

/**
 * Lets pending promise continuations finish without advancing animation frames.
 *
 * @param {number} [turns=6] Number of microtask turns to wait.
 * @returns {Promise<void>}
 */
async function settleMicrotasks(turns = 6) {
    for (let index = 0; index < turns; index += 1) {
        await Promise.resolve();
    }
}

/**
 * Creates a black-box browser harness for the userscript.
 *
 * The harness mocks only browser, userscript-manager, and public WME SDK APIs.
 * Tests intentionally do not depend on private function names in the script.
 *
 * @param {object} [options] Harness options.
 * @param {Record<string, unknown>} [options.settings] Initial GM storage values.
 * @param {(args: object) => void} [options.onAddFeatures] Optional SDK add hook.
 * @param {(sdk: object) => void} [options.configureSdk] SDK customization before initialization.
 * @param {boolean} [options.deferSidebarRegistration=false] Keep sidebar registration pending.
 * @param {number[]} [options.mapExtent] Initial WGS84 map extent.
 * @param {number} [options.zoomLevel=14] Initial map zoom.
 * @param {boolean} [options.confirmResult=true] Whole-province confirmation response.
 * @returns {Promise<object>} Harness controls and recorded calls.
 */
export async function createUserscriptHarness(options = {}) {
    const source = await readFile(SCRIPT_PATH, "utf8");
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
        pretendToBeVisual: true,
        runScripts: "outside-only",
        url: "https://www.waze.com/editor"
    });
    const { window } = dom;
    const { document } = window;

    const tabLabel = document.createElement("button");
    tabLabel.id = "test-tab-label";
    const tabPane = document.createElement("section");
    tabPane.id = "test-tab-pane";
    document.body.append(tabLabel, tabPane);

    const eventHandlers = new Map();
    const animationFrames = [];
    const timers = [];
    const requests = [];
    const storage = new Map(Object.entries(options.settings || {}));
    const sidebarRegistrationResult = { tabLabel, tabPane };
    let resolveSidebarRegistration;
    const deferredSidebarRegistration = new Promise(resolve => {
        resolveSidebarRegistration = resolve;
    });
    let mapExtent = options.mapExtent || [99, 9, 115, 15];
    let zoomLevel = options.zoomLevel ?? 14;
    let nextTimerIdentifier = 1;

    const sdk = {
        Events: {
            on: vi.fn(({ eventName, eventHandler }) => {
                const handlers = eventHandlers.get(eventName) || [];
                handlers.push(eventHandler);
                eventHandlers.set(eventName, handlers);
                return vi.fn(() => {
                    const currentHandlers = eventHandlers.get(eventName) || [];
                    eventHandlers.set(
                        eventName,
                        currentHandlers.filter(handler => handler !== eventHandler)
                    );
                });
            })
        },
        LayerSwitcher: {
            addLayerCheckbox: vi.fn(),
            isLayerCheckboxChecked: vi.fn(() => true),
            removeLayerCheckbox: vi.fn(),
            setLayerCheckboxChecked: vi.fn()
        },
        Map: {
            addFeatureToLayer: vi.fn(),
            addFeaturesToLayer: vi.fn(args => {
                if (typeof options.onAddFeatures === "function") {
                    options.onAddFeatures(args);
                }
            }),
            addLayer: vi.fn(),
            getMapExtent: vi.fn(() => [...mapExtent]),
            getZoomLevel: vi.fn(() => zoomLevel),
            redrawLayer: vi.fn(),
            removeAllFeaturesFromLayer: vi.fn(),
            removeFeatureFromLayer: vi.fn(),
            removeFeaturesFromLayer: vi.fn(),
            removeLayer: vi.fn(),
            setLayerOpacity: vi.fn(),
            setLayerVisibility: vi.fn(),
            setLayerZIndex: vi.fn(),
            setMapCenter: vi.fn(),
            zoomToExtent: vi.fn()
        },
        Sidebar: {
            registerScriptTab: vi.fn(() => (
                options.deferSidebarRegistration
                    ? deferredSidebarRegistration
                    : Promise.resolve(sidebarRegistrationResult)
            ))
        }
    };
    if (typeof options.configureSdk === "function") options.configureSdk(sdk);

    const getWmeSdk = vi.fn(() => sdk);
    const gmGetValue = vi.fn((key, defaultValue) => (
        storage.has(key) ? storage.get(key) : defaultValue
    ));
    const gmSetValue = vi.fn((key, value) => {
        storage.set(key, value);
    });
    const gmXmlHttpRequest = vi.fn(requestOptions => {
        const request = {
            abort: vi.fn(() => {
                requestOptions.onabort?.();
            }),
            options: requestOptions
        };
        requests.push(request);
        return request;
    });

    const consoleError = vi.fn();
    const consoleLog = vi.fn();
    const consoleWarn = vi.fn();
    Object.assign(window.console, {
        error: consoleError,
        log: consoleLog,
        warn: consoleWarn
    });

    Object.assign(window, {
        GM_getValue: gmGetValue,
        GM_setValue: gmSetValue,
        GM_xmlhttpRequest: gmXmlHttpRequest,
        SDK_INITIALIZED: Promise.resolve(),
        alert: vi.fn(),
        clearTimeout: vi.fn(identifier => {
            const timer = timers.find(item => item.identifier === identifier);
            if (timer) timer.cancelled = true;
        }),
        confirm: vi.fn(() => options.confirmResult ?? true),
        cancelAnimationFrame: vi.fn(identifier => {
            const frame = animationFrames.find(item => item.identifier === identifier);
            if (frame) frame.cancelled = true;
        }),
        getWmeSdk,
        requestAnimationFrame: vi.fn(callback => {
            const identifier = animationFrames.length + 1;
            animationFrames.push({ callback, cancelled: false, identifier });
            return identifier;
        }),
        setTimeout: vi.fn(callback => {
            const identifier = nextTimerIdentifier;
            nextTimerIdentifier += 1;
            timers.push({ callback, cancelled: false, identifier });
            return identifier;
        })
    });
    window.unsafeWindow = window;

    window.eval(`${source}\n//# sourceURL=tambon.user.script.js`);
    await settleMicrotasks();

    /**
     * Emits an SDK event to every registered handler.
     *
     * @param {string} eventName SDK event name.
     * @param {unknown} detail Event detail.
     * @returns {void}
     */
    function emitSdkEvent(eventName, detail) {
        for (const handler of eventHandlers.get(eventName) || []) {
            handler(detail);
        }
    }

    /**
     * Runs one queued animation frame.
     *
     * @returns {Promise<boolean>} True when a frame was processed.
     */
    async function runNextAnimationFrame() {
        const frame = animationFrames.shift();
        if (!frame) return false;
        if (!frame.cancelled) frame.callback(window.performance.now());
        await settleMicrotasks();
        return true;
    }

    /**
     * Runs queued animation frames until the script becomes idle.
     *
     * @param {number} [limit=2000] Safety limit for runaway scheduling.
     * @returns {Promise<void>}
     */
    async function flushAnimationFrames(limit = 2000) {
        let processed = 0;
        while (animationFrames.length > 0) {
            if (processed >= limit) {
                throw new Error(`Animation frame limit exceeded: ${limit}`);
            }
            await runNextAnimationFrame();
            processed += 1;
        }
    }

    /**
     * Runs all queued userscript timers once.
     *
     * @returns {Promise<void>}
     */
    async function flushTimers() {
        const pending = timers.splice(0);
        for (const timer of pending) {
            if (!timer.cancelled) timer.callback();
        }
        await settleMicrotasks();
    }

    /**
     * Clicks the load button for a named province.
     *
     * @param {string} [provinceName="สมุทรปราการ"] Province display name.
     * @returns {object|undefined} Created GM request, if a download was needed.
     */
    function startLoad(provinceName = "สมุทรปราการ") {
        const input = document.getElementById("tb-province-input");
        const button = document.getElementById("tb-load-btn");
        input.value = provinceName;
        button.click();
        return requests.at(-1);
    }

    /**
     * Clicks the secondary whole-province load button.
     *
     * @param {string} [provinceName="สมุทรปราการ"] Province display name.
     * @returns {object|undefined} Created GM request, if a download was needed.
     */
    function startFullLoad(provinceName = "สมุทรปราการ") {
        const input = document.getElementById("tb-province-input");
        const button = document.getElementById("tb-load-full-btn");
        input.value = provinceName;
        button.click();
        return requests.at(-1);
    }

    /**
     * Completes a mocked GM request with JSON data.
     *
     * @param {object} data Response object.
     * @param {object} [request=requests.at(-1)] Request to complete.
     * @param {number} [status=200] HTTP response status.
     * @returns {Promise<void>}
     */
    async function respondJson(data, request = requests.at(-1), status = 200) {
        if (!request) throw new Error("No pending GM request");
        request.options.onload?.({
            response: data,
            responseText: JSON.stringify(data),
            status
        });
        await settleMicrotasks();
    }

    return {
        animationFrames,
        close: () => dom.window.close(),
        consoleError,
        consoleLog,
        consoleWarn,
        document,
        emitSdkEvent,
        eventHandlers,
        flushAnimationFrames,
        flushTimers,
        getWmeSdk,
        gmGetValue,
        gmSetValue,
        gmXmlHttpRequest,
        requests,
        resolveSidebarRegistration: () => resolveSidebarRegistration(sidebarRegistrationResult),
        respondJson,
        runNextAnimationFrame,
        setMapExtent: extent => {
            mapExtent = [...extent];
        },
        setZoomLevel: value => {
            zoomLevel = value;
        },
        sdk,
        settleMicrotasks,
        source,
        startLoad,
        startFullLoad,
        storage,
        tabLabel,
        tabPane,
        timers,
        window
    };
}
