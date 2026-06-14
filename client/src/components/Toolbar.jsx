import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, getExtensionForLanguage } from '../utils/constants';
import JSZip from 'jszip';
import './Toolbar.css';

/**
 * Top toolbar — room info, language selector, action buttons.
 * On mobile (≤768px), secondary actions move to a floating bottom bar.
 */
function Toolbar({
  roomId,
  language,
  onLanguageChange,
  onCopyLink,
  onToggleSidebar,
  onToggleImages,
  onToggleFiles,
  onToggleAI,
  showSidebar,
  showImagePanel,
  showFilePanel,
  showAIPanel,
  isConnected,
  onRenameRoom,
  onDeleteRoom,
  addToast,
  userCount,
  activeTab,
  tabs,
  onOpenLineRange,
  onOpenShortcuts,
  onOpenThemeModal,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileLangMenu, setShowMobileLangMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const menuRef = useRef(null);
  const langMenuRef = useRef(null);
  const mobileLangMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Platform detection
  const isMac = typeof navigator !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.platform);
  const modKey = isMac ? '⌃' : 'Alt';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (showLangMenu && langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
      if (showMobileLangMenu && mobileLangMenuRef.current && !mobileLangMenuRef.current.contains(e.target)) {
        setShowMobileLangMenu(false);
      }
      if (showMobileMenu && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showLangMenu, showMobileLangMenu, showMobileMenu]);

  // Listen for global rename event from keyboard shortcuts
  useEffect(() => {
    const handleTriggerRename = () => setRenaming(true);
    window.addEventListener('trigger-rename-room', handleTriggerRename);
    return () => window.removeEventListener('trigger-rename-room', handleTriggerRename);
  }, []);

  const handleCopyCode = () => {
    if (!activeTab?.code) {
      addToast('No code to copy', 'error');
      return;
    }
    navigator.clipboard.writeText(activeTab.code);
    addToast('Code copied to clipboard!', 'success');
  };

  const handleDownloadFile = () => {
    if (!activeTab) {
      addToast('No file to download', 'error');
      return;
    }
    const blob = new Blob([activeTab.code || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.name || 'untitled.txt';
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${activeTab.name}`, 'success');
  };

  const handleDownloadAll = async () => {
    if (!tabs || Object.keys(tabs).length === 0) {
      addToast('No files to download', 'error');
      return;
    }
    const zip = new JSZip();
    Object.values(tabs).forEach((tab) => {
      zip.file(tab.name || 'untitled.txt', tab.code || '');
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${roomId}-code.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Downloaded all files as ZIP', 'success');
  };

  const handleRename = async () => {
    if (!newRoomId.trim()) return;
    try {
      await onRenameRoom(newRoomId.trim());
      setRenaming(false);
      setNewRoomId('');
      addToast('Room renamed!', 'success');
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this room permanently? This cannot be undone.')) return;
    try {
      await onDeleteRoom();
      addToast('Room deleted', 'info');
    } catch (err) {
      addToast(String(err), 'error');
    }
  };

  return (
    <>
      {/* ═══════════════════════════════════════
          TOP TOOLBAR (Desktop: full | Mobile: minimal)
          ═══════════════════════════════════════ */}
      <div className="toolbar">
        {/* Left: Logo + Room ID */}
        <div className="toolbar-left">
          <a href="/" className="toolbar-logo">
            <span className="text-accent">&lt;</span>Codely<span className="text-accent">/&gt;</span>
          </a>
          <div className="toolbar-divider" />
          <div className="room-id-group">
            {renaming ? (
              <div className="rename-inline">
                <input
                  type="text"
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  placeholder="new-room-id"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setRenaming(false);
                  }}
                />
                <button className="btn btn-ghost" onClick={handleRename}>✓</button>
                <button className="btn btn-ghost" onClick={() => setRenaming(false)}>✕</button>
              </div>
            ) : (
              <>
                <span
                  className="room-id mono"
                  onDoubleClick={() => setRenaming(true)}
                  title="Double click to rename room"
                  style={{ cursor: 'pointer' }}
                >
                  {roomId}
                </span>
                <button className="btn btn-icon btn-ghost" onClick={onCopyLink} title="Copy link">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Center: Language */}
        <div className="toolbar-center">
          <div className="language-select-wrapper" ref={langMenuRef} style={{ position: 'relative' }}>
            <button
              className="language-select"
              onClick={() => setShowLangMenu(!showLangMenu)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {LANGUAGES.find(l => l.value === language)?.label || 'JavaScript'}
              </span>
              <span className="material-symbols-outlined language-select-icon" style={{ position: 'static', right: 'auto' }}>expand_more</span>
            </button>

            {showLangMenu && (
              <div className="dropdown-menu" style={{ top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', minWidth: '160px', maxHeight: '400px', overflowY: 'auto' }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    className={`dropdown-item ${language === lang.value ? 'active' : ''}`}
                    onClick={() => { onLanguageChange(lang.value); setShowLangMenu(false); }}
                    style={{ display: 'flex', width: '100%' }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions (hidden on mobile — moved to bottom bar) */}
        <div className="toolbar-right toolbar-actions-desktop">
          <div className="user-count" title={`${userCount} user(s) online`}>
            <span className="user-count-dot" />
            {userCount}
          </div>

          <button
            className="btn btn-icon btn-ghost"
            onClick={handleCopyCode}
            title={`Copy code (${modKey} + C)`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>content_paste</span>
          </button>

          <button
            className={`btn btn-icon btn-ghost ${showImagePanel ? 'active' : ''}`}
            onClick={onToggleImages}
            title={`Toggle Screenshots (${modKey} + 2)`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>image</span>
          </button>

          <button
            className={`btn btn-icon btn-ghost ${showFilePanel ? 'active' : ''}`}
            onClick={onToggleFiles}
            title={`Toggle Files (${modKey} + 3)`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>attach_file</span>
          </button>

          <button
            className={`btn btn-icon btn-ghost ${showAIPanel ? 'active' : ''}`}
            onClick={onToggleAI}
            title={`Toggle AI Assistant (${modKey} + 4)`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>robot_2</span>
          </button>

          <button
            className={`btn btn-icon btn-ghost ${showSidebar ? 'active' : ''}`}
            onClick={onToggleSidebar}
            title={`Toggle Users Sidebar (${modKey} + 1)`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>group</span>
          </button>

          {/* More Menu */}
          <div className="menu-wrapper" ref={menuRef}>
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setShowMenu(!showMenu)}
              title="Room settings"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button
                  className="dropdown-item"
                  onClick={() => { handleCopyCode(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span> Copy Code
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { onOpenLineRange(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>select_all</span> Copy Lines...
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => { handleDownloadFile(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Download File
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { handleDownloadAll(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_zip</span> Download All (ZIP)
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => { onOpenThemeModal(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>palette</span> Color Theme
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => { onOpenShortcuts(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>keyboard</span> Keyboard Shortcuts
                </button>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item"
                  onClick={() => { setRenaming(true); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Rename Room
                </button>
                <button
                  className="dropdown-item dropdown-item-danger"
                  onClick={() => { handleDelete(); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Delete Room
                </button>
              </div>
            )}
          </div>

          <span className={`conn-indicator ${isConnected ? 'on' : 'off'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>

        {/* Mobile: minimal right side — just user count + connection */}
        <div className="toolbar-right toolbar-actions-mobile">
          <div className="user-count" title={`${userCount} user(s) online`}>
            <span className="user-count-dot" />
            {userCount}
          </div>
          <span className={`conn-indicator ${isConnected ? 'on' : 'off'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          MOBILE FLOATING BOTTOM BAR
          Panel toggles + secondary actions
          ═══════════════════════════════════════ */}
      <div className="mobile-action-bar">
        <div className="mobile-bar-inner">
          {/* Copy Code */}
          <button
            className="mobile-bar-btn"
            onClick={handleCopyCode}
            title="Copy code"
          >
            <span className="material-symbols-outlined">content_paste</span>
            <span className="mobile-bar-label">Copy</span>
          </button>

          {/* Screenshots */}
          <button
            className={`mobile-bar-btn ${showImagePanel ? 'active' : ''}`}
            onClick={onToggleImages}
          >
            <span className="material-symbols-outlined">image</span>
            <span className="mobile-bar-label">Images</span>
          </button>

          {/* Files */}
          <button
            className={`mobile-bar-btn ${showFilePanel ? 'active' : ''}`}
            onClick={onToggleFiles}
          >
            <span className="material-symbols-outlined">attach_file</span>
            <span className="mobile-bar-label">Files</span>
          </button>

          {/* AI */}
          <button
            className={`mobile-bar-btn ${showAIPanel ? 'active' : ''}`}
            onClick={onToggleAI}
          >
            <span className="material-symbols-outlined">robot_2</span>
            <span className="mobile-bar-label">AI</span>
          </button>

          {/* Users */}
          <button
            className={`mobile-bar-btn ${showSidebar ? 'active' : ''}`}
            onClick={onToggleSidebar}
          >
            <span className="material-symbols-outlined">group</span>
            <span className="mobile-bar-label">Users</span>
          </button>

          {/* More */}
          <div className="mobile-menu-wrapper">
            <button
              className="mobile-bar-btn"
              onClick={() => setShowMobileMenu(true)}
            >
              <span className="material-symbols-outlined">more_horiz</span>
              <span className="mobile-bar-label">More</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for 'More' Menu */}
      {showMobileMenu && (
        <>
          <div className="mobile-sheet-backdrop" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-bottom-sheet">
            <div className="mobile-sheet-header">
              <h3>More Options</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowMobileMenu(false)}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>
            <div className="mobile-sheet-content">
              <button
                className="dropdown-item sheet-item"
                onClick={() => { handleCopyCode(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">content_copy</span> Copy Code
              </button>
              <button
                className="dropdown-item sheet-item"
                onClick={() => { onOpenLineRange(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">select_all</span> Copy Lines...
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item sheet-item"
                onClick={() => { handleDownloadFile(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">download</span> Download File
              </button>
              <button
                className="dropdown-item sheet-item"
                onClick={() => { handleDownloadAll(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">folder_zip</span> Download All
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item sheet-item"
                onClick={() => { onOpenThemeModal(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">palette</span> Color Theme
              </button>
              <button
                className="dropdown-item sheet-item"
                onClick={() => { onOpenShortcuts(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">keyboard</span> Shortcuts
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item sheet-item"
                onClick={() => { setRenaming(true); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">edit</span> Rename Room
              </button>
              <button
                className="dropdown-item sheet-item dropdown-item-danger"
                onClick={() => { handleDelete(); setShowMobileMenu(false); }}
              >
                <span className="material-symbols-outlined">delete</span> Delete Room
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Toolbar;
