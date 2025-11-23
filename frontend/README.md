# Frontend Organization

## 📁 Folder Structure

```
frontend/
├── js/                     # JavaScript modules
│   ├── config.js          # Configuration & authentication
│   ├── utils.js           # Utility functions
│   ├── editor.js          # Code editor & AI features
│   ├── encryption.js      # WASM encryption handlers
│   ├── snippet-manager.js # Snippet management
│   ├── snippet-save.js    # Save functionality
│   ├── dashboard.js       # Dashboard logic
│   └── app-init.js        # App initialization
│
├── assets/                # Static files
├── index.html            # Main editor
├── dashboard.html        # Snippets dashboard
├── login.html            # Authentication
├── register.html         # User registration
├── profile.html          # User profile
├── style.css             # Global styles
├── vault.js              # WASM wrapper
└── vault.wasm            # AES-256 binary
```

## 📦 Module Descriptions

### `js/config.js`
- API base URL configuration
- Authentication helpers
- Auth header generation

### `js/utils.js`
- `escapeHtml()` - XSS protection
- `formatDate()` - Date formatting
- `showToast()` - Notifications

### `js/editor.js`
- CodeMirror initialization
- AI chat interface
- Toolbar button handlers
- AI features (analyze, explain, document, optimize)

### `js/encryption.js`
- WASM module initialization
- Encrypt/decrypt button handlers
- AES-256-CBC encryption

### `js/snippet-manager.js`
- Load snippets from API
- Display in sidebar
- Load snippet into editor
- Delete snippets
- Re-encrypt functionality

### `js/snippet-save.js`
- Save modal logic
- Encryption options
- Create/update snippets
- Password validation

### `js/dashboard.js`
- Dashboard page logic
- Snippet grid display
- Search/filter functionality
- Decrypt modal for dashboard

### `js/app-init.js`
- Main app initialization
- Module coordination
- Global variable setup

## 🔌 How to Use

### In HTML Files

For the **main editor** (index.html):
```html
<script type="module" src="js/app-init.js"></script>
```

For the **dashboard** (dashboard.html):
```html
<script type="module" src="js/dashboard.js"></script>
```

### Module Imports

```javascript
// Import from config
import { BASE_URL, checkAuth, getAuthHeaders } from './config.js';

// Import from utils
import { escapeHtml, formatDate } from './utils.js';

// Import from editor
import { codeMirrorEditor, initializeChat } from './editor.js';
```

## 🎯 Key Features

### Modular Design
- ✅ Separated concerns
- ✅ Reusable components
- ✅ Easy to maintain
- ✅ Clear dependencies

### Security
- ✅ XSS protection (escapeHtml)
- ✅ JWT authentication
- ✅ AES-256 encryption
- ✅ Secure password handling

### User Experience
- ✅ Real-time code editing
- ✅ AI-powered features
- ✅ Encrypted snippet support
- ✅ Responsive design

## 🚀 Development

### Adding New Features

1. **Create a new module** in `js/` folder
2. **Export functions** you want to use
3. **Import in app-init.js** or relevant page
4. **Initialize** in DOMContentLoaded

Example:
```javascript
// js/my-feature.js
export function myFeature() {
  console.log('My feature!');
}

// js/app-init.js
import { myFeature } from './my-feature.js';

document.addEventListener('DOMContentLoaded', () => {
  myFeature();
});
```

### Best Practices

1. **Use ES6 modules** - Import/export syntax
2. **Keep functions small** - Single responsibility
3. **Handle errors** - Try/catch blocks
4. **Validate input** - Check before processing
5. **Comment complex logic** - Help future you

## 📝 Notes

- All JavaScript files use ES6 modules
- WASM module loads asynchronously
- Authentication checked on page load
- Snippets cached in memory for performance

## 🐛 Debugging

### Common Issues

**Module not found:**
- Check file path in import statement
- Ensure file exists in `js/` folder

**Function not defined:**
- Check if function is exported
- Verify import statement

**WASM not loading:**
- Check browser console for errors
- Ensure vault.js and vault.wasm are in frontend root

**API errors:**
- Check BASE_URL in config.js
- Verify backend is running
- Check authentication token
