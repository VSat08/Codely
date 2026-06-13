import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useRoom } from '../hooks/useRoom';
import CodeEditor from '../components/CodeEditor';
import Toolbar from '../components/Toolbar';
import TabsBar from '../components/TabsBar';
import UserPresence from '../components/UserPresence';
import ImagePanel from '../components/ImagePanel';
import ImageLightbox from '../components/ImageLightbox';
import LineRangeModal from '../components/LineRangeModal';
import Toast from '../components/Toast';
import { useState, useCallback, useEffect } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { AIChatPanel } from '../components/AIChatPanel';
import FilePanel from '../components/FilePanel';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import ThemeModal from '../components/ThemeModal';
import { getExtensionForLanguage } from '../utils/constants';
import './Room.css';

function Room() {
  const { roomId } = useParams();
  const { socket, isConnected } = useSocket();
  const room = useRoom(socket, roomId);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLineRange, setShowLineRange] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editorTheme, setEditorTheme] = useState(
    localStorage.getItem('codely-editor-theme') || 'vs-dark'
  );
  const [toasts, setToasts] = useState([]);

  const aiChat = useAIChat(socket, roomId, room.currentUser?.name);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Link copied to clipboard!', 'success');
  }, [addToast]);

  const handleLanguageChange = (newLanguage) => {
    if (room.activeTabId) {
      room.handleTabLanguageChange(room.activeTabId, newLanguage);
    }
  };

  const handleCodeChange = (newCode) => {
    if (room.activeTabId) {
      room.handleTabCodeChange(room.activeTabId, newCode);
    }
  };

  const handleThemeChange = (newTheme) => {
    setEditorTheme(newTheme);
    localStorage.setItem('codely-editor-theme', newTheme);
    addToast('Theme applied', 'success');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // We no longer block shortcuts in inputs/textareas so they work in the editor!

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': // New Tab
            e.preventDefault();
            try {
              const defaultName = `Untitled-${Object.keys(room.tabs).length + 1}.${getExtensionForLanguage('javascript')}`;
              const newTab = await room.handleAddTab(defaultName, 'javascript');
              room.setActiveTabId(newTab.id);
            } catch (err) {
              addToast('Failed to create tab', 'error');
            }
            break;
          case 'w': // Close Tab
            e.preventDefault();
            if (e.shiftKey) {
              // Close all (keep one to prevent empty state error on backend)
              const tabIds = Object.keys(room.tabs);
              if (tabIds.length > 1) {
                // Delete all except active (or first)
                const keepId = room.activeTabId || tabIds[0];
                for (const id of tabIds) {
                  if (id !== keepId) {
                    room.handleDeleteTab(id).catch(() => {});
                  }
                }
                addToast('Closed other tabs', 'info');
              }
            } else if (room.activeTabId && Object.keys(room.tabs).length > 1) {
              // Close current
              room.handleDeleteTab(room.activeTabId).catch(() => addToast('Failed to close tab', 'error'));
            }
            break;
          case 'r': // Rename Room
            e.preventDefault();
            window.dispatchEvent(new Event('trigger-rename-room'));
            break;
          case 'e': // Rename Tab
            e.preventDefault();
            window.dispatchEvent(new Event('trigger-rename-tab'));
            break;
          case '1': // Toggle Users
            e.preventDefault();
            setShowSidebar(prev => !prev);
            break;
          case '2': // Toggle Images
            e.preventDefault();
            setShowImagePanel(prev => !prev);
            break;
          case '3': // Toggle Files
            e.preventDefault();
            setShowFilePanel(prev => !prev);
            break;
          case '4': // Toggle AI
            e.preventDefault();
            setShowAIPanel(prev => !prev);
            break;
          case 't': // Toggle Theme
            e.preventDefault();
            setShowThemeModal(prev => !prev);
            break;
          case '/': // Show Shortcuts
            e.preventDefault();
            setShowShortcuts(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room, addToast]);

  if (!room.isJoined) {
    return (
      <div className="room-loading">
        <div className="spinner" />
        <p>Joining room...</p>
      </div>
    );
  }

  return (
    <div className="room">
      {/* Toolbar */}
      <Toolbar
        roomId={roomId}
        language={room.activeTab?.language || 'javascript'}
        onLanguageChange={handleLanguageChange}
        onCopyLink={handleCopyLink}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleImages={() => setShowImagePanel(!showImagePanel)}
        onToggleFiles={() => setShowFilePanel(!showFilePanel)}
        onToggleAI={() => setShowAIPanel(!showAIPanel)}
        showSidebar={showSidebar}
        showImagePanel={showImagePanel}
        showFilePanel={showFilePanel}
        showAIPanel={showAIPanel}
        isConnected={isConnected}
        onRenameRoom={room.handleRenameRoom}
        onDeleteRoom={room.handleDeleteRoom}
        addToast={addToast}
        userCount={Object.keys(room.users).length}
        activeTab={room.activeTab}
        tabs={room.tabs}
        onOpenLineRange={() => setShowLineRange(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenThemeModal={() => setShowThemeModal(true)}
      />

      {/* Main Area */}
      <div className="room-body">
        {/* Editor Area */}
        <div className="editor-area">
          <TabsBar
            tabs={room.tabs}
            activeTabId={room.activeTabId}
            onTabChange={room.setActiveTabId}
            onTabAdd={room.handleAddTab}
            onTabDelete={room.handleDeleteTab}
            onTabRename={room.handleRenameTab}
          />
          {room.activeTab ? (
            <CodeEditor
              code={room.activeTab.code}
              language={room.activeTab.language}
              onChange={handleCodeChange}
              isRemoteChange={room.isRemoteChange}
              theme={editorTheme}
            />
          ) : (
            <div className="empty-editor">
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.5 }}>code_blocks</span>
              <p>No tabs open. Create one to start coding.</p>
            </div>
          )}
        </div>

        {showAIPanel && (
          <AIChatPanel
            aiChat={aiChat}
            activeTab={room.activeTabId}
            tabs={room.tabs}
            onClose={() => setShowAIPanel(false)}
            addToast={addToast}
          />
        )}

        {/* Sidebar */}
        {showSidebar && (
          <div className="sidebar">
            <div className="sidebar-header-mobile">
              <span className="sidebar-title">Room Users</span>
              <button 
                className="btn btn-icon btn-ghost close-sidebar-btn" 
                onClick={() => setShowSidebar(false)}
                title="Close sidebar"
              >
                <span className="material-symbols-outlined" style={{fontSize: '20px'}}>close</span>
              </button>
            </div>
            <UserPresence
              users={room.users}
              currentUser={room.currentUser}
              onRenameUser={room.handleRenameUser}
              socketId={socket?.id}
            />
          </div>
        )}
      </div>

      {/* Image Panel */}
      {showImagePanel && (
        <ImagePanel
          images={room.images}
          onImageShare={room.handleImageShare}
          onImageDelete={room.handleImageDelete}
          onImageClick={setLightboxImage}
          addToast={addToast}
        />
      )}

      {/* File Panel */}
      {showFilePanel && (
        <FilePanel
          files={room.files}
          onFileShare={room.handleFileShare}
          onFileDelete={room.handleFileDelete}
          addToast={addToast}
        />
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* Line Range Modal */}
      {showLineRange && room.activeTab && (
        <LineRangeModal
          code={room.activeTab.code}
          fileName={room.activeTab.name}
          onClose={() => setShowLineRange(false)}
          addToast={addToast}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <ThemeModal 
          currentTheme={editorTheme}
          onSelectTheme={handleThemeChange}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </div>
  );
}

export default Room;
