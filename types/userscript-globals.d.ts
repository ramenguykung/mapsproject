import type { WmeSDK } from "wme-sdk-typings";

interface GMXmlHttpResponse {
    response?: unknown;
    responseText: string;
    status: number;
}

interface GMXmlHttpRequestOptions {
    method: string;
    onabort?: () => void;
    onerror?: (error: unknown) => void;
    onload?: (response: GMXmlHttpResponse) => void;
    responseType?: string;
    url: string;
}

interface GMXmlHttpRequestHandle {
    abort(): void;
}

interface UserscriptWindow extends Window {
    SDK_INITIALIZED: Promise<void>;
    getWmeSdk(options: {
        scriptId: string;
        scriptName: string;
        version?: string;
    }): WmeSDK;
}

declare global {
    const unsafeWindow: UserscriptWindow & typeof globalThis;

    function GM_getValue<T>(key: string, defaultValue: T): T;
    function GM_getValue<T = unknown>(key: string): T | undefined;
    function GM_setValue(key: string, value: unknown): void;
    function GM_xmlhttpRequest(options: GMXmlHttpRequestOptions): GMXmlHttpRequestHandle;

    interface Window {
        SDK_INITIALIZED: Promise<void>;
        getWmeSdk: UserscriptWindow["getWmeSdk"];
    }
}

export {};
