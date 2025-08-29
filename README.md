# Code-Vault
A secure, client-side encryption vault with an AI-powered code assistant

## About The Project

Code Vault is a secure web application designed for developers to store, manage, and analyze sensitive code snippets. It provides a zero-knowledge, client-side encryption environment using C++/WebAssembly, ensuring that user data and passwords are never sent to a server. The application is enhanced with an integrated AI assistant (powered by Google Gemini) to provide intelligent code analysis, documentation, and optimization on user request.

### Key Features

* **🔒 Client-Side Encryption:** All encryption and decryption happens in your browser. Nothing unencrypted ever leaves your machine.
* **🚀 High-Performance:** Uses a C++ engine compiled to WebAssembly (WASM) for near-native encryption speed.
* **🤖 AI Code Assistant:** Get AI-powered insights on your code for:
    * Security Vulnerability Scanning
    * Automated Code Documentation
    * Performance and Logic Optimization
* **⚙️ Simple & Automated Workflow:** A unified `npm` script setup for easy installation and development.

---
## Tech Stack

* **Core Engine:** C++ / WebAssembly (via Emscripten)
* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js / Express.js
* **AI Integration:** Google Gemini API
* **Development Tools:** `nodemon` for live server reloading, `concurrently` to run servers simultaneously, `serve` for the frontend.

---
## Getting Started

Follow these steps to get a local copy up and running.

### Step 0: Prerequisites & Emsdk Setup

Before you begin, ensure you have the following tools installed.

**1. Node.js and npm**
* Download and install from the official website: [https://nodejs.org/](https://nodejs.org/)

**2. A C++ Compiler**
* **Windows:** Install the "Desktop development with C++" workload from the [Visual Studio Installer](https://visualstudio.microsoft.com/downloads/).
* **Mac/Linux:** Install `g++` or `clang` via your system's package manager.

**3. Emscripten SDK (Emsdk)**
This is the toolchain that compiles C++ to WebAssembly.
* **Download:** Go to the [Emsdk releases page](https://github.com/emscripten-core/emsdk/releases) and download the latest `emsdk-main.zip` file for your operating system.
* **Unzip:** Unzip the folder to a permanent location on your computer with **no spaces in the file path** (e.g., `D:\sdks\emsdk` is good, but `D:\My Tools\emsdk` is bad). For this project, you can simply unzip it inside your `Code-Vault` project folder.
* **Install:** Open a terminal (CMD or PowerShell), navigate into the unzipped `emsdk` folder, and run the following commands:
    ```sh
    # Download and install the latest SDK tools
    ./emsdk install latest
    
    # Make the "latest" SDK the active one
    ./emsdk activate latest
    ```
* This setup process only needs to be done once.

### Installation

1.  **Clone the Repository**
    ```sh
    git clone [https://github.com/your-username/code-vault.git](https://github.com/your-username/code-vault.git)
    cd code-vault
    ```

2.  **Create the Environment File**
    * In the `backend` folder, create a new file named `.env`.
    * Add your Gemini API key to this file. (See instructions [here](https://aistudio.google.com/app/apikey) on how to get one).
    ```
    GEMINI_API_KEY=your_secret_api_key_here
    ```

3.  **Install All Dependencies**
    * From the **root `code-vault` directory**, run the following command. This will install all backend libraries and development tools at once.
    ```sh
    npm install
    ```

---
## Usage / Workflow

The project is now set up. Follow these steps to compile the C++ code and run the application.

### Step 1: Compile the C++ to WebAssembly (One-Time Step)

You must run this command from the special **Emsdk Command Prompt**.

1.  Using your **File Explorer**, navigate to your `emsdk` folder.
2.  Find and **double-click** the file named `emcmdprompt.bat` (or `emsdk_cmd.bat`).
3.  A new command prompt window will open with the correct environment. In this **new window**, navigate to your **root project directory**:
    ```cmd
    cd /d "path\to\your\code-vault"
    ```
4.  Now, run the compile script:
    ```cmd
    npm run compile:wasm
    ```
    This will create `vault.js` and `vault.wasm` in your `frontend` folder. You only need to repeat this step if you change the C++ code in `cpp_encryption`.

### Step 2: Run the Development Server

1.  You can now close the Emsdk prompt. Open a **regular terminal** (like PowerShell or CMD).
2.  Navigate to your **root `code-vault` directory**.
3.  Run the main development command:
    ```sh
    npm run dev
    ```
4.  Your terminal will show logs from both the backend (on port 3000) and frontend (on port 5000) starting up.

### Step 3: Access the Application

* Your backend server is running on `http://localhost:3000`.
* Your frontend application is running on **`http://localhost:5000`**.
* Open your web browser and navigate to **`http://localhost:5000`** to use Code Vault.

---
## Project Structure

```plaintext
code-vault/
├── .gitignore
├── README.md
├── .env              # <-- Your secret API key goes here
├── package.json
├── backend/
│   └── server.js         # <-- The Node.js AI gateway 
├── cpp_encryption/
│   └── encryption_wrapper.cpp
├── frontend/
│   ├── app.js            # <-- Main frontend logic
│   ├── index.html
│   ├── style.css
│   ├── vault.js          # <-- Generated by the compiler
│   └── vault.wasm        # <-- Generated by the compiler
