<div align="center">
  <br />
  <h1>&lt;Codely /&gt;</h1>
  <p><b>The Instant Collaborative Code Editor & AI Workspace for Modern Engineering Teams</b></p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/version-2.4.0-blue.svg?style=flat-square" alt="Version 2.4.0" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Engine-Monaco%20Editor-3b82f6.svg?style=flat-square" alt="Engine: Monaco" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Sync-Yjs%20CRDTs-f97316.svg?style=flat-square" alt="Sync: Yjs CRDTs" /></a>
    <a href="#"><img src="https://img.shields.io/badge/AI-Gemini%20%7C%20GPT--4o%20%7C%20Claude%203.5-8b5cf6.svg?style=flat-square" alt="AI: Multi-Model" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Runtimes-23%2B%20Languages-10b981.svg?style=flat-square" alt="23+ Runtimes" /></a>
    <a href="#"><img src="https://img.shields.io/badge/License-Proprietary-ef4444.svg?style=flat-square" alt="License: Proprietary" /></a>
  </p>

  <p>
    Zero-install developer environment. Share a room link, collaborate in real-time with sub-millisecond CRDT sync,<br />
    execute code with an interactive streaming terminal, preview web layouts across responsive viewports,<br />
    and brainstorm with a context-aware AI partner that understands your workspace.<br />
    <b>No signup. No configuration. Pure flow state.</b>
  </p>
  <br />
</div>

---

## ⚡ What is Codely?

Traditional developer tools require accounts, environment setups, dependency installs, and subscription walls before writing or running a single line of code. **Codely eliminates the entire friction curve.**

In **under two seconds**, developers can launch a fully functional cloud IDE session featuring:
- **Multi-Tab File Management** with dynamic VS Code Seti & Devicon file icons
- **Sub-millisecond CRDT Multi-User Sync** with live colored collaborator cursors
- **Server-Backed Interactive Terminal** supporting `stdin`, `stdout`, `stderr`, and runtime interrupts
- **Sandboxed Live Web Preview** with responsive viewports (Desktop, Tablet, Mobile)
- **Deep Context-Aware AI Copilot** with tab drag-and-drop context attachment and one-click code diffing
- **Built-In Developer Documentation Portal (`/docs`)** with global `Ctrl+K` Deep Search

Whether conducting technical interviews, pair-programming remotely, troubleshooting algorithms with students, or prototyping full-stack ideas on the fly, Codely delivers a desktop-grade IDE experience straight into the browser.

---

## 🚀 Core Product Features

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CODELY WORKSPACE                                 │
├───────────────────────────────────────┬─────────────────────────────────────────┤
│          MONACO CODE EDITOR           │            CODELY AI (COPILOT)          │
│  • Multi-tab editing (23+ runtimes)   │  • Drag & drop tabs as prompt context   │
│  • Yjs Conflict-Free sync (CRDTs)     │  • Clipboard image & document paste     │
│  • Dynamic Seti & Devicon file icons  │  • One-click code diff & live patch     │
│  • 14 Curated Dark & Light themes     │  • Multi-provider (Gemini, GPT, Claude) │
├───────────────────────────────────────┴─────────────────────────────────────────┤
│                        UNIFIED SYSTEM PANEL (DOCKABLE)                          │
│   [ >_ Terminal ]   [ ! Problems ]   [ 🌐 Preview ]   [ 🖼 Images ]   [ 📁 Files ]│
│  • Bi-directional stdin/stdout stream    • Multi-device responsive switcher     │
│  • Clickable stack trace diagnostics     • Dual-axis & 2D corner sash resizing  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. 🔓 Zero-Friction Instant Workspaces
* **No Sign-Up Required**: Instant access with zero accounts, credit cards, or email verifications.
* **Instant URL Provisioning**: Navigate to any room path (e.g., `codely.app/room-id`) to instantly generate or join a shared session.
* **Ephemeral Architecture**: Sessions operate entirely in volatile in-memory state and automatically clean up after inactivity, keeping project data confidential.
* **Custom Identity**: Each collaborator receives a distinct cursor color and avatar badge that persists in local storage.

---

### 2. ⚡ Real-Time Collaborative Engine (Yjs CRDTs)
* **Conflict-Free Replicated Data Types**: Edits merge deterministically without merge conflicts or race conditions.
* **Live Remote Carets**: Real-time cursor tracking, text selections, and user labels.
* **Binary Compressed WebSockets**: State vectors and keystroke diffs transmit as compact binary chunks for minimum latency and bandwidth overhead.
* **Automatic Reconnection & Resync**: Seamlessly recalculates missing state vectors on network drops without losing edits.

---

### 3. 🎨 IDE-Grade Editor Tabs & Dynamic File Icons
* **Exact Seti / Modern IDE Icon System**:
  - `</>` in orange for HTML (`.html`, `.htm`) matching VS Code Seti style.
  - `#` in sky-blue for CSS and SCSS (`.css`, `.scss`).
  - `JS` in yellow for JavaScript (`.js`, `.mjs`, `.cjs`).
  - `⚛` in cyan for React JSX and TSX (`.jsx`, `.tsx`).
  - `TS` in blue for TypeScript (`.ts`).
  - Python snake logo for Python (`.py`).
  - `{ }` in amber for JSON (`.json`).
  - `M↓` in blue/slate for Markdown (`.md`).
  - Plus Rust, Go, Bash, SQL, Docker, C, C++, Java, and plaintext icons.
* **Real-Time Dynamic Icon Morphing**: Icons update in real time as you rename tabs (e.g. typing `App.jsx` immediately morphs the icon into the React atom).
* **Flicker-Free Close Buttons**: Crisp Unicode `✕` close controls with zero font-loading lag.

---

### 4. 💻 Interactive Execution Terminal
* **Multi-Language Runner**: Run Python, Node.js (JavaScript), TypeScript, C, C++, Java, Rust, Go, Bash, and more with process isolation.
* **Interactive Bi-Directional Streaming**: Full console supporting runtime user input (`stdin`), standard output (`stdout`), error streams (`stderr`), and keyboard interrupts (`Ctrl+C` / SIGINT).
* **Execution Telemetry**: Live execution duration timers, memory usage stats, and process exit status badges.
* **Quick Keyboard Trigger**: Execute any runnable file instantly with `Alt + Enter` (or `Ctrl + Enter`).

---

### 5. 🌐 Live Web Preview & Responsive Sandbox
* **Instant HTML/CSS/JS Sandbox**: Isolated client-side execution container with auto-refresh on save or tab switch.
* **Responsive Viewport Switcher**: Switch instantly between **Desktop (100%)**, **Tablet (768px frame)**, and **Mobile (375px frame)**.
* **Pop-Out Preview Mode**: Open the sandbox in an independent browser window for multi-monitor workflows.
* **Runtime Console Bridge**: Captures preview exceptions and `console.log` output directly into the workspace console.

---

### 6. 🧠 Context-Aware AI Copilot
* **Multi-Model Intelligence**: Built-in Google Gemini, plus BYOK (Bring Your Own Key) support for OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), and Gemini Pro.
* **Drag-and-Drop Tab Attachment**: Drag any file tab directly into the chat prompt to attach live code as analytical context.
* **Visual Attachment Parity**: Attached file chips in the AI prompt and message history display their matching file/language icons.
* **Clipboard (Ctrl+V) Image & File Ingestion**: Paste mockups, error screenshots, PDFs, or CSVs directly into the chat.
* **One-Click Code Application**: Apply AI-suggested code directly to the active tab or open it in a new editor tab with syntax detection.

---

### 7. 🗂️ Unified Dockable Panel & Multi-Axis Sashes
* **Dock Bottom or Right**: Toggle the unified panel between Bottom dock (ideal for terminal logs) and Right dock (ideal for web preview).
* **Dual-Axis & 2D Corner Drag Handles**: Adjust width and height simultaneously with smooth drag interactions.
* **One-Click Maximize / Restore**: Expand any panel to full workspace view with a single click or header double-click.

---

### 8. 📖 Premier Developer Documentation (`/docs`)
* **10 Exhaustive Reference Guides**: Comprehensive documentation covering Quickstart, Architecture, CRDT Sync, AI Copilot, Web Preview, Terminal Execution, Shortcuts, and 23+ Language Runtimes.
* **Command Palette Deep Search (`Ctrl+K` / `⌘+K`)**: Modal search indexing titles, descriptions, subtitles, TOC sections, and article bodies.
* **Google Antigravity-Style Announcement Bar**: Persistent, full-width announcement strip with dynamic sticky header height adaptation.
* **Interactive Code Frames**: Realistic Monaco editor illustration frames with dark and light theme fidelity.

---

## ⌨️ Productivity Keyboard Shortcuts

Codely features cross-platform shortcuts (`⌃ Control` on macOS, `Alt` on Windows & Linux):

| Shortcut (Win/Linux) | Shortcut (macOS) | Action | Description |
| :--- | :--- | :--- | :--- |
| `Alt + Enter` | `⌃ + Enter` | **Run Code** | Executes code in the interactive streaming terminal |
| `Alt + J` | `⌃ + J` | **Toggle Terminal** | Opens / closes the bottom Terminal panel |
| `Alt + N` | `⌃ + N` | **New Tab** | Creates a new editor file tab |
| `Alt + W` | `⌃ + W` | **Close Tab** | Closes the currently active tab |
| `Alt + Shift + W` | `⌃ + ⇧ + W` | **Close Other Tabs** | Closes all tabs except the active one |
| `Alt + E` | `⌃ + E` | **Rename Tab** | Initiates inline tab renaming |
| `Alt + D` | `⌃ + D` | **Toggle Dock** | Toggles panel dock between Bottom and Right |
| `Alt + M` | `⌃ + M` | **Maximize Panel** | Toggles maximize / restore on the active panel |
| `Alt + T` | `⌃ + T` | **Theme Selector** | Opens the 14-theme live picker modal |
| `Alt + 1` | `⌃ + 1` | **Room Users** | Toggles collaborator users drawer |
| `Alt + 2` | `⌃ + 2` | **Screenshots** | Toggles shared screenshots panel |
| `Alt + 3` | `⌃ + 3` | **Shared Files** | Toggles shared documents and files drawer |
| `Alt + 4` | `⌃ + 4` | **Codely AI** | Toggles AI assistant sidebar |
| `Alt + /` | `⌃ + /` | **Shortcuts** | Opens the keyboard shortcuts cheat sheet |
| `Ctrl + K` | `⌘ + K` | **Deep Search** | Opens Documentation Command Palette |

---

## 🛡️ Privacy & Security Architecture

1. **Zero Database Retention**: Code lives strictly in volatile memory. When a room closes or reaches inactivity, all memory is permanently wiped.
2. **Client-Side Key Isolation (BYOK)**: Custom AI API keys (OpenAI, Anthropic, Gemini) are stored strictly in client `sessionStorage` and are never persisted to a database or server logs.
3. **Sandbox Process Containment**: Terminal execution runs with timeout guards, buffer limits, and strict process termination.
4. **Binary Wire Compression**: Real-time collaboration operates via compact binary CRDT diffs, preventing raw code exposure in generic network logs.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite 5, Monaco Editor, Lucide & Devicon
* **Real-Time Collaboration**: Yjs (CRDTs), `y-monaco`, Socket.io Client
* **Backend**: Node.js, Express, Socket.io
* **Code Execution Engine**: Child Process streaming runner with buffered I/O and process guards
* **AI Engine**: Streaming adapter supporting Google Gemini, OpenAI (GPT-4o), and Anthropic (Claude 3.5 Sonnet)

---

## 🚦 Quickstart (Local Development)

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/your-username/codely.git
cd codely
```

### 2. Install dependencies
```bash
# Installs root, client, and server dependencies in one command
npm run install:all
```

### 3. Configure environment variables (optional)
Create a `.env` file in the `server` directory (optional):
```env
# Optional: Server port (defaults to 3001)
PORT=3001

# Optional: Default Google Gemini API key for built-in free tier AI assistant
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Custom Judge0 API endpoint for remote code execution (defaults to https://ce.judge0.com)
CODE_RUNNER_API_URL=https://ce.judge0.com
```

> **Note**: Users can also supply their own API keys (OpenAI, Anthropic Claude, or Google Gemini) directly in the web app under AI Settings via client-side BYOK.

### 4. Start development servers
```bash
# Starts the backend server (port 3001) and Vite frontend (port 5173) concurrently
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📄 License & Proprietary Notice

**Copyright © 2026 Codely. All Rights Reserved.**

This software and associated documentation files are proprietary and confidential. Unauthorized copying, distribution, modification, public display, or reverse engineering of this software via any medium is strictly prohibited without explicit written permission from the copyright owners.

---

<div align="center">
  <sub>Engineered for seamless collaboration, developer velocity, and pure flow state.</sub>
</div>
