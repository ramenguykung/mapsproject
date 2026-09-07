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
const FIXED_PANE_TEXT = [
    "ขอบเขตการปกครอง",
    "คำแนะนำ:",
    "กรุงเทพฯ: แสดงเขต",
    "ต่างจังหวัด: แสดงตำบล, อำเภอ",
    "จังหวัด:",
    "สีเส้น:",
    "ความทึบของเส้น:",
    "โหลดพื้นที่ในมุมมอง",
    "โหลดทั้งจังหวัด (ช้ากว่า)",
    "ยกเลิกการโหลด",
    "ลบเส้นออก",
    "0%",
    "--:--",
    "สถานะ: พร้อมใช้งาน",
    "โหลดขอบเขตบริเวณนี้",
    "วาร์ปปป",
    "-- เลือกอำเภอ/เขต --"
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

/**
 * Creates polygons whose coordinate counts exercise the SDK batch budget.
 *
 * @returns {object} GeoJSON fixture.
 */
function createCoordinateBudgetFixture() {
    const coordinateCounts = [6000, 6000, 11001, 5];
    return {
        type: "FeatureCollection",
        features: coordinateCounts.map((coordinateCount, index) => {
            const coordinates = Array.from({ length: coordinateCount - 1 }, (_, pointIndex) => [
                100 + index + ((pointIndex % 100) * 0.00001),
                10 + (Math.floor(pointIndex / 100) * 0.00001)
            ]);
            coordinates.push(coordinates[0]);
            return {
                type: "Feature",
                properties: {
                    ADM2_TH: "เมืองงบประมาณ",
                    ADM3_PCODE: "TH98" + String(index).padStart(4, "0"),
                    ADM3_TH: "พื้นที่งบประมาณ " + index
                },
                geometry: { type: "Polygon", coordinates: [coordinates] }
            };
        })
    };
}

/**
 * Creates one visible boundary plus boundaries just inside and outside 15% padding.
 *
 * @returns {object} GeoJSON fixture.
 */
function createViewportPaddingFixture() {
    /** @type {Array<[string, number, string]>} */
    const definitions = [
        ["TH970001", 100.2, "มองเห็น"],
        ["TH970002", 101.1, "ในระยะเผื่อ"],
        ["TH970003", 101.16, "นอกระยะเผื่อ"]
    ];
    return {
        type: "FeatureCollection",
        features: definitions.map(([pcode, minX, name]) => ({
            type: "Feature",
            properties: {
                ADM2_TH: "เมืองระยะเผื่อ",
                ADM3_PCODE: pcode,
                ADM3_TH: name
            },
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [minX, 10.2],
                    [minX + 0.02, 10.2],
                    [minX + 0.02, 10.4],
                    [minX, 10.4],
                    [minX, 10.2]
                ]]
            }
        }))
    };
}

/**
 * Creates one nearby polygon and one distant multipart polygon for rollback tests.
 *
 * @param {number} [partCount=25] Distant polygon part count.
 * @returns {object} GeoJSON fixture.
 */
function createSeparatedMultipartFixture(partCount = 25) {
    const fixture = createBoundaryFixture();
    fixture.features[1].geometry.coordinates = Array.from({ length: partCount }, (_, index) => {
        const lon = 110 + (index * 0.01);
        return [[
            [lon, 10],
            [lon + 0.005, 10],
            [lon + 0.005, 10.005],
            [lon, 10.005],
            [lon, 10]
        ]];
    });
    return fixture;
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
            "viewportSession",
            "refreshViewportFeatures",
            "visibleIds"
        ]) {
            expect(harness.source).not.toContain(forbiddenSymbol);
        }
    });

    test("preserves the reviewed interface copy for hybrid loading", async () => {
        const harness = await createHarness();
        const manifest = getFixedInterfaceCopy(harness);

        expect(harness.tabLabel.textContent).toBe("🇹🇭");
        expect(harness.tabLabel.title).toBe("ขอบเขตการปกครอง");
        expect(manifest.paneText).toEqual(FIXED_PANE_TEXT);
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

describe("hybrid boundary rendering", () => {
    test("keeps the visual boundary from intercepting native segment selection", async () => {
        const harness = await createHarness({
            configureSdk: sdk => sdk.Map.getLayerZIndex.mockReturnValue(7123)
        });
        await completeDownloadedLoad(harness, createBoundaryFixture());

        expect(harness.sdk.Map.getLayerZIndex).toHaveBeenCalledWith({
            layerName: "segments"
        });
        expect(harness.sdk.Map.setLayerZIndex).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary",
            zIndex: 7122
        });

        const layer = harness.sdk.Map.addLayer.mock.calls[0][0];
        expect(layer.styleRules[0].style).toMatchObject({
            fill: false,
            fillOpacity: 0,
            labelSelect: false,
            pointerEvents: "none"
        });
    });

    test("indexes the province but initially adds only padded-viewport boundaries", async () => {
        const harness = await createHarness({ mapExtent: [99.5, 9.5, 102.5, 12.5] });
        harness.startLoad();
        await harness.respondJson(createBoundaryFixture());
        await harness.flushAnimationFrames();

        const addedFeatures = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features);
        expect(addedFeatures).toHaveLength(1);
        expect(addedFeatures.every(feature => feature.geometry.type === "Polygon")).toBe(true);
        expect(addedFeatures.map(feature => feature.id)).toEqual(["1-TH990101-0"]);
        expect(addedFeatures[0].properties.__tbLabel).toBe("กลาง, เมืองหนึ่ง");

        expect(harness.sdk.Map.getMapExtent).toHaveBeenCalled();
        const subscribedEvents = harness.sdk.Events.on.mock.calls.map(([args]) => args.eventName);
        expect(subscribedEvents).not.toContain("wme-map-move");
        expect(subscribedEvents).toContain("wme-map-move-end");
        expect(subscribedEvents).toContain("wme-map-zoom-changed");

        expect(harness.sdk.LayerSwitcher.addLayerCheckbox).toHaveBeenCalledWith({
            isChecked: true,
            name: "Thailand Boundary Overlay"
        });
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("✅ โหลดพื้นที่ในมุมมองแล้ว (โหลดแล้ว 1/2 พื้นที่)");
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 1/2 พื้นที่");
    });

    test("uses exactly fifteen-percent viewport padding for initial selection", async () => {
        const harness = await createHarness({ mapExtent: [100, 10, 101, 11] });
        await completeDownloadedLoad(harness, createViewportPaddingFixture());

        const addedIds = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features)
            .map(feature => feature.id);
        expect(addedIds).toEqual(["1-TH970001-0", "1-TH970002-0"]);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 2/3 พื้นที่");
    });

    test("prompts after movement and accumulates a new zone only after user input", async () => {
        const harness = await createHarness({ mapExtent: [99.5, 9.5, 102.5, 12.5] });
        await completeDownloadedLoad(harness, createBoundaryFixture());
        harness.sdk.Map.addFeaturesToLayer.mockClear();
        const requestCount = harness.requests.length;

        harness.setMapExtent([109.5, 9.5, 114.5, 14.5]);
        harness.emitSdkEvent("wme-map-move-end");
        expect(harness.window.setTimeout.mock.calls.at(-1)[1]).toBe(180);
        await harness.flushTimers();

        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(harness.document.getElementById("tb-coverage-notice").style.display).toBe("block");
        expect(getElementText(harness.document.getElementById("tb-coverage-message")))
            .toBe("มุมมองนี้มีขอบเขตที่ยังไม่ได้โหลด");

        harness.document.getElementById("tb-load-current-btn").click();
        await harness.flushAnimationFrames();
        await harness.settleMicrotasks();

        const addedIds = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features)
            .map(feature => feature.id);
        expect(addedIds).toEqual(["1-TH990201-0", "1-TH990201-1"]);
        expect(harness.requests).toHaveLength(requestCount);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 2/2 พื้นที่");
        expect(harness.document.getElementById("tb-coverage-notice").style.display).toBe("none");

        harness.sdk.Map.addFeaturesToLayer.mockClear();
        harness.setMapExtent([99.5, 9.5, 102.5, 12.5]);
        harness.emitSdkEvent("wme-map-move-end");
        await harness.flushTimers();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
    });

    test("deduplicates indexed source PCodes and generated SDK feature IDs", async () => {
        const harness = await createHarness();
        const fixture = createBoundaryFixture();
        fixture.features = [fixture.features[0], JSON.parse(JSON.stringify(fixture.features[0]))];

        await completeDownloadedLoad(harness, fixture);

        const addedIds = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features)
            .map(feature => feature.id);
        expect(addedIds).toEqual(["1-TH990101-0"]);
        expect(new Set(addedIds).size).toBe(addedIds.length);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 1/1 พื้นที่");
    });

    test("blocks new loads below zoom 12 while retaining boundaries and the loaded tag", async () => {
        const harness = await createHarness({
            mapExtent: [99.5, 9.5, 102.5, 12.5],
            zoomLevel: 12
        });
        await completeDownloadedLoad(harness, createBoundaryFixture());
        const layer = harness.sdk.Map.addLayer.mock.calls[0][0];
        const loadedFeature = harness.sdk.Map.addFeaturesToLayer.mock.calls[0][0].features[0];
        harness.sdk.Map.addFeaturesToLayer.mockClear();
        harness.sdk.Map.removeLayer.mockClear();

        harness.setMapExtent([109.5, 9.5, 114.5, 14.5]);
        harness.setZoomLevel(11);
        harness.emitSdkEvent("wme-map-zoom-changed");
        await harness.flushTimers();

        expect(harness.document.getElementById("tb-load-btn").disabled).toBe(true);
        expect(harness.document.getElementById("tb-load-full-btn").disabled).toBe(true);
        expect(harness.document.getElementById("tb-loaded-status").style.display).toBe("block");
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 1/2 พื้นที่");
        expect(getElementText(harness.document.getElementById("tb-coverage-message")))
            .toBe("กรุณาซูมเข้าอย่างน้อยระดับ 12 เพื่อโหลดขอบเขตเพิ่มเติม");
        expect(harness.document.getElementById("tb-load-current-btn").style.display).toBe("none");
        expect(harness.sdk.Map.removeLayer).not.toHaveBeenCalled();
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(layer.styleContext.getLabel({ feature: loadedFeature, zoomLevel: 11 })).toBe("");

        harness.setZoomLevel(12);
        harness.emitSdkEvent("wme-map-zoom-changed");
        await harness.flushTimers();
        expect(harness.document.getElementById("tb-load-btn").disabled).toBe(false);
        expect(harness.document.getElementById("tb-load-full-btn").disabled).toBe(false);
        expect(harness.document.getElementById("tb-load-current-btn").style.display).toBe("block");
    });

    test("keeps whole-province loading secondary, confirmed, and deduplicated", async () => {
        const harness = await createHarness({ mapExtent: [99.5, 9.5, 102.5, 12.5] });
        await completeDownloadedLoad(harness, createBoundaryFixture());
        harness.sdk.Map.addFeaturesToLayer.mockClear();
        const requestCount = harness.requests.length;

        harness.startFullLoad();
        await harness.settleMicrotasks();
        await harness.flushAnimationFrames();

        expect(harness.window.confirm).toHaveBeenCalledOnce();
        expect(harness.requests).toHaveLength(requestCount);
        const addedIds = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .flatMap(([args]) => args.features)
            .map(feature => feature.id);
        expect(addedIds).toEqual(["1-TH990201-0", "1-TH990201-1"]);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 2/2 พื้นที่");
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("✅ แสดงผลครบทั้งจังหวัด (2 พื้นที่)");
        expect(harness.document.getElementById("tb-coverage-notice").style.display).toBe("none");
    });

    test("does not start whole-province loading when confirmation is declined", async () => {
        const harness = await createHarness({ confirmResult: false });

        harness.startFullLoad();
        await harness.settleMicrotasks();

        expect(harness.window.confirm).toHaveBeenCalledOnce();
        expect(harness.requests).toHaveLength(0);
        expect(harness.sdk.Map.addFeaturesToLayer).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: พร้อมใช้งาน");
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

    test("keeps multipart SDK batches at or below twenty polygons", async () => {
        const harness = await createHarness();
        await completeDownloadedLoad(harness, createMultipartBoundaryFixture());
        const batchSizes = harness.sdk.Map.addFeaturesToLayer.mock.calls
            .map(([args]) => args.features.length);
        expect(batchSizes).toEqual([20, 20, 14]);
    });

    test("caps SDK batches at ten thousand coordinates and isolates oversized polygons", async () => {
        const harness = await createHarness();
        await completeDownloadedLoad(harness, createCoordinateBudgetFixture());

        const coordinateCounts = harness.sdk.Map.addFeaturesToLayer.mock.calls.map(([args]) => (
            args.features.reduce((sum, feature) => sum + feature.geometry.coordinates[0].length, 0)
        ));
        expect(coordinateCounts).toEqual([6000, 6000, 11001, 5]);
        expect(harness.sdk.Map.addFeaturesToLayer.mock.calls[2][0].features).toHaveLength(1);
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

    test("rolls back successful batches when a later SDK add fails", async () => {
        let addCallCount = 0;
        const harness = await createHarness({
            onAddFeatures: () => {
                addCallCount += 1;
                if (addCallCount === 2) throw new Error("SDK rejected geometry");
            }
        });
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture(25));
        await harness.flushAnimationFrames();

        const rollback = harness.sdk.Map.removeFeaturesFromLayer.mock.calls.at(-1)[0];
        expect(rollback.layerName).toBe("wme-thailand-tambon-boundary");
        expect(rollback.featureIds).toHaveLength(20);
        expect(harness.sdk.Map.removeLayer).not.toHaveBeenCalled();
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox).not.toHaveBeenCalled();
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toMatch(/^❌ ผิดพลาด: /);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 0/25 พื้นที่");
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
        const rollback = harness.sdk.Map.removeFeaturesFromLayer.mock.calls.at(-1)[0];
        expect(rollback.layerName).toBe("wme-thailand-tambon-boundary");
        expect(rollback.featureIds).toHaveLength(insertedCount);
        expect(harness.sdk.Map.removeLayer).not.toHaveBeenCalled();
        expect(harness.sdk.LayerSwitcher.removeLayerCheckbox).not.toHaveBeenCalled();
        expect(harness.sdk.Map.setLayerVisibility.mock.calls.at(-1)[0].visibility).toBe(false);
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ยกเลิกการโหลดแล้ว");
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 0/60 พื้นที่");
    });

    test("cancels a new zone without removing previously committed boundaries", async () => {
        const harness = await createHarness({ mapExtent: [99.5, 9.5, 102.5, 12.5] });
        await completeDownloadedLoad(harness, createSeparatedMultipartFixture());
        const committedId = harness.sdk.Map.addFeaturesToLayer.mock.calls[0][0].features[0].id;
        harness.sdk.Map.addFeaturesToLayer.mockClear();
        harness.sdk.Map.removeFeaturesFromLayer.mockClear();

        harness.setMapExtent([109.5, 9.5, 111, 11]);
        harness.emitSdkEvent("wme-map-move-end");
        await harness.flushTimers();
        harness.document.getElementById("tb-load-current-btn").click();
        await harness.settleMicrotasks();
        expect(harness.sdk.Map.addFeaturesToLayer).toHaveBeenCalledOnce();

        harness.document.getElementById("tb-cancel-btn").click();
        await harness.flushAnimationFrames();

        const rolledBackIds = harness.sdk.Map.removeFeaturesFromLayer.mock.calls.at(-1)[0].featureIds;
        expect(rolledBackIds).toHaveLength(20);
        expect(rolledBackIds).not.toContain(committedId);
        expect(getElementText(harness.document.getElementById("tb-loaded-status")))
            .toBe("โหลดแล้ว 1/2 พื้นที่");
        expect(harness.sdk.Map.removeLayer).not.toHaveBeenCalled();
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
        expect(harness.document.getElementById("tb-loaded-status").style.display).toBe("none");
        expect(harness.document.getElementById("tb-coverage-notice").style.display).toBe("none");
        expect(harness.eventHandlers.get("wme-map-move-end") || []).toHaveLength(0);
        expect(getElementText(harness.document.getElementById("tb-status")))
            .toBe("สถานะ: ลบเส้นแล้ว");
    });

    test("clear remains available and tears down active SDK insertion", async () => {
        const harness = await createHarness();
        harness.startLoad();
        await harness.respondJson(createLargeBoundaryFixture());

        while (harness.sdk.Map.addFeaturesToLayer.mock.calls.length === 0) {
            expect(await harness.runNextAnimationFrame()).toBe(true);
        }
        const clearButton = harness.document.getElementById("tb-clear-btn");
        expect(clearButton.disabled).toBe(false);

        clearButton.click();
        const addCallCountAfterClear = harness.sdk.Map.addFeaturesToLayer.mock.calls.length;
        await harness.flushAnimationFrames();

        expect(harness.sdk.Map.addFeaturesToLayer).toHaveBeenCalledTimes(addCallCountAfterClear);
        expect(harness.sdk.Map.removeFeaturesFromLayer).toHaveBeenCalledOnce();
        expect(harness.sdk.Map.removeLayer).toHaveBeenCalledWith({
            layerName: "wme-thailand-tambon-boundary"
        });
        expect(harness.eventHandlers.get("wme-map-move-end") || []).toHaveLength(0);
        expect(harness.document.getElementById("tb-loaded-status").style.display).toBe("none");
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
