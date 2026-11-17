<div align="center">
  <img src="https://raw.githubusercontent.com/microsoft/monaco-editor/main/website/favicon.ico" width="80" alt="Codely Logo" />
  <h1>Codely</h1>
  <p><b>The Instant, Collaborative Web IDE with Real-Time Code Execution & Context-Aware AI</b></p>
  
  <p>
    <a href="#"><img src="https://img.shields.io/badge/Status-Active-brightgreen.svg?style=flat-square" alt="Status"></a>
    <a href="#"><img src="https://img.shields.io/badge/Engine-Monaco%20Editor-blue.svg?style=flat-square" alt="Engine"></a>
    <a href="#"><img src="https://img.shields.io/badge/Sync-Yjs%20CRDTs-orange.svg?style=flat-square" alt="Sync"></a>
    <a href="#"><img src="https://img.shields.io/badge/AI-Gemini%20%7C%20GPT--4o%20%7C%20Claude%203.5-purple.svg?style=flat-square" alt="AI"></a>
    <a href="#"><img src="https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square" alt="License"></a>
  </p>

  <p>
    Instant zero-install developer environment. Share a room link, code together in real-time,<br/>
    execute code with an interactive terminal, and brainstorm with an AI assistant that understands your workspace.<br/>
    <b>No signup. No configuration. Pure flow state.</b>
  </p>
</div>

---

## ⚡ Executive Summary

Traditional developer tools require accounts, environment setups, dependency installs, and subscription walls before you can write or run a single line of code. **Codely eliminates the entire friction curve.**

In **under two seconds**, developers can spin up a fully functioning cloud IDE session with multi-tab file management, sub-millisecond CRDT multi-user sync, a server-backed interactive execution terminal, an interactive browser preview sandbox, and a deep context-aware AI assistant.

Whether you're conducting technical interviews, pair-programming with teammates, debugging algorithms with students, or prototyping full-stack ideas on the fly, Codely delivers a desktop-grade IDE experience straight to the browser.

---

## 🚀 Core Product Capabilities

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                CODELY WORKSPACE                               │
├──────────────────────────────────────┬────────────────────────────────────────┤
│           MONACO CODE EDITOR         │             CODELY AI (COPILOT)        │
│  • Multi-tab editing (23+ languages) │  • Drag & drop tabs as context         │
│  • Yjs Conflict-Free sync (CRDTs)    │  • Clipboard image & document paste    │
│  • Multi-user cursors & live presence│  • One-click code diff & apply         │
│  • 14 Handcrafted editor themes      │  • Multi-provider (Gemini, GPT, Claude)│
├──────────────────────────────────────┴────────────────────────────────────────┤
│                       UNIFIED SYSTEM PANEL (DOCKABLE)                         │
│  [ >_ Terminal ]  [ ! Problems ]  [ 🌐 Preview ]  [ 🖼 Screenshots ]  [ 📁 Files ]│
│  • Interactive stdin / stdout / stderr   • Multi-device responsive view       │
│  • Clickable stack trace diagnostics     • Bi-directional live process stream │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. 🔓 Zero-Friction Instant Workspaces
* **No Accounts or Logins:** Never forced to sign up, input credit cards, or verify emails.
* **Instant Provisioning:** Navigate to any URL path (e.g. `codely.app/room-name`) to instantly create or join a collaborative session.
* **Custom Identity:** Every participant receives a distinct cursor color and default handle (`user-xxxx`) which can be renamed anytime and persists in local storage.
* **Ephemeral Architecture:** Rooms run in high-performance in-memory cache and automatically clean up after inactivity, keeping your data confidential.

---

### 2. ⚡ Real-Time Collaborative Engine (Yjs CRDTs)
* **Conflict-Free Replicated Data Types:** Simultaneous edits on identical lines merge deterministically with zero data loss or race conditions.
* **Live Remote Carets:** See collaborator cursor movements, selections, and name pills in real-time.
* **Binary Chunked WebSockets:** Large documents and high-frequency keystroke bursts are packed into compressed binary diffs over WebSockets for minimum bandwidth overhead.
* **Automatic Resync:** Reconnection events compute state-vector differences and seamlessly catch up missed changes in both directions.

---

### 3. 💻 Interactive Execution Terminal
* **Multi-Language Runner:** Execute Python, JavaScript (Node.js), TypeScript, C, C++, Java, Rust, Go, Bash, and more with dedicated process isolation.
* **True Interactive Bi-Directional Streaming:** Full interactive console supporting runtime input (`stdin`), outputs (`stdout`), standard errors (`stderr`), and keyboard interrupts (`Ctrl+C` / SIGINT).
* **Precise Execution Metrics:** Track execution start time, duration in milliseconds, memory state, and exit status badges.
* **Terminal Management:** Instant clear output, stop execution controls, and dedicated keyboard shortcuts.

---

### 4. 🌐 Live Web Preview & Responsive Sandbox
* **Instant HTML/CSS/JS Rendering:** Build web applications and UI prototypes with instant rendering inside an isolated client sandbox.
* **Multi-Device Viewport Toggles:** Instantly preview your web layout across Desktop, Tablet (768px), and Mobile (375px) responsive breakpoints.
* **Pop-Out Capability:** Open the running web preview in a clean standalone browser tab for dual-screen development.
* **Console Sync:** Web preview runtime logs and exceptions forward cleanly to the console.

---

### 5. 🔍 Automated Error & Diagnostic Parser (Problems View)
* **Intelligent Stack Trace Parsing:** Built-in regex engine parses raw compiler and runtime errors from Python, Node.js, GCC, Clang, Rust, and Java.
* **One-Click Navigation:** Click any parsed error in the Problems tab to jump straight to the exact file, line, and column in the Monaco editor.
* **Severity Filtering:** Filter diagnostics by Errors, Warnings, and Info with clear file badges.

---

### 6. 🧠 Context-Aware AI Copilot
* **Multi-Model Support:** 
  * Integrated **Google Gemini** free tier with fair rate limiting.
  * **BYOK (Bring Your Own Key)** support for **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, and **Google Gemini Pro**.
* **Drag-and-Drop Tab Attachment:** Grab any editor tab from the top bar and drop it directly into the AI prompt to attach that file's live code as prompt context.
* **Clipboard (Ctrl+V) File & Screenshot Ingestion:** Paste screenshots, terminal errors, PDFs, CSVs, or text documents directly into the chat prompt.
* **Smart Code Integration:**
  * **Apply to active file:** Replaces or patches code directly into your current editor tab.
  * **Insert into new tab:** Automatically opens an untitled file with the AI's generated code and language mode pre-configured.
* **Private vs. Shared Modes:** Switch between room-wide shared brainstorming or confidential private AI prompts with one click.
* **Modern Antigravity/Cursor Card Interface:** Spacious multi-line input canvas, circular context attachment buttons, and instant bottom-pinned opening without disorienting scroll animations.

---

### 7. 🗂️ Advanced Layout & Docking Architecture
* **Unified IDE Panel:** Dock Terminal, Problems, Preview, Images, and Files to the **Bottom** or **Right** of your workspace.
* **Dual-Axis Sash Resizing:** Resize bottom and side panels independently with smooth mouse/touch dragging, plus a **2D Corner Sash** to adjust both dimensions simultaneously.
* **Maximize & Minimize:** Expand any panel to full workspace view with a single click or double-click on the header.
* **Full Mobile Optimization:** 
  * Full-bleed mobile editor with zero bottom cutoff bands.
  * Floating glassmorphic navigation pill (`Run`, `Console`, `Images`, `Files`, `AI`, `Users`, `More`) with backdrop blur.
  * Touch-friendly drawer drag handles and swipe-to-dismiss bottom sheets.

---

### 8. 🎨 Handcrafted Themes & Monaco Customization
* **14 Curated IDE Themes:**
  * *Dark Themes:* VS Code Dark, GitHub Dark, Dracula, Nord, One Dark Pro, Night Owl, Monokai, SynthWave '84, Solarized Dark.
  * *Light Themes:* VS Code Light, GitHub Light, Solarized Light.
  * *High Contrast:* High Contrast Dark, High Contrast Light.
* **Typography:** Pre-configured with **JetBrains Mono**, smooth cursor animations, font ligatures, line highlights, and customizable tab spaces.

---

### 9. 📦 Asset Sharing & Workspace Export
* **Drag & Drop Media Sharing:** Upload screenshots and mockups with an integrated fullscreen lightbox viewer.
* **Document Sharing:** Share text files, CSVs, logs, and PDFs up to 10 files per session.
* **ZIP Workspace Export:** Download your entire multi-tab project packaged cleanly into a `.zip` archive.
* **Line Range Extraction:** Extract, copy, or share specific line numbers with preserved syntax styling.

---

## ⌨️ Productivity Keyboard Shortcuts

Codely supports cross-platform shortcuts (`Cmd` on macOS, `Ctrl` on Windows & Linux):

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Mod + N` | **New Tab** | Creates a new code tab |
| `Mod + W` | **Close Tab** | Closes the currently active tab |
| `Mod + E` | **Rename Tab** | Triggers inline filename and extension rename |
| `Mod + Enter` | **Run Code** | Executes code in the interactive terminal |
| `Mod + T` | **Theme Modal** | Opens the 14-theme live picker |
| `Mod + J` | **Toggle Console** | Opens / closes the bottom Terminal panel |
| `Mod + P` | **Toggle Preview** | Opens / closes the Live Web Preview |
| `Mod + L` | **Line Range** | Opens the line range selector and extractor |
| `Mod + 1` | **Room Users** | Toggles the active collaborator drawer |
| `Mod + 2` | **Screenshots** | Toggles the shared screenshots panel |
| `Mod + 3` | **Shared Files** | Toggles the document and file sharing panel |
| `Mod + 4` | **Codely AI** | Toggles the AI assistant sidebar |
| `Mod + /` | **Help & Shortcuts** | Displays the keyboard shortcuts cheat sheet |

---

## 🛡️ Privacy & Security Architecture

Privacy is engineered into Codely's foundational design:

1. **No Database Persistence:** Code is never stored to disk or a database. Rooms live exclusively in volatile RAM. When a room is closed or reaches inactivity, all associated memory is permanently freed.
2. **Client-Side Key Isolation (BYOK):** Custom API keys (OpenAI, Anthropic, Gemini) are stored strictly within the user's browser `sessionStorage`. They are never logged or stored on the server and are only passed as transient headers for authorized API calls.
3. **Prompt Injection Sanitization:** System prompts instruct AI models to treat workspace code strictly as passive analytical context, insulating the assistant against arbitrary injected instructions.
4. **Network & Payload Defense:** WebSocket message payloads are strictly limited to prevent buffer flooding, and execution commands run inside throttled sandbox boundaries.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, Vite 5, Monaco Editor, Lucide & Material Symbols
* **Collaboration & CRDTs:** Yjs, y-monaco, Socket.io Client
* **Backend:** Node.js, Express, Socket.io
* **Code Execution Engine:** Child Process Process Manager with stream buffering, timeout guards, and signal handlers
* **AI Engine:** Multi-provider streaming adapter (Google Gemini API, OpenAI API, Anthropic API)

---

## 🚦 Getting Started (Local Development)

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/your-org/codely.git
cd codely
```

### 2. Install dependencies
```bash
# Install root, client, and server dependencies
npm install
npm --prefix client install
npm --prefix server install
```

### 3. Configure environment variables
Create a `.env` file in the `server` directory (refer to `.env.example`):
```env
PORT=3001
CLIENT_URL=http://localhost:5173
# Optional: Default Google Gemini API key for free tier AI access
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run development servers
```bash
# Start backend server and Vite frontend concurrently
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📄 License & Proprietary Notice

**Copyright © 2026 Codely. All Rights Reserved.**

This software and associated documentation files are proprietary and confidential. Unauthorized copying, distribution, modification, public display, or reverse engineering of this software via any medium is strictly prohibited without explicit written permission from the copyright owners.

---

<div align="center">
  <sub>Engineered for seamless collaboration and developer velocity.</sub>
</div>
