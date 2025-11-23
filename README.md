# 🔐 Code Vault

> A secure, AI-powered code snippet manager with military-grade AES-256 encryption

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)

---

## � About- The Project

**Code Vault** is a professional-grade web application for developers to securely store, manage, and analyze code snippets. It combines **AES-256-CBC encryption** (compiled from C++ to WebAssembly) with **AI-powered code analysis** using Google's Gemini API.

### ✨ Key Features

* **🔒 Military-Grade Encryption**
  - AES-256-CBC encryption implemented in C++
  - Compiled to WebAssembly for near-native performance
  - Client-side encryption - your code never leaves unencrypted

* **🤖 AI Code Assistant**
  - Security vulnerability scanning
  - Code explanation and documentation
  - Performance optimization suggestions
  - Interactive chat with context awareness

* **📝 Snippet Management**
  - Save and organize code snippets
  - Encrypted snippet support
  - Search and filter functionality
  - Dashboard with visual preview

* **👤 User Authentication**
  - JWT-based authentication
  - Secure password hashing (bcrypt)
  - Profile management
  - Session handling

---

## 🏗️ Tech Stack

### **Backend**
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT + bcrypt
- **AI:** Google Gemini API

### **Frontend**
- **Editor:** CodeMirror
- **Encryption:** C++ → WebAssembly (Emscripten)
- **Styling:** Custom CSS
- **Architecture:** ES6 Modules

### **Encryption**
- **Algorithm:** AES-256-CBC
- **Language:** C++
- **Compiler:** Emscripten
- **Output:** WebAssembly

---

## 📁 Project Structure

```
Code-Vault/
├── backend/                    # Backend (Node.js + Express)
│   ├── controllers/           # Business logic
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── snippet.controller.js
│   │   └── ai.controller.js
│   ├── models/                # MongoDB schemas
│   │   ├── User.model.js
│   │   └── Snippet.model.js
│   ├── routes/                # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── snippet.routes.js
│   │   └── ai.routes.js
│   ├── middlewares/           # Express middlewares
│   │   └── auth.middleware.js
│   ├── utils/                 # Utility functions
│   │   ├── database.util.js
│   │   └── gemini.util.js
│   └── server.js              # Main server file
│
├── frontend/                   # Frontend (HTML + JS + CSS)
│   ├── js/                    # JavaScript modules
│   │   ├── config.js          # API configuration
│   │   ├── utils.js           # Utility functions
│   │   ├── editor.js          # CodeMirror & AI
│   │   ├── encryption.js      # WASM handlers
│   │   ├── snippet-manager.js # Snippet CRUD
│   │   ├── snippet-save.js    # Save functionality
│   │   ├── dashboard.js       # Dashboard logic
│   │   └── app-init.js        # App initialization
│   ├── assets/                # Static files
│   ├── index.html             # Main editor
│   ├── dashboard.html         # Snippets dashboard
│   ├── login.html             # Authentication
│   ├── register.html          # User registration
│   ├── profile.html           # User profile
│   ├── style.css              # Global styles
│   ├── vault.js               # WASM wrapper (generated)
│   └── vault.wasm             # AES-256 binary (generated)
│
├── cpp_encryption/             # C++ Encryption Source
│   ├── aes.h                  # AES-256 header
│   ├── aes.cpp                # AES-256 implementation
│   └── encryption_wrapper.cpp # WASM wrapper
│
├── emsdk/                      # Emscripten SDK
│   └── compile.bat            # Compilation script
│
├── .env                        # Environment variables (not in Git)
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── PROJECT_STRUCTURE.md       # Detailed structure
├── ORGANIZATION_COMPLETE.md   # Organization summary
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas)
3. **Google Gemini API Key** - [Get key](https://aistudio.google.com/app/apikey)
4. **C++ Compiler** (for WASM compilation)
   - Windows: Visual Studio with C++ workload
   - Mac/Linux: g++ or clang

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Code-Vault.git
cd Code-Vault
```

#### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Setup Environment Variables

Create a `.env` file in the `backend` folder:

```env
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=3000

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRES=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRES=7d
```

#### 4. Compile C++ to WebAssembly

**Option A: Using the batch file (Windows)**
```bash
cd emsdk
./compile.bat
```

**Option B: Manual compilation**
```bash
cd emsdk
./emsdk_env.bat
cd ..
emcc ./cpp_encryption/aes.cpp ./cpp_encryption/encryption_wrapper.cpp -o ./frontend/vault.js -s WASM=1 -s EXPORTED_RUNTIME_METHODS=[cwrap] -s ALLOW_MEMORY_GROWTH=1 -O3
```

This generates `vault.js` and `vault.wasm` in the `frontend` folder.

---

## 🎮 Usage

### Start the Backend Server
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3000`

### Start the Frontend Server
```bash
cd frontend
# Use Live Server extension in VSCode
# Or use any static file server
npx serve
```
Frontend runs on `http://localhost:5000` (or your server's port)

### Access the Application
Open your browser and navigate to `http://localhost:5000`

---

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login user |
| POST | `/api/logout` | Logout user |

### User Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/change-password` | Change password |

### Snippet Endpoints (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/snippets` | Get all snippets |
| POST | `/api/snippets` | Create snippet |
| GET | `/api/snippets/:id` | Get snippet by ID |
| PUT | `/api/snippets/:id` | Update snippet |
| DELETE | `/api/snippets/:id` | Delete snippet |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyze code |
| POST | `/api/chat` | Chat with AI |
| POST | `/api/action` | Perform AI action |

---

## 🔐 Security Features

### Encryption
- **Algorithm:** AES-256-CBC
- **Key Derivation:** Password-based
- **IV:** Random 16-byte initialization vector
- **Padding:** PKCS7
- **Implementation:** C++ compiled to WebAssembly

### Authentication
- **JWT Tokens:** Access & refresh tokens
- **Password Hashing:** bcrypt with salt rounds
- **HTTP-only Cookies:** Secure token storage
- **CORS:** Configured origins

### Data Protection
- **Client-side Encryption:** Code encrypted before storage
- **Environment Variables:** Sensitive data in .env
- **Input Validation:** All inputs validated
- **XSS Protection:** HTML escaping

---

## 🎯 Features in Detail

### Code Editor
- Syntax highlighting (CodeMirror)
- Multiple language support
- Line numbers
- Auto-completion
- Theme: Material Darker

### AI Assistant
- **Analyze:** Security vulnerability scanning
- **Explain:** Detailed code explanation
- **Document:** Generate documentation
- **Optimize:** Performance suggestions
- **Chat:** Interactive Q&A with context

### Snippet Management
- Create, read, update, delete
- Encryption support
- Search and filter
- Sidebar navigation
- Dashboard view

### User Management
- Registration with validation
- Secure login
- Profile editing
- Password change
- Session management

---

## 🛠️ Development

### Project Organization

The codebase follows **MVC architecture** with clear separation of concerns:

- **Models:** Database schemas
- **Views:** HTML pages
- **Controllers:** Business logic
- **Routes:** API endpoints
- **Middlewares:** Request processing
- **Utils:** Helper functions

### Adding New Features

**Backend:**
1. Create controller in `backend/controllers/`
2. Create route in `backend/routes/`
3. Import route in `backend/server.js`

**Frontend:**
1. Create module in `frontend/js/`
2. Export functions
3. Import in `frontend/js/app-init.js`

### Code Style

- **ES6 Modules:** Import/export syntax
- **Async/Await:** For asynchronous operations
- **Error Handling:** Try/catch blocks
- **Comments:** Document complex logic
- **Naming:** Descriptive variable names

---

## 📖 Documentation

<!-- - **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Complete project structure
- **[ORGANIZATION_COMPLETE.md](./ORGANIZATION_COMPLETE.md)** - Organization summary
- **[frontend/README.md](./frontend/README.md)** - Frontend module guide -->
- **[.gitignore.md](./.gitignore.md)** - Git ignore documentation

---

## 🐛 Troubleshooting

### WASM Module Not Loading
- Ensure `vault.js` and `vault.wasm` are in `frontend/` folder
- Check browser console for errors
- Verify WASM compilation was successful

### API Errors
- Check if backend server is running
- Verify `BASE_URL` in `frontend/js/config.js`
- Check authentication token

### Gemini API Errors
- Verify API key in `.env`
- Check API key restrictions in Google Cloud Console
- Ensure Generative Language API is enabled

### MongoDB Connection Issues
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas network access
- Ensure database user has proper permissions

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---


## 👨‍💻 Author

**Your Name**
- GitHub: [@Harsh03004](https://github.com/Harsh03004)

---

## 🙏 Acknowledgments

- [Emscripten](https://emscripten.org/) - C++ to WebAssembly compiler
- [CodeMirror](https://codemirror.net/) - Code editor component
- [Google Gemini](https://ai.google.dev/) - AI API
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database hosting
- [Express.js](https://expressjs.com/) - Web framework

---

## 📊 Project Stats

- **Lines of Code:** ~5,000+
- **Files:** 30+
- **Languages:** JavaScript, C++, HTML, CSS
- **Architecture:** MVC Pattern
- **Security:** AES-256-CBC Encryption

---

## 🚀 Roadmap

- [ ] Multi-language syntax highlighting
- [ ] Code snippet sharing
- [ ] Team collaboration features
- [ ] Mobile responsive design
- [ ] Dark/Light theme toggle
- [ ] Export/Import functionality
- [ ] Code version history
- [ ] Advanced search filters

---

## 💡 Support

If you found this project helpful, please give it a ⭐️!

For issues and questions, please open an issue on GitHub.

---
