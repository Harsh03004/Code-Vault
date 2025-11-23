
/*Module.onRuntimeInitialized = () => {
    console.log("WASM Module Loaded!");

    
    const encrypt = Module.cwrap('encrypt', 'string', ['string', 'string']);
    const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);

   
    const editor = document.getElementById('editor');
    const password = document.getElementById('password');
    const aiOutput = document.getElementById('ai-output');
    const encryptBtn = document.getElementById('encryptBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const aiBtn = document.getElementById('aiBtn');

    let isAnalyzing = false;

   
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
};*/

// ✅ Initialize CodeMirror (your editor)
const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  mode: "javascript",
  theme: "material-darker",
  lineNumbers: true,
  value: `function quantum_sort(arr) {
  return arr.sort();
}`,
});

// --- Chat UI setup (from your version) ---
const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("assistant-input");
const sendBtn = document.getElementById("send-btn");

sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if (!msg) return;

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.className = "user-msg";
  userMsg.innerText = msg;
  chatWindow.appendChild(userMsg);

  // Show loading
  const aiMsg = document.createElement("div");
  aiMsg.className = "ai-msg";
  aiMsg.innerText = "Thinking...";
  chatWindow.appendChild(aiMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Send to backend chat route
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: msg,
        code: codeMirrorEditor.getValue() // Include current code as context
      }),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Server error: ${response.statusText}`);
    }

    const data = await response.json();
    aiMsg.innerText = data.reply || "AI didn’t respond.";
  } catch (error) {
    console.error("Chat Error:", error);
    aiMsg.innerText = `Error: ${error.message}`;
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
  input.value = "";
});

// --- Toolbar Buttons for AI features ---
const toolbarButtons = document.querySelectorAll(".toolbar button");

// Map button text to action types for /api/action endpoint
const actionMap = {
  "Explain Code": "explain",
  "Generate Docs": "document",
  "Optimize": "optimize"
};

toolbarButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const buttonText = btn.innerText;
    const code = codeMirrorEditor.getValue();

    // Validate code is not empty
    if (!code.trim()) {
      alert("Please write or paste some code first!");
      return;
    }

    // Add loading message to chat window
    const aiMsg = document.createElement("div");
    aiMsg.className = "ai-msg";
    aiMsg.innerText = `${buttonText} in progress...`;
    chatWindow.appendChild(aiMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      let response, result;

      // "Run AI Analysis" uses /api/analyze, others use /api/action
      if (buttonText === "Run AI Analysis") {
        response = await fetch("http://localhost:3000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || `Server error: ${response.statusText}`);
        }

        result = await response.json();
        aiMsg.innerText = result.analysis || "No response from AI.";
      } else {
        // Use /api/action endpoint for other toolbar actions
        const action = actionMap[buttonText];
        
        if (!action) {
          throw new Error(`Unknown action for button: ${buttonText}`);
        }

        response = await fetch("http://localhost:3000/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, action }),
        });

        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.error || `Server error: ${response.statusText}`);
        }

        result = await response.json();
        aiMsg.innerText = result.result || "No response from AI.";
      }
    } catch (error) {
      console.error(`${buttonText} Error:`, error);
      aiMsg.innerText = `Error: ${error.message}`;
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
  });
});

// --- WASM Integration (from repo app.js) ---
Module.onRuntimeInitialized = () => {
  console.log("WASM Module Loaded!");

  const encrypt = Module.cwrap("encrypt", "string", ["string", "string"]);
  const decrypt = Module.cwrap("decrypt", "string", ["string", "string"]);

  const password = document.getElementById("password");
  const encryptBtn = document.getElementById("encryptBtn");
  const decryptBtn = document.getElementById("decryptBtn");
  const aiOutput = document.getElementById("ai-output");
  const aiBtn = document.getElementById("aiBtn");

  let isAnalyzing = false;

  // Encrypt button
  encryptBtn.addEventListener("click", () => {
    const code = codeMirrorEditor.getValue();
    const key = password.value;
    if (!code || !key) {
      alert("Please provide code and a key to encrypt.");
      return;
    }
    const encryptedCode = encrypt(code, key);
    codeMirrorEditor.setValue(encryptedCode);
    console.log("Encrypted:", encryptedCode);
  });

  // Decrypt button
  decryptBtn.addEventListener("click", () => {
    const encryptedCode = codeMirrorEditor.getValue();
    const key = password.value;
    if (!encryptedCode || !key) {
      alert("Please provide encrypted code and a key to decrypt.");
      return;
    }
    const decryptedCode = decrypt(encryptedCode, key);
    codeMirrorEditor.setValue(decryptedCode);
    console.log("Decrypted:", decryptedCode);
  });

  // AI Analyze button (repo one)
  aiBtn.addEventListener("click", async () => {
    if (isAnalyzing) return;
    const code = codeMirrorEditor.getValue();
    if (!code) {
      alert("Please provide code to analyze.");
      return;
    }

    isAnalyzing = true;
    aiBtn.disabled = true;
    aiBtn.textContent = "Analyzing...";
    aiOutput.textContent = "Analyzing...";

    try {
      const response = await fetch("http://localhost:3000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
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
      aiBtn.textContent = "Analyze with AI";
    }
  });
};
