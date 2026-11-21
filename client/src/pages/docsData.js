export const DOCS_SECTIONS = [
  {
    category: 'START HERE',
    items: [
      {
        slug: 'overview',
        title: 'Overview',
        icon: 'explore',
        description: 'Introduction to Codely, core architectural principles, and collaboration features.',
      },
      {
        slug: 'quickstart',
        title: 'Quickstart',
        icon: 'bolt',
        description: 'Spin up your first room in seconds with zero accounts and zero configuration.',
      },
      {
        slug: 'architecture',
        title: 'Architecture & Privacy',
        icon: 'security',
        description: 'How Codely guarantees ephemeral security, end-to-end CRDT sync, and privacy.',
      },
    ],
  },
  {
    category: 'CORE FEATURES',
    items: [
      {
        slug: 'crdt-sync',
        title: 'Real-Time Sync',
        icon: 'sync_alt',
        description: 'Conflict-free Yjs replication, multi-cursor awareness, and real-time selections.',
      },
      {
        slug: 'ai-chat',
        title: 'AI Assistant',
        icon: 'robot_2',
        description: 'Pair program with Claude, OpenAI, and Gemini with instant codebase context and vision.',
      },
      {
        slug: 'web-preview',
        title: 'Web Preview',
        icon: 'devices',
        description: 'Real-time HTML/CSS/JS preview, Desktop/Tablet/Mobile viewports, and live auto-reload.',
      },
      {
        slug: 'terminal-problems',
        title: 'Terminal',
        icon: 'terminal',
        description: 'Browser-based script runner, execution logs, and live Monaco linter diagnostics.',
      },
      {
        slug: 'file-sharing',
        title: 'File & Media Sharing',
        icon: 'attach_file',
        description: 'Multi-tab workspace, image lightbox preview, and passing attachments to AI.',
      },
    ],
  },
  {
    category: 'REFERENCE',
    items: [
      {
        slug: 'shortcuts',
        title: 'Keyboard Shortcuts',
        icon: 'keyboard',
        description: 'Speed up pairing with power-user hotkeys and gesture shortcuts.',
      },
      {
        slug: 'languages',
        title: 'Supported Languages',
        icon: 'code',
        description: 'Comprehensive list of 23+ syntax-highlighted languages and Monaco capabilities.',
      },
    ],
  },
];

export const DOCS_CONTENT = {
  overview: {
    title: 'Overview of Codely',
    subtitle: 'The browser-native collaborative IDE engineered for pair programming, interviews, and real-time debugging.',
    category: 'Start Here',
    updatedAt: 'November 2026',
    toc: [
      { id: 'what-is-codely', label: 'What is Codely?' },
      { id: 'core-surfaces', label: 'Core Workspace Surfaces' },
      { id: 'key-pillars', label: 'Key Pillars' },
      { id: 'next-steps', label: 'Next Steps' },
    ],
    content: `
      <section id="what-is-codely">
        <h2>What is Codely?</h2>
        <p>
          <strong>Codely</strong> is a high-performance, real-time collaborative coding workspace designed to eliminate all friction from remote pair programming, technical interviews, and education.
        </p>
        <p>
          Traditional pairing tools force developers into awkward screen shares with high latency, blurry text, and frustrating "pass-the-wheel" controls. Codely transforms this into a fluid, simultaneous multiplayer experience powered by <strong>Yjs CRDTs (Conflict-free Replicated Data Types)</strong> and the full power of Microsoft's <strong>Monaco Editor</strong> (the engine behind VS Code).
        </p>
      </section>

      <section id="core-surfaces">
        <h2>Core Workspace Surfaces</h2>
        <div class="docs-card-grid">
          <a href="/docs/crdt-sync" class="docs-surface-card">
            <div class="surface-card-header">
              <span class="surface-badge">Workspace</span>
              <span class="surface-icon material-symbols-outlined">sync_alt</span>
            </div>
            <h3>Monaco Multiplayer Editor</h3>
            <p>Full VS Code editing experience with 23+ language grammars, autocomplete, multi-tab file system, and colored live cursors.</p>
            <div class="surface-card-footer">
              <span>Read guide</span>
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </a>
          <a href="/docs/ai-chat" class="docs-surface-card">
            <div class="surface-card-header">
              <span class="surface-badge">Intelligence</span>
              <span class="surface-icon material-symbols-outlined">robot_2</span>
            </div>
            <h3>AI Assistant</h3>
            <p>Seamlessly toggle between Claude 3.5, GPT-4o, and Gemini 1.5 Pro with automatic multi-file and image context injection.</p>
            <div class="surface-card-footer">
              <span>Read guide</span>
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </a>
          <a href="/docs/web-preview" class="docs-surface-card">
            <div class="surface-card-header">
              <span class="surface-badge">Runtime</span>
              <span class="surface-icon material-symbols-outlined">devices</span>
            </div>
            <h3>Web Preview</h3>
            <p>Interactive HTML/CSS/JS preview featuring live debounced reload, Desktop/Tablet/Mobile viewports, and multi-dock layout.</p>
            <div class="surface-card-footer">
              <span>Read guide</span>
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </a>
          <a href="/docs/terminal-problems" class="docs-surface-card">
            <div class="surface-card-header">
              <span class="surface-badge">Diagnostics</span>
              <span class="surface-icon material-symbols-outlined">terminal</span>
            </div>
            <h3>Terminal</h3>
            <p>Instant script execution output and real-time Monaco diagnostics to catch syntax bugs before you test.</p>
            <div class="surface-card-footer">
              <span>Read guide</span>
              <span class="material-symbols-outlined">arrow_forward</span>
            </div>
          </a>
        </div>

        <div class="docs-preview-frame">
          <div class="docs-frame-header">
            <div class="docs-frame-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="docs-frame-title">codely.dev/session · Multiplayer Room</div>
            <div class="docs-frame-badge"><span class="pulse-indicator"></span> Live Yjs CRDT</div>
          </div>
          <div class="docs-frame-content">
            <div class="docs-frame-mock-tabs">
              <span class="docs-mock-tab active">index.html</span>
              <span class="docs-mock-tab">styles.css</span>
              <span class="docs-mock-tab">app.js</span>
            </div>
            <div class="docs-frame-code-body">
              <div class="code-line"><span class="c-kw">&lt;div</span> <span class="c-attr">class=</span><span class="c-str">"hero-canvas"</span><span class="c-kw">&gt;</span></div>
              <div class="code-line indent"><span class="c-kw">&lt;h1&gt;</span>Welcome to Codely<span class="c-kw">&lt;/h1&gt;</span> <span class="mock-cursor-tag alex">Alex</span></div>
              <div class="code-line indent"><span class="c-kw">&lt;p&gt;</span>Zero latency, instant multiplayer pairing.<span class="c-kw">&lt;/p&gt;</span> <span class="mock-cursor-tag sarah">Sarah</span></div>
              <div class="code-line"><span class="c-kw">&lt;/div&gt;</span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="key-pillars">
        <h2>Key Pillars</h2>
        <ul class="docs-feature-list">
          <li><strong>Zero Accounts Needed:</strong> Create or join a room with one click. No logins, passwords, or credit cards required.</li>
          <li><strong>Sub-50ms Synchronization:</strong> Keystroke streaming and cursor awareness synced over optimized binary WebSockets.</li>
          <li><strong>Ephemeral & Private:</strong> Sessions exist only while active in memory. No long-term storage or tracking.</li>
          <li><strong>Modern Developer Ergonomics:</strong> Full keyboard shortcuts, tab double-click creation, and customizable developer themes.</li>
        </ul>
      </section>

      <section id="next-steps">
        <h2>Next Steps</h2>
        <p>Ready to try it out? Follow our quickstart guide to create your first session in under 5 seconds.</p>
      </section>
    `,
  },

  quickstart: {
    title: 'Quickstart Guide',
    subtitle: 'Get up and running with a collaborative Codely room in seconds.',
    category: 'Start Here',
    updatedAt: 'November 2026',
    toc: [
      { id: 'create-room', label: '1. Create a Workspace' },
      { id: 'share-link', label: '2. Invite Collaborators' },
      { id: 'start-coding', label: '3. Start Coding Together' },
      { id: 'custom-rooms', label: 'Custom Room Codes' },
    ],
    content: `
      <section id="create-room">
        <h2>1. Create a Workspace</h2>
        <p>Navigate to the Codely landing page and click <strong>Start Workspace</strong>. You can optionally pick a primary language (JavaScript, Python, HTML/CSS, TypeScript, etc.) from the dropdown.</p>
        <div class="docs-callout tip">
          <span class="callout-icon material-symbols-outlined">lightbulb</span>
          <div class="callout-content">
            <strong>Pro Tip:</strong> You are not locked into one language! You can open multiple files in different languages simultaneously using tabs.
          </div>
        </div>
      </section>

      <section id="share-link">
        <h2>2. Invite Collaborators</h2>
        <p>Once inside your workspace, copy the room URL directly from your browser's address bar or click the <strong>Room Code</strong> button in the top left toolbar.</p>
        <p>Send the link or the 6-character room code to anyone. When they open the link, they immediately drop into the exact same code canvas with their own colored cursor and initials avatar.</p>
      </section>

      <section id="start-coding">
        <h2>3. Start Coding Together</h2>
        <p>Every keystroke, selection, and scroll position is synced with zero latency. You can:</p>
        <ul>
          <li>Type concurrently in the same document without overwriting each other.</li>
          <li>Open new tabs by double-clicking the empty space in the tab bar or pressing <kbd>Alt</kbd> + <kbd>N</kbd>.</li>
          <li>Open the bottom panel to run HTML previews or inspect terminal outputs.</li>
          <li>Chat with the AI assistant by clicking the robot icon in the top toolbar.</li>
        </ul>
      </section>

      <section id="custom-rooms">
        <h2>Custom Room Codes</h2>
        <p>Need a memorable link for a team meeting or interview? Expand <em>Configure workspace settings</em> on the home page and specify a custom room code like <code>team-daily-sync</code> or <code>interview-candidate-a</code>.</p>
      </section>
    `,
  },

  architecture: {
    title: 'Architecture & Privacy',
    subtitle: 'Deep dive into Codely’s conflict-free state engine, memory models, and ephemeral privacy guarantee.',
    category: 'Start Here',
    updatedAt: 'November 2026',
    toc: [
      { id: 'crdt-model', label: 'CRDT Consensus Engine' },
      { id: 'ephemeral-storage', label: 'Ephemeral Lifecycle' },
      { id: 'security-privacy', label: 'Security & Telemetry' },
    ],
    content: `
      <section id="crdt-model">
        <h2>CRDT Consensus Engine</h2>
        <p>
          Codely uses <strong>Yjs</strong>, a high-performance CRDT framework that models document text as a distributed sequence. 
          Unlike Operational Transformation (OT) systems used by Google Docs which require a centralized authority to transform indices, 
          Yjs operations are commutative and mathematically converge to identical state regardless of network reordering or packet delay.
        </p>
        <pre><code class="language-text">Client A (Keystroke) ──▶ Y.Doc Update (Uint8Array) ──▶ WebSocket Relay
Client B (Keystroke) ──▶ Y.Doc Update (Uint8Array) ──▶ WebSocket Relay
                              │
                    Deterministic Convergence (0 merge conflicts)</code></pre>
      </section>

      <section id="ephemeral-storage">
        <h2>Ephemeral Lifecycle</h2>
        <p>
          Codely believes that collaboration should leave zero unwanted footprints. Workspaces are kept strictly in-memory during active sessions. 
          When all collaborators leave a room, the room data and Yjs documents are discarded from memory.
        </p>
        <div class="docs-callout note">
          <span class="callout-icon material-symbols-outlined">shield</span>
          <div class="callout-content">
            <strong>Zero Long-Term Storage:</strong> No databases store your code snippets, room histories, or chat logs. Download or copy your files before ending your pairing session.
          </div>
        </div>
      </section>

      <section id="security-privacy">
        <h2>Security & Telemetry</h2>
        <ul>
          <li><strong>No User Accounts:</strong> We don't store emails, hashes, passwords, or personal identity profiles.</li>
          <li><strong>Client-Side AI Keys:</strong> When using custom AI providers, API keys remain stored in your local browser storage or server environment session without persistent logging.</li>
          <li><strong>Encrypted Transport:</strong> All WebSocket and HTTP traffic is strictly encrypted over TLS/WSS.</li>
        </ul>
      </section>
    `,
  },

  'crdt-sync': {
    title: 'Real-Time Sync',
    subtitle: 'How Yjs conflict-free replication powers effortless multiplayer coding.',
    category: 'Core Features',
    updatedAt: 'November 2026',
    toc: [
      { id: 'how-it-works', label: 'How Yjs Powers Codely' },
      { id: 'awareness', label: 'Presence & Awareness Protocol' },
      { id: 'multi-file-crdt', label: 'Per-File CRDT Instances' },
    ],
    content: `
      <section id="how-it-works">
        <h2>How Yjs Powers Codely</h2>
        <p>
          Every file in your Codely workspace is governed by its own independent <code>Y.Doc</code> instance. 
          When you type in the Monaco Editor, our custom Monaco-Yjs binding converts Monaco model changes into compact binary Yjs updates.
        </p>
        <p>
          These updates are transmitted over low-overhead WebSockets and applied using <code>Y.applyUpdate(doc, update)</code>. 
          Because Yjs operations are mathematically monotonic, merge conflicts are physically impossible.
        </p>
      </section>

      <section id="awareness">
        <h2>Presence & Awareness Protocol</h2>
        <p>
          In addition to text synchronization, Codely implements the Yjs Awareness protocol to stream ephemeral presence metadata:
        </p>
        <ul>
          <li><strong>Cursor Coordinates:</strong> Line and column positions rendered with colored markers.</li>
          <li><strong>Text Selections:</strong> Live highlighting showing exactly what region peers are reviewing.</li>
          <li><strong>User Profiles:</strong> Initials, chosen name, and distinct color badges.</li>
        </ul>
      </section>

      <section id="multi-file-crdt">
        <h2>Per-File CRDT Instances</h2>
        <p>
          Each tab maintains an isolated CRDT tree. This ensures that editing <code>App.jsx</code> will never interfere with another peer concurrently editing <code>styles.css</code>, keeping network payloads tiny and execution lightning fast.
        </p>
      </section>
    `,
  },

  'ai-chat': {
    title: 'AI Assistant',
    subtitle: 'In-workspace intelligence with multi-model switching, codebase awareness, and vision support.',
    category: 'Core Features',
    updatedAt: 'November 2026',
    toc: [
      { id: 'model-switching', label: 'Supported Models' },
      { id: 'context-injection', label: 'Context Injection' },
      { id: 'drag-and-drop', label: 'Tab Dragging & Screenshots' },
    ],
    content: `
      <section id="model-switching">
        <h2>Supported Models</h2>
        <p>Codely provides seamless toggling between industry-leading frontier models without leaving your session:</p>
        <ul>
          <li><strong>Anthropic Claude 3.5 Sonnet:</strong> Renowned for deep reasoning, code generation, and nuanced refactoring.</li>
          <li><strong>OpenAI GPT-4o:</strong> High-speed reasoning with broad tool and algorithmic strengths.</li>
          <li><strong>Google Gemini 1.5 Pro:</strong> Massive context window and excellent multimodal analysis.</li>
        </ul>
      </section>

      <section id="context-injection">
        <h2>Context Injection</h2>
        <p>
          Unlike external AI chatbots where you constantly copy-paste files, Codely's assistant automatically sees your open files, 
          active line selections, and project structure. When you ask <em>"Why is this returning undefined?"</em>, 
          the assistant already has the exact function context in its prompt.
        </p>
      </section>

      <section id="drag-and-drop">
        <h2>Tab Dragging & Screenshots</h2>
        <p>
          Want to pass specific files to the AI? Simply drag any tab header from the top bar directly into the AI Chat panel to attach it as focused context. 
          You can also paste screenshots or UI mockups directly to debug styling or visual glitches.
        </p>
      </section>
    `,
  },

  'web-preview': {
    title: 'Web Preview',
    subtitle: 'Instant HTML, CSS, and JS execution with responsive viewports and live auto-reload.',
    category: 'Core Features',
    updatedAt: 'November 2026',
    toc: [
      { id: 'live-reload', label: 'Live Auto-Reload' },
      { id: 'viewports', label: 'Responsive Viewports' },
      { id: 'dock-options', label: 'Docking & Pop-Out Modes' },
    ],
    content: `
      <section id="live-reload">
        <h2>Live Auto-Reload</h2>
        <p>
          When viewing an HTML file, the <strong>Preview</strong> tab in the bottom unified drawer compiles your HTML, CSS, and JavaScript into a sandboxed iframe.
        </p>
        <p>
          As you or your peers edit code, the preview automatically refreshes after a debounced 400ms pause, giving you instant visual feedback like CodePen or VS Code Live Server.
        </p>
      </section>

      <section id="viewports">
        <h2>Responsive Viewports</h2>
        <p>Test responsive designs on the fly using the built-in device switcher in the preview toolbar:</p>
        <ul>
          <li><strong>Desktop Mode:</strong> Full-width responsive canvas.</li>
          <li><strong>Tablet Mode:</strong> Clean 768px tablet frame centered on an eye-comfortable backdrop canvas.</li>
          <li><strong>Mobile Mode:</strong> 375px mobile device viewport for phone testing.</li>
        </ul>
      </section>

      <section id="dock-options">
        <h2>Docking & Pop-Out Modes</h2>
        <p>
          Click the dock button or press <kbd>Alt</kbd> + <kbd>D</kbd> to toggle the preview between a bottom drawer and a vertical split on the right. 
          You can also pop out the preview into a dedicated browser window for dual-monitor setups.
        </p>
      </section>
    `,
  },

  'terminal-problems': {
    title: 'Terminal',
    subtitle: 'In-browser script execution, logging, and real-time Monaco diagnostics.',
    category: 'Core Features',
    updatedAt: 'November 2026',
    toc: [
      { id: 'code-execution', label: 'Interactive Code Execution' },
      { id: 'problems-tab', label: 'Problems & Lint Diagnostics' },
      { id: 'supported-runtimes', label: 'Supported Runtimes' },
    ],
    content: `
      <section id="code-execution">
        <h2>Interactive Code Execution</h2>
        <p>
          Click the <strong>Run</strong> button in the top toolbar or press <kbd>Alt</kbd> + <kbd>Enter</kbd> to execute your active script. 
          Standard output, errors, and return values stream directly to the integrated Terminal panel in real time.
        </p>
      </section>

      <section id="problems-tab">
        <h2>Problems & Lint Diagnostics</h2>
        <p>
          The <strong>Problems</strong> inspector aggregates all linter warnings, syntax errors, and bracket mismatches across all open tabs. 
          Clicking any problem row immediately navigates your cursor to the exact line and column in the editor.
        </p>
      </section>

      <section id="supported-runtimes">
        <h2>Supported Runtimes</h2>
        <p>
          Supports direct execution for JavaScript, TypeScript, Python, HTML/CSS, and standard algorithmic scripts.
        </p>
      </section>
    `,
  },

  'file-sharing': {
    title: 'File & Media Sharing',
    subtitle: 'Share images, logs, configs, and assets directly within your pairing room.',
    category: 'Core Features',
    updatedAt: 'November 2026',
    toc: [
      { id: 'multi-tab', label: 'Multi-Tab File System' },
      { id: 'image-lightbox', label: 'Image Lightbox Preview' },
      { id: 'file-assets', label: 'File Assets Drawer' },
    ],
    content: `
      <section id="multi-tab">
        <h2>Multi-Tab File System</h2>
        <p>
          Codely supports simultaneous multi-file workspaces. Organize full projects across HTML, CSS, JavaScript, and documentation files with instant sync across all tabs.
        </p>
      </section>

      <section id="image-lightbox">
        <h2>Image Lightbox Preview</h2>
        <p>
          Drag screenshots, wireframes, or reference UI designs into the Files panel. Click any shared image to open a high-resolution lightbox with zoom and inspect controls.
        </p>
      </section>

      <section id="file-assets">
        <h2>File Assets Drawer</h2>
        <p>
          Shared files remain accessible to all collaborators in the room. Drag any asset directly into the AI assistant to query its contents or generate accompanying code.
        </p>
      </section>
    `,
  },

  shortcuts: {
    title: 'Keyboard Shortcuts Cheat Sheet',
    subtitle: 'Boost your workflow speed with Codely hotkeys, layout toggles, and gesture shortcuts.',
    category: 'Reference',
    updatedAt: 'November 2026',
    toc: [
      { id: 'code-execution', label: 'Code Execution & Runner' },
      { id: 'tabs-workspace', label: 'Tabs & Workspace Hotkeys' },
      { id: 'panels-layout', label: 'Panels & Layout Hotkeys' },
      { id: 'editor-navigation', label: 'Editor & Navigation Hotkeys' },
      { id: 'mouse-gestures', label: 'Mouse & Trackpad Gestures' },
      { id: 'platform-note', label: 'Cross-Platform Modifiers' },
    ],
    content: `
      <section id="code-execution">
        <h2>Code Execution & Runner</h2>
        <p>Trigger code compilation, script execution, or preview refresh with zero mouse movement:</p>
        <div class="docs-table-wrapper">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Windows / Linux</th>
                <th>macOS</th>
                <th>Action</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="kbd-stack">
                    <span class="kbd-combo"><kbd>Alt</kbd> + <kbd>Enter</kbd></span>
                    <span class="kbd-or">or</span>
                    <span class="kbd-combo"><kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>
                  </div>
                </td>
                <td>
                  <div class="kbd-stack">
                    <span class="kbd-combo"><kbd>⌘</kbd> + <kbd>Enter</kbd></span>
                    <span class="kbd-or">or</span>
                    <span class="kbd-combo"><kbd>⌃</kbd> + <kbd>Enter</kbd></span>
                  </div>
                </td>
                <td>Run code or refresh live HTML preview</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>J</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>J</kbd></td>
                <td>Toggle Terminal Console & Problems drawer</td>
                <td>Global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="tabs-workspace">
        <h2>Tabs & Workspace Hotkeys</h2>
        <p>Manage multi-file workspaces and tabs rapidly from the keyboard:</p>
        <div class="docs-table-wrapper">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Windows / Linux</th>
                <th>macOS</th>
                <th>Action</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>N</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>N</kbd></td>
                <td>Create a new file tab</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>W</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>W</kbd></td>
                <td>Close active tab</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>W</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>⇧</kbd> + <kbd>W</kbd></td>
                <td>Close all other tabs (keeps active tab)</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>E</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>E</kbd></td>
                <td>Inline rename active tab</td>
                <td>Tabs Bar</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>,</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>,</kbd></td>
                <td>Switch to previous tab</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>.</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>.</kbd></td>
                <td>Switch to next tab</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>R</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>R</kbd></td>
                <td>Rename room code</td>
                <td>Global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="panels-layout">
        <h2>Panels & Layout Hotkeys</h2>
        <p>Control panel docking, sizing, and sidebars without touching your mouse:</p>
        <div class="docs-table-wrapper">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Windows / Linux</th>
                <th>macOS</th>
                <th>Action</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>D</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>D</kbd></td>
                <td>Toggle panel dock (Bottom drawer vs Right side-by-side)</td>
                <td>Unified Panel</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>M</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>M</kbd></td>
                <td>Maximize / Restore panel size</td>
                <td>Unified Panel</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>1</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>1</kbd></td>
                <td>Toggle Room Users & Presence sidebar</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>2</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>2</kbd></td>
                <td>Toggle Screenshots drawer</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>3</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>3</kbd></td>
                <td>Toggle Files & Media drawer</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>4</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>4</kbd></td>
                <td>Toggle Context-Aware AI Assistant panel</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>T</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>T</kbd></td>
                <td>Toggle Color Theme Picker modal</td>
                <td>Global</td>
              </tr>
              <tr>
                <td><kbd>Alt</kbd> + <kbd>/</kbd></td>
                <td><kbd>⌃</kbd> + <kbd>/</kbd></td>
                <td>Open Keyboard Shortcuts Help modal</td>
                <td>Global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="editor-navigation">
        <h2>Editor & Navigation Hotkeys</h2>
        <p>Monaco editor built-in navigation and global search commands:</p>
        <div class="docs-table-wrapper">
          <table class="docs-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd></td>
                <td>Open Documentation Command-Palette Search</td>
                <td>Docs Page</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>⌘</kbd> + <kbd>S</kbd></td>
                <td>Format document & trigger sync</td>
                <td>Monaco Editor</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>F</kbd> / <kbd>⌘</kbd> + <kbd>F</kbd></td>
                <td>Find in file</td>
                <td>Monaco Editor</td>
              </tr>
              <tr>
                <td><kbd>Ctrl</kbd> + <kbd>H</kbd> / <kbd>⌘</kbd> + <kbd>H</kbd></td>
                <td>Find and replace in file</td>
                <td>Monaco Editor</td>
              </tr>
              <tr>
                <td><kbd>Esc</kbd></td>
                <td>Close modal / cancel tab rename / dismiss drawer</td>
                <td>Active Modal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="mouse-gestures">
        <h2>Mouse & Trackpad Gestures</h2>
        <p>Speed up common actions using ergonomic gestures:</p>
        <ul class="docs-feature-list">
          <li><strong>Double-click empty tab bar space:</strong> Instantly creates and focuses a new file tab right next to your open tabs.</li>
          <li><strong>Double-click existing tab header:</strong> Enters inline file rename mode. Press <kbd>Enter</kbd> to save or <kbd>Esc</kbd> to cancel.</li>
          <li><strong>Double-click panel header or drag handle:</strong> Instantly maximizes the bottom/side panel to 90% screen height or restores it to previous size.</li>
          <li><strong>Drag tab into AI Chat:</strong> Attaches the tab file as immediate focused context for your next AI prompt.</li>
          <li><strong>Corner drag sash:</strong> Drag the dual-direction corner sash to smoothly resize both bottom and side panels simultaneously.</li>
          <li><strong>Double-click corner sash:</strong> Resets both panel height and AI sidebar width to default standard dimensions (280px / 400px).</li>
        </ul>
      </section>

      <section id="platform-note">
        <h2>Cross-Platform Modifiers</h2>
        <div class="docs-callout tip">
          <span class="callout-icon material-symbols-outlined">lightbulb</span>
          <div class="callout-content">
            <strong>Modifier Keys:</strong> On Windows and Linux, shortcuts use the <kbd>Alt</kbd> modifier key. On macOS, shortcuts use the <kbd>⌃ Control</kbd> key to prevent collisions with native Option special character input. Universal actions like running code and search support both <kbd>Alt</kbd> and <kbd>Ctrl</kbd> / <kbd>⌘</kbd>.
          </div>
        </div>
      </section>
    `,
  },

  languages: {
    title: 'Supported Languages & Runtimes',
    subtitle: 'Comprehensive list of 23+ syntax-highlighted languages and runtime execution in Codely.',
    category: 'Reference',
    updatedAt: 'November 2026',
    toc: [
      { id: 'web-languages', label: 'Web & Scripting' },
      { id: 'backend-systems', label: 'Systems & Backend' },
      { id: 'data-markup', label: 'Data, Query & Markup' },
    ],
    content: `
      <section id="web-languages">
        <h2>Web & Scripting</h2>
        <p>Full IntelliSense, bracket matching, linting, and live execution support:</p>
        <div class="docs-card-grid three-col">
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-javascript-plain colored"></i></div>
            <span class="lang-name">JavaScript</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-typescript-plain colored"></i></div>
            <span class="lang-name">TypeScript</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-python-plain colored"></i></div>
            <span class="lang-name">Python</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-html5-plain colored"></i></div>
            <span class="lang-name">HTML</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-css3-plain colored"></i></div>
            <span class="lang-name">CSS</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-php-plain colored"></i></div>
            <span class="lang-name">PHP</span>
          </div>
        </div>
      </section>

      <section id="backend-systems">
        <h2>Systems & Backend</h2>
        <p>High-performance backend languages with Monaco syntax grammar and bracket colorization:</p>
        <div class="docs-card-grid three-col">
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-rust-original colored"></i></div>
            <span class="lang-name">Rust</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-go-original-wordmark colored"></i></div>
            <span class="lang-name">Go</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-cplusplus-plain colored"></i></div>
            <span class="lang-name">C / C++</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-java-plain colored"></i></div>
            <span class="lang-name">Java</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-csharp-plain colored"></i></div>
            <span class="lang-name">C#</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-ruby-plain colored"></i></div>
            <span class="lang-name">Ruby</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-kotlin-plain colored"></i></div>
            <span class="lang-name">Kotlin</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-swift-plain colored"></i></div>
            <span class="lang-name">Swift</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-dart-plain colored"></i></div>
            <span class="lang-name">Dart</span>
          </div>
        </div>
      </section>

      <section id="data-markup">
        <h2>Data, Query & Markup</h2>
        <p>Declarative formats, configurations, and database query schemas:</p>
        <div class="docs-card-grid three-col">
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><span class="material-symbols-outlined lang-mat-icon">database</span></div>
            <span class="lang-name">SQL</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><span class="material-symbols-outlined lang-mat-icon">data_object</span></div>
            <span class="lang-name">JSON</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><span class="material-symbols-outlined lang-mat-icon">schema</span></div>
            <span class="lang-name">YAML</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-markdown-original colored"></i></div>
            <span class="lang-name">Markdown</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-bash-plain colored"></i></div>
            <span class="lang-name">Shell / Bash</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><i class="devicon-docker-plain colored"></i></div>
            <span class="lang-name">Dockerfile</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><span class="material-symbols-outlined lang-mat-icon">code_blocks</span></div>
            <span class="lang-name">XML</span>
          </div>
          <div class="docs-lang-card">
            <div class="lang-icon-wrap"><span class="material-symbols-outlined lang-mat-icon">article</span></div>
            <span class="lang-name">Plaintext</span>
          </div>
        </div>
      </section>
    `,
  },
};
