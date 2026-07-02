<div align="center">
  <img src="https://raw.githubusercontent.com/microsoft/monaco-editor/main/website/favicon.ico" width="80" alt="Codely Logo" />
  <h1>Codely</h1>
  <p><b>The Instant Collaborative Code Editor with Built-in AI</b></p>
  
  <p>
    <a href="#"><img src="https://img.shields.io/badge/Status-Active-brightgreen.svg?style=flat-square" alt="Status"></a>
    <a href="#"><img src="https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square" alt="License"></a>
  </p>

  <p>
    Instantly share code, brainstorm with AI, and collaborate in real-time.<br/>
    <b>No login, no setup, pure flow state.</b>
  </p>
</div>

---

## ⚡ What is Codely?

Traditional SaaS tools force users through registration walls, email verification, and plan selection before writing a single line of code. **Codely eliminates all of that.**

Get coding collaboratively in **under 2 seconds**. Open a link, start typing, and everyone sees your code instantly. 

Built for developers who value **speed, privacy, and simplicity**, Codely combines the power of a professional IDE with the ease of a shareable link — plus an AI coding assistant that understands your workspace automatically.

---

## 🚀 Comprehensive Feature Set

### 1. 🔓 Zero-Friction Access
Most collaborative coding tools force users through registration walls. Codely eliminates that entirely.
- **No account required:** Never forced to sign up.
- **No tracking:** Complete anonymity by design.
- **One-click workspaces:** Generate a URL, share it, and collaborators join instantly.
- **Custom Identity:** Users get a random identity (`user-xxxx`) that they can rename at any time (persisted locally).

### 2. ⚡ Flawless Real-Time Sync (Yjs CRDTs)
Codely uses the same underlying CRDT technology as Figma to deliver bulletproof real-time collaboration.
- **Conflict-Free Editing:** Multiple users can type on the exact same line simultaneously without data loss.
- **Chunked Binary Transport:** Large documents are split into chunks for ultra-reliable delivery over WebSockets.
- **Batched Network Traffic:** Rapid keystrokes are coalesced within a 50ms window to prevent network flooding.
- **Automatic Resync:** If a user loses connection, Codely computes a state-vector diff on reconnect and flawlessly merges missed edits in both directions.

### 3. 🧠 Context-Aware AI Coding Assistant
Codely ships with a full AI coding assistant built directly into the editor interface.
- **Free Tier Available:** Integrated Google Gemini support with fair per-user rate limiting.
- **BYOK (Bring Your Own Key):** Power users can supply their own keys for **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, or **Gemini Pro**.
- **Context-Aware:** The AI automatically sees your active code tab.
- **Attach Multiple Files:** Select any combination of open tabs to include as context.
- **Multimodal Uploads:** Drag & drop images, PDFs, and documents directly into the chat for visual or text analysis.
- **Shared vs Private Modes:** Choose whether to broadcast your AI brainstorming to the entire room, or keep the conversation strictly private.
- **Streaming Responses:** AI responses stream in word-by-word with full rich Markdown formatting and one-click code copying.

### 4. 📝 Monaco Editor Engine
Built on the same rendering engine that powers Visual Studio Code.
- **23+ Languages:** Full syntax highlighting for JS, TS, Python, Java, C++, Rust, Go, HTML, CSS, SQL, Markdown, and more.
- **Premium Typography:** Ships with JetBrains Mono and font ligatures.
- **Smooth Animations:** Smooth scrolling and smooth cursor animation enabled by default.
- **Intelligent Layout:** Automatic word wrap and responsive layout reflows.

### 5. 🎨 14 Premium Editor Themes
Switch between carefully curated and handcrafted editor themes:
- **Dark Themes:** VS Dark, GitHub Dark, Dracula, Nord, Night Owl, One Dark Pro, Monokai, SynthWave '84, Solarized Dark.
- **Light Themes:** VS Light, GitHub Light, Solarized Light.
- **High Contrast:** High Contrast Dark, High Contrast Light.
- Each theme includes custom token coloring for keywords, strings, comments, and types.

### 6. 📁 Multi-Tab Workspace
Codely isn't a single-file editor; it's a full multi-tab IDE environment.
- **Unlimited Tabs:** Create, rename, and delete tabs freely.
- **Independent CRDTs:** Every tab has its own independent CRDT document, meaning collaborators can work in completely different files simultaneously.
- **Auto-Detection:** Renaming a file automatically detects and switches the syntax highlighting based on the extension.

### 7. 🖼️ Rich Media & File Sharing
Go beyond code by sharing visual context directly in your workspace.
- **Drag & Drop Uploads:** Drop screenshots or documents directly into the UI.
- **Clipboard Paste:** Native support for `Ctrl/Cmd + V` screenshot pasting.
- **Image Lightbox:** Click any image for a fullscreen preview.
- **40+ File Types:** Support for PDFs, CSVs, YAML, ENV, and DOCX files.
- **Easy Download:** One-click download for any shared asset.

### 8. 📥 Export & Line Extraction
- **ZIP Export:** Download your entire workspace (all tabs) packaged perfectly into a `.zip` file.
- **File Download:** Download the current active tab with its proper extension.
- **Line Range Modal:** Select a precise range of lines to extract and copy without losing formatting.

### 9. 👥 Live User Presence
- **Avatars & Colors:** Every user in the room gets a unique cursor color and name.
- **Live Cursors:** See exactly where other developers are typing, selecting, and navigating in real-time.
- **Hover Flags:** Hovering over a remote cursor reveals the collaborator's name pill.

### 10. 🏠 Ephemeral Room Management
- **Custom URLs:** Create memorable URLs like `codely.app/my-interview-room`.
- **Auto-Join:** Navigating to an uncreated URL automatically provisions a new room.
- **Ephemeral Storage:** Rooms are completely in-memory. After 30 days of inactivity, they are automatically purged. 

### 11. ⌨️ Pro-Level Keyboard Shortcuts
Codely is designed for power users with comprehensive, cross-platform shortcuts (`Cmd` on Mac, `Ctrl` on Windows/Linux).
- `Mod + N`: New Tab
- `Mod + W`: Close Tab
- `Mod + E`: Rename Tab
- `Mod + T`: Theme Picker
- `Mod + 1-4`: Toggle Sidebars (Users, Images, Files, AI)
- `Mod + Shift + W`: Close Other Tabs
- `Mod + /`: Show Shortcuts Modal

### 12. 📱 Mobile-First Design
- **Bottom Action Bar:** Quick access to files, images, and chat on mobile devices.
- **Swipe Gestures:** Swipe-to-dismiss support for panels.
- **Adaptive Padding:** The editor automatically resizes to accommodate mobile on-screen keyboards.

---

## 🏗️ Technical Architecture

Codely is engineered for extreme low latency and strict privacy. **No user code is ever persisted to a database.**

### Core Tech Stack
- **Frontend:** React 18, Vite 5
- **Real-time Engine:** Yjs (CRDTs), y-monaco
- **Transport:** Socket.io (WebSockets)
- **Backend:** Node.js, Express.js
- **AI Infrastructure:** Server-side proxy routing to Gemini, OpenAI, and Anthropic APIs.

### How it works under the hood
```text
┌─────────────────────┐         WebSocket          ┌────────────────────┐
│                     │ ◄─── Socket.io ────────► │                    │
│   React + Vite      │    (Yjs updates,           │  Express + Node    │
│   (Browser)         │     AI chat,               │  (Server)          │
│                     │     room events)           │                    │
│   Monaco Editor     │                            │  Yjs Server Docs   │
│   Yjs Client Docs   │                            │  Gemini API Proxy  │
│   AI Chat Panel     │                            │  Rate Limiter      │
└─────────────────────┘                            └────────────────────┘
```

---

## 🔒 Security & Privacy Model

Privacy isn't an afterthought—it is the core architectural pillar.

* **No Database:** We don't want your code. All room data lives exclusively in RAM and is permanently destroyed upon server restart or inactivity.
* **API Key Safety:** BYOK API keys are strictly maintained in browser `sessionStorage` (cleared on tab close) and act only as pass-through headers via the server.
* **Prompt Injection Defense:** System prompts explicitly instruct the AI to isolate and ignore malicious instructions embedded in user code.
* **Strict Payload Limits:** Hard limits on WebSocket buffer sizes (10MB), image sizes (2MB), and message lengths prevent abuse and DDoS.

---

## 🎯 Target Audience
- **Engineering Teams:** Fast brainstorming and pair programming sessions.
- **Interviewers:** Live coding technical assessments with zero onboarding friction.
- **Students & Educators:** Study groups and live code demonstrations.
- **Freelancers:** Instantly sharing architectural changes with clients in real-time.

---

## 📄 License & Copyright

**© 2026 Codely. All Rights Reserved.**

This project is proprietary software and original innovation. It is **not** open-source. 
Unauthorized copying, cloning, distribution, modification, or commercial use of this codebase is strictly prohibited.

---
<div align="center">
  <i>Built for developers, by developers.</i><br/>
  <b>Code at the speed of thought.</b>
</div>
