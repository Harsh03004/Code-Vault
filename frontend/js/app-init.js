// Main App Initialization
import { checkAuth, BASE_URL } from './config.js';
import { codeMirrorEditor, initializeChat, initializeToolbar } from './editor.js';
import { initializeEncryption } from './encryption.js';
import { initializeSnippetManager, filterSidebarSnippets } from './snippet-manager.js';
import './snippet-save.js';

// Check authentication on page load
checkAuth();

// Global variables
window.BASE_URL = BASE_URL;
window.accessToken = localStorage.getItem('accessToken');
window.codeMirrorEditor = codeMirrorEditor;
window.allSnippets = [];
window.currentSnippetId = null;
window.hasUnsavedChanges = false;

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
  // Initialize editor features
  initializeChat();
  initializeToolbar();
  
  // Initialize encryption
  initializeEncryption();
  
  // Initialize snippet management
  initializeSnippetManager(codeMirrorEditor);
  
  // Setup search filter
  const searchInput = document.getElementById('sidebar-search');
  if (searchInput) {
    searchInput.addEventListener('keyup', filterSidebarSnippets);
  }
  
  console.log('✅ Code Vault initialized successfully!');
});
