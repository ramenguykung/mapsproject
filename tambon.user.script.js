// ==UserScript==
// @name         WME Thailand Tambon
// @namespace    https://github.com/wazeth/
// @version      2.0.1
// @description  แสดงขอบเขตตำบล
// @author       Waze Thailand
// @match        https://*.waze.com/*/editor*
// @match        https://*.waze.com/editor*
// @exclude      https://*.waze.com/user/editor*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const DATA_BASE_URL = "https://wazeth.github.io/mapsproject/geojson/";
    const SCRIPT_ID = "wme-th-tambon-tab-v3";
    const SCRIPT_TITLE = "ขอบเขตการปกครอง";

    // รายชื่อจังหวัด
    const PROVINCES = {
        "0": { name: "กรุงเทพมหานคร", file: "10-bangkok.geojson" },
        "1": { name: "สมุทรปราการ", file: "11-SPK.geojson" },
        "2": { name: "นนทบุรี", file: "12-NTB.geojson" },
        "3": { name: "ปทุมธานี", file: "13-PTM.geojson" },
        "4": { name: "พระนครศรีอยุธยา", file: "14-PSA.geojson" },
        "5": { name: "อ่างทอง", file: "15-ANG.geojson" },
        "6": { name: "ลพบุรี", file: "16-LBR.geojson" },
        "7": { name: "สิงห์บุรี", file: "17-SBR.geojson" },
        "8": { name: "ชัยนาท", file: "18-CNT.geojson" },
        "9": { name: "สระบุรี", file: "19-SRB.geojson" },
        "10": { name: "ชลบุรี", file: "20-CBR.geojson" },
        "11": { name: "ระยอง", file: "21-RYN.json" },
        "12": { name: "จันทบุรี", file: "22-CBR.json" },
        "13": { name: "ตราด", file: "23-TRT.geojson" },
        "14": { name: "ฉะเชิงเทรา", file: "24-CCS.geojson" },
        "15": { name: "ปราจีนบุรี", file: "25-PCB.geojson" },
        "16": { name: "นครนายก", file: "26-NNY.geojson" },
        "17": { name: "สระแก้ว", file: "27-SKO.json" },
        "18": { name: "นครราชสีมา", file: "30-NSM.geojson" },
        "19": { name: "บุรีรัมย์", file: "31-BRR.geojson" },
        "20": { name: "สุรินทร์", file: "32-SRN.geojson" },
        "21": { name: "ศรีสะเกษ", file: "33-SSK.geojson" },
        "22": { name: "อุบลราชธานี", file: "34-URT.json" },
        "24": { name: "ยโสธร", file: "35-YST.geojson" },
        "25": { name: "ชัยภูมิ", file: "36-CYP.geojson" },
        "26": { name: "อำนาจเจริญ", file: "37-ANC.geojson" },
        "27": { name: "บึงกาฬ", file: "38-BUK.geojson" },
        "28": { name: "หนองบัวลำภู", file: "39-NBL.geojson" },
        "29": { name: "ขอนแก่น", file: "40-KKN.geojson" },
        "30": { name: "อุดรธานี", file: "41-UDT.json" },
        "33": { name: "เลย", file: "42-LOE.geojson" },
        "34": { name: "หนองคาย", file: "43-NKH.geojson" },
        "35": { name: "มหาสารคาม", file: "44-MSK.geojson" },
        "36": { name: "ร้อยเอ็ด", file: "45-RET.geojson" },
        "37": { name: "กาฬสินธุ์", file: "46-KLS.json" },
        "39": { name: "สกลนคร", file: "47-SKN.geojson" },
        "40": { name: "นครพนม", file: "48-NPN.geojson" },
        "41": { name: "มุกดาหาร", file: "49-MDH.geojson" },
        "42": { name: "เชียงใหม่", file: "50-CMI.geojson" },
        "43": { name: "ลำพูน", file: "51-LPN.geojson" },
        "44": { name: "ลำปาง", file: "52-LPG.geojson" },
        "45": { name: "อุตรดิตถ์", file: "53-URD.geojson" },
        "46": { name: "แพร่", file: "54-PHE.geojson" },
        "47": { name: "น่าน", file: "55-NAN.geojson" },
        "48": { name: "พะเยา", file: "56-PYO.geojson" },
        "49": { name: "เชียงราย", file: "57-CHR.geojson" },
        "50": { name: "แม่ฮ่องสอน", file: "58-MHS.geojson" },
        "51": { name: "นครสวรรค์", file: "60-NSW.geojson" },
        "52": { name: "อุทัยธานี", file: "61-UTN.geojson" },
        "53": { name: "กำแพงเพชร", file: "62-KPP.geojson" },
        "54": { name: "ตาก", file: "63-TAK.geojson" },
        "55": { name: "สุโขทัย", file: "64-SKT.geojson" },
        "56": { name: "พิษณุโลก", file: "65-PNL.geojson" },
        "57": { name: "พิจิตร", file: "66-PHC.geojson" },
        "58": { name: "เพชรบูรณ์", file: "67-PCB.geojson" },
        "59": { name: "ราชบุรี", file: "70-RBR.geojson" },
        "60": { name: "กาญจนบุรี", file: "71-KBR.geojson" },
        "61": { name: "สุพรรณบุรี", file: "72-SBR.geojson" },
        "62": { name: "นครปฐม", file: "73-NPT.geojson" },
        "63": { name: "สมุทรสาคร", file: "74-SKN.geojson" },
        "64": { name: "สมุทรสงคราม", file: "75-SSK.geojson" },
        "65": { name: "เพชรบุรี", file: "76-PBR.geojson" },
        "66": { name: "ประจวบคีรีขันธ์", file: "77-PKK.geojson" },
        "67": { name: "นครศรีธรรมราช", file: "80-NST.geojson" },
        "68": { name: "กระบี่", file: "81-KRB.geojson" },
        "69": { name: "พังงา", file: "82-PNG.geojson" },
        "70": { name: "ภูเก็ต", file: "83-PKT.geojson" },
        "71": { name: "สุราษฎร์ธานี", file: "84-STN.geojson" },
        "72": { name: "ระนอง", file: "85-RNG.geojson" },
        "73": { name: "ชุมพร", file: "86-CMP.geojson" },
        "74": { name: "สงขลา", file: "90-SKL.geojson" },
        "75": { name: "สตูล", file: "91-STU.geojson" },
        "76": { name: "ตรัง", file: "92-TRN.geojson" },
        "77": { name: "พัทลุง", file: "93-PTL.geojson" },
        "78": { name: "ปัตตานี", file: "94-PTN.geojson" },
        "79": { name: "ยะลา", file: "95-YLA.geojson" },
        "80": { name: "นราธิวาส", file: "96-NTW.geojson" }
    };

    const LAYER_NAME = "wme-thailand-tambon-boundary";
    const LAYER_CHECKBOX_NAME = "Thailand Boundary Overlay";
    const LAYER_Z_INDEX = 9999;
    const LABEL_MIN_ZOOM = 12;
    const LABEL_FEATURE_LIMIT = 1200;
    const MIN_BOUNDARY_LOAD_ZOOM = 12;
    const VIEWPORT_PADDING_RATIO = 0.15;
    const COVERAGE_REFRESH_DEBOUNCE_MS = 180;
    const FRAME_BUDGET_MS = 8;
    const MAX_PREPARED_FEATURES_PER_FRAME = 20;
    const MAX_SDK_FEATURES_PER_BATCH = 20;
    const MAX_SDK_COORDINATES_PER_BATCH = 10000;
    const PROGRESS_UPDATE_INTERVAL_MS = 100;
    const GEOJSON_CACHE_LIMIT = 2;
    const OUTLINE_COLOR_STORAGE_KEY = "wme-th-tambon:outline-color";
    const OUTLINE_OPACITY_STORAGE_KEY = "wme-th-tambon:outline-opacity";
    const DEFAULT_OUTLINE_COLOR = "#FF0000";
    const DEFAULT_OUTLINE_OPACITY = 0.8;

    /**
     * @typedef {object} OutlineSettings
     * @property {string} color Stroke color in hexadecimal notation.
     * @property {number} opacity Stroke opacity from zero to one.
     */

    /**
     * @typedef {object} SidebarUi
     * @property {HTMLInputElement} provinceInput Province selector input.
     * @property {HTMLDataListElement} provinceList Province datalist.
     * @property {HTMLButtonElement} loadButton Load button.
     * @property {HTMLButtonElement} fullLoadButton Whole-province load button.
     * @property {HTMLButtonElement} loadCurrentButton Coverage action button.
     * @property {HTMLButtonElement} cancelButton Cancel button.
     * @property {HTMLButtonElement} clearButton Clear button.
     * @property {HTMLElement} status Status message element.
     * @property {HTMLElement} progressContainer Progress container.
     * @property {HTMLElement} progressBar Progress bar element.
     * @property {HTMLElement} progressText Progress text element.
     * @property {HTMLElement} etaText Estimated time element.
     * @property {HTMLInputElement} outlineColor Outline color control.
     * @property {HTMLInputElement} outlineOpacity Outline opacity control.
     * @property {HTMLInputElement} featureSearch Feature search control.
     * @property {HTMLSelectElement} districtSelect District selector.
     * @property {HTMLElement} loadedStatus Persistent loaded-area status.
     * @property {HTMLElement} coverageNotice Coverage notice container.
     * @property {HTMLElement} coverageMessage Coverage notice message.
     */

    /**
     * @typedef {object} ProgressUi
     * @property {HTMLElement} bar Progress bar element.
     * @property {HTMLElement} text Progress text element.
     * @property {HTMLElement} eta Estimated time element.
     */

    /**
     * @typedef {object} LoadState
     * @property {number} token Token used to cancel stale asynchronous work.
     * @property {boolean} isLoading Whether the sidebar is in its loading state.
     * @property {{abort: () => void}|null} request Active userscript request handle.
     */

    /**
     * @typedef {import("geojson").Polygon | import("geojson").MultiPolygon} SourceGeometry
     */

    /**
     * @typedef {import("geojson").Feature<SourceGeometry, Record<string, unknown>>} SourceFeature
     */

    /**
     * @typedef {import("wme-sdk-typings").SdkFeature<import("geojson").Polygon>} PreparedSdkFeature
     */

    /**
     * @typedef {object} BoundaryBounds
     * @property {number} minX Minimum longitude.
     * @property {number} minY Minimum latitude.
     * @property {number} maxX Maximum longitude.
     * @property {number} maxY Maximum latitude.
     */

    /**
     * @typedef {object} BoundaryIndexItem
     * @property {Record<string, unknown>} attributes Source feature properties.
     * @property {string} label Boundary label.
     * @property {string} pcode Stable administrative code.
     * @property {Array<import("geojson").Polygon>} polygonParts Atomic polygon geometries.
     * @property {number[]} polygonCoordinateCounts Coordinate count for each polygon part.
     * @property {BoundaryBounds} bounds Full-resolution feature bounds.
     * @property {PreparedSdkFeature[]|null} sdkFeatures Lazily prepared SDK features.
     */

    /**
     * @typedef {object} NavigatorEntry
     * @property {string} name Name used by the existing district list.
     * @property {string} district District or Bangkok district name.
     * @property {string} searchLabel Disambiguated result label.
     * @property {string} searchText Normalized text used for matching.
     * @property {BoundaryBounds} bounds Indexed WGS84 bounds.
     */

    /**
     * @typedef {object} IndexedBoundaryData
     * @property {BoundaryIndexItem[]} items Indexed source boundaries.
     * @property {Record<string, NavigatorEntry[]>} navigatorData Navigator data grouped by district.
     * @property {number} sourceFeatureCount Administrative area count.
     */

    /**
     * @typedef {object} ProvinceSession
     * @property {number} loadToken Token that created the session.
     * @property {string} provinceKey Province key.
     * @property {string} filename Province filename.
     * @property {boolean} labelsEnabled Whether labels are enabled for this province.
     * @property {BoundaryIndexItem[]} items Indexed source boundaries.
     * @property {Record<string, NavigatorEntry[]>} navigatorData Navigator data grouped by district.
     * @property {number} sourceFeatureCount Administrative area count.
     * @property {Set<string>} loadedSourceIds Source PCode values committed to the layer.
     * @property {Set<string>} loadedFeatureIds SDK feature IDs committed to the layer.
     * @property {boolean} isFullProvinceLoaded Whether every source boundary is loaded.
     * @property {(() => void)|null} removeMoveEndHandler SDK move-end cleanup function.
     */

    /**
     * @typedef {object} RenderOperation
     * @property {number} loadToken Active load token.
     * @property {ProvinceSession} session Target province session.
     * @property {BoundaryIndexItem[]} items Source items being added.
     * @property {string[]} addedFeatureIds SDK IDs successfully added by this operation.
     * @property {boolean} hadLoadedFeatures Whether the layer already contained committed features.
     */

    /**
     * @typedef {object} SdkFeatureUnit
     * @property {PreparedSdkFeature} feature SDK feature.
     * @property {number} coordinateCount Full-resolution coordinate count.
     */

    /** @type {import("wme-sdk-typings").WmeSDK|null} */
    let wmeSDK = null;
    let initialized = false;
    /** @type {LoadState} */
    const loadState = {
        token: 0,
        isLoading: false,
        request: null
    };
    let isBoundaryLayerCreated = false;
    let isBoundaryLayerReady = false;
    let isBoundaryLayerEnabled = true;
    let isLayerCheckboxRegistered = false;
    /** @type {Map<string, Promise<object>>} */
    const geoJsonCache = new Map();
    /** @type {Record<string, NavigatorEntry[]>} */
    let currentProvinceData = {};
    /** @type {ProvinceSession|null} */
    let activeProvinceSession = null;
    /** @type {RenderOperation|null} */
    let activeRenderOperation = null;
    /** @type {SidebarUi|null} */
    let sidebarUi = null;
    /** @type {ReturnType<typeof setTimeout>|null} */
    let coverageRefreshTimer = null;
    /** @type {(() => void)|null} */
    let removeZoomHandler = null;
    /** @type {OutlineSettings} */
    let outlineSettings = {
        color: DEFAULT_OUTLINE_COLOR,
        opacity: DEFAULT_OUTLINE_OPACITY
    };

    /** @type {any} */
    const pageWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
    startSdkInitialization();

    /**
     * Waits for the page SDK bridge and starts the userscript.
     *
     * @returns {void}
     */
    function startSdkInitialization() {
        if (!pageWindow.SDK_INITIALIZED || typeof pageWindow.SDK_INITIALIZED.then !== "function") {
            console.error("WME Tambon: SDK_INITIALIZED is unavailable");
            return;
        }

        pageWindow.SDK_INITIALIZED.then(init).catch(error => {
            console.error("WME Tambon: SDK initialization failed", error);
        });
    }

    /**
     * Initializes the SDK, sidebar, persistent settings, and event handlers.
     *
     * @returns {Promise<void>}
     */
    async function init() {
        if (initialized) return;
        if (typeof pageWindow.getWmeSdk !== "function") {
            throw new Error("WME Tambon: getWmeSdk is unavailable");
        }

        console.log("WME Tambon: Starting...");
        const sdk = pageWindow.getWmeSdk({
            scriptId: SCRIPT_ID,
            scriptName: SCRIPT_TITLE
        });
        assertSdkCapabilities(sdk);
        wmeSDK = sdk;
        initialized = true;
        outlineSettings = loadOutlineSettings();
        registerLayerCheckboxListener();

        const { tabLabel, tabPane } = await wmeSDK.Sidebar.registerScriptTab();

        tabLabel.innerHTML = '<span>🇹🇭</span>';
        tabLabel.title = SCRIPT_TITLE;

        tabPane.innerHTML = `
            <div style="padding: 5px 10px; box-sizing: border-box;">
                <h3 style="margin-bottom: 15px; text-align: center;">${SCRIPT_TITLE}</h3>

                <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
                    <strong>คำแนะนำ:</strong>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                       <li>กรุงเทพฯ: แสดงเขต</li>
                       <li>ต่างจังหวัด: แสดงตำบล, อำเภอ</li>
                    </ul>
                </div>

                <div class="form-group">
                    <label for="tb-province-input" style="font-weight: bold;">จังหวัด:</label>
                    <input list="tb-provinces-list" id="tb-province-input" class="form-control" placeholder="-- พิมพ์หรือคลิกเพื่อเลือก --" style="width: 100%; margin-bottom: 10px;">
                    <datalist id="tb-provinces-list"></datalist>
                </div>

                <div class="form-group" style="margin-bottom: 10px;">
                    <label for="tb-outline-color" style="font-weight: bold;">สีเส้น:</label>
                    <input id="tb-outline-color" type="color" value="${outlineSettings.color}" style="width: 100%; height: 30px;">
                </div>

                <div class="form-group" style="margin-bottom: 10px;">
                    <label for="tb-outline-opacity" style="font-weight: bold;">ความทึบของเส้น:</label>
                    <input id="tb-outline-opacity" type="range" min="0" max="1" step="0.05" value="${outlineSettings.opacity}" style="width: 100%;">
                </div>

                <div style="margin-top: 15px;">
                    <button id="tb-load-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 8px;">โหลดพื้นที่ในมุมมอง</button>
                    <button id="tb-load-full-btn" class="btn btn-default" style="width: 100%; margin-bottom: 8px; font-size: 11px;">โหลดทั้งจังหวัด (ช้ากว่า)</button>
                    <button id="tb-cancel-btn" class="btn btn-warning" style="width: 100%; margin-bottom: 8px; display: none;">ยกเลิกการโหลด</button>
                    <button id="tb-clear-btn" class="btn btn-default" style="width: 100%;">ลบเส้นออก</button>
                </div>

                <div id="tb-progress-container" style="display:none; margin-top: 15px;">
                    <div style="background: #e0e0e0; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div id="tb-progress-bar" style="background: #4caf50; width: 0%; height: 100%; transition: width 0.2s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
                        <span id="tb-progress-text">0%</span>
                        <span id="tb-eta-text">--:--</span>
                    </div>
                </div>

                <hr style="margin: 15px 0;"/>
                <div id="tb-status" style="font-size:11px; color:#666; text-align: center;">สถานะ: พร้อมใช้งาน</div>
                <div id="tb-loaded-status" style="display:none; margin-top: 8px; padding: 5px 8px; border-radius: 10px; background: #e8f5e9; color: #2e7d32; font-size: 11px; text-align: center;"></div>
                <div id="tb-coverage-notice" style="display:none; margin-top: 8px; padding: 8px; border: 1px solid #f0ad4e; border-radius: 4px; background: #fff8e1; font-size: 11px; text-align: center;">
                    <div id="tb-coverage-message" style="margin-bottom: 6px;"></div>
                    <button id="tb-load-current-btn" class="btn btn-primary" style="width: 100%; font-size: 11px;">โหลดขอบเขตบริเวณนี้</button>
                </div>
                <hr style="margin: 15px 0; border-color: #ccc;"/>

                <div id="tb-navigator-container" style="display: none; padding-bottom: 10px;">
                    <div style="font-weight: bold; margin-bottom: 8px; font-size: 12px; color: #333;">วาร์ปปป</div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <input id="tb-feature-search" class="form-control" placeholder="ค้นหาอำเภอ/เขต/ตำบล" style="width: 100%; height: 30px; font-size: 12px;">
                    </div>
                    <div class="form-group" style="margin-bottom: 10px;">
                        <select id="tb-district-select" class="form-control" style="width: 100%; height: 30px; font-size: 12px;">
                            <option value="">-- เลือกอำเภอ/เขต --</option>
                        </select>
                    </div>
                    <div id="tb-tambon-list" style="max-height: 250px; overflow-y: auto; padding-right: 5px;"></div>
                </div>
            </div>
        `;

        setupInteractions();
    }

    /**
     * Verifies the public SDK surface required by this userscript.
     *
     * @param {import("wme-sdk-typings").WmeSDK} sdk SDK instance.
     * @returns {void}
     */
    function assertSdkCapabilities(sdk) {
        const requiredMethods = [
            ["Sidebar.registerScriptTab", sdk?.Sidebar?.registerScriptTab],
            ["Events.on", sdk?.Events?.on],
            ["LayerSwitcher.addLayerCheckbox", sdk?.LayerSwitcher?.addLayerCheckbox],
            ["LayerSwitcher.removeLayerCheckbox", sdk?.LayerSwitcher?.removeLayerCheckbox],
            ["Map.addLayer", sdk?.Map?.addLayer],
            ["Map.addFeaturesToLayer", sdk?.Map?.addFeaturesToLayer],
            ["Map.getMapExtent", sdk?.Map?.getMapExtent],
            ["Map.getZoomLevel", sdk?.Map?.getZoomLevel],
            ["Map.removeFeaturesFromLayer", sdk?.Map?.removeFeaturesFromLayer],
            ["Map.removeLayer", sdk?.Map?.removeLayer],
            ["Map.redrawLayer", sdk?.Map?.redrawLayer],
            ["Map.setLayerVisibility", sdk?.Map?.setLayerVisibility],
            ["Map.setLayerZIndex", sdk?.Map?.setLayerZIndex],
            ["Map.setMapCenter", sdk?.Map?.setMapCenter]
        ];
        const missingMethods = requiredMethods
            .filter(([, method]) => typeof method !== "function")
            .map(([name]) => name);

        if (missingMethods.length > 0) {
            throw new Error("WME Tambon: Required SDK capabilities are unavailable: " + missingMethods.join(", "));
        }
    }

    /**
     * Loads and validates persisted outline settings.
     *
     * @returns {OutlineSettings} Validated outline settings.
     */
    function loadOutlineSettings() {
        let color = DEFAULT_OUTLINE_COLOR;
        let opacity = DEFAULT_OUTLINE_OPACITY;

        try {
            if (typeof GM_getValue === "function") {
                const storedColor = GM_getValue(OUTLINE_COLOR_STORAGE_KEY, DEFAULT_OUTLINE_COLOR);
                const storedOpacity = GM_getValue(OUTLINE_OPACITY_STORAGE_KEY, DEFAULT_OUTLINE_OPACITY);
                if (isValidOutlineColor(storedColor)) color = storedColor;
                if (
                    typeof storedOpacity === "number" &&
                    Number.isFinite(storedOpacity) &&
                    storedOpacity >= 0 &&
                    storedOpacity <= 1
                ) {
                    opacity = storedOpacity;
                }
            }
        } catch (error) {
            console.warn("WME Tambon: outline settings could not be loaded", error);
        }

        return { color, opacity };
    }

    /**
     * Saves the current outline settings in userscript storage.
     *
     * @returns {void}
     */
    function persistOutlineSettings() {
        try {
            if (typeof GM_setValue === "function") {
                GM_setValue(OUTLINE_COLOR_STORAGE_KEY, outlineSettings.color);
                GM_setValue(OUTLINE_OPACITY_STORAGE_KEY, outlineSettings.opacity);
            }
        } catch (error) {
            console.warn("WME Tambon: outline settings could not be saved", error);
        }
    }

    /**
     * Tests whether a value is a six-digit hexadecimal color.
     *
     * @param {unknown} value Value to validate.
     * @returns {value is string} True for a valid color.
     */
    function isValidOutlineColor(value) {
        return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    }

    /**
     * Redraws the completed boundary layer after a style change.
     *
     * @returns {void}
     */
    function redrawBoundaryLayer() {
        if (!wmeSDK || !isBoundaryLayerCreated || !isBoundaryLayerReady) return;
        wmeSDK.Map.redrawLayer({ layerName: LAYER_NAME });
    }

    /**
     * Tracks the SDK layer checkbox without revealing an incomplete layer.
     *
     * @returns {void}
     */
    function registerLayerCheckboxListener() {
        if (!wmeSDK) return;
        wmeSDK.Events.on({
            eventName: "wme-layer-checkbox-toggled",
            eventHandler: ({ name, checked }) => {
                if (name !== LAYER_CHECKBOX_NAME) return;
                isBoundaryLayerEnabled = checked;
                if (isBoundaryLayerCreated && isBoundaryLayerReady && wmeSDK) {
                    wmeSDK.Map.setLayerVisibility({
                        layerName: LAYER_NAME,
                        visibility: checked
                    });
                }
            }
        });
    }

    /**
     * Returns a required sidebar element.
     *
     * @template {HTMLElement} T
     * @param {string} id Element id.
     * @returns {T} Connected element.
     */
    function getRequiredElement(id) {
        const element = document.getElementById(id);
        if (!element) throw new Error("WME Tambon: Missing sidebar element " + id);
        return /** @type {T} */ (element);
    }

    /**
     * Aborts the active userscript request when possible.
     *
     * @returns {void}
     */
    function abortActiveRequest() {
        if (loadState.request && typeof loadState.request.abort === "function") {
            try {
                loadState.request.abort();
            } catch (error) {
                console.warn("WME Tambon: request abort failed", error);
            }
        }
        loadState.request = null;
    }

    /**
     * Hides and clears navigation data for a removed or replaced layer.
     *
     * @returns {void}
     */
    function clearNavigator() {
        currentProvinceData = {};
        const navigatorContainer = document.getElementById("tb-navigator-container");
        const tambonList = document.getElementById("tb-tambon-list");
        const featureSearch = document.getElementById("tb-feature-search");
        if (navigatorContainer) navigatorContainer.style.display = "none";
        if (tambonList) tambonList.textContent = "";
        if (featureSearch instanceof HTMLInputElement) featureSearch.value = "";
    }

    /**
     * Connects sidebar controls to loading, styling, search, and navigation.
     *
     * @returns {void}
     */
    function setupInteractions() {
        /** @type {SidebarUi} */
        const ui = {
            provinceInput: getRequiredElement("tb-province-input"),
            provinceList: getRequiredElement("tb-provinces-list"),
            loadButton: getRequiredElement("tb-load-btn"),
            fullLoadButton: getRequiredElement("tb-load-full-btn"),
            loadCurrentButton: getRequiredElement("tb-load-current-btn"),
            cancelButton: getRequiredElement("tb-cancel-btn"),
            clearButton: getRequiredElement("tb-clear-btn"),
            status: getRequiredElement("tb-status"),
            progressContainer: getRequiredElement("tb-progress-container"),
            progressBar: getRequiredElement("tb-progress-bar"),
            progressText: getRequiredElement("tb-progress-text"),
            etaText: getRequiredElement("tb-eta-text"),
            outlineColor: getRequiredElement("tb-outline-color"),
            outlineOpacity: getRequiredElement("tb-outline-opacity"),
            featureSearch: getRequiredElement("tb-feature-search"),
            districtSelect: getRequiredElement("tb-district-select"),
            loadedStatus: getRequiredElement("tb-loaded-status"),
            coverageNotice: getRequiredElement("tb-coverage-notice"),
            coverageMessage: getRequiredElement("tb-coverage-message")
        };
        sidebarUi = ui;
        const {
            provinceInput,
            provinceList: datalist,
            loadButton: btnLoad,
            fullLoadButton: btnLoadFull,
            loadCurrentButton: btnLoadCurrent,
            cancelButton: btnCancel,
            clearButton: btnClear,
            status: statusDiv,
            progressContainer,
            progressBar,
            progressText,
            etaText,
            outlineColor,
            outlineOpacity,
            featureSearch,
            districtSelect
        } = ui;

        /**
         * Applies the loading state to controls.
         *
         * @param {boolean} loading Whether a load is active.
         * @returns {void}
         */
        const setLoadingState = loading => {
            loadState.isLoading = loading;
            provinceInput.disabled = loading;
            featureSearch.disabled = loading;
            btnCancel.style.display = loading ? "block" : "none";
            btnCancel.disabled = !loading;
            syncBoundaryActionControls();
            if (!loading) updateCoverageUi();
        };

        /**
         * Restores the progress display after cancellation.
         *
         * @returns {void}
         */
        const resetProgressUi = () => {
            progressBar.style.width = "0%";
            progressText.innerText = "0%";
            etaText.innerText = "--:--";
            progressContainer.style.display = "none";
        };

        /**
         * Cancels active work and rolls back only its partial SDK additions.
         *
         * @returns {void}
         */
        const cancelLoading = () => {
            loadState.token += 1;
            abortActiveRequest();
            rollbackActiveRenderOperation();
            setLoadingState(false);
            resetProgressUi();
            statusDiv.innerText = "สถานะ: ยกเลิกการโหลดแล้ว";
            updateCoverageUi();
        };

        setLoadingState(false);

        Object.keys(PROVINCES).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
            const option = document.createElement("option");
            option.value = PROVINCES[key].name;
            datalist.appendChild(option);
        });

        /**
         * Starts a selected-province viewport or full load.
         *
         * @param {"viewport"|"full"} mode Load mode.
         * @returns {void}
         */
        const startSelectedLoad = mode => {
            if (!isBoundaryLoadingAllowed()) {
                updateCoverageUi();
                return;
            }
            const selectedName = provinceInput.value;
            const selectedKey = Object.keys(PROVINCES).find(key => PROVINCES[key].name === selectedName);

            if (selectedKey && PROVINCES[selectedKey]) {
                if (
                    mode === "full" &&
                    !window.confirm("การโหลดทั้งจังหวัดอาจทำให้เบราว์เซอร์ค้างชั่วคราว ต้องการดำเนินการต่อหรือไม่?")
                ) {
                    return;
                }
                statusDiv.innerText = "⏳ กำลังดาวน์โหลด...";
                progressContainer.style.display = "block";
                progressBar.style.width = "0%";
                progressText.innerText = "0%";
                etaText.innerText = "กำลังโหลด...";
                setLoadingState(true);

                loadBoundary(selectedKey, PROVINCES[selectedKey].file, mode, statusDiv, {
                    bar: progressBar,
                    text: progressText,
                    eta: etaText
                }, () => {
                    setLoadingState(false);
                });
            } else {
                alert("กรุณาเลือกจังหวัดให้ถูกต้อง (ต้องตรงกับในรายการ)");
            }
        };

        btnLoad.addEventListener("click", () => {
            startSelectedLoad("viewport");
        });

        btnLoadFull.addEventListener("click", () => {
            startSelectedLoad("full");
        });

        btnLoadCurrent.addEventListener("click", () => {
            if (!activeProvinceSession || !isBoundaryLoadingAllowed()) {
                updateCoverageUi();
                return;
            }
            statusDiv.innerText = "⏳ กำลังโหลดขอบเขตบริเวณนี้...";
            progressContainer.style.display = "block";
            progressBar.style.width = "0%";
            progressText.innerText = "0%";
            etaText.innerText = "กำลังโหลด...";
            setLoadingState(true);
            loadBoundary(
                activeProvinceSession.provinceKey,
                activeProvinceSession.filename,
                "viewport",
                statusDiv,
                { bar: progressBar, text: progressText, eta: etaText },
                () => setLoadingState(false)
            );
        });

        btnCancel.addEventListener("click", () => {
            if (!loadState.isLoading) return;
            cancelLoading();
        });

        btnClear.addEventListener("click", () => {
            loadState.token += 1;
            abortActiveRequest();
            rollbackActiveRenderOperation();
            teardownProvinceSession();
            setLoadingState(false);
            statusDiv.innerText = "สถานะ: ลบเส้นแล้ว";
            progressContainer.style.display = "none";
            updateCoverageUi();
        });

        districtSelect.addEventListener("change", () => {
            featureSearch.value = "";
            renderTambonButtons(districtSelect.value);
        });

        featureSearch.addEventListener("input", () => {
            const query = normalizeSearchText(featureSearch.value);
            if (query) {
                renderSearchResults(query);
            } else {
                renderTambonButtons(districtSelect.value);
            }
        });

        outlineColor.addEventListener("input", () => {
            if (!isValidOutlineColor(outlineColor.value)) return;
            outlineSettings.color = outlineColor.value;
            redrawBoundaryLayer();
        });
        outlineColor.addEventListener("change", persistOutlineSettings);

        outlineOpacity.addEventListener("input", () => {
            const opacity = Number(outlineOpacity.value);
            if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) return;
            outlineSettings.opacity = opacity;
            redrawBoundaryLayer();
        });
        outlineOpacity.addEventListener("change", persistOutlineSettings);

        if (removeZoomHandler) removeZoomHandler();
        removeZoomHandler = wmeSDK?.Events.on({
            eventName: "wme-map-zoom-changed",
            eventHandler: () => {
                syncBoundaryActionControls();
                scheduleCoverageRefresh();
            }
        }) || null;
        syncBoundaryActionControls();
        updateCoverageUi();
    }

    /**
     * Returns whether the map is zoomed in far enough to start SDK ingestion.
     *
     * @returns {boolean} True at the configured loading zoom or higher.
     */
    function isBoundaryLoadingAllowed() {
        return Boolean(wmeSDK && wmeSDK.Map.getZoomLevel() >= MIN_BOUNDARY_LOAD_ZOOM);
    }

    /**
     * Synchronizes loading buttons with zoom and operation state.
     *
     * @returns {void}
     */
    function syncBoundaryActionControls() {
        if (!sidebarUi) return;
        const disabled = loadState.isLoading || !isBoundaryLoadingAllowed();
        sidebarUi.loadButton.disabled = disabled;
        sidebarUi.fullLoadButton.disabled = disabled;
        sidebarUi.loadCurrentButton.disabled = disabled;
    }

    /**
     * Updates the persistent loaded-boundary tag without regard to zoom.
     *
     * @returns {void}
     */
    function updateLoadedStatus() {
        if (!sidebarUi) return;
        if (!activeProvinceSession) {
            sidebarUi.loadedStatus.style.display = "none";
            sidebarUi.loadedStatus.textContent = "";
            return;
        }
        sidebarUi.loadedStatus.style.display = "block";
        sidebarUi.loadedStatus.textContent =
            "โหลดแล้ว " + activeProvinceSession.loadedSourceIds.size +
            "/" + activeProvinceSession.sourceFeatureCount + " พื้นที่";
    }

    /**
     * Coalesces map movement and zoom events before checking coverage.
     *
     * @returns {void}
     */
    function scheduleCoverageRefresh() {
        if (coverageRefreshTimer !== null) clearTimeout(coverageRefreshTimer);
        coverageRefreshTimer = setTimeout(() => {
            coverageRefreshTimer = null;
            updateCoverageUi();
        }, COVERAGE_REFRESH_DEBOUNCE_MS);
    }

    /**
     * Shows a user-gated action only when visible source boundaries are missing.
     *
     * @returns {void}
     */
    function updateCoverageUi() {
        updateLoadedStatus();
        syncBoundaryActionControls();
        if (!sidebarUi) return;

        const session = activeProvinceSession;
        if (!session || session.isFullProvinceLoaded || loadState.isLoading) {
            sidebarUi.coverageNotice.style.display = "none";
            return;
        }

        const visibleItems = getViewportItems(session, 0);
        const hasUnloadedVisibleItem = visibleItems.some(item => !session.loadedSourceIds.has(item.pcode));
        if (!hasUnloadedVisibleItem) {
            sidebarUi.coverageNotice.style.display = "none";
            return;
        }

        sidebarUi.coverageNotice.style.display = "block";
        if (!isBoundaryLoadingAllowed()) {
            sidebarUi.coverageMessage.textContent =
                "กรุณาซูมเข้าอย่างน้อยระดับ 12 เพื่อโหลดขอบเขตเพิ่มเติม";
            sidebarUi.loadCurrentButton.style.display = "none";
        } else {
            sidebarUi.coverageMessage.textContent = "มุมมองนี้มีขอบเขตที่ยังไม่ได้โหลด";
            sidebarUi.loadCurrentButton.style.display = "block";
        }
    }

    /**
     * Converts the current WME extent into an optionally padded bounds object.
     *
     * @param {number} paddingRatio Padding relative to viewport width and height.
     * @returns {BoundaryBounds|null} Valid extent or null.
     */
    function getCurrentMapBounds(paddingRatio) {
        if (!wmeSDK) return null;
        const extent = wmeSDK.Map.getMapExtent();
        if (!Array.isArray(extent) || extent.length < 4) return null;
        const [left, bottom, right, top] = extent.map(Number);
        if (![left, bottom, right, top].every(Number.isFinite)) return null;
        const padX = Math.max(right - left, 0) * paddingRatio;
        const padY = Math.max(top - bottom, 0) * paddingRatio;
        return {
            minX: left - padX,
            minY: bottom - padY,
            maxX: right + padX,
            maxY: top + padY
        };
    }

    /**
     * Tests whether two WGS84 bounds intersect.
     *
     * @param {BoundaryBounds} first First bounds.
     * @param {BoundaryBounds} second Second bounds.
     * @returns {boolean} True when the bounds overlap.
     */
    function boundsIntersect(first, second) {
        return !(
            first.maxX < second.minX ||
            first.minX > second.maxX ||
            first.maxY < second.minY ||
            first.minY > second.maxY
        );
    }

    /**
     * Selects source items intersecting the current viewport.
     *
     * @param {ProvinceSession} session Active province session.
     * @param {number} paddingRatio Viewport padding ratio.
     * @returns {BoundaryIndexItem[]} Intersecting items.
     */
    function getViewportItems(session, paddingRatio) {
        const viewportBounds = getCurrentMapBounds(paddingRatio);
        if (!viewportBounds) return [];
        return session.items.filter(item => boundsIntersect(item.bounds, viewportBounds));
    }

    /**
     * Returns unloaded source items intersecting the padded viewport.
     *
     * @param {ProvinceSession} session Active province session.
     * @param {number} paddingRatio Viewport padding ratio.
     * @returns {BoundaryIndexItem[]} Unloaded viewport items.
     */
    function getUnloadedViewportItems(session, paddingRatio) {
        return getViewportItems(session, paddingRatio)
            .filter(item => !session.loadedSourceIds.has(item.pcode));
    }

    /**
     * Returns every source item not yet committed to the SDK layer.
     *
     * @param {ProvinceSession} session Active province session.
     * @returns {BoundaryIndexItem[]} Unloaded items.
     */
    function getUnloadedItems(session) {
        return session.items.filter(item => !session.loadedSourceIds.has(item.pcode));
    }

    /**
     * Makes indexed province data available to navigation and coverage checks.
     *
     * @param {ProvinceSession} session Prepared session.
     * @returns {void}
     */
    function activateProvinceSession(session) {
        activeProvinceSession = session;
        currentProvinceData = session.navigatorData;
        updateDistrictDropdown();
        if (wmeSDK) {
            session.removeMoveEndHandler = wmeSDK.Events.on({
                eventName: "wme-map-move-end",
                eventHandler: scheduleCoverageRefresh
            });
        }
        updateCoverageUi();
    }

    /**
     * Rolls back features added by the current render operation only.
     *
     * @returns {void}
     */
    function rollbackActiveRenderOperation() {
        const operation = activeRenderOperation;
        activeRenderOperation = null;
        if (!operation) return;

        if (wmeSDK && isBoundaryLayerCreated && operation.addedFeatureIds.length > 0) {
            try {
                wmeSDK.Map.removeFeaturesFromLayer({
                    layerName: LAYER_NAME,
                    featureIds: operation.addedFeatureIds
                });
            } catch (error) {
                console.warn("WME Tambon: partial boundary rollback failed", error);
            }
        }
        if (!operation.hadLoadedFeatures) isBoundaryLayerReady = false;
        updateLoadedStatus();
    }

    /**
     * Removes active province state, events, and SDK geometry.
     *
     * @returns {void}
     */
    function teardownProvinceSession() {
        if (coverageRefreshTimer !== null) {
            clearTimeout(coverageRefreshTimer);
            coverageRefreshTimer = null;
        }
        if (activeProvinceSession?.removeMoveEndHandler) {
            try {
                activeProvinceSession.removeMoveEndHandler();
            } catch (error) {
                console.warn("WME Tambon: map event cleanup failed", error);
            }
        }
        activeProvinceSession = null;
        activeRenderOperation = null;
        removeBoundaryLayer();
        clearNavigator();
        if (sidebarUi) {
            sidebarUi.loadedStatus.style.display = "none";
            sidebarUi.loadedStatus.textContent = "";
            sidebarUi.coverageNotice.style.display = "none";
        }
    }

    /**
     * Downloads and parses a GeoJSON resource through the userscript API.
     *
     * @param {string} url Resource URL.
     * @returns {Promise<object>} Parsed JSON object.
     */
    function fetchGM(url) {
        return new Promise((resolve, reject) => {
            const request = GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (loadState.request === request) loadState.request = null;
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch (e) { reject(new Error("Invalid JSON")); }
                    } else { reject(new Error("HTTP Error: " + response.status)); }
                },
                onerror: function() {
                    if (loadState.request === request) loadState.request = null;
                    reject(new Error("Network Error"));
                },
                onabort: function() {
                    if (loadState.request === request) loadState.request = null;
                    reject(new Error("Request canceled"));
                }
            });
            loadState.request = request;
        });
    }

    /**
     * Returns a cached GeoJSON promise and retains only two recent provinces.
     *
     * @param {string} url Resource URL.
     * @returns {Promise<object>} Parsed GeoJSON object.
     */
    function fetchGeoJson(url) {
        const cached = geoJsonCache.get(url);
        if (cached) {
            geoJsonCache.delete(url);
            geoJsonCache.set(url, cached);
            return cached;
        }

        const pending = fetchGM(url).catch(error => {
            if (geoJsonCache.get(url) === pending) geoJsonCache.delete(url);
            throw error;
        });
        geoJsonCache.set(url, pending);

        while (geoJsonCache.size > GEOJSON_CACHE_LIMIT) {
            const oldestUrl = geoJsonCache.keys().next().value;
            if (typeof oldestUrl !== "string") break;
            geoJsonCache.delete(oldestUrl);
        }

        return pending;
    }

    /**
     * Resolves the unchanged label for one administrative area.
     *
     * @param {string} provinceKey Province key.
     * @param {Record<string, unknown>} attributes GeoJSON properties.
     * @returns {string} Display label.
     */
    function resolveFeatureLabel(provinceKey, attributes) {
        const adm2 = getPropertyString(attributes, "ADM2_TH");
        if (provinceKey === "0") return adm2;
        const adm3 = getPropertyString(attributes, "ADM3_TH");
        if (adm3 && adm2) return adm3 + ", " + adm2;
        return adm3 || adm2;
    }

    /**
     * Ensures a province is indexed and renders a user-selected target.
     *
     * @param {string} provinceKey Province key.
     * @param {string} filename GeoJSON filename.
     * @param {"viewport"|"full"} mode Load mode.
     * @param {HTMLElement} statusDiv Status element.
     * @param {ProgressUi} ui Progress elements.
     * @param {Function} onComplete Completion callback.
     * @returns {void}
     */
    function loadBoundary(provinceKey, filename, mode, statusDiv, ui, onComplete) {
        const loadToken = ++loadState.token;
        abortActiveRequest();

        void (async () => {
            try {
                let session = activeProvinceSession;
                if (!session || session.provinceKey !== provinceKey || session.filename !== filename) {
                    teardownProvinceSession();
                    statusDiv.innerText = "⏳ กำลังดาวน์โหลด...";
                    const geoJsonData = await fetchGeoJson(DATA_BASE_URL + filename);
                    if (loadToken !== loadState.token) return;

                    const rawFeatures = getSourceFeatures(geoJsonData);
                    if (rawFeatures.length === 0) {
                        throw new Error("ไม่พบข้อมูลพื้นที่ในไฟล์");
                    }

                    statusDiv.innerText = "กำลังจัดทำดัชนีขอบเขต...";
                    const indexed = await prepareBoundaryIndex(rawFeatures, provinceKey, ui, loadToken);
                    if (!indexed || loadToken !== loadState.token) return;

                    session = {
                        loadToken,
                        provinceKey,
                        filename,
                        labelsEnabled: indexed.sourceFeatureCount <= LABEL_FEATURE_LIMIT,
                        items: indexed.items,
                        navigatorData: indexed.navigatorData,
                        sourceFeatureCount: indexed.sourceFeatureCount,
                        loadedSourceIds: new Set(),
                        loadedFeatureIds: new Set(),
                        isFullProvinceLoaded: false,
                        removeMoveEndHandler: null
                    };
                    activateProvinceSession(session);
                }

                const targetItems = mode === "full"
                    ? getUnloadedItems(session)
                    : getUnloadedViewportItems(session, VIEWPORT_PADDING_RATIO);
                if (targetItems.length === 0) {
                    ui.bar.style.width = "100%";
                    ui.text.innerText = "100%";
                    ui.eta.innerText = "เสร็จสิ้น";
                    statusDiv.innerText = mode === "full" || session.isFullProvinceLoaded
                        ? `✅ แสดงผลครบทั้งจังหวัด (${session.sourceFeatureCount} พื้นที่)`
                        : "ไม่พบขอบเขตที่ยังไม่ได้โหลดในมุมมองนี้";
                    return;
                }

                const completed = await renderBoundaryItems(session, targetItems, ui, loadToken);
                if (!completed || loadToken !== loadState.token) return;

                ui.eta.innerText = "เสร็จสิ้น";
                const labelSuffix = !session.labelsEnabled ? ", โหมดเร็ว: ปิดชื่อ" : "";
                statusDiv.innerText = session.isFullProvinceLoaded
                    ? `✅ แสดงผลครบทั้งจังหวัด (${session.sourceFeatureCount} พื้นที่${labelSuffix})`
                    : `✅ โหลดพื้นที่ในมุมมองแล้ว (โหลดแล้ว ${session.loadedSourceIds.size}/${session.sourceFeatureCount} พื้นที่${labelSuffix})`;
            } catch (error) {
                if (loadToken !== loadState.token) return;
                rollbackActiveRenderOperation();
                const message = error instanceof Error ? error.message : String(error);
                statusDiv.innerText = "❌ ผิดพลาด: " + message;
            } finally {
                if (loadToken === loadState.token) {
                    updateCoverageUi();
                    if (typeof onComplete === "function") onComplete();
                }
            }
        })();
    }

    /**
     * Extracts source features from a parsed GeoJSON feature collection.
     *
     * @param {unknown} value Parsed JSON value.
     * @returns {SourceFeature[]} Source features or an empty array.
     */
    function getSourceFeatures(value) {
        if (!value || typeof value !== "object") return [];
        const features = Reflect.get(value, "features");
        return Array.isArray(features) ? /** @type {SourceFeature[]} */ (features) : [];
    }

    /**
     * Builds a full-resolution spatial index in cooperative frames.
     *
     * @param {SourceFeature[]} rawFeatures Source GeoJSON features.
     * @param {string} provinceKey Province key.
     * @param {ProgressUi} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @returns {Promise<IndexedBoundaryData|null>} Indexed data or null after cancellation.
     */
    async function prepareBoundaryIndex(rawFeatures, provinceKey, ui, loadToken) {
        /** @type {BoundaryIndexItem[]} */
        const items = [];
        const indexedPcodes = new Set();
        /** @type {Record<string, NavigatorEntry[]>} */
        const navigatorData = {};
        const total = rawFeatures.length;
        const startTime = nowMs();
        let lastProgressUpdateAt = -Infinity;
        let index = 0;

        /**
         * Updates the existing progress messages without excessive DOM work.
         *
         * @param {boolean} force Whether to bypass throttling.
         * @returns {void}
         */
        const updateProgress = force => {
            const now = nowMs();
            if (!force && now - lastProgressUpdateAt < PROGRESS_UPDATE_INTERVAL_MS) return;
            lastProgressUpdateAt = now;
            const pct = Math.floor((index / total) * 100);
            ui.bar.style.width = pct + "%";
            ui.text.innerText = "กำลังประมวลผล: " + pct + "% (" + index + "/" + total + ")";

            const elapsed = Math.max((now - startTime) / 1000, 0.001);
            if (index > 0 && index < total) {
                const rate = index / elapsed;
                const etaSeconds = (total - index) / Math.max(rate, 0.001);
                ui.eta.innerText = "เหลืออีก: " + formatTime(etaSeconds);
            }
        };

        while (index < total) {
            if (loadToken !== loadState.token) return null;
            const frameStart = nowMs();
            let preparedInFrame = 0;

            while (
                index < total &&
                preparedInFrame < MAX_PREPARED_FEATURES_PER_FRAME &&
                nowMs() - frameStart < FRAME_BUDGET_MS
            ) {
                const sourceFeature = rawFeatures[index];
                if (!sourceFeature || typeof sourceFeature !== "object" || !sourceFeature.geometry) {
                    throw new Error("Invalid GeoJSON feature at index " + index);
                }

                const attributes = sourceFeature.properties && typeof sourceFeature.properties === "object"
                    ? sourceFeature.properties
                    : {};
                const pcode = getPropertyString(attributes, "ADM3_PCODE") ||
                    getPropertyString(attributes, "ADM2_PCODE");
                if (!pcode) throw new Error("Missing PCode at index " + index);
                if (indexedPcodes.has(pcode)) {
                    preparedInFrame += 1;
                    index += 1;
                    continue;
                }

                const polygonParts = flattenPolygonGeometry(sourceFeature.geometry);
                const measurement = measurePolygonParts(polygonParts);
                const item = {
                    attributes,
                    label: resolveFeatureLabel(provinceKey, attributes),
                    pcode,
                    polygonParts,
                    polygonCoordinateCounts: measurement.coordinateCounts,
                    bounds: measurement.bounds,
                    sdkFeatures: null
                };
                indexedPcodes.add(pcode);
                items.push(item);
                preparedInFrame += 1;
                addNavigatorEntry(navigatorData, provinceKey, attributes, measurement.bounds);
                index += 1;
            }

            updateProgress(index >= total);
            if (index < total) await waitForNextFrame();
        }

        Object.keys(navigatorData).forEach(district => {
            navigatorData[district].sort((a, b) => a.name.localeCompare(b.name, "th"));
        });

        return {
            items,
            navigatorData,
            sourceFeatureCount: items.length
        };
    }

    /**
     * Measures full-resolution polygon parts for indexing and SDK batching.
     *
     * @param {Array<import("geojson").Polygon>} polygonParts Polygon parts.
     * @returns {{bounds: BoundaryBounds, coordinateCounts: number[]}} Measurement.
     */
    function measurePolygonParts(polygonParts) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const coordinateCounts = polygonParts.map(part => {
            let count = 0;
            for (const ring of part.coordinates) {
                if (!Array.isArray(ring) || ring.length === 0) {
                    throw new Error("Invalid GeoJSON geometry: Polygon");
                }
                for (const coordinate of ring) {
                    const x = Number(coordinate?.[0]);
                    const y = Number(coordinate?.[1]);
                    if (!Number.isFinite(x) || !Number.isFinite(y)) {
                        throw new Error("Invalid GeoJSON coordinate");
                    }
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                    count += 1;
                }
            }
            return count;
        });

        if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
            throw new Error("Invalid GeoJSON geometry: Polygon");
        }
        return { bounds: { minX, minY, maxX, maxY }, coordinateCounts };
    }

    /**
     * Adds selected full-resolution boundaries through bounded SDK calls.
     *
     * @param {ProvinceSession} session Active province session.
     * @param {BoundaryIndexItem[]} items Unloaded source items.
     * @param {ProgressUi} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @returns {Promise<boolean>} True after every selected feature is committed.
     */
    async function renderBoundaryItems(session, items, ui, loadToken) {
        if (!wmeSDK) throw new Error("WME Tambon: SDK is unavailable");
        if (!isBoundaryLayerCreated) createBoundaryLayer(session.labelsEnabled);

        const units = createSdkFeatureUnits(session, items);
        const batches = createSdkFeatureBatches(units);
        const operation = {
            loadToken,
            session,
            items,
            addedFeatureIds: [],
            hadLoadedFeatures: session.loadedFeatureIds.size > 0
        };
        activeRenderOperation = operation;
        ui.eta.innerText = "กำลังวาดเส้นลงแผนที่...";
        let completedUnits = 0;

        for (let index = 0; index < batches.length; index += 1) {
            if (loadToken !== loadState.token) return false;
            const batch = batches[index];
            wmeSDK.Map.addFeaturesToLayer({
                layerName: LAYER_NAME,
                features: batch.map(unit => unit.feature)
            });
            operation.addedFeatureIds.push(...batch.map(unit => String(unit.feature.id)));
            completedUnits += batch.length;
            const pct = Math.floor((completedUnits / units.length) * 100);
            ui.bar.style.width = pct + "%";
            ui.text.innerText = "กำลังวาดเส้น: " + pct + "% (" + completedUnits + "/" + units.length + ")";
            if (index + 1 < batches.length) await waitForNextFrame();
        }

        if (loadToken !== loadState.token) return false;
        for (const item of items) session.loadedSourceIds.add(item.pcode);
        for (const featureId of operation.addedFeatureIds) session.loadedFeatureIds.add(featureId);
        session.isFullProvinceLoaded = session.loadedSourceIds.size >= session.sourceFeatureCount;
        activeRenderOperation = null;

        if (!isBoundaryLayerReady) {
            isBoundaryLayerReady = true;
            wmeSDK.Map.setLayerVisibility({
                layerName: LAYER_NAME,
                visibility: isBoundaryLayerEnabled
            });
            wmeSDK.Map.redrawLayer({ layerName: LAYER_NAME });
        }
        updateLoadedStatus();
        return true;
    }

    /**
     * Lazily creates SDK features and pairs them with coordinate costs.
     *
     * @param {ProvinceSession} session Active province session.
     * @param {BoundaryIndexItem[]} items Source items.
     * @returns {SdkFeatureUnit[]} SDK feature units.
     */
    function createSdkFeatureUnits(session, items) {
        /** @type {SdkFeatureUnit[]} */
        const units = [];
        const selectedFeatureIds = new Set();
        for (const item of items) {
            if (!item.sdkFeatures) {
                item.sdkFeatures = item.polygonParts.map((geometry, partIndex) => ({
                    id: session.provinceKey + "-" + item.pcode + "-" + partIndex,
                    type: "Feature",
                    geometry,
                    properties: {
                        __tbLabel: session.labelsEnabled && partIndex === 0 ? item.label : ""
                    }
                }));
            }
            item.sdkFeatures.forEach((feature, partIndex) => {
                const featureId = String(feature.id);
                if (session.loadedFeatureIds.has(featureId) || selectedFeatureIds.has(featureId)) return;
                selectedFeatureIds.add(featureId);
                units.push({
                    feature,
                    coordinateCount: item.polygonCoordinateCounts[partIndex]
                });
            });
        }
        return units;
    }

    /**
     * Groups SDK feature units by polygon and coordinate budgets.
     *
     * @param {SdkFeatureUnit[]} units SDK feature units.
     * @returns {SdkFeatureUnit[][]} SDK batches.
     */
    function createSdkFeatureBatches(units) {
        /** @type {SdkFeatureUnit[][]} */
        const batches = [];
        /** @type {SdkFeatureUnit[]} */
        let batch = [];
        let batchCoordinateCount = 0;

        const flush = () => {
            if (batch.length === 0) return;
            batches.push(batch);
            batch = [];
            batchCoordinateCount = 0;
        };

        for (const unit of units) {
            if (
                batch.length >= MAX_SDK_FEATURES_PER_BATCH ||
                (batch.length > 0 && batchCoordinateCount + unit.coordinateCount > MAX_SDK_COORDINATES_PER_BATCH)
            ) {
                flush();
            }
            batch.push(unit);
            batchCoordinateCount += unit.coordinateCount;
            if (
                batch.length >= MAX_SDK_FEATURES_PER_BATCH ||
                batchCoordinateCount >= MAX_SDK_COORDINATES_PER_BATCH
            ) {
                flush();
            }
        }
        flush();
        return batches;
    }

    /**
     * Flattens a Polygon or MultiPolygon into SDK-compatible Polygon objects.
     *
     * @param {any} geometry Source GeoJSON geometry.
     * @returns {Array<import("geojson").Polygon>} Atomic polygons.
     */
    function flattenPolygonGeometry(geometry) {
        if (
            geometry?.type === "Polygon" &&
            Array.isArray(geometry.coordinates) &&
            geometry.coordinates.length > 0
        ) {
            return [{ type: "Polygon", coordinates: geometry.coordinates }];
        }

        if (
            geometry?.type === "MultiPolygon" &&
            Array.isArray(geometry.coordinates) &&
            geometry.coordinates.length > 0
        ) {
            return geometry.coordinates.map((coordinates, partIndex) => {
                if (!Array.isArray(coordinates) || coordinates.length === 0) {
                    throw new Error("Invalid MultiPolygon part at index " + partIndex);
                }
                return { type: "Polygon", coordinates };
            });
        }

        if (geometry?.type === "Polygon" || geometry?.type === "MultiPolygon") {
            throw new Error("Invalid GeoJSON geometry: " + geometry.type);
        }

        const geometryType = geometry?.type || "unknown";
        throw new Error("Unsupported GeoJSON geometry: " + geometryType);
    }

    /**
     * Returns a source property as a string without copying unsafe values.
     *
     * @param {Record<string, unknown>} attributes Source properties.
     * @param {string} key Property name.
     * @returns {string} String value or an empty string.
     */
    function getPropertyString(attributes, key) {
        const value = attributes[key];
        if (typeof value === "string") return value;
        if (typeof value === "number" && Number.isFinite(value)) return String(value);
        return "";
    }

    /**
     * Returns a monotonic clock when available.
     *
     * @returns {number} Current time in milliseconds.
     */
    function nowMs() {
        return typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now();
    }

    /**
     * Yields work until the next browser frame with a timer fallback.
     *
     * @returns {Promise<void>}
     */
    function waitForNextFrame() {
        return new Promise(resolve => {
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(() => resolve());
            } else {
                setTimeout(resolve, 0);
            }
        });
    }

    /**
     * Formats seconds using the existing Thai duration strings.
     *
     * @param {number} seconds Duration in seconds.
     * @returns {string} Formatted duration.
     */
    function formatTime(seconds) {
        if (seconds < 1) return "< 1 วิ";
        if (seconds < 60) return Math.round(seconds) + " วิ";
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins + " นาที " + secs + " วิ";
    }

    /**
     * Creates a hidden SDK layer with dynamic stroke and label styling.
     *
     * @param {boolean} labelsEnabled Whether labels are enabled.
     * @returns {void}
     */
    function createBoundaryLayer(labelsEnabled) {
        if (!wmeSDK) throw new Error("WME Tambon: SDK is unavailable");
        if (isBoundaryLayerCreated || isLayerCheckboxRegistered) {
            const removalError = removeBoundaryLayer();
            if (removalError) throw removalError;
        }

        wmeSDK.Map.addLayer({
            layerName: LAYER_NAME,
            styleContext: {
                getStrokeColor: () => outlineSettings.color,
                getStrokeOpacity: () => outlineSettings.opacity,
                getLabel: ({ feature, zoomLevel }) => {
                    if (!labelsEnabled || zoomLevel < LABEL_MIN_ZOOM) return "";
                    const label = feature?.properties?.__tbLabel;
                    return typeof label === "string" ? label : "";
                }
            },
            styleRules: [{
                style: {
                    strokeColor: "${getStrokeColor}",
                    strokeOpacity: "${getStrokeOpacity}",
                    strokeWidth: 2,
                    fillColor: "#FF0000",
                    fillOpacity: 0,
                    label: "${getLabel}",
                    fontColor: "#8B0000",
                    fontSize: "14px",
                    fontFamily: "Sarabun, sans-serif",
                    labelOutlineColor: "#ffffff",
                    labelOutlineWidth: 3,
                    fontWeight: "bold",
                    labelAlign: "cm",
                    pointerEvents: "none"
                }
            }]
        });

        isBoundaryLayerCreated = true;
        isBoundaryLayerReady = false;
        isBoundaryLayerEnabled = true;

        try {
            wmeSDK.Map.setLayerZIndex({
                layerName: LAYER_NAME,
                zIndex: LAYER_Z_INDEX
            });
            wmeSDK.Map.setLayerVisibility({
                layerName: LAYER_NAME,
                visibility: false
            });
            wmeSDK.LayerSwitcher.addLayerCheckbox({
                name: LAYER_CHECKBOX_NAME,
                isChecked: true
            });
            isLayerCheckboxRegistered = true;
        } catch (error) {
            removeBoundaryLayer();
            throw error;
        }
    }

    /**
     * Removes the SDK layer and its independent layer-switcher checkbox.
     *
     * @returns {unknown|null} The first SDK cleanup error, if any.
     */
    function removeBoundaryLayer() {
        isBoundaryLayerReady = false;
        let firstError = null;

        if (wmeSDK && isBoundaryLayerCreated) {
            try {
                wmeSDK.Map.removeLayer({ layerName: LAYER_NAME });
                isBoundaryLayerCreated = false;
            } catch (error) {
                firstError = error;
                console.warn("WME Tambon: boundary layer removal failed", error);
            }
        }

        if (wmeSDK && isLayerCheckboxRegistered) {
            try {
                wmeSDK.LayerSwitcher.removeLayerCheckbox({ name: LAYER_CHECKBOX_NAME });
                isLayerCheckboxRegistered = false;
            } catch (error) {
                if (!firstError) firstError = error;
                console.warn("WME Tambon: layer checkbox removal failed", error);
            }
        }
        if (!isBoundaryLayerCreated && !isLayerCheckboxRegistered) {
            isBoundaryLayerEnabled = true;
        }
        return firstError;
    }

    /**
     * Adds one source administrative area to the province navigator.
     *
     * @param {Record<string, NavigatorEntry[]>} navigatorData Navigator data under construction.
     * @param {string} provinceKey Province key.
     * @param {Record<string, unknown>} attributes Source feature properties.
     * @param {BoundaryBounds} bounds Indexed source feature bounds.
     * @returns {void}
     */
    function addNavigatorEntry(navigatorData, provinceKey, attributes, bounds) {
        const district = getPropertyString(attributes, "ADM2_TH");
        if (!district) return;

        const tambon = getPropertyString(attributes, "ADM3_TH");
        const name = tambon || district;
        if (!navigatorData[district]) navigatorData[district] = [];
        if (navigatorData[district].some(entry => entry.name === name)) return;

        const searchLabel = resolveFeatureLabel(provinceKey, attributes);
        navigatorData[district].push({
            name,
            district,
            searchLabel,
            searchText: normalizeSearchText([district, tambon, searchLabel].filter(Boolean).join(" ")),
            bounds
        });
    }

    /**
     * Normalizes user-entered and feature text for province-wide matching.
     *
     * @param {string} value Text to normalize.
     * @returns {string} Normalized search text.
     */
    function normalizeSearchText(value) {
        return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("th");
    }

    /**
     * Renders matching district and tambon entries for the loaded province.
     *
     * @param {string} rawQuery Search field value.
     * @returns {void}
     */
    function renderSearchResults(rawQuery) {
        const query = normalizeSearchText(rawQuery);
        if (!query) {
            const districtSelect = document.getElementById("tb-district-select");
            renderTambonButtons(districtSelect instanceof HTMLSelectElement ? districtSelect.value : "");
            return;
        }

        const matches = Object.values(currentProvinceData)
            .flat()
            .filter(entry => entry.searchText.includes(query))
            .sort((a, b) => a.searchLabel.localeCompare(b.searchLabel, "th"));
        renderNavigatorEntries(matches, entry => entry.searchLabel);
    }

    /**
     * Rebuilds the district selector from the loaded province.
     *
     * @returns {void}
     */
    function updateDistrictDropdown() {
        const districtSelect = document.getElementById('tb-district-select');
        const navigatorContainer = document.getElementById('tb-navigator-container');
        const tambonList = document.getElementById('tb-tambon-list');
        if (!districtSelect || !tambonList || !navigatorContainer) return;

        districtSelect.innerHTML = '<option value="">-- เลือกอำเภอ / เขต --</option>';
        tambonList.innerHTML = '';

        const districts = Object.keys(currentProvinceData).sort((a, b) => a.localeCompare(b, 'th'));

        if (districts.length > 0) {
            districts.forEach(dist => {
                const opt = document.createElement('option');
                opt.value = dist;
                opt.innerText = dist;
                districtSelect.appendChild(opt);
            });
            navigatorContainer.style.display = "block";
        } else {
            navigatorContainer.style.display = "none";
        }
    }

    /**
     * Renders the existing district-specific navigator workflow.
     *
     * @param {string} selectedDistrict Selected district name.
     * @returns {void}
     */
    function renderTambonButtons(selectedDistrict) {
        const entries = selectedDistrict && currentProvinceData[selectedDistrict]
            ? currentProvinceData[selectedDistrict]
            : [];
        renderNavigatorEntries(entries, entry => entry.name);
    }

    /**
     * Renders navigator buttons with either district or search-result labels.
     *
     * @param {NavigatorEntry[]} entries Navigator entries to render.
     * @param {(entry: NavigatorEntry) => string} getLabel Button label provider.
     * @returns {void}
     */
    function renderNavigatorEntries(entries, getLabel) {
        const tambonList = document.getElementById("tb-tambon-list");
        if (!tambonList) return;
        tambonList.innerHTML = "";

        entries.forEach(entry => {
            const button = document.createElement("button");
            button.className = "btn btn-default";
            button.style.cssText = "width: 100%; text-align: left; margin-bottom: 5px; font-size: 12px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #fff;";
            button.textContent = getLabel(entry);
            button.addEventListener("click", () => goToFeature(entry));
            button.onmouseover = () => button.style.background = "#e6f7ff";
            button.onmouseout = () => button.style.background = "#fff";
            tambonList.appendChild(button);
        });
    }

    /**
     * Uses indexed bounds to center the map without walking geometry again.
     *
     * @param {NavigatorEntry} entry Selected navigator entry.
     * @returns {void}
     */
    function goToFeature(entry) {
        goToLocation(
            (entry.bounds.minX + entry.bounds.maxX) / 2,
            (entry.bounds.minY + entry.bounds.maxY) / 2
        );
    }

    /**
     * Centers the WME map on WGS84 coordinates at the existing warp zoom.
     *
     * @param {number} lon Longitude.
     * @param {number} lat Latitude.
     * @returns {void}
     */
    function goToLocation(lon, lat) {
        if (!wmeSDK || !Number.isFinite(lon) || !Number.isFinite(lat)) return;
        wmeSDK.Map.setMapCenter({
            lonLat: { lon, lat },
            zoomLevel: 14
        });
    }
})();
