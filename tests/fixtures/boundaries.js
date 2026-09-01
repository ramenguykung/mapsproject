/**
 * Returns a small province fixture containing one Polygon and one MultiPolygon.
 *
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createBoundaryFixture() {
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    ADM1_TH: "จังหวัดทดสอบ",
                    ADM2_EN: "Mueang One",
                    ADM2_TH: "เมืองหนึ่ง",
                    ADM3_EN: "Central",
                    ADM3_PCODE: "TH990101",
                    ADM3_TH: "กลาง"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [100, 10],
                        [102, 10],
                        [102, 12],
                        [100, 12],
                        [100, 10]
                    ]]
                }
            },
            {
                type: "Feature",
                properties: {
                    ADM1_TH: "จังหวัดทดสอบ",
                    ADM2_EN: "Mueang Two",
                    ADM2_TH: "เมืองสอง",
                    ADM3_EN: "Ban Mai",
                    ADM3_PCODE: "TH990201",
                    ADM3_TH: "บ้านใหม่"
                },
                geometry: {
                    type: "MultiPolygon",
                    coordinates: [
                        [[
                            [110, 10],
                            [112, 10],
                            [112, 12],
                            [110, 12],
                            [110, 10]
                        ]],
                        [[
                            [113, 13],
                            [114, 13],
                            [114, 14],
                            [113, 14],
                            [113, 13]
                        ]]
                    ]
                }
            }
        ]
    };
}

/**
 * Creates enough simple source features to require multiple render frames.
 *
 * @param {number} [count=60] Source feature count.
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createLargeBoundaryFixture(count = 60) {
    return {
        type: "FeatureCollection",
        features: Array.from({ length: count }, (_, index) => {
            const lon = 100 + (index * 0.01);
            return {
                type: "Feature",
                properties: {
                    ADM2_TH: "เมืองทดสอบ",
                    ADM3_PCODE: `TH99${String(index).padStart(4, "0")}`,
                    ADM3_TH: `พื้นที่ ${index}`
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [lon, 10],
                        [lon + 0.005, 10],
                        [lon + 0.005, 10.005],
                        [lon, 10.005],
                        [lon, 10]
                    ]]
                }
            };
        })
    };
}

/**
 * Creates one multipart area large enough to span preparation frames.
 *
 * @param {number} [partCount=54] Atomic polygon part count.
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createMultipartBoundaryFixture(partCount = 54) {
    return {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            properties: {
                ADM2_TH: "เมืองหลายเกาะ",
                ADM3_PCODE: "TH999901",
                ADM3_TH: "ตำบลหลายเกาะ"
            },
            geometry: {
                type: "MultiPolygon",
                coordinates: Array.from({ length: partCount }, (_, index) => {
                    const lon = 100 + (index * 0.01);
                    return [[
                        [lon, 10],
                        [lon + 0.005, 10],
                        [lon + 0.005, 10.005],
                        [lon, 10.005],
                        [lon, 10]
                    ]];
                })
            }
        }]
    };
}

/**
 * Returns a Bangkok-style fixture without ADM3 properties.
 *
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createBangkokFixture() {
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    ADM2_EN: "Phra Nakhon",
                    ADM2_PCODE: "TH1001",
                    ADM2_TH: "พระนคร"
                },
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [100, 13],
                        [101, 13],
                        [101, 14],
                        [100, 14],
                        [100, 13]
                    ]]
                }
            }
        ]
    };
}

/**
 * Returns duplicate tambon names in two districts and one within-district duplicate.
 *
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createDuplicateSearchFixture() {
    const definitions = [
        ["เมืองหนึ่ง", "บ้านใหม่", "TH990101", 100],
        ["เมืองหนึ่ง", "บ้านใหม่", "TH990102", 101],
        ["เมืองสอง", "บ้านใหม่", "TH990201", 102],
        ["เมืองสอง", "กลาง", "TH990202", 103]
    ];
    return {
        type: "FeatureCollection",
        features: definitions.map(([district, tambon, pcode, lon]) => ({
            type: "Feature",
            properties: {
                ADM2_TH: district,
                ADM3_PCODE: pcode,
                ADM3_TH: tambon
            },
            geometry: {
                type: "Polygon",
                coordinates: [[
                    [lon, 10],
                    [lon + 0.5, 10],
                    [lon + 0.5, 10.5],
                    [lon, 10.5],
                    [lon, 10]
                ]]
            }
        }))
    };
}

/**
 * Returns an unsupported geometry for error-path coverage.
 *
 * @returns {object} GeoJSON FeatureCollection.
 */
export function createUnsupportedGeometryFixture() {
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {
                    ADM2_TH: "เมืองทดสอบ",
                    ADM3_PCODE: "TH999999",
                    ADM3_TH: "เส้นทดสอบ"
                },
                geometry: {
                    type: "LineString",
                    coordinates: [[100, 10], [101, 11]]
                }
            }
        ]
    };
}
