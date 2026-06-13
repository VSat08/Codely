import { useState, useRef, useEffect } from 'react';
import { LANGUAGES, getExtensionForLanguage } from '../utils/constants';
import JSZip from 'jszip';
import './Toolbar.css';

/**
 * Top toolbar — room info, language selector, action buttons.
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
  const [renaming, setRenaming] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const menuRef = useRef(null);
  const langMenuRef = useRef(null);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const altKey = isMac ? 'Option' : 'Alt';

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showLangMenu]);

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
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>content_copy</span>
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

      {/* Right: Actions */}
      <div className="toolbar-right">
        <div className="user-count" title={`${userCount} user(s) online`}>
          <span className="user-count-dot" />
          {userCount}
        </div>

        <button
          className="btn btn-icon btn-ghost"
          onClick={handleCopyCode}
          title="Copy code"
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>content_paste</span>
        </button>

        <button
          className={`btn btn-icon btn-ghost ${showImagePanel ? 'active' : ''}`}
          onClick={onToggleImages}
          title={`Toggle Screenshots (${altKey} + 2)`}
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>image</span>
        </button>

        <button
          className={`btn btn-icon btn-ghost ${showFilePanel ? 'active' : ''}`}
          onClick={onToggleFiles}
          title={`Toggle Files (${altKey} + 3)`}
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>attach_file</span>
        </button>

        <button
          className={`btn btn-icon btn-ghost ${showAIPanel ? 'active' : ''}`}
          onClick={onToggleAI}
          title={`Toggle AI Assistant (${altKey} + 4)`}
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>smart_toy</span>
        </button>

        <button
          className={`btn btn-icon btn-ghost ${showSidebar ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title={`Toggle Users Sidebar (${altKey} + 1)`}
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>group</span>
        </button>

        {/* More Menu */}
        <div className="menu-wrapper" ref={menuRef}>
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => setShowMenu(!showMenu)}
            title="Room settings"
          >
            <span className="material-symbols-outlined" style={{fontSize: '20px'}}>more_vert</span>
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => { handleCopyCode(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>content_copy</span> Copy Code
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onOpenLineRange(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>select_all</span> Copy Lines...
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { handleDownloadFile(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>download</span> Download File
              </button>
              <button
                className="dropdown-item"
                onClick={() => { handleDownloadAll(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>folder_zip</span> Download All (ZIP)
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { onOpenThemeModal(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>palette</span> Color Theme
              </button>
              <button
                className="dropdown-item"
                onClick={() => { onOpenShortcuts(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>keyboard</span> Keyboard Shortcuts
              </button>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => { setRenaming(true); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>edit</span> Rename Room
              </button>
              <button
                className="dropdown-item dropdown-item-danger"
                onClick={() => { handleDelete(); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span> Delete Room
              </button>
            </div>
          )}
        </div>

        <span className={`conn-indicator ${isConnected ? 'on' : 'off'}`} title={isConnected ? 'Connected' : 'Disconnected'} />
      </div>
    </div>
  );
}

export default Toolbar;
