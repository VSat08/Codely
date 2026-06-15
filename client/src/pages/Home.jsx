import { useState, useRef, useEffect } from 'react';
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

  return (
    <div className="home">
      {/* Dynamic Ambient Background */}
      <div className="ambient-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="home-content">
        
        {/* Navigation / Header */}
        <nav className="home-nav animate-fade-in-down">
          <div className="logo">
            <span className="logo-bracket">&lt;</span>
            <span className="logo-text">Codely</span>
            <span className="logo-bracket">/&gt;</span>
          </div>
          <div className="nav-status">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
            <span className="nav-status-text">
              {isConnected ? 'System Online' : 'Connecting...'}
            </span>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="hero animate-fade-in-up">
          <h1 className="hero-title">
            Code at the speed <br className="desktop-break" /> of thought.
          </h1>
          <p className="hero-subtitle">
            Instantly share code, brainstorm with AI, and collaborate in real-time.
            No login, no setup, pure flow state.
          </p>
        </header>

        {/* Main Interaction Glass Panel */}
        <div className="glass-panel main-interaction animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          
          <div className="action-split">
            {/* Create Room Section */}
            <div className="action-section">
              <h2 className="section-heading">Start a new session</h2>
              <p className="section-subtext">Instantly spin up a collaborative workspace.</p>
              
              <button
                className="btn btn-primary btn-create-premium"
                onClick={handleCreateRoom}
                disabled={isCreating || !isConnected}
              >
                {isCreating ? <span className="spinner" /> : <span className="material-symbols-outlined icon-glow">add</span>}
                {isCreating ? 'Initializing...' : 'Create Workspace'}
              </button>

              <button
                className="btn btn-ghost btn-toggle-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide configuration' : 'Configure workspace'}
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  {showAdvanced ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showAdvanced && (
                <div className="advanced-options slide-down">
                  <div className="form-field">
                    <label htmlFor="custom-id">Custom Room URL</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">codely/</span>
                      <input
                        id="custom-id"
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
                          className="custom-select-btn"
                          onClick={() => setShowLangMenu(!showLangMenu)}
                        >
                          <span>{LANGUAGES.find(l => l.value === selectedLanguage)?.label || 'JavaScript'}</span>
                          <span className="material-symbols-outlined select-icon">unfold_more</span>
                        </button>
                        
                        {showLangMenu && (
                          <div className="custom-select-dropdown">
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
              )}
            </div>

            <div className="action-divider">
              <div className="divider-line"></div>
              <span>OR</span>
              <div className="divider-line"></div>
            </div>

            {/* Join Room Section */}
            <div className="action-section">
              <h2 className="section-heading">Join existing session</h2>
              <p className="section-subtext">Enter a code or paste a link to jump in.</p>
              
              <form className="join-form" onSubmit={handleJoinRoom}>
                <div className="join-input-wrapper">
                  <span className="material-symbols-outlined input-icon">link</span>
                  <input
                    id="join-input"
                    type="text"
                    placeholder="Room code or URL"
                    value={joinId}
                    onChange={(e) => {
                      setJoinId(e.target.value);
                      setError('');
                    }}
                  />
                  <button className="btn btn-secondary btn-join-premium" type="submit">
                    Join
                  </button>
                </div>
              </form>
            </div>
          </div>

          {error && <div className="error-banner animate-fade-in"><span className="material-symbols-outlined">error</span> {error}</div>}
        </div>

        {/* Bento Box Feature Grid */}
        <div className="bento-grid animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          <div className="bento-item glass-panel">
            <div className="bento-icon-wrapper blue-glow">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <h3>Lightning Fast</h3>
            <p>Zero database lookups. Peer-to-peer WebSockets deliver keystrokes instantly.</p>
          </div>

          <div className="bento-item glass-panel bento-wide">
            <div className="bento-icon-wrapper purple-glow">
              <span className="material-symbols-outlined">robot_2</span>
            </div>
            <div className="bento-content-row">
              <div className="bento-text">
                <h3>Context-Aware AI</h3>
                <p>Chat with a powerful AI assistant that automatically sees your code, images, and file structure without any manual copying and pasting.</p>
              </div>
              <div className="bento-visual">
                 <div className="mock-ai-bubble">How can I optimize this?</div>
              </div>
            </div>
          </div>

          <div className="bento-item glass-panel">
            <div className="bento-icon-wrapper green-glow">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3>Anonymous</h3>
            <p>We store nothing. No login required, no tracking cookies, complete privacy.</p>
          </div>

          <div className="bento-item glass-panel">
            <div className="bento-icon-wrapper orange-glow">
              <span className="material-symbols-outlined">image</span>
            </div>
            <h3>Rich Media</h3>
            <p>Drag, drop, and paste screenshots and files directly into your workspace.</p>
          </div>

        </div>

        <footer className="home-footer animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <p>© {new Date().getFullYear()} Codely. Built for developers.</p>
        </footer>

      </div>
    </div>
  );
}

export default Home;
