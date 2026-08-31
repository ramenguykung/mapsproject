// ==UserScript==
// @name         WME Thailand Tambon
// @namespace    https://github.com/wazeth/
// @version      2.0.1
// @description  แสดงขอบเขตตำบล
// @author       Waze Thailand
// @match        https://*.waze.com/*/editor*
// @match        https://*.waze.com/editor*
// @exclude      https://*.waze.com/user/editor*
// @grant        GM_xmlhttpRequest
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
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

    const LABEL_MIN_ZOOM = 12;
    const LABEL_FEATURE_LIMIT = 1200;

    let tambonLayer = null;
    let activeLoadToken = 0;
    let activeRequest = null;
    const geoJsonCache = new Map();
    let currentProvinceData = {};

    if (W?.userscripts?.state?.isInitialized) {
        init();
    } else {
        document.addEventListener("wme-initialized", init, { once: true });
    }

    async function init() {
        console.log("WME Tambon: Starting...");
        const { tabLabel, tabPane } = W.userscripts.registerSidebarTab(SCRIPT_ID);

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
                        <select id="tb-district-select" class="form-control" style="width: 100%; height: 30px; font-size: 12px;">
                            <option value="">-- เลือกอำเภอ/เขต --</option>
                        </select>
                    </div>
                    <div id="tb-tambon-list" style="max-height: 250px; overflow-y: auto; padding-right: 5px;"></div>
                </div>
            </div>
        `;

        await W.userscripts.waitForElementConnected(tabPane);
        setupInteractions();
    }

    function setupInteractions() {
        const input = document.getElementById('tb-province-input');
        const datalist = document.getElementById('tb-provinces-list');
        const btnLoad = document.getElementById('tb-load-btn');
        const btnCancel = document.getElementById('tb-cancel-btn');
        const btnClear = document.getElementById('tb-clear-btn');
        const statusDiv = document.getElementById('tb-status');

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
                try { activeRequest.abort(); } catch (err) {}
            }
            activeRequest = null;
        };

        const cancelLoading = () => {
            activeLoadToken += 1;
            abortActiveRequest();

            if (tambonLayer) {
                W.map.removeLayer(tambonLayer);
                tambonLayer.destroy();
                tambonLayer = null;
            }

            setLoadingState(false);
            resetProgressUi();
            statusDiv.innerText = "สถานะ: ยกเลิกการโหลดแล้ว";
        };

        setLoadingState(false);

        Object.keys(PROVINCES).sort((a,b) => parseInt(a) - parseInt(b)).forEach(key => {
            let opt = document.createElement('option');
            opt.value = PROVINCES[key].name;
            datalist.appendChild(opt);
        });

        btnLoad.addEventListener('click', () => {
            const selectedName = input.value;
            const selectedKey = Object.keys(PROVINCES).find(key => PROVINCES[key].name === selectedName);

            if(selectedKey && PROVINCES[selectedKey]) {
                statusDiv.innerText = "⏳ กำลังดาวน์โหลด...";
                progressContainer.style.display = "block";
                progressBar.style.width = "0%";
                progressText.innerText = "0%";
                etaText.innerText = "กำลังโหลด...";
                setLoadingState(true);

                loadBoundary(selectedKey, PROVINCES[selectedKey].file, statusDiv, {
                    bar: progressBar, text: progressText, eta: etaText
                }, () => {
                    setLoadingState(false);
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

            if (tambonLayer) {
                W.map.removeLayer(tambonLayer);
                tambonLayer.destroy();
                tambonLayer = null;
            }

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

    function fetchGM(url) {
        return new Promise((resolve, reject) => {
            const request = GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function(response) {
                    if (activeRequest === request) activeRequest = null;
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch (e) { reject(new Error("Invalid JSON")); }
                    } else { reject(new Error("HTTP Error: " + response.status)); }
                },
                onerror: function(err) {
                    if (activeRequest === request) activeRequest = null;
                    reject(new Error("Network Error"));
                },
                onabort: function() {
                    if (activeRequest === request) activeRequest = null;
                    reject(new Error("Request canceled"));
                }
            });
            activeRequest = request;
        });
    }

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

    function resolveFeatureLabel(provinceKey, attributes) {
        const attrs = attributes || {};
        if (provinceKey === "0") return attrs.ADM2_TH || "";
        const adm3 = attrs.ADM3_TH || "";
        const adm2 = attrs.ADM2_TH || "";
        if (adm3 && adm2) return adm3 + ", " + adm2;
        return adm3 || adm2;
    }

    function loadBoundary(provinceKey, filename, statusDiv, ui, onComplete) {
        const loadToken = ++activeLoadToken;
        const url = DATA_BASE_URL + filename;

        if (tambonLayer) {
            W.map.removeLayer(tambonLayer);
            tambonLayer.destroy();
            tambonLayer = null;
        }

        fetchGeoJson(url).then(data => {
            if (loadToken !== activeLoadToken) return;
            parseDistrictsForNavigator(data, provinceKey);
            statusDiv.innerText = "กำลังประมวลผล...";
            drawLayerSimple(data, provinceKey, statusDiv, ui, loadToken, onComplete);
        }).catch(err => {
            if (loadToken !== activeLoadToken) return;
            statusDiv.innerText = "❌ ผิดพลาด: " + err.message;
            if (typeof onComplete === "function") onComplete();
        });
    }

    // ฟังก์ชันวาดเส้นแบบรวดเดียว (แบบเดียวกับ Script 2)
    function drawLayerSimple(geoJsonData, provinceKey, statusDiv, ui, loadToken, onComplete) {
        const rawFeatures = Array.isArray(geoJsonData?.features) ? geoJsonData.features : [];
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
        const features = [];
        const BATCH_SIZE = 50;
        let index = 0;
        const startTime = performance.now();

        // สร้าง Layer เตรียมไว้ก่อน
        tambonLayer = createBoundaryLayer(provinceKey, labelsEnabled);
        W.map.addLayer(tambonLayer);
        bringLayerToFront(tambonLayer);

        if (tambonLayer.div) {
            tambonLayer.div.style.pointerEvents = "none";
            tambonLayer.div.style.background = "transparent";
        }

        function processBatch() {
            if (loadToken !== activeLoadToken) return;

            const end = Math.min(index + BATCH_SIZE, total);
            for (let i = index; i < end; i++) {
                const f = rawFeatures[i];
                if (!f || !f.geometry) continue;

                // ใช้ตัวแปลงของ WME โดยตรง (พิกัดจะถูกแปลงอัตโนมัติ)
                const olGeometry = W.userscripts.toOLGeometry(f.geometry);
                if (olGeometry) {
                    const attrs = f.properties || {};
                    if (labelsEnabled && !attrs.__tbLabel) {
                        attrs.__tbLabel = resolveFeatureLabel(provinceKey, attrs);
                    }
                    features.push(new OpenLayers.Feature.Vector(olGeometry, attrs));
                }
            }
            index = end;

            // อัปเดตแถบโหลด
            const pct = Math.floor((index / total) * 100);
            ui.bar.style.width = pct + "%";
            ui.text.innerText = "กำลังประมวลผล: " + pct + "% (" + index + "/" + total + ")";

            const elapsed = Math.max((performance.now() - startTime) / 1000, 0.001);
            if (index > 0 && index < total) {
                const rate = index / elapsed;
                const etaSeconds = (total - index) / Math.max(rate, 0.001);
                ui.eta.innerText = "เหลืออีก: " + formatTime(etaSeconds);
            }

            if (index < total) {
                setTimeout(processBatch, 0);
            } else {
                ui.eta.innerText = "กำลังวาดเส้นลงแผนที่...";

                // แอดเส้นทั้งหมดลงแผนที่ทีเดียว (วิธีนี้เสถียรสุด)
                tambonLayer.addFeatures(features);

                ui.eta.innerText = "เสร็จสิ้น";
                statusDiv.innerText = `✅ แสดงผลเรียบร้อย (${features.length} พื้นที่${!labelsEnabled ? ", โหมดเร็ว: ปิดชื่อ" : ""})`;

                const navContainer = document.getElementById('tb-navigator-container');
                if (navContainer && Object.keys(currentProvinceData).length > 0) {
                    navContainer.style.display = "block";
                }

                if (typeof onComplete === "function") onComplete();
            }
        }

        processBatch();
    }

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

    function formatTime(seconds) {
        if (seconds < 1) return "< 1 วิ";
        if (seconds < 60) return Math.round(seconds) + " วิ";
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return mins + " นาที " + secs + " วิ";
    }

    function createBoundaryLayer(provinceKey, labelsEnabled) {
        const style = new OpenLayers.Style({
            strokeColor: "#FF0000", strokeOpacity: 0.8, strokeWidth: 2,
            fillColor: "#FF0000", fillOpacity: 0.0,
            label: "${getLabel}",
            fontColor: "#8B0000", fontSize: "14px", fontFamily: "Sarabun, sans-serif",
            labelOutlineColor: "#ffffff", labelOutlineWidth: 3, fontWeight: "bold", labelAlign: "cm"
        }, {
            context: {
                getLabel: function(feature) {
                    if (!labelsEnabled) return "";
                    if (!W?.map || W.map.getZoom() < LABEL_MIN_ZOOM) return "";
                    const attrs = feature?.attributes || {};
                    return attrs.__tbLabel || resolveFeatureLabel(provinceKey, attrs);
                }
            }
        });

        return new OpenLayers.Layer.Vector("Thailand Boundary Overlay", {
            styleMap: new OpenLayers.StyleMap(style), displayInLayerSwitcher: true
        });
    }

    function bringLayerToFront(layer) {
        try {
            // เช็คก่อนว่า W.map.layers มีตัวตนและเป็น Array หรือไม่
            if (W?.map?.layers && Array.isArray(W.map.layers)) {
                const maxZ = W.map.layers.reduce((max, l) => {
                    if (l && typeof l.getZIndex === 'function') {
                        const z = Number(l.getZIndex());
                        return Number.isFinite(z) ? Math.max(max, z) : max;
                    }
                    return max;
                }, 0);
                layer.setZIndex(maxZ + 1);
            } else {
                // ถ้าหาไม่เจอ บังคับดันขึ้นบนสุดที่ 9999
                layer.setZIndex(9999);
            }
        } catch (e) {
            layer.setZIndex(9999);
        }
    }

    function parseDistrictsForNavigator(geoJsonData, provinceKey) {
        currentProvinceData = {};
        const allFeatures = Array.isArray(geoJsonData?.features) ? geoJsonData.features : [];

        allFeatures.forEach(f => {
            const attrs = f.properties || {};
            const adm2 = attrs.ADM2_TH;
            const adm3 = attrs.ADM3_TH;
            if (!adm2) return;

            const bounds = computeGeometryBounds(f.geometry);
            let centerLon = null, centerLat = null;
            if (bounds) {
                centerLon = (bounds.minX + bounds.maxX) / 2;
                centerLat = (bounds.minY + bounds.maxY) / 2;
            }

            if (!currentProvinceData[adm2]) currentProvinceData[adm2] = [];
            const displayName = adm3 || adm2;

            const isDuplicate = currentProvinceData[adm2].find(t => t.name === displayName);
            if (!isDuplicate) {
                currentProvinceData[adm2].push({ name: displayName, lon: centerLon, lat: centerLat });
            }
        });

        Object.keys(currentProvinceData).forEach(dist => {
            currentProvinceData[dist].sort((a, b) => a.name.localeCompare(b.name, 'th'));
        });
        updateDistrictDropdown();
    }

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

    function renderTambonButtons(selectedDistrict) {
        const tambonList = document.getElementById('tb-tambon-list');
        if (!tambonList) return;
        tambonList.innerHTML = '';

        if (!selectedDistrict || !currentProvinceData[selectedDistrict]) return;

        currentProvinceData[selectedDistrict].forEach(tambon => {
            if (tambon.lon === null || tambon.lat === null) return;
            const btn = document.createElement('button');
            btn.className = "btn btn-default";
            btn.style.cssText = "width: 100%; text-align: left; margin-bottom: 5px; font-size: 12px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #fff;";
            btn.innerHTML = `${tambon.name}`;
            btn.addEventListener('click', () => goToLocation(tambon.lon, tambon.lat));
            btn.onmouseover = () => btn.style.background = "#e6f7ff";
            btn.onmouseout = () => btn.style.background = "#fff";
            tambonList.appendChild(btn);
        });
    }

    function goToLocation(lon, lat) {
        if (!W?.map) return;
        const projWGS84 = new OpenLayers.Projection("EPSG:4326");
        const projMap = W.map.getProjectionObject() || new OpenLayers.Projection("EPSG:900913");
        const center = new OpenLayers.LonLat(lon, lat).transform(projWGS84, projMap);
        W.map.setCenter(center, 14);
    }
})();