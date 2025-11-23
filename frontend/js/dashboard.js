// Dashboard Module
import { BASE_URL, checkAuth, getAuthHeaders } from './config.js';
import { escapeHtml, formatDate } from './utils.js';

// Check authentication
checkAuth();

// Global variables
let allSnippets = [];

// Load snippets on page load
document.addEventListener('DOMContentLoaded', () => {
  loadSnippets();
});

// Load snippets
async function loadSnippets() {
  try {
    const res = await fetch(`${BASE_URL}/snippets`, {
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load snippets');
    }

    allSnippets = data.data;
    displaySnippets(allSnippets);
  } catch (err) {
    console.error('Load snippets error:', err);
    document.getElementById('snippetsContainer').innerHTML = `
      <div class="empty-state">
        <h2>Error Loading Snippets</h2>
        <p>${err.message}</p>
      </div>
    `;
  }
}

// Display snippets
function displaySnippets(snippets) {
  const container = document.getElementById('snippetsContainer');

  if (snippets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>No Snippets Yet</h2>
        <p>Start creating your first code snippet!</p>
        <button class="btn-new" onclick="createNewSnippet()">+ Create First Snippet</button>
      </div>
    `;
    return;
  }

  container.innerHTML = snippets.map(snippet => `
    <div class="snippet-card" id="card-${snippet._id}">
      <h3>${snippet.isEncrypted ? '🔒' : '📄'} ${escapeHtml(snippet.name)}</h3>
      <div class="snippet-meta">
        Created: ${formatDate(snippet.createdAt)}${snippet.isEncrypted ? ' • Encrypted' : ''}
      </div>
      <div class="snippet-preview" id="preview-${snippet._id}">
        ${snippet.isEncrypted 
          ? `<div style="text-align: center; padding: 20px; color: #888;">
               <div style="font-size: 3rem; margin-bottom: 10px;">🔒</div>
               <p style="color: #00f6ff;">This snippet is encrypted</p>
               <p style="font-size: 0.85rem; margin-top: 5px;">Click Open to decrypt and view</p>
             </div>` 
          : escapeHtml(snippet.code.substring(0, 150)) + (snippet.code.length > 150 ? '...' : '')}
      </div>
      <div class="snippet-actions">
        <button class="btn btn-primary" onclick="${snippet.isEncrypted ? `decryptSnippetInDashboard(\`${snippet._id}\`, \`${escapeHtml(snippet.name)}\`)` : `openSnippet(\`${snippet._id}\`)`}">Open</button>
        <button class="btn btn-danger" onclick="deleteSnippet(\`${snippet._id}\`, \`${escapeHtml(snippet.name)}\`)">Delete</button>
      </div>
    </div>
  `).join('');
}

// Filter snippets
window.filterSnippets = function() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allSnippets.filter(snippet => 
    snippet.name.toLowerCase().includes(searchTerm) ||
    snippet.code.toLowerCase().includes(searchTerm)
  );
  displaySnippets(filtered);
};

// Open snippet
window.openSnippet = function(id) {
  localStorage.setItem('loadSnippetId', id);
  window.location.href = 'index.html';
};

// Delete snippet
window.deleteSnippet = async function(id, name) {
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

    const loadedSnippetId = localStorage.getItem('currentSnippetId');
    if (loadedSnippetId === id) {
      localStorage.removeItem('currentSnippetId');
    }

    alert('Snippet deleted successfully!');
    loadSnippets();
  } catch (err) {
    console.error('Delete snippet error:', err);
    alert('Error: ' + err.message);
  }
};

// Create new snippet
window.createNewSnippet = function() {
  localStorage.removeItem('loadSnippetId');
  window.location.href = 'index.html';
};

// Decrypt snippet in dashboard
window.decryptSnippetInDashboard = function(id, name) {
  const currentDecryptSnippet = allSnippets.find(s => s._id === id);
  if (!currentDecryptSnippet) {
    alert('Snippet not found');
    return;
  }
  
  document.getElementById('decryptSnippetName').textContent = `Enter password to open: ${name}`;
  document.getElementById('decryptModal').style.display = 'flex';
  document.getElementById('decryptPasswordInput').value = '';
  document.getElementById('decryptPasswordInput').focus();
  document.getElementById('decryptError').style.display = 'none';
  
  window.currentDecryptSnippet = currentDecryptSnippet;
};

// Close decrypt modal
window.closeDecryptModal = function() {
  document.getElementById('decryptModal').style.display = 'none';
  document.getElementById('decryptPasswordInput').value = '';
  document.getElementById('decryptError').style.display = 'none';
  window.currentDecryptSnippet = null;
};

// Confirm decrypt and open
window.confirmDecryptDashboard = function() {
  const password = document.getElementById('decryptPasswordInput').value;
  const errorEl = document.getElementById('decryptError');

  if (!password) {
    errorEl.textContent = 'Please enter the decryption password';
    errorEl.style.display = 'block';
    return;
  }

  if (!window.currentDecryptSnippet) {
    errorEl.textContent = 'No snippet to decrypt';
    errorEl.style.display = 'block';
    return;
  }

  sessionStorage.setItem('decryptPassword', password);
  sessionStorage.setItem('needsDecryption', 'true');
  
  localStorage.setItem('loadSnippetId', window.currentDecryptSnippet._id);
  window.location.href = 'index.html';
};

// Handle Enter key in decrypt modal
document.addEventListener('DOMContentLoaded', () => {
  const decryptInput = document.getElementById('decryptPasswordInput');
  if (decryptInput) {
    decryptInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.confirmDecryptDashboard();
      }
    });
  }
});
