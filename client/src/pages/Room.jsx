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
import { useState, useCallback } from 'react';
import './Room.css';

function Room() {
  const { roomId } = useParams();
  const { socket, isConnected } = useSocket();
  const room = useRoom(socket, roomId);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLineRange, setShowLineRange] = useState(false);
  const [toasts, setToasts] = useState([]);

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
        showSidebar={showSidebar}
        showImagePanel={showImagePanel}
        isConnected={isConnected}
        onRenameRoom={room.handleRenameRoom}
        onDeleteRoom={room.handleDeleteRoom}
        addToast={addToast}
        userCount={Object.keys(room.users).length}
        activeTab={room.activeTab}
        tabs={room.tabs}
        onOpenLineRange={() => setShowLineRange(true)}
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
            />
          ) : (
            <div className="empty-editor">
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.5 }}>code_blocks</span>
              <p>No tabs open. Create one to start coding.</p>
            </div>
          )}
        </div>

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
