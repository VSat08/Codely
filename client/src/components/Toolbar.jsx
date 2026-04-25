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
  showSidebar,
  showImagePanel,
  isConnected,
  onRenameRoom,
  onDeleteRoom,
  addToast,
  userCount,
  activeTab,
  tabs,
  onOpenLineRange,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

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
        <select
          className="language-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          id="language-selector"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
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
          title="Toggle screenshots"
        >
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>image</span>
        </button>

        <button
          className={`btn btn-icon btn-ghost ${showSidebar ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title="Toggle sidebar"
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
