// Encryption Module - WASM Integration
import { codeMirrorEditor } from './editor.js';

export function initializeEncryption() {
  Module.onRuntimeInitialized = () => {
    console.log("✅ WASM Module Loaded - AES-256 Encryption Ready!");

    const encrypt = Module.cwrap("encrypt", "string", ["string", "string"]);
    const decrypt = Module.cwrap("decrypt", "string", ["string", "string"]);

    const password = document.getElementById("password");
    const encryptBtn = document.getElementById("encryptBtn");
    const decryptBtn = document.getElementById("decryptBtn");

    if (!encryptBtn || !decryptBtn) return;

    // Encrypt button
    encryptBtn.addEventListener("click", () => {
      const code = codeMirrorEditor.getValue();
      const key = password?.value;
      
      if (!code || !key) {
        alert("Please provide code and a key to encrypt.");
        return;
      }
      
      const encryptedCode = encrypt(code, key);
      codeMirrorEditor.setValue(encryptedCode);
      console.log("🔒 Code encrypted successfully");
    });

    // Decrypt button
    decryptBtn.addEventListener("click", () => {
      const encryptedCode = codeMirrorEditor.getValue();
      const key = password?.value;
      
      if (!encryptedCode || !key) {
        alert("Please provide encrypted code and a key to decrypt.");
        return;
      }
      
      const decryptedCode = decrypt(encryptedCode, key);
      
      if (decryptedCode === 'DECRYPTION_ERROR') {
        alert('Failed to decrypt. Wrong password?');
        return;
      }
      
      codeMirrorEditor.setValue(decryptedCode);
      console.log("🔓 Code decrypted successfully");
    });
  };
}
