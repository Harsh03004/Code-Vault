// Snippet Management for Code Vault

// Global variables for decryption
let pendingDecryptSnippet = null;
let currentDecryptPassword = null; // Store password for re-encryption
let isCurrentSnippetDecrypted = false; // Track if current snippet is decrypted

// Load snippets on page load
window.addEventListener('DOMContentLoaded', () => {
  loadSidebarSnippets();
  checkForSnippetToLoad();

  // Track changes in editor
  if (typeof codeMirrorEditor !== 'undefined') {
    codeMirrorEditor.on('change', () => {
      hasUnsavedChanges = true;
    });
  }
});

// Toggle encryption fields
function toggleEncryptionFields() {
  const checkbox = document.getElementById('encryptCheckbox');
  const fields = document.getElementById('encryptionFields');
  fields.style.display = checkbox.checked ? 'block' : 'none';

  // Clear password fields when unchecked
  if (!checkbox.checked) {
    document.getElementById('encryptionPassword').value = '';
    document.getElementById('confirmEncryptionPassword').value = '';
  }
}

// Load snippets into sidebar
async function loadSidebarSnippets() {
  try {
    const res = await fetch(`${BASE_URL}/snippets`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippets');
    }

    allSnippets = data.data;
    displaySidebarSnippets(allSnippets);
  } catch (err) {
    console.error('Load snippets error:', err);
    document.getElementById('sidebar-snippet-list').innerHTML = `
      <li style="color: #ff4d4d; text-align: center; padding: 20px;">Error loading snippets</li>
    `;
  }
}

// Display snippets in sidebar
function displaySidebarSnippets(snippets) {
  const list = document.getElementById('sidebar-snippet-list');

  if (snippets.length === 0) {
    list.innerHTML = `
      <li style="color: #888; text-align: center; padding: 20px;">No snippets yet</li>
    `;
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
function filterSidebarSnippets() {
  const searchTerm = document.getElementById('sidebar-search').value.toLowerCase();
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

    // Check if there's a password from dashboard
    const needsDecryption = sessionStorage.getItem('needsDecryption');
    const password = sessionStorage.getItem('decryptPassword');

    if (needsDecryption === 'true' && password) {
      // Clear session storage
      sessionStorage.removeItem('needsDecryption');
      sessionStorage.removeItem('decryptPassword');

      // Load and decrypt automatically
      loadSnippetByIdWithPassword(snippetId, password);
    } else {
      loadSnippetById(snippetId);
    }
  }
}

// Load snippet by ID with password (from dashboard)
async function loadSnippetByIdWithPassword(id, password) {
  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippet');
    }

    const snippet = data.data;

    // If encrypted, decrypt with provided password
    if (snippet.isEncrypted) {
      try {
        if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
          const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);
          const decryptedCode = decrypt(snippet.code, password);

          if (decryptedCode === 'DECRYPTION_ERROR') {
            alert('Failed to decrypt. Wrong password?');
            return;
          }

          // Create decrypted snippet object
          const decryptedSnippet = {
            ...snippet,
            code: decryptedCode
          };

          loadSnippetIntoEditor(decryptedSnippet);
        } else {
          alert('Decryption module not loaded');
        }
      } catch (err) {
        console.error('Decrypt error:', err);
        alert('Failed to decrypt. Wrong password?');
      }
    } else {
      // Load code into editor (unencrypted)
      loadSnippetIntoEditor(snippet);
    }
  } catch (err) {
    console.error('Load snippet error:', err);
    alert('Error: ' + err.message);
  }
}

// Load snippet by ID
async function loadSnippetById(id) {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Do you want to continue?')) {
      return;
    }
  }

  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippet');
    }

    const snippet = data.data;

    // If encrypted, show decrypt modal
    if (snippet.isEncrypted) {
      pendingDecryptSnippet = snippet;
      document.getElementById('decryptModal').style.display = 'flex';
      document.getElementById('decryptPassword').focus();
      document.getElementById('decryptError').style.display = 'none';
      return;
    }

    // Load code into editor (unencrypted)
    isCurrentSnippetDecrypted = false;
    currentDecryptPassword = null;
    hideReEncryptButton();
    loadSnippetIntoEditor(snippet);
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

  // Update current snippet
  currentSnippetId = snippet._id;
  document.getElementById('current-snippet-name').textContent = snippet.name;
  hasUnsavedChanges = false;

  // Update sidebar highlighting
  displaySidebarSnippets(allSnippets);
}

// Create new snippet
function createNewSnippet() {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Do you want to continue?')) {
      return;
    }
  }

  // Clear editor
  if (typeof codeMirrorEditor !== 'undefined') {
    codeMirrorEditor.setValue('function quantum_sort(arr) {\n  return arr.sort();\n}');
  }

  // Reset current snippet
  currentSnippetId = null;
  document.getElementById('current-snippet-name').textContent = 'New Snippet';
  hasUnsavedChanges = false;

  // Reset decryption state
  isCurrentSnippetDecrypted = false;
  currentDecryptPassword = null;
  hideReEncryptButton();

  // Update sidebar highlighting
  displaySidebarSnippets(allSnippets);
}

// Save snippet
function saveSnippet() {
  // Get code from editor
  let code = '';
  if (typeof codeMirrorEditor !== 'undefined') {
    code = codeMirrorEditor.getValue();
  }

  if (!code || code.trim().length === 0) {
    alert('Please write some code before saving!');
    return;
  }

  // If updating existing snippet
  if (currentSnippetId) {
    const currentSnippet = allSnippets.find(s => s._id === currentSnippetId);
    if (currentSnippet) {
      document.getElementById('snippetNameInput').value = currentSnippet.name;
    }
  } else {
    document.getElementById('snippetNameInput').value = '';
  }

  // Show save modal
  document.getElementById('saveModal').style.display = 'flex';
  document.getElementById('snippetNameInput').focus();
  document.getElementById('saveError').style.display = 'none';
}

// Close save modal
function closeSaveModal() {
  document.getElementById('saveModal').style.display = 'none';
  document.getElementById('snippetNameInput').value = '';
  document.getElementById('saveError').style.display = 'none';
}

// Confirm save
async function confirmSave() {
  const name = document.getElementById('snippetNameInput').value.trim();
  const errorEl = document.getElementById('saveError');

  if (!name) {
    errorEl.textContent = 'Please enter a snippet name';
    errorEl.style.display = 'block';
    return;
  }

  // Check if snippet name already exists (only when creating new snippet)
  if (!currentSnippetId) {
    const existingSnippet = allSnippets.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSnippet) {
      const confirmOverwrite = confirm(`A snippet named "${name}" already exists. Do you want to overwrite it?`);
      if (!confirmOverwrite) {
        return;
      }
      // Set currentSnippetId to update the existing snippet instead of creating new
      currentSnippetId = existingSnippet._id;
    }
  }

  let code = '';
  if (typeof codeMirrorEditor !== 'undefined') {
    code = codeMirrorEditor.getValue();
  }

  // Check if encryption is enabled
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

    // Encrypt the code using WASM
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
      // Update existing snippet
      res = await fetch(`${BASE_URL}/snippets/${currentSnippetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name,
          code: finalCode,
          language: 'javascript',
          isEncrypted: isEncrypted
        })
      });
    } else {
      // Create new snippet
      res = await fetch(`${BASE_URL}/snippets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
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

    // Update current snippet
    currentSnippetId = data.data._id;
    document.getElementById('current-snippet-name').textContent = data.data.name;
    hasUnsavedChanges = false;

    // Show encrypted code in editor if encrypted
    if (isEncrypted && typeof codeMirrorEditor !== 'undefined') {
      codeMirrorEditor.setValue(finalCode);
    }

    // Reset decryption state after saving
    isCurrentSnippetDecrypted = false;
    currentDecryptPassword = null;
    hideReEncryptButton();

    // Reload sidebar
    await loadSidebarSnippets();

    // Close modal
    closeSaveModal();

    // Show success message
    alert(isEncrypted ? 'Snippet encrypted and saved successfully! 🔒' : 'Snippet saved successfully!');
  } catch (err) {
    console.error('Save snippet error:', err);
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle Enter key in save modal
document.addEventListener('DOMContentLoaded', () => {
  const snippetNameInput = document.getElementById('snippetNameInput');
  if (snippetNameInput) {
    snippetNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmSave();
      }
    });
  }
});

// Delete snippet from sidebar
async function deleteSnippetFromSidebar(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/snippets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete snippet');
    }

    // Clear editor if deleted snippet was currently loaded
    if (currentSnippetId === id) {
      if (typeof codeMirrorEditor !== 'undefined') {
        codeMirrorEditor.setValue('function quantum_sort(arr) {\n  return arr.sort();\n}');
      }
      currentSnippetId = null;
      document.getElementById('current-snippet-name').textContent = 'New Snippet';
      hasUnsavedChanges = false;
    }

    // Reload sidebar snippets
    await loadSidebarSnippets();

    // Show success message
    alert('Snippet deleted successfully!');
  } catch (err) {
    console.error('Delete snippet error:', err);
    alert('Error: ' + err.message);
  }
}


// Close decrypt modal
function closeDecryptModal() {
  document.getElementById('decryptModal').style.display = 'none';
  document.getElementById('decryptPassword').value = '';
  document.getElementById('decryptError').style.display = 'none';
  pendingDecryptSnippet = null;
}

// Confirm decrypt
function confirmDecrypt() {
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
    // Decrypt the code using WASM
    if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
      const decrypt = Module.cwrap('decrypt', 'string', ['string', 'string']);
      const decryptedCode = decrypt(pendingDecryptSnippet.code, password);

      if (decryptedCode === 'DECRYPTION_ERROR') {
        errorEl.textContent = 'Failed to decrypt. Wrong password?';
        errorEl.style.display = 'block';
        return;
      }

      // Store password for re-encryption
      currentDecryptPassword = password;
      isCurrentSnippetDecrypted = true;

      // Create a temporary snippet object with decrypted code
      const decryptedSnippet = {
        ...pendingDecryptSnippet,
        code: decryptedCode
      };

      // Load into editor
      loadSnippetIntoEditor(decryptedSnippet);

      // Show re-encrypt button
      showReEncryptButton();

      // Close modal
      closeDecryptModal();
    } else {
      errorEl.textContent = 'Decryption module not loaded';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    console.error('Decrypt error:', err);
    errorEl.textContent = 'Failed to decrypt. Wrong password?';
    errorEl.style.display = 'block';
  }
}

// Show re-encrypt button
function showReEncryptButton() {
  const encryptBtn = document.getElementById('encryptBtn');
  if (encryptBtn) {
    encryptBtn.textContent = '🔒 Re-encrypt';
    encryptBtn.style.background = 'linear-gradient(90deg, #ffa500, #ff8c00)';
    encryptBtn.onclick = reEncryptCode;
  }
}

// Hide re-encrypt button (reset to normal)
function hideReEncryptButton() {
  const encryptBtn = document.getElementById('encryptBtn');
  if (encryptBtn) {
    encryptBtn.textContent = 'Encrypt/Decrypt';
    encryptBtn.style.background = '';
    encryptBtn.onclick = null;
  }
}

// Re-encrypt code
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
    // Get current code from editor
    let code = '';
    if (typeof codeMirrorEditor !== 'undefined') {
      code = codeMirrorEditor.getValue();
    }

    // Encrypt the code using WASM
    if (typeof Module !== 'undefined' && typeof Module.cwrap !== 'undefined') {
      const encrypt = Module.cwrap('encrypt', 'string', ['string', 'string']);
      const encryptedCode = encrypt(code, currentDecryptPassword);

      // Show encrypted code in editor
      codeMirrorEditor.setValue(encryptedCode);

      // Reset state
      isCurrentSnippetDecrypted = false;
      currentDecryptPassword = null;

      // Hide re-encrypt button
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

// Handle Enter key in decrypt modal
document.addEventListener('DOMContentLoaded', () => {
  const decryptPassword = document.getElementById('decryptPassword');
  if (decryptPassword) {
    decryptPassword.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        confirmDecrypt();
      }
    });
  }
});
