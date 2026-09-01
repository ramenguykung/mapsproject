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
    const FRAME_BUDGET_MS = 8;
    const MAX_PREPARED_FEATURES_PER_FRAME = 20;
    const MAX_SDK_FEATURES_PER_BATCH = 20;
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
     * @typedef {object} PendingPreparedArea
     * @property {Record<string, unknown>} attributes Source feature properties.
     * @property {SourceGeometry} geometry Source geometry used by the navigator.
     * @property {string} label Boundary label.
     * @property {string} pcode Stable administrative code.
     * @property {Array<import("geojson").Polygon>} polygonParts Atomic polygon geometries.
     * @property {number} nextPartIndex Next polygon part to prepare.
     */

    /**
     * @typedef {object} NavigatorEntry
     * @property {string} name Name used by the existing district list.
     * @property {string} district District or Bangkok district name.
     * @property {string} searchLabel Disambiguated result label.
     * @property {string} searchText Normalized text used for matching.
     * @property {SourceGeometry} geometry Source GeoJSON geometry.
     * @property {{lon: number, lat: number}|null} center Cached WGS84 center.
     * @property {boolean} centerResolved Whether center calculation has run.
     */

    /**
     * @typedef {object} PreparedBoundaryData
     * @property {PreparedSdkFeature[]} features Atomic SDK polygon features.
     * @property {Record<string, NavigatorEntry[]>} navigatorData Navigator data grouped by district.
     * @property {number} sourceFeatureCount Administrative area count.
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
                    <button id="tb-load-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 8px;">โหลดข้อมูล</button>
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
            districtSelect: getRequiredElement("tb-district-select")
        };
        const {
            provinceInput,
            provinceList: datalist,
            loadButton: btnLoad,
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
            btnLoad.disabled = loading;
            btnClear.disabled = loading;
            featureSearch.disabled = loading;
            btnCancel.style.display = loading ? "block" : "none";
            btnCancel.disabled = !loading;
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
         * Cancels all active work and removes any partial layer.
         *
         * @returns {void}
         */
        const cancelLoading = () => {
            loadState.token += 1;
            abortActiveRequest();
            removeBoundaryLayer();
            clearNavigator();
            setLoadingState(false);
            resetProgressUi();
            statusDiv.innerText = "สถานะ: ยกเลิกการโหลดแล้ว";
        };

        setLoadingState(false);

        Object.keys(PROVINCES).sort((a, b) => parseInt(a) - parseInt(b)).forEach(key => {
            const option = document.createElement("option");
            option.value = PROVINCES[key].name;
            datalist.appendChild(option);
        });

        btnLoad.addEventListener("click", () => {
            const selectedName = provinceInput.value;
            const selectedKey = Object.keys(PROVINCES).find(key => PROVINCES[key].name === selectedName);

            if (selectedKey && PROVINCES[selectedKey]) {
                statusDiv.innerText = "⏳ กำลังดาวน์โหลด...";
                progressContainer.style.display = "block";
                progressBar.style.width = "0%";
                progressText.innerText = "0%";
                etaText.innerText = "กำลังโหลด...";
                setLoadingState(true);

                loadBoundary(selectedKey, PROVINCES[selectedKey].file, statusDiv, {
                    bar: progressBar,
                    text: progressText,
                    eta: etaText
                }, () => {
                    setLoadingState(false);
                });
            } else {
                alert("กรุณาเลือกจังหวัดให้ถูกต้อง (ต้องตรงกับในรายการ)");
            }
        });

        btnCancel.addEventListener("click", () => {
            if (!loadState.isLoading) return;
            cancelLoading();
        });

        btnClear.addEventListener("click", () => {
            loadState.token += 1;
            abortActiveRequest();
            removeBoundaryLayer();
            clearNavigator();
            setLoadingState(false);
            statusDiv.innerText = "สถานะ: ลบเส้นแล้ว";
            progressContainer.style.display = "none";
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
     * Downloads one province and starts complete SDK layer rendering.
     *
     * @param {string} provinceKey Province key.
     * @param {string} filename GeoJSON filename.
     * @param {HTMLElement} statusDiv Status element.
     * @param {ProgressUi} ui Progress elements.
     * @param {Function} onComplete Completion callback.
     * @returns {void}
     */
    function loadBoundary(provinceKey, filename, statusDiv, ui, onComplete) {
        const loadToken = ++loadState.token;
        const url = DATA_BASE_URL + filename;

        abortActiveRequest();
        removeBoundaryLayer();
        clearNavigator();

        fetchGeoJson(url)
            .then(async geoJsonData => {
                if (loadToken !== loadState.token) return;
                statusDiv.innerText = "กำลังประมวลผล...";
                await drawCompleteBoundaryLayer(
                    geoJsonData,
                    provinceKey,
                    statusDiv,
                    ui,
                    loadToken,
                    onComplete
                );
            })
            .catch(error => {
                if (loadToken !== loadState.token) return;
                removeBoundaryLayer();
                clearNavigator();
                const message = error instanceof Error ? error.message : String(error);
                statusDiv.innerText = "❌ ผิดพลาด: " + message;
                if (typeof onComplete === "function") onComplete();
            });
    }

    /**
     * Prepares and inserts every source area without spatial filtering.
     *
     * @param {unknown} geoJsonData Province GeoJSON data.
     * @param {string} provinceKey Province key.
     * @param {HTMLElement} statusDiv Status element.
     * @param {ProgressUi} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @param {Function} onComplete Completion callback.
     * @returns {Promise<void>}
     */
    async function drawCompleteBoundaryLayer(geoJsonData, provinceKey, statusDiv, ui, loadToken, onComplete) {
        const rawFeatures = getSourceFeatures(geoJsonData);
        const total = rawFeatures.length;

        if (total === 0) {
            statusDiv.innerText = "❌ ไม่พบข้อมูลพื้นที่ในไฟล์";
            ui.bar.style.width = "0%";
            ui.text.innerText = "0%";
            ui.eta.innerText = "--:--";
            if (typeof onComplete === "function") onComplete();
            return;
        }

        const labelsEnabled = total <= LABEL_FEATURE_LIMIT;
        const prepared = await prepareBoundaryData(rawFeatures, provinceKey, labelsEnabled, ui, loadToken);
        if (!prepared || loadToken !== loadState.token) return;

        createBoundaryLayer(labelsEnabled);
        const completed = await addPreparedFeatures(prepared.features, ui, loadToken);
        if (!completed || loadToken !== loadState.token || !wmeSDK) return;

        isBoundaryLayerReady = true;
        wmeSDK.Map.setLayerVisibility({
            layerName: LAYER_NAME,
            visibility: isBoundaryLayerEnabled
        });
        wmeSDK.Map.redrawLayer({ layerName: LAYER_NAME });

        currentProvinceData = prepared.navigatorData;
        updateDistrictDropdown();
        ui.eta.innerText = "เสร็จสิ้น";
        statusDiv.innerText = `✅ แสดงผลเรียบร้อย (${prepared.sourceFeatureCount} พื้นที่${!labelsEnabled ? ", โหมดเร็ว: ปิดชื่อ" : ""})`;
        if (typeof onComplete === "function") onComplete();
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
     * Converts all source areas into atomic SDK polygons in cooperative frames.
     *
     * @param {SourceFeature[]} rawFeatures Source GeoJSON features.
     * @param {string} provinceKey Province key.
     * @param {boolean} labelsEnabled Whether labels are enabled.
     * @param {ProgressUi} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @returns {Promise<PreparedBoundaryData|null>} Prepared data or null after cancellation.
     */
    async function prepareBoundaryData(rawFeatures, provinceKey, labelsEnabled, ui, loadToken) {
        /** @type {PreparedSdkFeature[]} */
        const features = [];
        /** @type {Record<string, NavigatorEntry[]>} */
        const navigatorData = {};
        const total = rawFeatures.length;
        const startTime = nowMs();
        let lastProgressUpdateAt = -Infinity;
        let index = 0;
        /** @type {PendingPreparedArea|null} */
        let pendingArea = null;

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
                if (!pendingArea) {
                    const sourceFeature = rawFeatures[index];
                    if (!sourceFeature || typeof sourceFeature !== "object" || !sourceFeature.geometry) {
                        throw new Error("Invalid GeoJSON feature at index " + index);
                    }

                    const attributes = sourceFeature.properties && typeof sourceFeature.properties === "object"
                        ? sourceFeature.properties
                        : {};
                    const pcode = getPropertyString(attributes, "ADM3_PCODE") ||
                        getPropertyString(attributes, "ADM2_PCODE");
                    if (!pcode) {
                        throw new Error("Missing PCode at index " + index);
                    }

                    pendingArea = {
                        attributes,
                        geometry: sourceFeature.geometry,
                        label: resolveFeatureLabel(provinceKey, attributes),
                        pcode,
                        polygonParts: flattenPolygonGeometry(sourceFeature.geometry),
                        nextPartIndex: 0
                    };
                    if (nowMs() - frameStart >= FRAME_BUDGET_MS) break;
                }

                const partIndex = pendingArea.nextPartIndex;
                features.push({
                    id: provinceKey + "-" + pendingArea.pcode + "-" + partIndex,
                    type: "Feature",
                    geometry: pendingArea.polygonParts[partIndex],
                    properties: {
                        __tbLabel: labelsEnabled && partIndex === 0 ? pendingArea.label : ""
                    }
                });
                pendingArea.nextPartIndex += 1;
                preparedInFrame += 1;

                if (pendingArea.nextPartIndex >= pendingArea.polygonParts.length) {
                    addNavigatorEntry(
                        navigatorData,
                        provinceKey,
                        pendingArea.attributes,
                        pendingArea.geometry
                    );
                    pendingArea = null;
                    index += 1;
                }
            }

            updateProgress(index >= total);
            if (index < total) await waitForNextFrame();
        }

        Object.keys(navigatorData).forEach(district => {
            navigatorData[district].sort((a, b) => a.name.localeCompare(b.name, "th"));
        });

        return {
            features,
            navigatorData,
            sourceFeatureCount: total
        };
    }

    /**
     * Adds all prepared SDK polygons in bounded synchronous batches.
     *
     * @param {PreparedSdkFeature[]} features SDK features.
     * @param {ProgressUi} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @returns {Promise<boolean>} True after every feature is added.
     */
    async function addPreparedFeatures(features, ui, loadToken) {
        if (!wmeSDK) throw new Error("WME Tambon: SDK is unavailable");
        ui.eta.innerText = "กำลังวาดเส้นลงแผนที่...";

        for (let index = 0; index < features.length; index += MAX_SDK_FEATURES_PER_BATCH) {
            if (loadToken !== loadState.token) return false;
            const batch = features.slice(index, index + MAX_SDK_FEATURES_PER_BATCH);
            wmeSDK.Map.addFeaturesToLayer({
                layerName: LAYER_NAME,
                features: batch
            });
            if (index + MAX_SDK_FEATURES_PER_BATCH < features.length) {
                await waitForNextFrame();
            }
        }

        return loadToken === loadState.token;
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
     * Computes WGS84 bounds for a GeoJSON geometry when a user warps.
     *
     * @param {any} geometry GeoJSON geometry.
     * @returns {{minX: number, minY: number, maxX: number, maxY: number}|null} Geometry bounds.
     */
    function computeGeometryBounds(geometry) {
        if (!geometry) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        function updateCoord(coord) {
            if (!Array.isArray(coord) || coord.length < 2) return;
            const x = Number(coord[0]), y = Number(coord[1]);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        function walkCoordinates(coords) {
            if (!Array.isArray(coords) || coords.length === 0) return;
            if (typeof coords[0] === "number") {
                updateCoord(coords);
                return;
            }
            for (let i = 0; i < coords.length; i += 1) walkCoordinates(coords[i]);
        }

        function walkGeometry(g) {
            if (!g) return;
            if (g.type === "GeometryCollection" && Array.isArray(g.geometries)) {
                for (let i = 0; i < g.geometries.length; i += 1) walkGeometry(g.geometries[i]);
                return;
            }
            walkCoordinates(g.coordinates);
        }

        walkGeometry(geometry);
        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
        return { minX, minY, maxX, maxY };
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
     * @param {SourceGeometry} geometry Source feature geometry kept for lazy center calculation.
     * @returns {void}
     */
    function addNavigatorEntry(navigatorData, provinceKey, attributes, geometry) {
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
            geometry,
            center: null,
            centerResolved: false
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
     * Calculates an area's center once and warps to it.
     *
     * @param {NavigatorEntry} entry Selected navigator entry.
     * @returns {void}
     */
    function goToFeature(entry) {
        if (!entry.centerResolved) {
            const bounds = computeGeometryBounds(entry.geometry);
            entry.center = bounds
                ? {
                    lon: (bounds.minX + bounds.maxX) / 2,
                    lat: (bounds.minY + bounds.maxY) / 2
                }
                : null;
            entry.centerResolved = true;
        }

        if (entry.center) goToLocation(entry.center.lon, entry.center.lat);
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
