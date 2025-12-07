// Code Editor Module
import { BASE_URL } from './config.js';

// Initialize CodeMirror
export const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  mode: "javascript",
  theme: "material-darker",
  lineNumbers: true,
  value: `function quantum_sort(arr) {
  return arr.sort();
}`,
});

// -------------------
// AI Chat Module
// -------------------
export function initializeChat() {
  const chatWindow = document.getElementById("chat-window");
  const input = document.getElementById("assistant-input");
  const sendBtn = document.getElementById("send-btn");

  if (!sendBtn) return;

  // Unified send function
  async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    // Add user message
    const userMsg = document.createElement("div");
    userMsg.className = "user-msg";
    userMsg.innerText = msg;
    chatWindow.appendChild(userMsg);

    // Add loading AI message
    const aiMsg = document.createElement("div");
    aiMsg.className = "ai-msg";
    aiMsg.innerText = "Thinking...";
    chatWindow.appendChild(aiMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: msg,
          code: codeMirrorEditor.getValue()
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error: ${response.statusText}`);
      }

      const data = await response.json();
      aiMsg.innerText = data.reply || "AI didn't respond.";
    } catch (error) {
      console.error("Chat Error:", error);
      aiMsg.innerText = `Error: ${error.message}`;
    }

    input.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Button click
  sendBtn.addEventListener("click", sendMessage);

  // Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

// -------------------
// Toolbar Module
// -------------------
export function initializeToolbar() {
  const toolbarButtons = document.querySelectorAll(".toolbar button");
  const chatWindow = document.getElementById("chat-window");

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

      // Handle Save Code separately
      if (buttonText === "💾 Save Code") {
        saveSnippet(); // your existing function
        return;
      }

      const aiMsg = document.createElement("div");
      aiMsg.className = "ai-msg";
      aiMsg.innerText = `${buttonText} in progress...`;
      chatWindow.appendChild(aiMsg);
      chatWindow.scrollTop = chatWindow.scrollHeight;

      try {
        let response, result;

        if (buttonText === "Run AI Analysis") {
          response = await fetch(`${BASE_URL}/analyze`, {
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
          if (!action) {
            aiMsg.innerText = `Unknown action for button: ${buttonText}`;
            return;
          }

          response = await fetch(`${BASE_URL}/action`, {
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
      } catch (error) {
        console.error(`${buttonText} Error:`, error);
        aiMsg.innerText = `Error: ${error.message}`;
      }

      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
  });
}
