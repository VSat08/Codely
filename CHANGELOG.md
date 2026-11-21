# Changelog

All notable changes to the **Codely** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.4.0] - 2026-11-21

### Added
- **Editor Tab Language & File Icons**:
  - Visual language/file icons rendered in editor tabs matching standard IDE conventions: orange `</>` for HTML (Seti style), cyan `⚛` React atom for JSX/TSX, yellow `JS` badge for JavaScript, blue `#` for CSS/SCSS, blue `TS` for TypeScript, Python snakes for `.py`, amber `{ }` for JSON, `M↓` for Markdown, and more.
  - Real-time dynamic icon morphing during tab renaming as you type file extensions.
  - Zero-latency, offline-ready SVG and Seti glyphs with crisp Unicode `✕` close buttons eliminating raw font ligature flash.
  - Synchronized landing page mockup tabs in `Home.jsx` with real editor tab icons.
- **AI Chat Attachment Icon Parity**:
  - Attached file chips in the AI Chat input now display matching brand and language icons (`app.jsx` → React atom, `Untitled-3.js` → JS badge, `main.html` → orange `</>`) instead of generic document outlines.
  - Chat message history badges updated to render matching file/language icons.
- **Full-Width Documentation Announcement Bar (Google Antigravity Style)**:
  - Full-width announcement strip directly beneath the category subnav (`Start Here`, `Features`, `Reference`) with `✦ NEW` pill, direct guide link, and persistent `✕` dismissal.
  - Dynamic sticky header height system (`--docs-header-height`: 142px with banner, 104px dismissed) with seamless sidebar, TOC, and smooth-scroll anchor positioning.
- **Premier Documentation Portal (`/docs` & `/docs/:slug`)**:
  - 10 comprehensive reference guides covering Overview, Quickstart, Architecture & Privacy, Real-Time Sync, AI Assistant, Web Preview, Terminal, File & Media Sharing, Keyboard Shortcuts, and Supported Languages (23+ runtimes).
  - Global Deep Search Command Palette (`Ctrl+K` / `⌘+K`) indexing titles, descriptions, subtitles, TOC sections, and article bodies with arrow-key keyboard navigation.
  - Dynamic scroll-spy Table of Contents ("On this page") tracking active sections with offset-aware smooth scrolling (`scroll-margin-top: calc(var(--docs-header-height) + 26px)`).
  - Stacked keyboard runner shortcut layout (`Alt + Enter` / *or* / `Ctrl + Enter`) with clean cross-platform modifier mapping.
- **Full Theme Parity**:
  - Full high-contrast VS Dark (`#0e0e10`) and VS Light (`#ffffff`) theme support across all documentation pages, navigation bars, search palettes, and tables.
  - Interactive Theme-Adaptive Code Illustration frame featuring authentic Monaco dark and light editor chrome with syntax highlighting.
  - High-contrast devicon color overrides in dark mode for monochromatic brand logos (GNU Bash, Rust, Markdown).
- **Responsive Mobile & Tablet Layout**:
  - Slide-over navigation drawer with backdrop blur and animated hamburger toggle.
  - Dedicated mobile search trigger button (`.mobile-search-btn`) in the top navigation.
  - Responsive header controls featuring compact "Launch" button and balanced spacing.

### Fixed
- Fixed AI Chat attached file chips rendering generic document outlines instead of matching tab file/language icons.
- Fixed editor tab close buttons temporarily displaying raw ligature text `"close"` prior to icon font loading.
- Fixed code block contrast failure in light mode where text inherited dark slate on navy background.
- Fixed code preview heading text wrapping on narrow mobile screens.
- Fixed header button collision and crowding on mobile viewports between 481px and 768px.
- Fixed search placeholder wrapping awkwardly to two lines on tablet screens (~820px).
- Fixed routing to automatically redirect unknown or broken documentation slugs to `/docs/overview`.

---

## [2.3.0] - 2026-11-20

### Added
- **Unified Dockable Panel System**:
  - Dock Terminal, Problems, Preview, Images, and Files to the **Bottom** or **Right** workspace areas.
  - Dual-axis sash dragging and 2D corner drag handles for simultaneous multi-axis resizing.
  - Double-click header toggle to maximize/restore panel height and width.
- **Sandboxed Live Web Preview**:
  - Live HTML/CSS/JS sandbox execution with debounced auto-reload (400ms).
  - Responsive device switcher: Desktop, Tablet (768px frame), and Mobile (375px frame).
  - Standalone pop-out preview window for dual-monitor workflows.

---

## [2.2.0] - 2026-11-19

### Added
- **Interactive Multi-Language Execution Terminal**:
  - Live script runner supporting Python, Node.js, TypeScript, C, C++, Java, Rust, Go, and Bash.
  - True bidirectional streaming `stdin`, `stdout`, and `stderr` over WebSockets.
  - Keyboard execution interrupt (`Ctrl+C` / SIGINT) and clear console controls.
  - Execution duration timer, memory usage display, and exit code indicators.
- **Automated Problems & Compiler Diagnostic Parser**:
  - Real-time compiler stack trace parser for GCC, Clang, Rustc, Python, and Node.js.
  - One-click navigation jumping directly from diagnostic error lines to file, row, and column in Monaco.

---

## [2.1.0] - 2026-11-18

### Added
- **Context-Aware AI Copilot**:
  - Multi-model integration supporting Google Gemini Free tier, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, and Gemini 1.5 Pro via Bring-Your-Own-Key (BYOK).
  - Drag-and-drop Monaco tab pill directly into the AI prompt to supply file contents as prompt context.
  - Clipboard (`Ctrl+V`) image and screenshot pasting directly into chat context.
  - One-click code diff insertion: "Apply to active file" or "Insert into new tab".
  - Private vs. Shared room-wide AI conversation modes.

---

## [2.0.0] - 2026-11-16

### Added
- **Multi-File Workspace Architecture**:
  - Multi-tab file system with inline rename, extension icons, and tab close buttons.
  - Instant workspace packaging and `.zip` archive export.
  - Line-range code extraction and sharing modal.
- **Media & Document Sharing**:
  - Shared screenshots panel with fullscreen Lightbox zoom.
  - In-session document sharing for PDFs, CSVs, and text files.

---

## [1.0.0] - 2026-11-10

### Added
- **Initial Public Release of Codely**:
  - High-performance Monaco code editor integration with 23+ syntax grammars.
  - Conflict-free real-time collaborative editing powered by Yjs CRDTs over binary WebSockets.
  - Remote multi-user cursor tracking, text selections, and collaborator presence tags.
  - Ephemeral zero-login instant room generation with custom room code support.
  - 14 handcrafted editor themes spanning Dark, Light, and High Contrast palettes.

