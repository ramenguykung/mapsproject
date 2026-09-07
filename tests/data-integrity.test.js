import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const ROOT = dirname(fileURLToPath(new URL("../tambon.user.script.js", import.meta.url)));
const SCRIPT_SOURCE = readFileSync(join(ROOT, "tambon.user.script.js"), "utf8");
const DATA_BASE_URL = "https://wazeth.github.io/mapsproject/geojson/";
const REFERENCED_FILES = [...SCRIPT_SOURCE.matchAll(/file:\s*"([^"]+)"/g)]
    .map(match => new URL(match[1], DATA_BASE_URL).href);
const PROVINCE_ROWS = [...SCRIPT_SOURCE.matchAll(
    /"(\d+)":\s*\{\s*name:\s*"([^"]+)",\s*file:\s*"([^"]+)"\s*\}/g
)].map(match => ({ key: match[1], name: match[2], file: match[3] }));

/**
 * Validates a Polygon ring and updates aggregate counters.
 *
 * @param {unknown} ring Coordinate ring.
 * @param {object} counters Aggregate counters.
 * @returns {void}
 */
function validateRing(ring, counters) {
    if (!Array.isArray(ring)) throw new Error("Polygon ring is not an array");
    if (ring.length < 4) throw new Error("Polygon ring has fewer than four coordinates");
    const first = ring[0];
    const last = ring.at(-1);
    if (!Array.isArray(first) || !Array.isArray(last) || first[0] !== last[0] || first[1] !== last[1]) {
        throw new Error("Polygon ring is not closed");
    }
    for (const coordinate of ring) {
        if (!Array.isArray(coordinate)) throw new Error("Polygon coordinate is not an array");
        if (!Number.isFinite(Number(coordinate[0])) || !Number.isFinite(Number(coordinate[1]))) {
            throw new Error("Polygon coordinate is not finite");
        }
    }
    counters.rings += 1;
}

test("all mapped provinces have complete SDK-compatible geometry", { timeout: 180000 }, async () => {
    expect(REFERENCED_FILES).toHaveLength(77);
    expect(new Set(REFERENCED_FILES).size).toBe(77);

    const counters = {
        atomicPolygons: 0,
        rings: 0,
        sourceAreas: 0
    };

    for (const url of REFERENCED_FILES) {
        const filename = new URL(url).pathname.split("/").pop();
        const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        const data = await response.json();
        if (!Array.isArray(data.features)) throw new Error(`${filename} has no features`);
        const provinceCodes = new Set();

        for (const feature of data.features) {
            counters.sourceAreas += 1;
            const properties = feature.properties || {};
            const provinceCode = properties.ADM3_PCODE || properties.ADM2_PCODE;
            if (typeof provinceCode !== "string" || provinceCode.trim() === "") {
                throw new Error(`${filename} has an area without a PCode`);
            }
            if (provinceCodes.has(provinceCode)) throw new Error(`${filename} repeats ${provinceCode}`);
            provinceCodes.add(provinceCode);

            const geometry = feature.geometry;
            if (geometry?.type !== "Polygon" && geometry?.type !== "MultiPolygon") {
                throw new Error(`${filename} contains unsupported geometry ${geometry?.type}`);
            }
            const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
            counters.atomicPolygons += polygons.length;
            for (const polygon of polygons) {
                for (const ring of polygon) validateRing(ring, counters);
            }
        }
    }

    expect(counters).toEqual({
        atomicPolygons: 8018,
        rings: 8021,
        sourceAreas: 7306
    });
});

test("province display names and file mappings retain their ordered contract", () => {
    expect(PROVINCE_ROWS).toHaveLength(77);
    const mappingManifest = PROVINCE_ROWS
        .map(({ key, name, file }) => `${key}|${name}|${file}`)
        .join("\n");
    expect(createHash("sha256").update(mappingManifest, "utf8").digest("hex"))
        .toBe("3cfdbc8481f053dc84c7c9a01163448bc201d098f11ba5c69614381a8a7c171e");
});
