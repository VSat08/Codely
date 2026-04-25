import { useState } from 'react';
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
      <div className="home-content">
        {/* Hero */}
        <div className="hero animate-fade-in-up">
          <div className="logo">
            <span className="logo-bracket">&lt;</span>
            <span className="logo-text">Codely</span>
            <span className="logo-bracket">/&gt;</span>
          </div>
          <p className="tagline">
            Share code and screenshots in real-time.
            <br />
            <span className="text-secondary">No login. No setup. Just share.</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="home-card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* Create Room */}
          <div className="card-section">
            <button
              className="btn btn-primary btn-create"
              onClick={handleCreateRoom}
              disabled={isCreating || !isConnected}
              id="create-room-btn"
            >
              {isCreating ? (
                <span className="spinner" />
              ) : (
                <span>+</span>
              )}
              {isCreating ? 'Creating...' : 'Create New Room'}
            </button>

            <button
              className="btn btn-ghost btn-toggle-advanced"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▾ Hide options' : '▸ Advanced options'}
            </button>

            {showAdvanced && (
              <div className="advanced-options">
                <div className="form-field">
                  <label htmlFor="custom-id">Custom Room ID</label>
                  <input
                    id="custom-id"
                    type="text"
                    placeholder="e.g. my-project (optional)"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    maxLength={32}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="language-select">Language</label>
                  <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="divider">
            <span>or join an existing room</span>
          </div>

          {/* Join Room */}
          <form className="card-section" onSubmit={handleJoinRoom}>
            <div className="join-row">
              <input
                id="join-input"
                type="text"
                placeholder="Enter room code or paste link..."
                value={joinId}
                onChange={(e) => {
                  setJoinId(e.target.value);
                  setError('');
                }}
              />
              <button className="btn btn-secondary" type="submit" id="join-room-btn">
                Join →
              </button>
            </div>
          </form>

          {/* Error */}
          {error && <p className="error-msg">{error}</p>}
        </div>

        {/* Features */}
        <div className="features animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="feature">
            <span className="feature-icon material-symbols-outlined">edit_note</span>
            <div>
              <strong>Real-time editing</strong>
              <p>Code together with live sync</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon material-symbols-outlined">image</span>
            <div>
              <strong>Share screenshots</strong>
              <p>Paste or drag & drop images</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon material-symbols-outlined">lock</span>
            <div>
              <strong>Private & anonymous</strong>
              <p>No login, no tracking, no database</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon material-symbols-outlined">bolt</span>
            <div>
              <strong>Instant setup</strong>
              <p>Create a room in one click</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="connection-status" style={{ animationDelay: '300ms' }}>
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="text-secondary" style={{ fontSize: '0.8rem' }}>
            {isConnected ? 'Connected to server' : 'Connecting...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Home;
