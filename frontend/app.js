// Wait until the WASM module is fully loaded
Module.onRuntimeInitialized = () => {
    console.log("WASM Module Loaded!");

    // 'cwrap' creates a JavaScript wrapper for a C++ function
    const encrypt = Module.cwrap('encrypt', 'string', ['string', 'string']);
    const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);

    // Get references to all the HTML elements
    const editor = document.getElementById('editor');
    const password = document.getElementById('password');
    const aiOutput = document.getElementById('ai-output');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const aiBtn = document.getElementById('aiBtn');

    let isAnalyzing = false;

    // --- Event Listener for Encrypt Button ---
    encryptBtn.addEventListener('click', () => {
        const code = editor.value;
        const key = password.value;
        if (!code || !key) {
            alert("Please provide code and a key to encrypt.");
            return;
        }
        const encryptedCode = encrypt(code, key);
        editor.value = encryptedCode;
        console.log("Encrypted:", encryptedCode);
    });

    // --- Event Listener for Decrypt Button ---
    decryptBtn.addEventListener('click', () => {
        const encryptedCode = editor.value;
        const key = password.value;
        if (!encryptedCode || !key) {
            alert("Please provide encrypted code and a key to decrypt.");
            return;
        }
        const decryptedCode = decrypt(encryptedCode, key);
        editor.value = decryptedCode;
        console.log("Decrypted:", decryptedCode);
    });

    // --- Event Listener for AI Analyze Button ---
    aiBtn.addEventListener('click', async () => {
        if (isAnalyzing) return;

        const code = editor.value;
        if (!code) {
            alert("Please provide code to analyze.");
            return;
        }

        isAnalyzing = true;
        aiBtn.disabled = true;
        aiBtn.textContent = 'Analyzing...';
        aiOutput.textContent = "Analyzing...";

        try {
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || `Server error: ${response.statusText}`);
            }

            const result = await response.json();
            aiOutput.textContent = result.analysis;
        } catch (error) {
            aiOutput.textContent = `Error: ${error.message}`;
            console.error("AI Analysis Error:", error);
        } finally {
            isAnalyzing = false;
            aiBtn.disabled = false;
            aiBtn.textContent = 'Analyze with AI';
        }
    });
};