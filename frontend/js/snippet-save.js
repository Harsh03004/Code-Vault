// Snippet Save Module
import { BASE_URL, getAuthHeaders } from './config.js';
import { loadSidebarSnippets, allSnippets, currentSnippetId, hasUnsavedChanges } from './snippet-manager.js';

// Toggle encryption fields
window.toggleEncryptionFields = function() {
  const checkbox = document.getElementById('encryptCheckbox');
  const fields = document.getElementById('encryptionFields');
  if (!checkbox || !fields) return;

  fields.style.display = checkbox.checked ? 'block' : 'none';

  if (!checkbox.checked) {
    document.getElementById('encryptionPassword').value = '';
    document.getElementById('confirmEncryptionPassword').value = '';
  }
};

// Save snippet
window.saveSnippet = function() {
  let code = '';
  if (typeof codeMirrorEditor !== 'undefined') {
    code = codeMirrorEditor.getValue();
  }

  if (!code || code.trim().length === 0) {
    alert('Please write some code before saving!');
    return;
  }

  if (currentSnippetId) {
    const currentSnippet = allSnippets.find(s => s._id === currentSnippetId);
    if (currentSnippet) {
      document.getElementById('snippetNameInput').value = currentSnippet.name;
    }
  } else {
    document.getElementById('snippetNameInput').value = '';
  }

  document.getElementById('saveModal').style.display = 'flex';
  document.getElementById('snippetNameInput').focus();
  document.getElementById('saveError').style.display = 'none';
};

// Close save modal
window.closeSaveModal = function() {
  document.getElementById('saveModal').style.display = 'none';
  document.getElementById('snippetNameInput').value = '';
  document.getElementById('saveError').style.display = 'none';
};

// Confirm save
window.confirmSave = async function() {
  const name = document.getElementById('snippetNameInput').value.trim();
  const errorEl = document.getElementById('saveError');

  if (!name) {
    errorEl.textContent = 'Please enter a snippet name';
    errorEl.style.display = 'block';
    return;
  }

  if (!currentSnippetId) {
    const existingSnippet = allSnippets.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSnippet) {
      const confirmOverwrite = confirm(`A snippet named "${name}" already exists. Do you want to overwrite it?`);
      if (!confirmOverwrite) {
        return;
      }
      currentSnippetId = existingSnippet._id;
    }
  }

  let code = '';
  if (typeof codeMirrorEditor !== 'undefined') {
    code = codeMirrorEditor.getValue();
  }

  const encryptCheckbox = document.getElementById('encryptCheckbox');
  const isEncrypted = encryptCheckbox.checked;
  let finalCode = code;

  if (isEncrypted) {
    const password = document.getElementById('encryptionPassword').value;
    const confirmPassword = document.getElementById('confirmEncryptionPassword').value;

    if (!password || !confirmPassword) {
      errorEl.textContent = 'Please enter and confirm encryption password';
      errorEl.style.display = 'block';
      return;
    }

    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match';
      errorEl.style.display = 'block';
      return;
    }

    if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
      const encrypt = Module.cwrap('encrypt', 'string', ['string', 'string']);
      finalCode = encrypt(code, password);
    } else {
      errorEl.textContent = 'Encryption module not loaded';
      errorEl.style.display = 'block';
      return;
    }
  }

  try {
    let res;

    if (currentSnippetId) {
      res = await fetch(`${BASE_URL}/snippets/${currentSnippetId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          code: finalCode,
          language: 'javascript',
          isEncrypted: isEncrypted
        })
      });
    } else {
      res = await fetch(`${BASE_URL}/snippets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          code: finalCode,
          language: 'javascript',
          isEncrypted: isEncrypted
        })
      });
    }

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to save snippet');
    }

    currentSnippetId = data.data._id;
    const nameEl = document.getElementById('current-snippet-name');
    if (nameEl) nameEl.textContent = data.data.name;
    hasUnsavedChanges = false;

    if (isEncrypted && typeof codeMirrorEditor !== 'undefined') {
      codeMirrorEditor.setValue(finalCode);
    }

    await loadSidebarSnippets();
    window.closeSaveModal();

    alert(isEncrypted ? 'Snippet encrypted and saved successfully! 🔒' : 'Snippet saved successfully!');
  } catch (err) {
    console.error('Save snippet error:', err);
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
};

// Create new snippet
window.createNewSnippet = function() {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Do you want to continue?')) {
      return;
    }
  }

  if (typeof codeMirrorEditor !== 'undefined') {
    codeMirrorEditor.setValue('function quantum_sort(arr) {\n  return arr.sort();\n}');
  }

  currentSnippetId = null;
  const nameEl = document.getElementById('current-snippet-name');
  if (nameEl) nameEl.textContent = 'New Snippet';
  hasUnsavedChanges = false;
};

// Handle Enter key in save modal
document.addEventListener('DOMContentLoaded', () => {
  const snippetNameInput = document.getElementById('snippetNameInput');
  if (snippetNameInput) {
    snippetNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.confirmSave();
      }
    });
  }

  const decryptPassword = document.getElementById('decryptPassword');
  if (decryptPassword) {
    decryptPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.confirmDecrypt();
      }
    });
  }
});
