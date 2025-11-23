// Snippet Management Module
import { BASE_URL, getAuthHeaders } from './config.js';
import { escapeHtml } from './utils.js';

// Global variables
let pendingDecryptSnippet = null;
let currentDecryptPassword = null;
let isCurrentSnippetDecrypted = false;
export let allSnippets = [];
export let currentSnippetId = null;
export let hasUnsavedChanges = false;

// Initialize snippet management
export function initializeSnippetManager(editor) {
  loadSidebarSnippets();
  checkForSnippetToLoad();

  // Track changes in editor
  if (editor) {
    editor.on('change', () => {
      hasUnsavedChanges = true;
    });
  }
}

// Load snippets into sidebar
export async function loadSidebarSnippets() {
  try {
    const res = await fetch(`${BASE_URL}/snippets`, {
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippets');
    }

    allSnippets = data.data;
    displaySidebarSnippets(allSnippets);
  } catch (err) {
    console.error('Load snippets error:', err);
    const list = document.getElementById('sidebar-snippet-list');
    if (list) {
      list.innerHTML = `<li style="color: #ff4d4d; text-align: center; padding: 20px;">Error loading snippets</li>`;
    }
  }
}

// Display snippets in sidebar
function displaySidebarSnippets(snippets) {
  const list = document.getElementById('sidebar-snippet-list');
  if (!list) return;

  if (snippets.length === 0) {
    list.innerHTML = `<li style="color: #888; text-align: center; padding: 20px;">No snippets yet</li>`;
    return;
  }

  list.innerHTML = snippets.map(snippet => `
    <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; ${currentSnippetId === snippet._id ? 'background: #2a2d35;' : ''} border-bottom: 1px solid #1a1d24;">
      <span onclick="loadSnippetById('${snippet._id}')" style="cursor: pointer; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${snippet.isEncrypted ? '🔒 ' : ''}${escapeHtml(snippet.name)}
      </span>
      <button onclick="event.stopPropagation(); deleteSnippetFromSidebar('${snippet._id}', '${escapeHtml(snippet.name).replace(/'/g, "\\'")}');" style="background: #ff4d4d; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.75rem; margin-left: 8px;">🗑️</button>
    </li>
  `).join('');
}

// Filter sidebar snippets
export function filterSidebarSnippets() {
  const searchInput = document.getElementById('sidebar-search');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const filtered = allSnippets.filter(snippet =>
    snippet.name.toLowerCase().includes(searchTerm)
  );
  displaySidebarSnippets(filtered);
}

// Check if there's a snippet to load from localStorage
function checkForSnippetToLoad() {
  const snippetId = localStorage.getItem('loadSnippetId');
  if (snippetId) {
    localStorage.removeItem('loadSnippetId');

    const needsDecryption = sessionStorage.getItem('needsDecryption');
    const password = sessionStorage.getItem('decryptPassword');

    if (needsDecryption === 'true' && password) {
      sessionStorage.removeItem('needsDecryption');
      sessionStorage.removeItem('decryptPassword');
      loadSnippetByIdWithPassword(snippetId, password);
    } else {
      window.loadSnippetById(snippetId);
    }
  }
}

// Load snippet by ID with password
async function loadSnippetByIdWithPassword(id, password) {
  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippet');
    }

    const snippet = data.data;

    if (snippet.isEncrypted) {
      if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
        const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);
        const decryptedCode = decrypt(snippet.code, password);

        if (decryptedCode === 'DECRYPTION_ERROR') {
          alert('Failed to decrypt. Wrong password?');
          return;
        }

        const decryptedSnippet = { ...snippet, code: decryptedCode };
        loadSnippetIntoEditor(decryptedSnippet);
      } else {
        alert('Decryption module not loaded');
      }
    } else {
      loadSnippetIntoEditor(snippet);
    }
  } catch (err) {
    console.error('Load snippet error:', err);
    alert('Error: ' + err.message);
  }
}

// Load snippet into editor
function loadSnippetIntoEditor(snippet) {
  if (typeof codeMirrorEditor !== 'undefined') {
    codeMirrorEditor.setValue(snippet.code);
  }

  currentSnippetId = snippet._id;
  const nameEl = document.getElementById('current-snippet-name');
  if (nameEl) nameEl.textContent = snippet.name;
  hasUnsavedChanges = false;

  displaySidebarSnippets(allSnippets);
}

// Export functions to window for HTML onclick handlers
window.loadSnippetById = async function(id) {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Do you want to continue?')) {
      return;
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippet');
    }

    const snippet = data.data;

    if (snippet.isEncrypted) {
      pendingDecryptSnippet = snippet;
      document.getElementById('decryptModal').style.display = 'flex';
      document.getElementById('decryptPassword').focus();
      document.getElementById('decryptError').style.display = 'none';
      return;
    }

    isCurrentSnippetDecrypted = false;
    currentDecryptPassword = null;
    hideReEncryptButton();
    loadSnippetIntoEditor(snippet);
  } catch (err) {
    console.error('Load snippet error:', err);
    alert('Error: ' + err.message);
  }
};

window.deleteSnippetFromSidebar = async function(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete snippet');
    }

    if (currentSnippetId === id) {
      if (typeof codeMirrorEditor !== 'undefined') {
        codeMirrorEditor.setValue('function quantum_sort(arr) {\n  return arr.sort();\n}');
      }
      currentSnippetId = null;
      const nameEl = document.getElementById('current-snippet-name');
      if (nameEl) nameEl.textContent = 'New Snippet';
      hasUnsavedChanges = false;
    }

    await loadSidebarSnippets();
    alert('Snippet deleted successfully!');
  } catch (err) {
    console.error('Delete snippet error:', err);
    alert('Error: ' + err.message);
  }
};

// Re-encrypt button functions
function showReEncryptButton() {
  const encryptBtn = document.getElementById('encryptBtn');
  if (encryptBtn) {
    encryptBtn.textContent = '🔒 Re-encrypt';
    encryptBtn.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
    encryptBtn.onclick = reEncryptCode;
  }
}

function hideReEncryptButton() {
  const encryptBtn = document.getElementById('encryptBtn');
  if (encryptBtn) {
    encryptBtn.textContent = 'Encrypt/Decrypt';
    encryptBtn.style.background = '';
    encryptBtn.onclick = null;
  }
}

function reEncryptCode() {
  if (!isCurrentSnippetDecrypted || !currentDecryptPassword) {
    alert('No decrypted code to re-encrypt');
    return;
  }

  if (!currentSnippetId) {
    alert('No snippet loaded');
    return;
  }

  try {
    let code = '';
    if (typeof codeMirrorEditor !== 'undefined') {
      code = codeMirrorEditor.getValue();
    }

    if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
      const encrypt = Module.cwrap('encrypt', 'string', ['string', 'string']);
      const encryptedCode = encrypt(code, currentDecryptPassword);

      codeMirrorEditor.setValue(encryptedCode);
      isCurrentSnippetDecrypted = false;
      currentDecryptPassword = null;
      hideReEncryptButton();

      alert('Code re-encrypted successfully! 🔒');
    } else {
      alert('Encryption module not loaded');
    }
  } catch (err) {
    console.error('Re-encrypt error:', err);
    alert('Failed to re-encrypt code');
  }
}

// Decrypt modal functions
window.closeDecryptModal = function() {
  document.getElementById('decryptModal').style.display = 'none';
  document.getElementById('decryptPassword').value = '';
  document.getElementById('decryptError').style.display = 'none';
  pendingDecryptSnippet = null;
};

window.confirmDecrypt = function() {
  const password = document.getElementById('decryptPassword').value;
  const errorEl = document.getElementById('decryptError');

  if (!password) {
    errorEl.textContent = 'Please enter the decryption password';
    errorEl.style.display = 'block';
    return;
  }

  if (!pendingDecryptSnippet) {
    errorEl.textContent = 'No snippet to decrypt';
    errorEl.style.display = 'block';
    return;
  }

  try {
    if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
      const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);
      const decryptedCode = decrypt(pendingDecryptSnippet.code, password);

      if (decryptedCode === 'DECRYPTION_ERROR') {
        errorEl.textContent = 'Failed to decrypt. Wrong password?';
        errorEl.style.display = 'block';
        return;
      }

      currentDecryptPassword = password;
      isCurrentSnippetDecrypted = true;

      const decryptedSnippet = {
        ...pendingDecryptSnippet,
        code: decryptedCode
      };

      loadSnippetIntoEditor(decryptedSnippet);
      showReEncryptButton();
      window.closeDecryptModal();
    } else {
      errorEl.textContent = 'Decryption module not loaded';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Decrypt error:', err);
    errorEl.textContent = 'Failed to decrypt. Wrong password?';
    errorEl.style.display = 'block';
  }
};
