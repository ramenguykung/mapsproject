// ==UserScript==
// @name         WME Thailand Tambon
// @namespace    https://github.com/wazeth/
// @version      2.1
// @description  แสดงขอบเขตตำบล
// @author       Waze Thailand
// @match        https://*.waze.com/*/editor*
// @match        https://*.waze.com/editor*
// @exclude      https://*.waze.com/user/editor*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/561139/WME%20Thailand%20Tambon.user.js
// @updateURL https://update.greasyfork.org/scripts/561139/WME%20Thailand%20Tambon.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const DATA_BASE_URL = "https://wazeth.github.io/mapsproject/geojson/";
    const SCRIPT_ID = "wme-th-tambon-tab-v2";
    const SCRIPT_TITLE = "ขอบเขตการปกครอง";
    const LAYER_NAME = "wme-thailand-tambon-boundary";
    const LAYER_CHECKBOX_NAME = "ขอบเขตการปกครอง";
    const LAYER_Z_INDEX = 1000;

    const PROVINCES = { // รายชื่อจังหวัด
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

    const FRAME_BUDGET_MS = 10;
    const MAX_FEATURES_PER_BATCH = 15;
    const LABEL_MIN_ZOOM = 12;
    const PROGRESS_UPDATE_INTERVAL_MS = 120;
    const LABEL_FEATURE_LIMIT = 1200;
    const VIEWPORT_PADDING_RATIO = 0.15;
    const VIEWPORT_REFRESH_DEBOUNCE_MS = 180;

    let wmeSDK = null;
    let isBoundaryLayerCreated = false;
    let isBoundaryLayerEnabled = true;
    let activeLoadToken = 0;
    let activeRequest = null;
    let viewportSession = null;
    let viewportRefreshTimer = null;
    const geoJsonCache = new Map();

    const pageWindow = typeof unsafeWindow === "undefined" ? window : unsafeWindow;
    pageWindow.SDK_INITIALIZED.then(init);

    /**
     * Initializes the WME SDK integration and builds the script user interface.
     *
     * @returns {Promise<void>}
     */
    async function init() {
        console.log("WME Tambon: Starting...");
        wmeSDK = pageWindow.getWmeSdk({
            scriptId: SCRIPT_ID,
            scriptName: SCRIPT_TITLE
        });

        registerLayerCheckbox();
        const { tabLabel, tabPane } = await wmeSDK.Sidebar.registerScriptTab();

        tabLabel.innerHTML = '<span>TH</span>';
        tabLabel.title = SCRIPT_TITLE;

        tabPane.innerHTML = `
            <div style="padding: 5px 10px; box-sizing: border-box;">
                <h3 style="margin-bottom: 15px; text-align: center;">${SCRIPT_TITLE}</h3>

                <div style="margin-bottom: 10px; font-size: 12px; color: #666;">
                    <strong>คำแนะนำ:</strong>
                    <ul style="padding-left: 20px; margin-top: 5px;">
                       <li>กรุงเทพฯ: แสดงเขต</li>
                       <li>ต่างจังหวัด: แสดงตำบล, อำเภอ</li>
                       <li>ความเร็วขึ้นอยู่กับขนาดพื้นที่และอินเตอร์เน็ต</li>
                    </ul>
                </div>

                <div class="form-group">
                    <label for="tb-province-input" style="font-weight: bold;">จังหวัด:</label>
                    <input list="tb-provinces-list" id="tb-province-input" class="form-control" placeholder="-- พิมพ์หรือคลิกเพื่อเลือก --" style="width: 100%; margin-bottom: 10px;">
                    <datalist id="tb-provinces-list"></datalist>
                </div>

                <div style="margin-top: 15px;">
                    <button id="tb-load-btn" class="btn btn-primary" style="width: 100%; margin-bottom: 8px;">
                        โหลดข้อมูล
                    </button>
                    <button id="tb-cancel-btn" class="btn btn-warning" style="width: 100%; margin-bottom: 8px; display: none;">
                        ยกเลิกการโหลด
                    </button>
                    <button id="tb-clear-btn" class="btn btn-default" style="width: 100%;">
                        ลบเส้นออก
                    </button>
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
                        <select id="tb-district-select" class="form-control" style="width: 100%; height: 30px; font-size: 12px;">
                            <option value="">-- เลือกอำเภอ/เขต --</option>
                        </select>
                    </div>
                    <div id="tb-tambon-list" style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
                        </div>
                </div>
            </div>
        `;

        setupInteractions();
    }

    /**
     * Adds the script layer checkbox and applies checkbox changes to the SDK layer.
     *
     * @returns {void}
     */
    function registerLayerCheckbox() {
        wmeSDK.LayerSwitcher.addLayerCheckbox({
            name: LAYER_CHECKBOX_NAME,
            isChecked: isBoundaryLayerEnabled
        });

        wmeSDK.Events.on({
            eventName: "wme-layer-checkbox-toggled",
            eventHandler: ({ name, checked }) => {
                if (name !== LAYER_CHECKBOX_NAME) return;
                isBoundaryLayerEnabled = checked;
                if (isBoundaryLayerCreated) {
                    wmeSDK.Map.setLayerVisibility({
                        layerName: LAYER_NAME,
                        visibility: checked
                    });
                }
            }
        });
    }

    /**
     * Connects controls in the script tab to loading, clearing, and navigation actions.
     *
     * @returns {void}
     */
    function setupInteractions() {
        const input = document.getElementById('tb-province-input');
        const datalist = document.getElementById('tb-provinces-list');
        const btnLoad = document.getElementById('tb-load-btn');
        const btnCancel = document.getElementById('tb-cancel-btn');
        const btnClear = document.getElementById('tb-clear-btn');
        const statusDiv = document.getElementById('tb-status');
        const navigatorContainer = document.getElementById('tb-navigator-container');

        const progressContainer = document.getElementById('tb-progress-container');
        const progressBar = document.getElementById('tb-progress-bar');
        const progressText = document.getElementById('tb-progress-text');
        const etaText = document.getElementById('tb-eta-text');
        let isLoading = false;

        const setLoadingState = (loading) => {
            isLoading = loading;
            input.disabled = loading;
            btnLoad.disabled = loading;
            btnClear.disabled = loading;
            btnCancel.style.display = loading ? "block" : "none";
            btnCancel.disabled = !loading;
        };

        const resetProgressUi = () => {
            progressBar.style.width = "0%";
            progressText.innerText = "0%";
            etaText.innerText = "--:--";
            progressContainer.style.display = "none";
        };

        const abortActiveRequest = () => {
            if (activeRequest && typeof activeRequest.abort === "function") {
                try {
                    activeRequest.abort();
                } catch (err) {
                    console.warn("WME Tambon: request abort failed", err);
                }
            }
            activeRequest = null;
        };

        const cancelLoading = () => {
            activeLoadToken += 1;
            abortActiveRequest();
            teardownViewportSession();

            removeBoundaryLayer();

            setLoadingState(false);
            resetProgressUi();
            statusDiv.innerText = "สถานะ: ยกเลิกการโหลดแล้ว";
        };

        setLoadingState(false);

        Object.keys(PROVINCES).sort((a,b) => parseInt(a) - parseInt(b)).forEach(key => {
            const opt = document.createElement('option');
            opt.value = PROVINCES[key].name;
            datalist.appendChild(opt);
        });

        btnLoad.addEventListener('click', () => {
            const selectedName = input.value;
            const selectedKey = Object.keys(PROVINCES).find(key => PROVINCES[key].name === selectedName);

            if(selectedKey && PROVINCES[selectedKey]) {
                statusDiv.innerText = "กำลังดาวน์โหลด...";
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
                    if (navigatorContainer && Object.keys(currentProvinceData).length > 0) {
                        navigatorContainer.style.display = "block";
                    }
                });
            } else {
                alert("กรุณาเลือกจังหวัดให้ถูกต้อง (ต้องตรงกับในรายการ)");
            }
        });

        btnCancel.addEventListener('click', () => {
            if (!isLoading) return;
            cancelLoading();
        });

        btnClear.addEventListener('click', () => {
            activeLoadToken += 1;
            abortActiveRequest();
            teardownViewportSession();
            removeBoundaryLayer();

            setLoadingState(false);
            statusDiv.innerText = "สถานะ: ลบเส้นแล้ว";
            progressContainer.style.display = "none";
            document.getElementById('tb-navigator-container').style.display = "none";
        });

        const districtSelect = document.getElementById('tb-district-select');
        if (districtSelect) {
            districtSelect.addEventListener('change', (e) => {
                renderTambonButtons(e.target.value);
            });
        }
    }

    /**
     * Downloads and parses a JSON resource through the userscript request API.
     *
     * @param {string} url Resource URL.
     * @returns {Promise<object>} Parsed JSON data.
     */
    function fetchGM(url) {
        return new Promise((resolve, reject) => {
            const request = GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (activeRequest === request) {
                        activeRequest = null;
                    }
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const json = JSON.parse(response.responseText);
                            resolve(json);
                        } catch (e) {
                            reject(new Error("Invalid JSON"));
                        }
                    } else {
                        reject(new Error("HTTP Error: " + response.status));
                    }
                },
                onerror: function(err) {
                    if (activeRequest === request) {
                        activeRequest = null;
                    }
                    reject(new Error("Network Error"));
                },
                onabort: function() {
                    if (activeRequest === request) {
                        activeRequest = null;
                    }
                    reject(new Error("Request canceled"));
                }
            });
            activeRequest = request;
        });
    }

    /**
     * Returns a cached GeoJSON request for a resource URL.
     *
     * @param {string} url Resource URL.
     * @returns {Promise<object>} Parsed GeoJSON data.
     */
    function fetchGeoJson(url) {
        if (!geoJsonCache.has(url)) {
            const pending = fetchGM(url).catch(err => {
                geoJsonCache.delete(url);
                throw err;
            });
            geoJsonCache.set(url, pending);
        }
        return geoJsonCache.get(url);
    }

    /**
     * Resolves the label shown for one administrative feature.
     *
     * @param {string} provinceKey Province key.
     * @param {object} attributes GeoJSON properties.
     * @returns {string} Display label.
     */
    function resolveFeatureLabel(provinceKey, attributes) {
        const attrs = attributes || {};

        if (provinceKey === "0") {
            return attrs.ADM2_TH || "";
        }

        const adm3 = attrs.ADM3_TH || "";
        const adm2 = attrs.ADM2_TH || "";
        if (adm3 && adm2) return adm3 + ", " + adm2;
        return adm3 || adm2;
    }

    /**
     * Loads one province and starts indexed viewport rendering.
     *
     * @param {string} provinceKey Province key.
     * @param {string} filename GeoJSON filename.
     * @param {HTMLElement} statusDiv Status element.
     * @param {object} ui Progress elements.
     * @param {Function} onComplete Completion callback.
     * @returns {void}
     */
    function loadBoundary(provinceKey, filename, statusDiv, ui, onComplete) {
        const loadToken = ++activeLoadToken;
        const url = DATA_BASE_URL + filename;

        teardownViewportSession();

        removeBoundaryLayer();

        fetchGeoJson(url)
            .then(data => {
                if (loadToken !== activeLoadToken) return;
                parseDistrictsForNavigator(data);
                statusDiv.innerText = "กำลังประมวลผล...";
                drawLayerWithProgress(data, provinceKey, statusDiv, ui, loadToken, onComplete);
            })
            .catch(err => {
                if (loadToken !== activeLoadToken) return;
                console.error("Load Error:", err);
                statusDiv.innerText = "ผิดพลาด: " + err.message;
                if (typeof onComplete === "function") {
                    onComplete();
                }
            });
    }

    /**
     * Indexes source features without blocking the editor and starts viewport rendering.
     *
     * @param {object} geoJsonData Province GeoJSON data.
     * @param {string} provinceKey Province key.
     * @param {HTMLElement} statusDiv Status element.
     * @param {object} ui Progress elements.
     * @param {number} loadToken Active load token.
     * @param {Function} onComplete Completion callback.
     * @returns {void}
     */
    function drawLayerWithProgress(geoJsonData, provinceKey, statusDiv, ui, loadToken, onComplete) {
        const allFeatures = Array.isArray(geoJsonData?.features) ? geoJsonData.features : [];
        const total = allFeatures.length;

        if (total === 0) {
            statusDiv.innerText = "ไม่พบข้อมูลพื้นที่ในไฟล์";
            ui.bar.style.width = "0%";
            ui.text.innerText = "0%";
            ui.eta.innerText = "--:--";
            if (typeof onComplete === "function") {
                onComplete();
            }
            return;
        }

        const labelsEnabled = total <= LABEL_FEATURE_LIMIT;
        const indexedItems = [];
        const itemsById = new Map();
        let index = 0;
        const startTime = performance.now();
        let lastProgressUpdateAt = 0;

        function updateIndexProgress(force) {
            const now = performance.now();
            if (!force && (now - lastProgressUpdateAt) < PROGRESS_UPDATE_INTERVAL_MS) {
                return;
            }
            lastProgressUpdateAt = now;

            const elapsed = Math.max((now - startTime) / 1000, 0.001);
            const pct = Math.floor((index / total) * 100);
            ui.bar.style.width = pct + "%";
            ui.text.innerText = "กำลังโหลดข้อมูล: " + pct + "% (" + index + "/" + total + ")";

            if (index > 0 && index < total) {
                const rate = index / elapsed;
                const etaSeconds = (total - index) / Math.max(rate, 0.001);
                ui.eta.innerText = "เหลืออีก: " + formatTime(etaSeconds);
            } else if (index >= total) {
                ui.eta.innerText = "กำลังแสดงมุมมอง...";
            }
        }

        function processIndexBatch() {
            if (loadToken !== activeLoadToken) return;

            const frameStart = performance.now();
            let processedInBatch = 0;

            while (
                index < total &&
                processedInBatch < (MAX_FEATURES_PER_BATCH * 10) &&
                (performance.now() - frameStart) < FRAME_BUDGET_MS
            ) {
                const featureIndex = index;
                const f = allFeatures[index];
                index += 1;
                processedInBatch += 1;

                if (!f || !f.geometry) continue;

                const bounds = computeGeometryBounds(f.geometry);
                if (!bounds) continue;

                const attrs = f.properties || {};
                if (labelsEnabled && !attrs.__tbLabel) {
                    attrs.__tbLabel = resolveFeatureLabel(provinceKey, attrs);
                }

                const item = {
                    id: featureIndex,
                    geometry: f.geometry,
                    properties: attrs,
                    bounds,
                    sdkFeatures: null,
                    addedFeatureIds: []
                };
                indexedItems.push(item);
                itemsById.set(featureIndex, item);
            }

            updateIndexProgress(false);

            if (index < total) {
                scheduleNextFrame(processIndexBatch);
                return;
            }

            updateIndexProgress(true);

            createBoundaryLayer(provinceKey, labelsEnabled);

            const session = {
                loadToken,
                labelsEnabled,
                items: indexedItems,
                itemsById,
                visibleIds: new Set(),
                refreshId: 0,
                removeMoveHandler: null
            };
            viewportSession = session;
            statusDiv.innerText = "กำลังโหลดเฉพาะมุมมองปัจจุบัน...";

            refreshViewportFeatures(session, statusDiv, ui, {
                isInitial: true,
                onComplete: function() {
                    attachViewportRefreshHandler(session, statusDiv, ui);
                    if (typeof onComplete === "function") {
                        onComplete();
                    }
                }
            });
        }

        processIndexBatch();
    }

    /**
     * Reconciles SDK layer features with the padded current map viewport.
     *
     * @param {object} session Active viewport session.
     * @param {HTMLElement} statusDiv Status element.
     * @param {object} ui Progress elements.
     * @param {object} options Refresh options.
     * @returns {void}
     */
    function refreshViewportFeatures(session, statusDiv, ui, options) {
        const isInitial = Boolean(options && options.isInitial);
        const onComplete = options && options.onComplete;

        if (!isViewportSessionActive(session)) {
            return;
        }

        const extent = getCurrentPaddedExtent();
        if (!extent) {
            if (isInitial && typeof onComplete === "function") {
                onComplete();
            }
            return;
        }

        const refreshId = ++session.refreshId;
        const targetItems = [];
        for (let i = 0; i < session.items.length; i += 1) {
            const item = session.items[i];
            if (boundsIntersect(item.bounds, extent)) {
                targetItems.push(item);
            }
        }

        const targetIdSet = new Set(targetItems.map(item => item.id));
        const idsToRemove = [];
        session.visibleIds.forEach(id => {
            if (!targetIdSet.has(id)) {
                idsToRemove.push(id);
            }
        });

        if (idsToRemove.length && isBoundaryLayerCreated) {
            const removeItems = [];
            for (let i = 0; i < idsToRemove.length; i += 1) {
                const item = session.itemsById.get(idsToRemove[i]);
                if (item) removeItems.push(item);
            }
            removeItemsFromBoundaryLayer(removeItems);
            for (let i = 0; i < idsToRemove.length; i += 1) {
                session.visibleIds.delete(idsToRemove[i]);
            }
        }

        const addQueue = [];
        for (let i = 0; i < targetItems.length; i += 1) {
            const item = targetItems[i];
            if (!session.visibleIds.has(item.id)) {
                addQueue.push(item);
            }
        }

        let addIndex = 0;
        const startTime = performance.now();
        let lastProgressUpdateAt = 0;

        function updateViewportProgress(force) {
            if (!isInitial) return;

            const now = performance.now();
            if (!force && (now - lastProgressUpdateAt) < PROGRESS_UPDATE_INTERVAL_MS) {
                return;
            }
            lastProgressUpdateAt = now;

            const totalToAdd = addQueue.length;
            const pct = totalToAdd === 0 ? 100 : Math.floor((addIndex / totalToAdd) * 100);
            ui.bar.style.width = pct + "%";
            ui.text.innerText = "กำลังประมวลผล: " + pct + "% (" + addIndex + " จาก " + totalToAdd + ")";

            if (totalToAdd === 0 || addIndex >= totalToAdd) {
                ui.eta.innerText = "เสร็จสิ้น";
                return;
            }

            const elapsed = Math.max((now - startTime) / 1000, 0.001);
            const rate = addIndex / elapsed;
            const etaSeconds = (totalToAdd - addIndex) / Math.max(rate, 0.001);
            ui.eta.innerText = "เหลืออีก: " + formatTime(etaSeconds);
        }

        function processAddBatch() {
            if (!isViewportSessionActive(session, refreshId)) return;

            const frameStart = performance.now();
            const batchItems = [];
            let processedInBatch = 0;

            while (
                addIndex < addQueue.length &&
                processedInBatch < MAX_FEATURES_PER_BATCH &&
                (performance.now() - frameStart) < FRAME_BUDGET_MS
            ) {
                const item = addQueue[addIndex];
                addIndex += 1;
                processedInBatch += 1;

                if (!item.sdkFeatures) {
                    item.sdkFeatures = createSdkFeatures(item);
                }

                batchItems.push(item);
                session.visibleIds.add(item.id);
            }

            if (batchItems.length && isBoundaryLayerCreated) {
                addItemsToBoundaryLayer(batchItems);
            }

            updateViewportProgress(false);

            if (addIndex < addQueue.length) {
                scheduleNextFrame(processAddBatch);
                return;
            }

            updateViewportProgress(true);
            if (isBoundaryLayerCreated) {
                wmeSDK.Map.setLayerVisibility({
                    layerName: LAYER_NAME,
                    visibility: isBoundaryLayerEnabled
                });
                wmeSDK.Map.redrawLayer({ layerName: LAYER_NAME });
            }

            if (isInitial) {
                finalizeLayer(session.visibleIds.size, statusDiv, session.labelsEnabled, true);
            } else {
                statusDiv.innerText = `อัปเดตมุมมองแล้ว (${session.visibleIds.size} พื้นที่ในหน้าจอ)`;
            }

            if (typeof onComplete === "function") {
                onComplete();
            }
        }

        processAddBatch();
    }

    /**
     * Checks whether asynchronous viewport work still belongs to the active load.
     *
     * @param {object} session Viewport session.
     * @param {number} [refreshId] Expected refresh identifier.
     * @returns {boolean} True when the session is active.
     */
    function isViewportSessionActive(session, refreshId) {
        if (!session || viewportSession !== session) return false;
        if (session.loadToken !== activeLoadToken) return false;
        if (typeof refreshId === "number" && session.refreshId !== refreshId) return false;
        return true;
    }

    /**
     * Registers an SDK map move end handler for viewport refreshes.
     *
     * @param {object} session Active viewport session.
     * @param {HTMLElement} statusDiv Status element.
     * @param {object} ui Progress elements.
     * @returns {void}
     */
    function attachViewportRefreshHandler(session, statusDiv, ui) {
        if (!isViewportSessionActive(session)) return;
        if (session.removeMoveHandler) return;

        const moveHandler = function() {
            if (!isViewportSessionActive(session)) return;

            if (viewportRefreshTimer) {
                clearTimeout(viewportRefreshTimer);
            }

            viewportRefreshTimer = setTimeout(() => {
                viewportRefreshTimer = null;
                refreshViewportFeatures(session, statusDiv, ui, { isInitial: false });
            }, VIEWPORT_REFRESH_DEBOUNCE_MS);
        };

        session.removeMoveHandler = wmeSDK.Events.on({
            eventName: "wme-map-move-end",
            eventHandler: moveHandler
        });
    }

    /**
     * Cancels timers and unregisters the active SDK map event handler.
     *
     * @returns {void}
     */
    function teardownViewportSession() {
        if (viewportRefreshTimer) {
            clearTimeout(viewportRefreshTimer);
            viewportRefreshTimer = null;
        }

        if (viewportSession && viewportSession.removeMoveHandler) {
            viewportSession.removeMoveHandler();
            viewportSession.removeMoveHandler = null;
        }

        viewportSession = null;
    }

    /**
     * Gets the SDK map extent in WGS84 with extra viewport padding.
     *
     * @returns {object|null} Padded extent or null when unavailable.
     */
    function getCurrentPaddedExtent() {
        const mapExtent = wmeSDK.Map.getMapExtent();
        if (!Array.isArray(mapExtent) || mapExtent.length < 4) return null;

        const [left, bottom, right, top] = mapExtent;
        if (![left, bottom, right, top].every(Number.isFinite)) return null;

        const width = Math.max(right - left, 0);
        const height = Math.max(top - bottom, 0);
        const padX = width * VIEWPORT_PADDING_RATIO;
        const padY = height * VIEWPORT_PADDING_RATIO;

        return {
            left: left - padX,
            right: right + padX,
            bottom: bottom - padY,
            top: top + padY
        };
    }

    /**
     * Tests whether geometry bounds intersect the current map extent.
     *
     * @param {object} bounds Geometry bounds.
     * @param {object} extent Map extent.
     * @returns {boolean} True when the bounds intersect.
     */
    function boundsIntersect(bounds, extent) {
        if (!bounds || !extent) return false;
        return !(
            bounds.maxX < extent.left ||
            bounds.minX > extent.right ||
            bounds.maxY < extent.bottom ||
            bounds.minY > extent.top
        );
    }

    /**
     * Computes WGS84 bounds for a GeoJSON geometry.
     *
     * @param {object} geometry GeoJSON geometry.
     * @returns {object|null} Geometry bounds or null for invalid coordinates.
     */
    function computeGeometryBounds(geometry) {
        if (!geometry) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        function updateCoord(coord) {
            if (!Array.isArray(coord) || coord.length < 2) return;
            const x = Number(coord[0]);
            const y = Number(coord[1]);
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

            for (let i = 0; i < coords.length; i += 1) {
                walkCoordinates(coords[i]);
            }
        }

        function walkGeometry(g) {
            if (!g) return;
            if (g.type === "GeometryCollection" && Array.isArray(g.geometries)) {
                for (let i = 0; i < g.geometries.length; i += 1) {
                    walkGeometry(g.geometries[i]);
                }
                return;
            }

            walkCoordinates(g.coordinates);
        }

        walkGeometry(geometry);

        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
            return null;
        }

        return { minX, minY, maxX, maxY };
    }

    /**
     * Flattens complex GeoJSON into geometry types accepted by the WME SDK.
     *
     * @param {object} geometry GeoJSON geometry.
     * @returns {object[]} Atomic Point, LineString, or Polygon geometries.
     */
    function getAtomicGeometries(geometry) {
        if (!geometry || typeof geometry.type !== "string") return [];

        if (["Point", "LineString", "Polygon"].includes(geometry.type)) {
            return [geometry];
        }

        const multiGeometryTypes = {
            MultiPoint: "Point",
            MultiLineString: "LineString",
            MultiPolygon: "Polygon"
        };
        const atomicType = multiGeometryTypes[geometry.type];
        if (atomicType && Array.isArray(geometry.coordinates)) {
            return geometry.coordinates.map(coordinates => ({
                type: atomicType,
                coordinates
            }));
        }

        if (geometry.type === "GeometryCollection" && Array.isArray(geometry.geometries)) {
            return geometry.geometries.flatMap(getAtomicGeometries);
        }

        return [];
    }

    /**
     * Builds uniquely identified SDK features for one indexed source feature.
     *
     * @param {object} item Indexed source feature.
     * @returns {object[]} SDK compatible GeoJSON features.
     */
    function createSdkFeatures(item) {
        return getAtomicGeometries(item.geometry).map((geometry, partIndex) => ({
            id: item.id + "-" + partIndex,
            type: "Feature",
            geometry,
            properties: {
                ...item.properties,
                __tbPrimaryPart: partIndex === 0
            }
        }));
    }

    /**
     * Adds a batch of indexed source items through the WME SDK.
     *
     * @param {object[]} items Indexed source items.
     * @returns {void}
     */
    function addItemsToBoundaryLayer(items) {
        const features = items.flatMap(item => item.sdkFeatures || []);
        if (!features.length) return;

        try {
            wmeSDK.Map.addFeaturesToLayer({
                layerName: LAYER_NAME,
                features
            });
            items.forEach(item => {
                item.addedFeatureIds = (item.sdkFeatures || []).map(feature => feature.id);
            });
        } catch (error) {
            console.warn("WME Tambon: SDK batch add failed, retrying each area", error);
            items.forEach(item => {
                const itemFeatures = item.sdkFeatures || [];
                item.addedFeatureIds = [];
                if (!itemFeatures.length) return;

                try {
                    wmeSDK.Map.addFeaturesToLayer({
                        layerName: LAYER_NAME,
                        features: itemFeatures
                    });
                    item.addedFeatureIds = itemFeatures.map(feature => feature.id);
                } catch (itemError) {
                    console.warn("WME Tambon: area could not be added: " + item.id, itemError);
                }
            });
        }
    }

    /**
     * Removes indexed source items from the SDK boundary layer.
     *
     * @param {object[]} items Indexed source items.
     * @returns {void}
     */
    function removeItemsFromBoundaryLayer(items) {
        const featureIds = items.flatMap(item => item.addedFeatureIds || []);
        if (featureIds.length) {
            try {
                wmeSDK.Map.removeFeaturesFromLayer({
                    layerName: LAYER_NAME,
                    featureIds
                });
            } catch (error) {
                console.warn("WME Tambon: SDK feature removal failed", error);
            }
        }
        items.forEach(item => {
            item.addedFeatureIds = [];
        });
    }

    /**
     * Schedules work for the next animation frame with a timer fallback.
     *
     * @param {Function} callback Work callback.
     * @returns {void}
     */
    function scheduleNextFrame(callback) {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(callback);
        } else {
            setTimeout(callback, 0);
        }
    }

    /**
     * Formats seconds as a short Thai duration.
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
     * Creates and styles the administrative boundary layer through the WME SDK.
     *
     * @param {string} provinceKey Province key.
     * @param {boolean} labelsEnabled Whether labels are enabled for this province.
     * @returns {void}
     */
    function createBoundaryLayer(provinceKey, labelsEnabled) {
        wmeSDK.Map.addLayer({
            layerName: LAYER_NAME,
            styleContext: {
                getLabel: ({ feature, zoomLevel }) => {
                    if (!labelsEnabled || zoomLevel < LABEL_MIN_ZOOM) return "";
                    const properties = feature?.properties || {};
                    if (!properties.__tbPrimaryPart) return "";
                    return properties.__tbLabel || resolveFeatureLabel(provinceKey, properties);
                }
            },
            styleRules: [{
                style: {
                    strokeColor: "#FF0000",
                    strokeOpacity: 0.8,
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
        wmeSDK.Map.setLayerZIndex({
            layerName: LAYER_NAME,
            zIndex: LAYER_Z_INDEX
        });
        wmeSDK.Map.setLayerVisibility({
            layerName: LAYER_NAME,
            visibility: false
        });
    }

    /**
     * Removes the current boundary layer through the WME SDK.
     *
     * @returns {void}
     */
    function removeBoundaryLayer() {
        if (!isBoundaryLayerCreated) return;
        wmeSDK.Map.removeLayer({ layerName: LAYER_NAME });
        isBoundaryLayerCreated = false;
    }

    /**
     * Writes the completed layer status.
     *
     * @param {number} featureCount Visible administrative area count.
     * @param {HTMLElement} statusDiv Status element.
     * @param {boolean} labelsEnabled Whether labels are enabled.
     * @param {boolean} viewportMode Whether viewport mode is active.
     * @returns {void}
     */
    function finalizeLayer(featureCount, statusDiv, labelsEnabled, viewportMode) {
        const modeSuffix = viewportMode ? "ในมุมมอง" : "";

        if (labelsEnabled) {
            statusDiv.innerText = `แสดงผลเรียบร้อย (${featureCount} พื้นที่${modeSuffix})`;
        } else {
            statusDiv.innerText = `แสดงผลเรียบร้อย (${featureCount} พื้นที่${modeSuffix}, โหมดเร็ว: ปิดชื่อพื้นที่)`;
        }
    }

    let currentProvinceData = {};

    /**
     * Builds the district and tambon navigator data from loaded GeoJSON.
     *
     * @param {object} geoJsonData Province GeoJSON data.
     * @returns {void}
     */
    function parseDistrictsForNavigator(geoJsonData) {
        currentProvinceData = {};
        const allFeatures = Array.isArray(geoJsonData?.features) ? geoJsonData.features : [];

        allFeatures.forEach(f => {
            const attrs = f.properties || {};
            const adm2 = attrs.ADM2_TH;
            const adm3 = attrs.ADM3_TH;

            if (!adm2) return;

            const bounds = computeGeometryBounds(f.geometry);
            let centerLon = null;
            let centerLat = null;
            if (bounds) {
                centerLon = (bounds.minX + bounds.maxX) / 2;
                centerLat = (bounds.minY + bounds.maxY) / 2;
            }

            if (!currentProvinceData[adm2]) {
                currentProvinceData[adm2] = [];
            }

            const displayName = adm3 || adm2;

            const isDuplicate = currentProvinceData[adm2].find(t => t.name === displayName);
            if (!isDuplicate) {
                currentProvinceData[adm2].push({
                    name: displayName,
                    lon: centerLon,
                    lat: centerLat
                });
            }
        });

        Object.keys(currentProvinceData).forEach(dist => {
            currentProvinceData[dist].sort((a, b) => a.name.localeCompare(b.name, 'th'));
        });

        updateDistrictDropdown();
    }

    /**
     * Rebuilds the district selector from the active province data.
     *
     * @returns {void}
     */
    function updateDistrictDropdown() {
        const districtSelect = document.getElementById('tb-district-select');
        const navigatorContainer = document.getElementById('tb-navigator-container');
        const tambonList = document.getElementById('tb-tambon-list');

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
     * Renders navigation buttons for the selected district.
     *
     * @param {string} selectedDistrict District name.
     * @returns {void}
     */
    function renderTambonButtons(selectedDistrict) {
        const tambonList = document.getElementById('tb-tambon-list');
        tambonList.innerHTML = '';

        if (!selectedDistrict || !currentProvinceData[selectedDistrict]) return;

        currentProvinceData[selectedDistrict].forEach(tambon => {
            if (tambon.lon === null || tambon.lat === null) return;

            const btn = document.createElement('button');
            btn.className = "btn btn-default";
            btn.style.cssText = "width: 100%; text-align: left; margin-bottom: 5px; font-size: 12px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #fff;";
            btn.innerText = tambon.name;

            btn.addEventListener('click', () => {
                goToLocation(tambon.lon, tambon.lat);
            });

            btn.onmouseover = () => btn.style.background = "#e6f7ff";
            btn.onmouseout = () => btn.style.background = "#fff";

            tambonList.appendChild(btn);
        });
    }

    /**
     * Centers the WME map on a WGS84 coordinate through the SDK.
     *
     * @param {number} lon Longitude.
     * @param {number} lat Latitude.
     * @returns {void}
     */
    function goToLocation(lon, lat) {
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
        wmeSDK.Map.setMapCenter({
            lonLat: { lon, lat },
            zoomLevel: 14
        });
    }

})();
