import { afterEach, describe, expect, test, vi } from "vitest";
import {
    createBangkokFixture,
    createBoundaryFixture,
    createDuplicateSearchFixture,
    createLargeBoundaryFixture,
    createMultipartBoundaryFixture,
    createUnsupportedGeometryFixture
} from "./fixtures/boundaries.js";
import { createUserscriptHarness } from "./helpers/userscript-harness.js";

const openHarnesses = [];
const V201_FIXED_PANE_TEXT = [
    "ขอบเขตการปกครอง",
    "คำแนะนำ:",
    "กรุงเทพฯ: แสดงเขต",
    "ต่างจังหวัด: แสดงตำบล, อำเภอ",
    "จังหวัด:",
    "โหลดข้อมูล",
    "ยกเลิกการโหลด",
    "ลบเส้นออก",
    "0%",
    "--:--",
    "สถานะ: พร้อมใช้งาน",
    "วาร์ปปป",
    "-- เลือกอำเภอ/เขต --"
];
const APPROVED_FIXED_COPY_ADDITIONS = [
    "สีเส้น:",
    "ความทึบของเส้น:"
];

/**
 * Reads text written through either innerText or textContent in jsdom.
 *
 * @param {HTMLElement} element Element to inspect.
 * @returns {string} Current text.
 */
function getElementText(element) {
    return typeof element.innerText === "string" ? element.innerText : element.textContent;
}

/**
 * Captures every fixed text node and placeholder rendered by the sidebar.
 * Province datalist values are data rather than interface copy and are excluded.
 *
 * @param {object} harness Userscript harness.
 * @returns {{paneText: string[], placeholders: Array<{id: string, value: string}>}} Copy manifest.
 */
function getFixedInterfaceCopy(harness) {
    const walker = harness.document.createTreeWalker(
        harness.tabPane,
        harness.window.NodeFilter.SHOW_TEXT
    );
    const paneText = [];
    while (walker.nextNode()) {
        const value = walker.currentNode.nodeValue.trim();
        const parent = walker.currentNode.parentElement;
        if (value && !parent?.closest("datalist")) paneText.push(value);
    }

    const placeholders = [...harness.tabPane.querySelectorAll("[placeholder]")]
        .map(element => ({ id: element.id, value: element.getAttribute("placeholder") }));
    return { paneText, placeholders };
}

/**
 * Creates and tracks a harness for automatic cleanup.
 *
 * @param {object} [options] Harness options.
 * @returns {Promise<object>} Userscript harness.
 */
async function createHarness(options) {
    const harness = await createUserscriptHarness(options);
    openHarnesses.push(harness);
    return harness;
}

/**
 * Downloads and fully renders one uncached province fixture.
 *
 * @param {object} harness Userscript harness.
 * @param {object} fixture GeoJSON fixture.
 * @param {string} [provinceName="สมุทรปราการ"] Province display name.
 * @returns {Promise<void>}
 */
async function completeDownloadedLoad(harness, fixture, provinceName = "สมุทรปราการ") {
    const requestCount = harness.requests.length;
    harness.startLoad(provinceName);
    expect(harness.requests).toHaveLength(requestCount + 1);
    await harness.respondJson(fixture, harness.requests.at(-1));
    await harness.flushAnimationFrames();
    await harness.settleMicrotasks();
}

afterEach(() => {
    for (const harness of openHarnesses.splice(0)) {
        harness.close();
    }
    vi.restoreAllMocks();
});

describe("SDK bootstrap and preserved interface", () => {
    test("initializes through the SDK and preserves existing display strings", async () => {
        const harness = await createHarness();

        expect(harness.getWmeSdk).toHaveBeenCalledWith({
            scriptId: "wme-th-tambon-tab-v3",
            scriptName: "ขอบเขตการปกครอง"
        });
        expect(harness.sdk.Sidebar.registerScriptTab).toHaveBeenCalledOnce();
        expect(harness.tabLabel.textContent).toBe("🇹🇭");
        expect(harness.tabLabel.title).toBe("ขอบเขตการปกครอง");

        expect(harness.document.getElementById("tb-province-input").placeholder)
            .toBe("-- พิมพ์หรือคลิกเพื่อเลือก --");
        expect(harness.document.querySelector("#tb-district-select option").textContent)
            .toBe("-- เลือกอำเภอ/เขต --");
        expect(harness.document.getElementById("tb-feature-search").placeholder)
            .toBe("ค้นหาอำเภอ/เขต/ตำบล");
    });

    test("contains no legacy W or OpenLayers integration", async () => {
        const harness = await createHarness();

        expect(harness.source).not.toMatch(/\bOpenLayers\b/);
        expect(harness.source).not.toMatch(/\bW\s*(?:\.|\?\.)/);
        for (const forbiddenSymbol of [
            "dangerouslyAddFeaturesToLayerWithoutValidation",
            "setLayerOpacity",
            "wme-map-move-end",
            "getMapExtent",
            "removeFeaturesFromLayer",
            "viewportSession",
            "refreshViewportFeatures",
            "visibleIds"
        ]) {
            expect(harness.source).not.toContain(forbiddenSymbol);
        }
    });

    test("preserves the exact v2.0.1 interface copy plus three approved additions", async () => {
        const harness = await createHarness();
        const manifest = getFixedInterfaceCopy(harness);

        expect(harness.tabLabel.textContent).toBe("🇹🇭");
        expect(harness.tabLabel.title).toBe("ขอบเขตการปกครอง");
        expect(manifest.paneText.filter(value => !APPROVED_FIXED_COPY_ADDITIONS.includes(value)))
            .toEqual(V201_FIXED_PANE_TEXT);
        expect(manifest.paneText.filter(value => APPROVED_FIXED_COPY_ADDITIONS.includes(value)))
            .toEqual(APPROVED_FIXED_COPY_ADDITIONS);
        expect(manifest.placeholders).toEqual([
            { id: "tb-province-input", value: "-- พิมพ์หรือคลิกเพื่อเลือก --" },
            { id: "tb-feature-search", value: "ค้นหาอำเภอ/เขต/ตำบล" }
        ]);
    });

    test("rejects previously proposed draft interface copy", async () => {
        const harness = await createHarness();

        const forbiddenDraftStrings = [
            "<span>TH</span>",
            "ความเร็วขึ้นอยู่กับขนาดพื้นที่และอินเตอร์เน็ต",
            "กำลังโหลดข้อมูล:",
            "กำลังแสดงมุมมอง...",
            "กำลังโหลดเฉพาะมุมมองปัจจุบัน...",
            "อัปเดตมุมมองแล้ว",
            "พื้นที่ในหน้าจอ",
            "โหมดเร็ว: ปิดชื่อพื้นที่",
            "wme-th-tambon-tab-v2"
        ];
        for (const value of forbiddenDraftStrings) {
            expect(harness.source, `Old draft string returned: ${value}`).not.toContain(value);
        }
    });

    test("retains userscript metadata needed by WME and userscript managers", async () => {
        const harness = await createHarness();
        const metadata = harness.source
            .slice(0, harness.source.indexOf("// ==/UserScript==") + "// ==/UserScript==".length)
            .split(/\r?\n/)
            .filter(line => line.startsWith("// @"));

        expect(metadata).toEqual([
            "// @name         WME Thailand Tambon",
            "// @namespace    https://github.com/wazeth/",
            "// @version      2.0.1",
            "// @description  แสดงขอบเขตตำบล",
            "// @author       Waze Thailand",
            "// @match        https://*.waze.com/*/editor*",
            "// @match        https://*.waze.com/editor*",
            "// @exclude      https://*.waze.com/user/editor*",
            "// @run-at       document-idle",
            "// @grant        GM_xmlhttpRequest",
            "// @grant        GM_getValue",
            "// @grant        GM_setValue",
            "// @grant        unsafeWindow",
            "// @license      MIT"
        ]);
    });

    test("awaits asynchronous sidebar registration before building the interface", async () => {
        const harness = await createHarness({ deferSidebarRegistration: true });

        expect(harness.sdk.Sidebar.registerScriptTab).toHaveBeenCalledOnce();
        expect(harness.document.getElementById("tb-load-btn")).toBeNull();

        harness.resolveSidebarRegistration();
        await harness.settleMicrotasks();

        expect(harness.document.getElementById("tb-load-btn")).not.toBeNull();
        expect(harness.tabLabel.textContent).toBe("🇹🇭");
    });

    test("stops initialization when a required SDK capability is unavailable", async () => {
        const harness = await createHarness({
            configureSdk: sdk => {
                delete sdk.Map.redrawLayer;
            }
        });

        expect(harness.sdk.Sidebar.registerScriptTab).not.toHaveBeenCalled();
        expect(harness.consoleError).toHaveBeenCalled();
        const reportedError = harness.consoleError.mock.calls.flat().find(value => (
            value && typeof value === "object" && "message" in value
        ));
        expect(String(reportedError?.message)).toContain("Map.redrawLayer");
    });
});

describe("full boundary rendering", () => {
    test("adds every Polygon and MultiPolygon part without viewport filtering", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createBoundaryFixture());
        await harness.flushAnimationFrames();

        const addedFeatures = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features);
        expect(addedFeatures).toHaveLength(3);
        expect(addedFeatures.every(feature => feature.geometry.type === "Polygon")).toBe(true);
        expect(new Set(addedFeatures.map(feature => feature.id)).size).toBe(3);
        expect(addedFeatures.map(feature => feature.id)).toEqual([
            "1-TH990101-0",
            "1-TH990201-0",
            "1-TH990201-1"
        ]);
        expect(addedFeatures.map(feature => feature.properties.__tbLabel)).toEqual([
            "กลาง, เมืองหนึ่ง",
            "บ้านใหม่, เมืองสอง",
            ""
        ]);

        expect(harness.sdk.Map.getMapExtent).not.toHaveBeenCalled();
        const subscribedEvents = harness.sdk.Events.on.mock.calls.map(([args]) => args.eventName);
        expect(subscribedEvents).not.toContain("wme-map-move");
        expect(subscribedEvents).not.toContain("wme-map-move-end");

        expect(harness.sdk.LayerSwitcher.addLayerCheckbox).toHaveBeenCalledWith({
            isChecked: true,
            name: "Thailand Boundary Overlay"
        });
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("✅ แสดงผลเรียบร้อย (2 พื้นที่)");
    });

    test("does not reveal the layer until all feature batches complete", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture());

        const visibleBeforeCompletion = harness.sdk.Map.setLayerVisibility.mock.calls
            .some(([args]) => args.visibility === true);
        expect(visibleBeforeCompletion).toBe(false);

        await harness.flushAnimationFrames();

        const visibilityCalls = harness.sdk.Map.setLayerVisibility.mock.calls.map(([args]) => args.visibility);
        expect(visibilityCalls.at(-1)).toBe(true);
        const addedFeatures = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features);
        expect(addedFeatures).toHaveLength(60);
    });

    test("synchronizes checkbox changes made while SDK insertion is active", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture());

        while (harness.sdk.Map.addFeaturesToLayer.mock.calls.length === 0) {
            expect(await harness.runNextAnimationFrame()).toBe(true);
        }
        const visibilityCallCount = harness.sdk.Map.setLayerVisibility.mock.calls.length;
        harness.emitSdkEvent("wme-layer-checkbox-toggled", {
            checked: false,
            name: "Thailand Boundary Overlay"
        });
        expect(harness.sdk.Map.setLayerVisibility).toHaveBeenCalledTimes(visibilityCallCount);

        await harness.flushAnimationFrames();
        expect(harness.sdk.Map.setLayerVisibility.mock.calls.at(-1)[0].visibility).toBe(false);

        harness.emitSdkEvent("wme-layer-checkbox-toggled", {
            checked: true,
            name: "Thailand Boundary Overlay"
        });
        expect(harness.sdk.Map.setLayerVisibility.mock.calls.at(-1)[0]).toEqual({
            layerName: "wme-thailand-tambon-boundary",
            visibility: true
        });

        harness.emitSdkEvent("wme-layer-checkbox-toggled", {
            checked: false,
            name: "Thailand Boundary Overlay"
        });
        expect(harness.sdk.Map.setLayerVisibility.mock.calls.at(-1)[0]).toEqual({
            layerName: "wme-thailand-tambon-boundary",
            visibility: false
        });

        const visibilityCallCountAfterCompletion = harness.sdk.Map.setLayerVisibility.mock.calls.length;
        harness.emitSdkEvent("wme-layer-checkbox-toggled", {
            checked: true,
            name: "Some Other Layer"
        });
        expect(harness.sdk.Map.setLayerVisibility)
            .toHaveBeenCalledTimes(visibilityCallCountAfterCompletion);
    });

    test("keeps every SDK insertion batch at or below twenty polygons", async () => {
        const harness = await createHarness();
        await completeDownloadedLoad(harness, createLargeBoundaryFixture(61));

        const batchSizes = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .map(([args]) => args.features.length);
        expect(batchSizes.length).toBeGreaterThan(1);
        expect(batchSizes.every(size => size > 0 && size <= 20)).toBe(true);
        expect(batchSizes.reduce((sum, size) => sum + size, 0)).toBe(61);
    });

    test("prepares multipart areas in slices of at most twenty polygons", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createMultipartBoundaryFixture());

        let preparationFrameCount = 0;
        while (harness.sdk.Map.addLayer.mock.calls.length === 0) {
            expect(await harness.runNextAnimationFrame()).toBe(true);
            preparationFrameCount += 1;
            expect(preparationFrameCount).toBeLessThan(10);
        }
        expect(preparationFrameCount).toBeGreaterThanOrEqual(2);

        await harness.flushAnimationFrames();
        const addedFeatures = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features);
        expect(addedFeatures).toHaveLength(54);
    });

    test("uses the zoom threshold and correct Bangkok and provincial labels", async () => {
        const provincialHarness = await createHarness();
        await completeDownloadedLoad(provincialHarness, createBoundaryFixture());
        const provincialLayer = provincialHarness.sdk.Map.addLayer.mock.calls[0][0];
        const provincialFeature = provincialHarness.sdk.Map.addFeaturesToLayer.mock.calls[0][0].features[0];
        expect(provincialLayer.styleContext.getLabel({
            feature: provincialFeature,
            zoomLevel: 11
        })).toBe("");
        expect(provincialLayer.styleContext.getLabel({
            feature: provincialFeature,
            zoomLevel: 12
        })).toBe("กลาง, เมืองหนึ่ง");

        const bangkokHarness = await createHarness();
        await completeDownloadedLoad(bangkokHarness, createBangkokFixture(), "กรุงเทพมหานคร");
        const bangkokLayer = bangkokHarness.sdk.Map.addLayer.mock.calls[0][0];
        const bangkokFeature = bangkokHarness.sdk.Map.addFeaturesToLayer.mock.calls[0][0].features[0];
        expect(bangkokLayer.styleContext.getLabel({
            feature: bangkokFeature,
            zoomLevel: 12
        })).toBe("พระนคร");
    });
});

describe("cancellation and failure cleanup", () => {
    test("aborts an active download and preserves the cancellation message", async () => {
        const harness = await createHarness();
        const request = harness.startLoad();

        harness.document.getElementById("tb-cancel-btn").click();
        await harness.settleMicrotasks();
        await harness.flushAnimationFrames();

        expect(request.abort).toHaveBeenCalledOnce();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ยกเลิกการโหลดแล้ว");
    });

    test("invalidates queued processing work after cancellation", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture());

        harness.document.getElementById("tb-cancel-btn").click();
        await harness.flushAnimationFrames();

        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(harness.document.getElementById("tb-navigator-container").style.display).toBe("none");
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ยกเลิกการโหลดแล้ว");
    });

    test("removes a partial layer instead of silently skipping an SDK add failure", async () => {
        const harness = await createHarness({
            onAddFeatures: () => {
                throw new Error("SDK rejected geometry");
            }
        });
        harness.startLoad();
        await harness.respondJson(createBoundaryFixture());
        await harness.flushAnimationFrames();

        expect(harness.sdk.Map.removeLayer).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary"
        });
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox).toHaveBeenCalledWith({
            name: "Thailand Boundary Overlay"
        });
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toMatch(/^❌ ผิดพลาด: /);
        expect(harness.sdk.Map.setLayerVisibility.mock.calls)
            .not.toContainEqual([{ layerName: "wme-thailand-tambon-boundary", visibility: true }]);
    });

    test("cancels during SDK insertion without completing the partial layer", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture());

        while (harness.sdk.Map.addFeaturesToLayer.mock.calls.length === 0) {
            expect(await harness.runNextAnimationFrame()).toBe(true);
        }
        harness.document.getElementById("tb-cancel-btn").click();
        await harness.flushAnimationFrames();

        const insertedCount = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features)
            .length;
        expect(insertedCount).toBeGreaterThan(0);
        expect(insertedCount).toBeLessThan(60);
        expect(harness.sdk.Map.removeLayer).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary"
        });
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox).toHaveBeenCalledWith({
            name: "Thailand Boundary Overlay"
        });
        expect(harness.sdk.Map.setLayerVisibility.mock.calls.at(-1)[0].visibility).toBe(false);
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ยกเลิกการโหลดแล้ว");
    });

    test("rejects unsupported geometry before creating a layer", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createUnsupportedGeometryFixture());
        await harness.flushAnimationFrames();
        await harness.settleMicrotasks(12);

        expect(harness.sdk.Map.addLayer).not.toHaveBeenCalled();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toContain("Unsupported GeoJSON geometry: LineString");
    });

    test("rejects a source area without a stable administrative code", async () => {
        const harness = await createHarness();
        const fixture = createBoundaryFixture();
        delete fixture.features[0].properties.ADM3_PCODE;
        harness.startLoad();
        await harness.respondJson(fixture);
        await harness.flushAnimationFrames();
        await harness.settleMicrotasks(12);

        expect(harness.sdk.Map.addLayer).not.toHaveBeenCalled();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("❌ ผิดพลาด: Missing PCode at index 0");
    });

    test("rejects an empty Polygon before creating a layer", async () => {
        const harness = await createHarness();
        const fixture = createBoundaryFixture();
        fixture.features[0].geometry.coordinates = [];
        harness.startLoad();
        await harness.respondJson(fixture);
        await harness.flushAnimationFrames();
        await harness.settleMicrotasks(12);

        expect(harness.sdk.Map.addLayer).not.toHaveBeenCalled();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("❌ ผิดพลาด: Invalid GeoJSON geometry: Polygon");
    });
});

describe("layer lifecycle and cache", () => {
    test("replaces provinces, reuses recent cache entries, and evicts least-recently-used data", async () => {
        const harness = await createHarness();
        const fixture = createBoundaryFixture();
        await completeDownloadedLoad(harness, fixture, "สมุทรปราการ");
        await completeDownloadedLoad(harness, fixture, "นนทบุรี");

        const requestCountBeforeCacheHit = harness.requests.length;
        harness.startLoad("สมุทรปราการ");
        await harness.settleMicrotasks();
        await harness.flushAnimationFrames();
        expect(harness.requests).toHaveLength(requestCountBeforeCacheHit);

        await completeDownloadedLoad(harness, fixture, "ปทุมธานี");
        await completeDownloadedLoad(harness, fixture, "นนทบุรี");

        expect(harness.requests).toHaveLength(4);
        expect(harness.sdk.Map.addLayer).toHaveBeenCalledTimes(5);
        expect(harness.sdk.Map.removeLayer.mock.calls.length).toBeGreaterThanOrEqual(4);
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox.mock.calls.length)
            .toBeGreaterThanOrEqual(4);
    });

    test("clear removes the layer, checkbox, and navigator state", async () => {
        const harness = await createHarness();
        await completeDownloadedLoad(harness, createBoundaryFixture());
        const search = harness.document.getElementById("tb-feature-search");
        search.value = "บ้านใหม่";
        search.dispatchEvent(new harness.window.Event("input", { bubbles: true }));

        harness.document.getElementById("tb-clear-btn").click();

        expect(harness.sdk.Map.removeLayer).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary"
        });
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox).toHaveBeenCalledWith({
            name: "Thailand Boundary Overlay"
        });
        expect(search.value).toBe("");
        expect(harness.document.getElementById("tb-navigator-container").style.display).toBe("none");
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ลบเส้นแล้ว");
    });
});

describe("persistent outline settings", () => {
    test("loads validated settings and saves live changes under the approved keys", async () => {
        const harness = await createHarness({
            settings: {
                "wme-th-tambon:outline-color": "#00AA44",
                "wme-th-tambon:outline-opacity": 0.35
            }
        });
        const color = harness.document.getElementById("tb-outline-color");
        const opacity = harness.document.getElementById("tb-outline-opacity");

        expect(color.value).toBe("#00aa44");
        expect(opacity.value).toBe("0.35");

        color.value = "#112233";
        color.dispatchEvent(new harness.window.Event("input", { bubbles: true }));
        color.dispatchEvent(new harness.window.Event("change", { bubbles: true }));
        opacity.value = "0.65";
        opacity.dispatchEvent(new harness.window.Event("input", { bubbles: true }));
        opacity.dispatchEvent(new harness.window.Event("change", { bubbles: true }));

        expect(harness.gmSetValue.mock.calls).toContainEqual([
            "wme-th-tambon:outline-color",
            "#112233"
        ]);
        expect(harness.gmSetValue.mock.calls).toContainEqual([
            "wme-th-tambon:outline-opacity",
            0.65
        ]);
    });

    test("falls back to the preserved defaults for invalid stored settings", async () => {
        const harness = await createHarness({
            settings: {
                "wme-th-tambon:outline-color": "not-a-color",
                "wme-th-tambon:outline-opacity": 4
            }
        });

        expect(harness.document.getElementById("tb-outline-color").value).toBe("#ff0000");
        expect(harness.document.getElementById("tb-outline-opacity").value).toBe("0.8");
    });

    test("does not coerce a string-valued persisted opacity", async () => {
        const harness = await createHarness({
            settings: { "wme-th-tambon:outline-opacity": "0.5" }
        });

        expect(harness.document.getElementById("tb-outline-opacity").value).toBe("0.8");
    });

    test("redraws an existing completed layer after a style change", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createBoundaryFixture());
        await harness.flushAnimationFrames();
        harness.sdk.Map.redrawLayer.mockClear();

        const color = harness.document.getElementById("tb-outline-color");
        color.value = "#112233";
        color.dispatchEvent(new harness.window.Event("input", { bubbles: true }));

        expect(harness.sdk.Map.redrawLayer).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary"
        });
        expect(harness.sdk.Map.setLayerOpacity).not.toHaveBeenCalled();

        const layer = harness.sdk.Map.addLayer.mock.calls[0][0];
        expect(layer.styleContext.getStrokeColor()).toBe("#112233");
        expect(layer.styleContext.getStrokeOpacity()).toBe(0.8);
    });
});

describe("search and warp", () => {
    test("searches the loaded province and warps with the SDK in WGS84", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createBoundaryFixture());
        await harness.flushAnimationFrames();

        const search = harness.document.getElementById("tb-feature-search");
        search.value = "บ้านใหม่";
        search.dispatchEvent(new harness.window.Event("input", { bubbles: true }));

        const resultButtons = [...harness.document.querySelectorAll("#tb-tambon-list button")];
        expect(resultButtons).toHaveLength(1);
        expect(resultButtons[0].textContent).toBe("บ้านใหม่, เมืองสอง");

        resultButtons[0].click();
        expect(harness.sdk.Map.setMapCenter).toHaveBeenCalledWith({
            lonLat: { lat: 12, lon: 112 },
            zoomLevel: 14
        });
    });

    test("disambiguates global duplicates and restores the selected district for an empty query", async () => {
        const harness = await createHarness();
        await completeDownloadedLoad(harness, createDuplicateSearchFixture());

        const district = harness.document.getElementById("tb-district-select");
        district.value = "เมืองหนึ่ง";
        district.dispatchEvent(new harness.window.Event("change", { bubbles: true }));
        expect([...harness.document.querySelectorAll("#tb-tambon-list button")])
            .toHaveLength(1);

        const search = harness.document.getElementById("tb-feature-search");
        search.value = "  บ้านใหม่   ";
        search.dispatchEvent(new harness.window.Event("input", { bubbles: true }));
        const duplicateLabels = [...harness.document.querySelectorAll("#tb-tambon-list button")]
            .map(button => button.textContent);
        expect(duplicateLabels).toHaveLength(2);
        expect(duplicateLabels.sort()).toEqual([
            "บ้านใหม่, เมืองหนึ่ง",
            "บ้านใหม่, เมืองสอง"
        ].sort());

        search.value = "";
        search.dispatchEvent(new harness.window.Event("input", { bubbles: true }));
        const restoredButtons = [...harness.document.querySelectorAll("#tb-tambon-list button")];
        expect(restoredButtons).toHaveLength(1);
        expect(restoredButtons[0].textContent).toBe("บ้านใหม่");

        search.value = "บ้านใหม่";
        search.dispatchEvent(new harness.window.Event("input", { bubbles: true }));
        district.value = "เมืองสอง";
        district.dispatchEvent(new harness.window.Event("change", { bubbles: true }));
        expect(search.value).toBe("");
        const districtLabels = [...harness.document.querySelectorAll("#tb-tambon-list button")]
            .map(button => button.textContent);
        expect(districtLabels).toHaveLength(2);
        expect(districtLabels.sort()).toEqual(["กลาง", "บ้านใหม่"].sort());
    });
});
