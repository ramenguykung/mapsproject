export default [
    {
        files: ["tambon.user.script.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                alert: "readonly",
                cancelAnimationFrame: "readonly",
                clearTimeout: "readonly",
                console: "readonly",
                document: "readonly",
                GM_getValue: "readonly",
                GM_setValue: "readonly",
                GM_xmlhttpRequest: "readonly",
                HTMLInputElement: "readonly",
                HTMLSelectElement: "readonly",
                performance: "readonly",
                requestAnimationFrame: "readonly",
                setTimeout: "readonly",
                unsafeWindow: "readonly",
                window: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": [
                "warn",
                {
                    args: "none",
                    caughtErrors: "none"
                }
            ]
        }
    }
];
