import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = resolve(repositoryRoot, "tambon.user.script.js");
const outputPath = resolve(repositoryRoot, "dist", "tambon.user.js");

const METADATA_OPEN = "// ==UserScript==";
const METADATA_CLOSE = "// ==/UserScript==";

/**
 * Extracts the userscript metadata block without normalizing its contents.
 *
 * The metadata header must remain the first part of the released file: userscript
 * managers inspect it before evaluating the script body.  Keeping the separator
 * independently also preserves the source file's line endings and blank line.
 *
 * @param {string} source Userscript source text.
 * @returns {{ metadata: string, separator: string, body: string }} Source parts.
 */
export function splitUserscriptSource(source) {
    const firstLineEnd = source.search(/\r?\n/);

    if (firstLineEnd === -1 || source.slice(0, firstLineEnd) !== METADATA_OPEN) {
        throw new Error(`Expected ${METADATA_OPEN} to be the first line of ${sourcePath}`);
    }

    const metadataCloseIndex = source.indexOf(METADATA_CLOSE);
    const metadataCloseEnd = metadataCloseIndex + METADATA_CLOSE.length;
    const metadataCloseLineStart = source.lastIndexOf("\n", metadataCloseIndex) + 1;

    if (
        metadataCloseIndex === -1 ||
        source.slice(metadataCloseLineStart, metadataCloseEnd) !== METADATA_CLOSE ||
        !/^\r?\n/.test(source.slice(metadataCloseEnd))
    ) {
        throw new Error(`Expected a standalone ${METADATA_CLOSE} line in ${sourcePath}`);
    }

    if (source.indexOf(METADATA_CLOSE, metadataCloseEnd) !== -1) {
        throw new Error(`Expected exactly one ${METADATA_CLOSE} line in ${sourcePath}`);
    }

    const metadata = source.slice(0, metadataCloseEnd);
    const metadataLines = metadata.split(/\r?\n/);

    if (metadataLines.some(line => !line.startsWith("//"))) {
        throw new Error(`Expected every metadata line in ${sourcePath} to be a comment`);
    }

    if (!/^\/\/\s+@version\s+\S+/m.test(metadata)) {
        throw new Error(`Expected a non-empty @version directive in ${sourcePath}`);
    }

    const separatorMatch = /^(?:\r?\n)+/.exec(source.slice(metadataCloseEnd));

    if (!separatorMatch) {
        throw new Error(`Expected a line break after ${METADATA_CLOSE} in ${sourcePath}`);
    }

    const separator = separatorMatch[0];
    const body = source.slice(metadataCloseEnd + separator.length);

    if (body.trim().length === 0) {
        throw new Error(`Expected a script body after ${METADATA_CLOSE} in ${sourcePath}`);
    }

    return { metadata, separator, body };
}

/**
 * Returns a fresh deterministic obfuscator profile for the WME userscript.
 *
 * Property/global renaming is deliberately off because the script consumes WME's
 * public SDK surface and userscript-manager globals. String-array extraction and
 * local identifier mangling still deter casual copying without compatibility-risky
 * control-flow or anti-debugging transformations.
 *
 * @returns {object} JavaScript Obfuscator options.
 */
export function createObfuscationOptions() {
    return {
        compact: true,
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 0,
        deadCodeInjection: false,
        deadCodeInjectionThreshold: 0,
        debugProtection: false,
        debugProtectionInterval: 0,
        disableConsoleOutput: false,
        domainLock: [],
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: false,
        renameGlobals: false,
        renameProperties: false,
        reservedNames: [
            "^GM_.*$",
            "^unsafeWindow$",
            "^SDK_INITIALIZED$",
            "^getWmeSdk$"
        ],
        seed: "wme-thailand-tambon-release",
        selfDefending: false,
        simplify: false,
        sourceMap: false,
        splitStrings: false,
        stringArray: true,
        stringArrayCallsTransform: false,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.75,
        target: "browser-no-eval",
        transformObjectKeys: false,
        unicodeEscapeSequence: false
    };
}

/**
 * Builds the release-only userscript artifact.
 *
 * @returns {Promise<string>} Absolute path of the generated artifact.
 */
export async function buildTambonUserscript() {
    const source = await readFile(sourcePath, "utf8");
    const { metadata, separator, body } = splitUserscriptSource(source);
    const obfuscatedBody = JavaScriptObfuscator
        .obfuscate(body, createObfuscationOptions())
        .getObfuscatedCode();

    if (obfuscatedBody.trim().length === 0) {
        throw new Error("Obfuscator returned an empty userscript body");
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${metadata}${separator}${obfuscatedBody}\n`, "utf8");

    return outputPath;
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
    buildTambonUserscript().catch(error => {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    });
}
