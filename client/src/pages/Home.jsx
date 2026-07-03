import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { LANGUAGES } from '../utils/constants';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [joinId, setJoinId] = useState('');
  const [customId, setCustomId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);
  const mockupRef = useRef(null);

  const targetProgress = useRef(0);
  const currentProgress = useRef(0);
  const animationFrameId = useRef(null);
  const isLoopRunning = useRef(false);

  // Apply only the transform (cheap, GPU-composited). Shadow is static in CSS.
  const applyMockupTransform = useCallback((p) => {
    const el = mockupRef.current;
    if (!el) return;
    const rotateX = 25 - p * 25;
    const scale = 0.85 + p * 0.15;
    const translateY = 20 - p * 20;
    el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`;
  }, []);

  // Self-terminating render loop — only runs while settling toward the target,
  // then stops so we don't burn a rAF every frame at idle.
  const ensureLoopRunning = useCallback(() => {
    if (isLoopRunning.current) return;
    isLoopRunning.current = true;

    const tick = () => {
      const diff = targetProgress.current - currentProgress.current;

      if (Math.abs(diff) < 0.001) {
        currentProgress.current = targetProgress.current;
        applyMockupTransform(currentProgress.current);
        isLoopRunning.current = false; // settled — stop the loop
        return;
      }

      currentProgress.current += diff * 0.18; // slightly snappier lerp
      applyMockupTransform(currentProgress.current);
      animationFrameId.current = window.requestAnimationFrame(tick);
    };

    animationFrameId.current = window.requestAnimationFrame(tick);
  }, [applyMockupTransform]);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    targetProgress.current = Math.min(Math.max(scrollTop / 400, 0), 1);
    ensureLoopRunning();
  };

  useEffect(() => {
    applyMockupTransform(0); // initial tilt
    return () => {
      if (animationFrameId.current) window.cancelAnimationFrame(animationFrameId.current);
    };
  }, [applyMockupTransform]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showLangMenu && langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangMenu]);

  const handleCreateRoom = () => {
    if (!socket || !isConnected) {
      setError('Connecting to server... Please wait.');
      return;
    }

    setIsCreating(true);
    setError('');

    const payload = {
      language: selectedLanguage,
      customId: customId.trim() || undefined,
    };

    socket.emit('create-room', payload, (response) => {
      setIsCreating(false);
      if (response.error) {
        setError(response.error);
        return;
      }

      // Save creator token in localStorage
      localStorage.setItem(`codely-creator-${response.roomId}`, response.creatorToken);
      navigate(`/${response.roomId}`);
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) {
      setError('Please enter a room code.');
      return;
    }

    // Extract room ID from URL if pasted
    const match = id.match(/\/([a-zA-Z0-9_-]+)\/?$/);
    const roomId = match ? match[1] : id;

    navigate(`/${roomId}`);
  };

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="home" onScroll={handleScroll}>
      {/* Dynamic Premium Background */}
      <div className="premium-background">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="grid-overlay" />
        <div className="bg-vignette" />
      </div>

      <div className="home-content">

        {/* Navigation / Header */}
        <nav className="home-nav animate-fade-in">
          <div className="logo">
            <span className="logo-bracket">&lt;</span>
            <span className="logo-text">Codely</span>
            <span className="logo-bracket">/&gt;</span>
          </div>

          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollToId('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollToId('how-it-works')}>How it works</button>
            <button className="nav-link" onClick={() => scrollToId('cta')}>Get started</button>
          </div>

          <div className="nav-right">
            <div className="nav-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              <span className="nav-status-text">
                {isConnected ? 'System Online' : 'Connecting...'}
              </span>
            </div>
            <button className="btn nav-cta" onClick={handleCreateRoom} disabled={isCreating || !isConnected}>
              Launch workspace
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="hero-section">
          <div className="hero-badge animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <span className="live-pulse" />
            Real-time Multiplayer Editor
          </div>
          <h1 className="hero-title animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Code together. <br className="desktop-break" />
            <span className="text-gradient">Instantly.</span>
          </h1>
          <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            Frictionless pair programming with context-aware AI, live cursors, and rich media sharing.
            Share one link and drop straight into flow state — no accounts, no setup.
          </p>

          {/* Centralized Action Center */}
          <div className="action-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="action-card glass-panel">

              {/* Top Row: Quick Start */}
              <div className="action-primary-row">
                <button
                  className="btn btn-hero-create"
                  onClick={handleCreateRoom}
                  disabled={isCreating || !isConnected}
                >
                  {isCreating ? <span className="spinner" /> : <span className="material-symbols-outlined icon-glow">rocket_launch</span>}
                  {isCreating ? 'Initializing...' : 'Start Workspace'}
                </button>

                <div className="action-divider-vertical">
                  <span>OR</span>
                </div>

                <form className="join-form-inline" onSubmit={handleJoinRoom}>
                  <div className="join-input-premium">
                    <span className="material-symbols-outlined input-icon">link</span>
                    <input
                      type="text"
                      placeholder="Paste room code/URL"
                      value={joinId}
                      onChange={(e) => {
                        setJoinId(e.target.value);
                        setError('');
                      }}
                    />
                    <button className="btn btn-secondary btn-join-sm" type="submit">
                      Join
                    </button>
                  </div>
                </form>
              </div>

              {/* Advanced Configuration Toggle */}
              <button
                className="btn-toggle-advanced-premium"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
                {showAdvanced ? 'Hide workspace settings' : 'Configure workspace settings'}
              </button>

              {/* Advanced Config Area */}
              <div className={`advanced-config-panel ${showAdvanced ? 'open' : ''}`}>
                <div className="form-row">
                  <div className="form-field">
                    <label>Custom Room URL</label>
                    <div className="input-with-prefix-premium">
                      <span className="input-prefix">codely/</span>
                      <input
                        type="text"
                        placeholder="my-project"
                        value={customId}
                        onChange={(e) => setCustomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                        maxLength={32}
                      />
                    </div>
                  </div>

                  <div className="form-field" ref={langMenuRef}>
                    <label>Primary Language</label>
                    <div className="custom-select-wrapper">
                      <button
                        type="button"
                        className="custom-select-btn-premium"
                        onClick={() => setShowLangMenu(!showLangMenu)}
                      >
                        <span>{LANGUAGES.find(l => l.value === selectedLanguage)?.label || 'JavaScript'}</span>
                        <span className="material-symbols-outlined select-icon">unfold_more</span>
                      </button>

                      {showLangMenu && (
                        <div className="custom-select-dropdown-premium">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.value}
                              type="button"
                              className={`custom-select-option ${selectedLanguage === lang.value ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedLanguage(lang.value);
                                setShowLangMenu(false);
                              }}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Trust line */}
            <div className="hero-trust">
              <span><span className="material-symbols-outlined">check_circle</span> No sign-up</span>
              <span className="trust-sep" />
              <span><span className="material-symbols-outlined">bolt</span> Instant setup</span>
              <span className="trust-sep" />
              <span><span className="material-symbols-outlined">lock</span> Ephemeral &amp; private</span>
            </div>

            {error && <div className="error-banner animate-fade-in"><span className="material-symbols-outlined">error</span> {error}</div>}
          </div>
        </main>

        {/* Interactive CSS Mockup */}
        <div className="mockup-container animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div
            className="editor-mockup glass-panel"
            ref={mockupRef}
            style={{
              transform: `perspective(1200px) rotateX(25deg) scale(0.85) translateY(20px)`
            }}
          >
            {/* Real toolbar replica */}
            <div className="mockup-toolbar">
              <div className="mk-left">
                <span className="mk-logo"><span className="mk-bracket">&lt;</span>Codely<span className="mk-bracket">/&gt;</span></span>
                <span className="mk-divider" />
                <span className="mk-room">team-sync</span>
                <span className="material-symbols-outlined mk-icon">content_copy</span>
              </div>

              <div className="mk-center">
                <span className="mk-lang">
                  <span className="mk-js-badge">JS</span>
                  JavaScript
                  <span className="material-symbols-outlined mk-lang-caret">expand_more</span>
                </span>
              </div>

              <div className="mk-right">
                <div className="mockup-avatars">
                  <div className="mockup-avatar" style={{ background: '#3b82f6' }}>AL</div>
                  <div className="mockup-avatar" style={{ background: '#10b981', zIndex: 1, marginLeft: '-8px' }}>SR</div>
                </div>
                <span className="material-symbols-outlined mk-icon mk-icon-hide">content_paste</span>
                <span className="material-symbols-outlined mk-icon mk-icon-hide">image</span>
                <span className="material-symbols-outlined mk-icon mk-icon-hide">attach_file</span>
                <span className="material-symbols-outlined mk-icon active">robot_2</span>
                <span className="material-symbols-outlined mk-icon">group</span>
                <span className="mk-conn" title="Connected" />
              </div>
            </div>

            {/* Real tabs bar replica */}
            <div className="mockup-tabsbar">
              <div className="mk-tab active">
                <span className="mk-tab-name">index.js</span>
                <span className="material-symbols-outlined mk-tab-close">close</span>
              </div>
              <div className="mk-tab">
                <span className="mk-tab-name">App.jsx</span>
              </div>
              <div className="mk-tab mk-tab-hide">
                <span className="mk-tab-name">styles.css</span>
              </div>
              <span className="material-symbols-outlined mk-tab-add">add</span>
            </div>

            <div className="mockup-body">
              <div className="mockup-line-numbers">
                {Array.from({ length: 15 }).map((_, i) => <span key={i}>{i + 1}</span>)}
              </div>
              <div className="mockup-code">
                <pre><code><span className="keyword">import</span> {'{'} <span className="class">createServer</span> {'}'} <span className="keyword">from</span> <span className="string">'http'</span>;{'\n'}
<span className="keyword">import</span> {'{'} <span className="class">Server</span> {'}'} <span className="keyword">from</span> <span className="string">'socket.io'</span>;{'\n'}
{'\n'}
<span className="keyword">const</span> <span className="variable">io</span> = <span className="keyword">new</span> <span className="class">Server</span>(server, {'{\n'}
  <span className="property">cors</span>: {'{'} <span className="property">origin</span>: <span className="string">'*'</span> {'}'}{'\n'}
{'}'});{'\n'}
{'\n'}
<span className="variable">io</span>.<span className="function">on</span>(<span className="string">'connection'</span>, (<span className="variable">socket</span>) {'=>'} {'{\n'}
  <span className="comment">// Real-time magic happens here ✨</span>{'\n'}
{'}'});</code></pre>
              </div>

              {/* Floating CSS Animated Cursors */}
              <div className="mock-cursor cursor-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" stroke="#fff" strokeWidth="1.5" />
                </svg>
                <div className="cursor-name" style={{ background: '#3b82f6' }}>Alex</div>
              </div>

              <div className="mock-cursor cursor-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#10b981" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" stroke="#fff" strokeWidth="1.5" />
                </svg>
                <div className="cursor-name" style={{ background: '#10b981' }}>Sarah</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats / Credibility strip */}
        <section className="stats-strip animate-fade-in-up">
          <div className="stat-item">
            <div className="stat-value">&lt;50ms</div>
            <div className="stat-label">Sync latency</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-value">23+</div>
            <div className="stat-label">Languages</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-value">3</div>
            <div className="stat-label">AI models</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Sign-ups needed</div>
          </div>
        </section>

        {/* Section heading */}
        <div className="section-heading animate-fade-in-up" id="features">
          <div className="section-eyebrow">Everything you need</div>
          <h2 className="section-title">A full collaboration suite, in one link</h2>
          <p className="section-desc">
            Codely isn't just a shared textarea. It's a complete real-time workspace built for pairing,
            interviews, teaching, and debugging together.
          </p>
        </div>

        {/* Premium Bento Box Feature Grid */}
        <section className="premium-bento-grid animate-fade-in-up">

          {/* AI — tall feature card */}
          <div className="bento-card card-gradient-border card-tall">
            <div className="bento-card-inner glass-panel">
              <div className="bento-icon purple-glow">
                <span className="material-symbols-outlined">robot_2</span>
              </div>
              <h3>Context-Aware AI Chat</h3>
              <p>The assistant sees your codebase, open tabs and attached screenshots — no copy-pasting into a separate window. Switch between the models you already trust.</p>

              <div className="ai-brand-chips">
                <span className="ai-chip" style={{ '--chip': 'var(--brand-claude)' }}>Claude</span>
                <span className="ai-chip" style={{ '--chip': 'var(--brand-openai)' }}>OpenAI</span>
                <span className="ai-chip" style={{ '--chip': 'var(--brand-google)' }}>Gemini</span>
              </div>

              <div className="mock-ai-chat">
                <div className="ai-message user-msg">Explain this WebSocket logic</div>
                <div className="ai-message bot-msg">
                  <span className="material-symbols-outlined bot-icon">smart_toy</span>
                  <span className="bot-text">The <code>io.on('connection')</code> block fires whenever a client joins the room…</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time sync — wide */}
          <div className="bento-card card-gradient-border card-wide">
            <div className="bento-card-inner glass-panel">
              <div className="bento-content-row">
                <div className="bento-text">
                  <div className="bento-icon blue-glow">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <h3>Zero-latency CRDT sync</h3>
                  <p>Yjs conflict-free replicated data types stream every keystroke instantly. See live cursors, selections and names — no merge conflicts, ever.</p>
                </div>
                <div className="bento-visual">
                  <div className="sync-visual">
                    <div className="sync-cursor c-a"><span className="sync-caret" style={{ background: '#3b82f6' }} /><span className="sync-tag" style={{ background: '#3b82f6' }}>Alex</span></div>
                    <div className="sync-cursor c-b"><span className="sync-caret" style={{ background: '#10b981' }} /><span className="sync-tag" style={{ background: '#10b981' }}>Sarah</span></div>
                    <div className="sync-line" style={{ width: '80%' }} />
                    <div className="sync-line" style={{ width: '55%' }} />
                    <div className="sync-line highlight" style={{ width: '70%' }} />
                    <div className="sync-line" style={{ width: '40%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-tab */}
          <div className="bento-card card-gradient-border">
            <div className="bento-card-inner glass-panel">
              <div className="bento-icon orange-glow">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <h3>Multi-tab workspace</h3>
              <p>Open and sync multiple files at once. Share a whole project structure, not just a single snippet.</p>
            </div>
          </div>

          {/* Media sharing */}
          <div className="bento-card card-gradient-border">
            <div className="bento-card-inner glass-panel">
              <div className="bento-icon blue-glow">
                <span className="material-symbols-outlined">attach_file</span>
              </div>
              <h3>Image &amp; file sharing</h3>
              <p>Drag in screenshots, logs, PDFs or configs. Preview images in a lightbox and hand context straight to the AI.</p>
            </div>
          </div>

          {/* Presence */}
          <div className="bento-card card-gradient-border">
            <div className="bento-card-inner glass-panel">
              <div className="bento-icon green-glow">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h3>Live presence</h3>
              <p>See exactly who's in the room and where they're working — avatars, colored cursors and typing indicators.</p>
            </div>
          </div>

          {/* Security */}
          <div className="bento-card card-gradient-border">
            <div className="bento-card-inner glass-panel">
              <div className="bento-icon green-glow">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <h3>Ephemeral &amp; secure</h3>
              <p>No login, no long-term storage. Sessions live only as long as you need them, then disappear.</p>
            </div>
          </div>

        </section>

        {/* How it works */}
        <div className="section-heading animate-fade-in-up" id="how-it-works">
          <div className="section-eyebrow">Zero setup</div>
          <h2 className="section-title">From idea to pairing in seconds</h2>
        </div>

        <section className="how-grid animate-fade-in-up">
          <div className="how-step">
            <div className="how-num">1</div>
            <div className="how-icon"><span className="material-symbols-outlined">rocket_launch</span></div>
            <h4>Start a workspace</h4>
            <p>Pick a language and hit start. Your room spins up instantly with a shareable link.</p>
          </div>
          <div className="how-connector" />
          <div className="how-step">
            <div className="how-num">2</div>
            <div className="how-icon"><span className="material-symbols-outlined">share</span></div>
            <h4>Share the link</h4>
            <p>Send the URL to anyone. They join in one click — no account, no install.</p>
          </div>
          <div className="how-connector" />
          <div className="how-step">
            <div className="how-num">3</div>
            <div className="how-icon"><span className="material-symbols-outlined">groups</span></div>
            <h4>Build together</h4>
            <p>Code live, chat with AI, share files and stay in sync. That's it.</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta animate-fade-in-up" id="cta">
          <div className="final-cta-glow" />
          <h2>Ready to pair up?</h2>
          <p>Spin up a live workspace right now — it's free and takes one click.</p>
          <div className="final-cta-actions">
            <button
              className="btn btn-hero-create btn-cta-lg"
              onClick={handleCreateRoom}
              disabled={isCreating || !isConnected}
            >
              {isCreating ? <span className="spinner" /> : <span className="material-symbols-outlined icon-glow">rocket_launch</span>}
              {isCreating ? 'Initializing...' : 'Start a free workspace'}
            </button>
            <span className="final-cta-note">No credit card · No account · Just code</span>
          </div>
        </section>

        <footer className="home-footer animate-fade-in-up">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="logo">
                <span className="logo-bracket">&lt;</span>
                <span className="logo-text">Codely</span>
                <span className="logo-bracket">/&gt;</span>
              </div>
              <p className="footer-tagline">Real-time collaborative coding, built for flow state.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h5>Product</h5>
                <button className="footer-link" onClick={() => scrollToId('features')}>Features</button>
                <button className="footer-link" onClick={() => scrollToId('how-it-works')}>How it works</button>
                <button className="footer-link" onClick={handleCreateRoom}>Launch workspace</button>
              </div>
              <div className="footer-col">
                <h5>Highlights</h5>
                <span className="footer-link static">Real-time sync</span>
                <span className="footer-link static">AI assistant</span>
                <span className="footer-link static">File &amp; image sharing</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Codely. Built for flow state.</p>
            <div className="footer-status">
              <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
              {isConnected ? 'All systems operational' : 'Reconnecting…'}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default Home;
