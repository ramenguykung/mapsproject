import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const SOURCE_PATH = resolve(ROOT, "tambon.user.script.js");
const BUILD_SCRIPT_PATH = resolve(ROOT, "scripts", "build-tambon-userscript.mjs");
const RELEASE_PATH = resolve(ROOT, "dist", "tambon.user.js");
const VITEST_ENTRYPOINT = resolve(ROOT, "node_modules", "vitest", "vitest.mjs");
const USERSCRIPT_HEADER_START = "// ==UserScript==";
const USERSCRIPT_HEADER_END = "// ==/UserScript==";
const OBFUSCATED_IDENTIFIERS = [
    "activeRenderOperation",
    "createSdkFeatureBatches",
    "normalizeSearchText",
    "prepareBoundaryIndex",
    "renderBoundaryItems"
];

/**
 * Runs a release verification command and fails with its exit status.
 *
 * @param {string} command Executable path.
 * @param {string[]} args Command arguments.
 * @param {NodeJS.ProcessEnv} [environment] Child process environment.
 * @returns {void}
 */
function run(command, args, environment = process.env) {
    const result = spawnSync(command, args, {
        cwd: ROOT,
        env: environment,
        stdio: "inherit"
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
    }
}

/**
 * Reads the metadata header exactly as it appears in a userscript source file.
 *
 * @param {string} source Userscript contents.
 * @returns {string} Header and its following line-break separator.
 */
function getMetadataHeader(source) {
    assert.ok(source.startsWith(USERSCRIPT_HEADER_START), "userscript must start with metadata");
    const closingOffset = source.indexOf(USERSCRIPT_HEADER_END);
    assert.notEqual(closingOffset, -1, "userscript metadata must have a closing marker");

    const closingEnd = closingOffset + USERSCRIPT_HEADER_END.length;
    const separator = /^(?:\r?\n)+/.exec(source.slice(closingEnd));
    assert.ok(separator, "userscript metadata must be followed by a line break");
    return source.slice(0, closingEnd + separator[0].length);
}

/**
 * Builds the release artifact and reads its exact contents.
 *
 * @returns {Promise<string>} Generated artifact contents.
 */
async function buildReleaseArtifact() {
    run(process.execPath, [BUILD_SCRIPT_PATH]);
    return readFile(RELEASE_PATH, "utf8");
}

async function verifyReleaseArtifact() {
    const source = await readFile(SOURCE_PATH, "utf8");
    const sourceHeader = getMetadataHeader(source);
    assert.match(sourceHeader, /^\/\/ @version\s+2\.0\.1(?:\r?\n)/m);

    const firstArtifact = await buildReleaseArtifact();
    const secondArtifact = await buildReleaseArtifact();
    assert.equal(secondArtifact, firstArtifact, "release builds must be byte-identical");

    const artifactHeader = getMetadataHeader(secondArtifact);
    assert.equal(artifactHeader, sourceHeader, "release metadata must be unchanged");
    assert.ok(secondArtifact.startsWith(sourceHeader), "release metadata must remain at byte zero");
    assert.doesNotMatch(secondArtifact, /sourceMappingURL=/u, "release artifact must not expose a source map");
    for (const identifier of OBFUSCATED_IDENTIFIERS) {
        assert.doesNotMatch(
            secondArtifact,
            new RegExp(`\\b${identifier}\\b`, "u"),
            `release artifact still exposes ${identifier}`
        );
    }

    run(process.execPath, ["--check", RELEASE_PATH]);
    run(
        process.execPath,
        [VITEST_ENTRYPOINT, "run", "tests/tambon.user.script.test.js"],
        { ...process.env, TAMBON_USERSCRIPT_PATH: RELEASE_PATH }
    );
}

await verifyReleaseArtifact();
console.log("Release userscript verification passed.");
