// ----------------------
// Initialize CodeMirror
// ----------------------
const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  mode: "javascript",
  theme: "material-darker",
  lineNumbers: true,
  value: `function quantum_sort(arr) {\n  return arr.sort();\n}`,
});

// ----------------------
// Chat Assistant Helpers
// ----------------------
const chatWindow = document.getElementById("chat-window");
const input = document.getElementById("assistant-input");
const sendBtn = document.getElementById("send-btn");

// Append message to chat window (returns the element for editing)
function appendMessage(msg, type = "ai") {
  const el = document.createElement("div");
  el.className = type === "user" ? "user-msg" : "ai-msg";
  el.innerText = msg;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return el;
}

// Open assistant panel if closed
function ensureAssistantOpen() {
  if (window.openAssistant) window.openAssistant();
}

// ----------------------
// Chat input behavior
// ----------------------
sendBtn.addEventListener("click", async () => {
  const msg = input.value.trim();
  if (!msg) return;

  ensureAssistantOpen();

  // Append user message
  appendMessage(msg, "user");

  // Append loading message and store reference
  const aiMsg = appendMessage("Thinking...", "ai");

  input.value = "";

  try {
    const response = await fetch("http://localhost:4000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: msg,
        code: codeMirrorEditor.getValue(),
      }),
    });

    if (!response.ok) {
      const errorResult = await response.json();
      throw new Error(errorResult.error || `Server error: ${response.statusText}`);
    }

    const data = await response.json();
    // Replace "Thinking..." with actual AI reply
    aiMsg.innerText = data.reply || "AI didn’t respond.";
  } catch (err) {
    console.error("Chat Error:", err);
    aiMsg.innerText = `Error: ${err.message}`;
  }
});

// Press Enter to send message
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// ----------------------
// Toolbar AI Buttons
// ----------------------
const toolbarButtons = document.querySelectorAll(".toolbar button");
const actionMap = {
  "Explain Code": "explain",
  "Generate Docs": "document",
  "Optimize": "optimize",
};

toolbarButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const buttonText = btn.innerText;
    const code = codeMirrorEditor.getValue();

    if (!code.trim()) {
      alert("Please write or paste some code first!");
      return;
    }

    ensureAssistantOpen();

    const aiMsg = appendMessage(`${buttonText} in progress...`, "ai");

    try {
      let response, result;

      if (buttonText === "Run AI Analysis") {
        response = await fetch("http://localhost:4000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || `Server error: ${response.statusText}`);
        }
        result = await response.json();
        aiMsg.innerText = result.analysis || "No response from AI.";
      } else {
        const action = actionMap[buttonText];
        if (!action) throw new Error(`Unknown action for button: ${buttonText}`);

        response = await fetch("http://localhost:4000/api/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, action }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || `Server error: ${response.statusText}`);
        }
        result = await response.json();
        aiMsg.innerText = result.result || "No response from AI.";
      }
    } catch (err) {
      console.error(`${buttonText} Error:`, err);
      aiMsg.innerText = `Error: ${err.message}`;
    }
  });
});

// ----------------------
// WASM Encryption/Decryption
// ----------------------
Module.onRuntimeInitialized = () => {
  console.log("WASM Module Loaded!");

  const encrypt = Module.cwrap("encrypt", "string", ["string", "string"]);
  const decrypt = Module.cwrap("decrypt", "string", ["string", "string"]);

  const password = document.getElementById("password");
  const encryptBtn = document.getElementById("encryptBtn");
  const decryptBtn = document.getElementById("decryptBtn");
  const aiBtn = document.getElementById("aiBtn");
  const aiOutput = document.getElementById("ai-output");

  let isAnalyzing = false;

  // Encrypt code
  encryptBtn.addEventListener("click", () => {
    const code = codeMirrorEditor.getValue();
    const key = password.value;
    if (!code || !key) {
      alert("Please provide code and a key to encrypt.");
      return;
    }
    const encrypted = encrypt(code, key);
    codeMirrorEditor.setValue(encrypted);
    console.log("Encrypted:", encrypted);
  });

  // Decrypt code
  decryptBtn.addEventListener("click", () => {
    const code = codeMirrorEditor.getValue();
    const key = password.value;
    if (!code || !key) {
      alert("Please provide encrypted code and a key to decrypt.");
      return;
    }
    const decrypted = decrypt(code, key);
    codeMirrorEditor.setValue(decrypted);
    console.log("Decrypted:", decrypted);
  });

  // Legacy AI Analyze button
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

    ensureAssistantOpen();
    const aiMsg = appendMessage("Analyzing code...", "ai");

    try {
      const response = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error: ${response.statusText}`);
      }

      const result = await response.json();
      aiOutput.textContent = result.analysis;
      aiMsg.innerText = result.analysis || "No response from AI.";
    } catch (err) {
      aiOutput.textContent = `Error: ${err.message}`;
      aiMsg.innerText = `Error: ${err.message}`;
      console.error("AI Analysis Error:", err);
    } finally {
      isAnalyzing = false;
      aiBtn.disabled = false;
      aiBtn.textContent = "Analyze with AI";
    }
  });
};
