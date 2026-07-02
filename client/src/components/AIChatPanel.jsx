import React, { useState, useRef, useEffect } from 'react';
import { AIChatMessage } from './AIChatMessage';
import { AIChatSettings } from './AIChatSettings';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_FILE_EXTENSIONS } from '../utils/constants';
import './AIChatPanel.css';

const SUGGESTIONS = [
  { icon: 'cloud_done', text: 'Optimise my code' },
  { icon: 'bug_report', text: 'Find bugs in my code' },
  { icon: 'lightbulb', text: 'Explain how this works' },
  { icon: 'help', text: 'How do I fix this error' },
];
export function AIChatPanel({ aiChat, activeTab, tabs, ydocs, onClose, addToast }) {
  // Helper: read live code from Yjs doc (the source of truth), falling back to tab.code
  const getLiveCode = (tab) => {
    if (ydocs && ydocs[tab.id]) {
      return ydocs[tab.id].getText('monaco').toString();
    }
    return tab.code || '';
  };
  const {
    messages,
    isStreaming,
    aiMode,
    setAiMode,
    provider,
    setProvider,
    aiModel,
    setAiModel,
    apiKey,
    setApiKey,
    attachedFiles,
    attachedMedia,
    sendMessage,
    attachFile,
    removeAttachedFile,
    attachMedia,
    removeAttachedMedia,
    retryAttachMedia,
    stopGeneration,
    getUsageStats,
    providerLimits,
    clearChat
  } = aiChat;

  const tabsArray = Object.values(tabs);

  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [panelWidth, setPanelWidth] = useState(400);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isDragging = useRef(false);
  const modeMenuRef = useRef(null);
  const attachMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const dragCounter = useRef(0);
  const chatContainerRef = useRef(null);
  const isUserScrolledUp = useRef(false);

  useEffect(() => {
    if (!isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    isUserScrolledUp.current = scrollHeight - scrollTop - clientHeight > 50;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Click outside for menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const newWidth = document.body.clientWidth - e.clientX;
    if (newWidth >= 300 && newWidth <= 800) {
      setPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    isUserScrolledUp.current = false;

    // Refresh all attached file codes from Yjs before sending,
    // so the AI always sees the latest editor content, not a stale snapshot.
    const freshFiles = attachedFiles.map(f => {
      const tab = tabsArray.find(t => t.name === f.fileName);
      if (tab) {
        return { ...f, code: getLiveCode(tab) };
      }
      return f;
    });

    const result = sendMessage(input, freshFiles);
    if (result?.error) {
      addToast(result.error, 'error');
      return;
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectTabToAttach = (tab) => {
    if (attachedFiles.length >= 5) {
      addToast('Maximum 5 files can be attached', 'error');
      return;
    }
    if (attachedFiles.some(f => f.fileName === tab.name)) {
      addToast('File already attached', 'info');
      return;
    }
    attachFile(getLiveCode(tab), tab.language, tab.name);
    setShowAttachMenu(false);
    addToast(`📎 Attached ${tab.name}`, 'success');
  };

  const handleSuggestionClick = (text) => {
    isUserScrolledUp.current = false;

    // Refresh all already-attached file codes from Yjs
    let currentFiles = attachedFiles.map(f => {
      const tab = tabsArray.find(t => t.name === f.fileName);
      if (tab) {
        return { ...f, code: getLiveCode(tab) };
      }
      return f;
    });

    // Auto-attach current file for context if not already attached
    if (activeTab && !currentFiles.some(f => f.fileName === tabs[activeTab]?.name)) {
      const tab = tabs[activeTab];
      if (tab && currentFiles.length < 5) {
        const liveCode = getLiveCode(tab);
        currentFiles.push({ code: liveCode, language: tab.language, fileName: tab.name });
        attachFile(liveCode, tab.language, tab.name);
      }
    }
    // We send message passing the overridden files to fix race condition
    sendMessage(text, currentFiles);
  };

  // ── Media Upload Handlers ──

  const handleMediaFiles = (files) => {
    for (const file of files) {
      const result = attachMedia(file);
      if (result?.error) {
        addToast(result.error, 'error');
      }
    }
  };

  const handleImageInputChange = (e) => {
    if (e.target.files?.length) {
      handleMediaFiles(Array.from(e.target.files));
    }
    e.target.value = ''; // Reset so same file can be re-selected
    setShowAttachMenu(false);
  };

  const handleDocInputChange = (e) => {
    if (e.target.files?.length) {
      handleMediaFiles(Array.from(e.target.files));
    }
    e.target.value = '';
    setShowAttachMenu(false);
  };

  // ── Drag & Drop ──

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer?.files?.length) {
      handleMediaFiles(Array.from(e.dataTransfer.files));
    }
  };

  const hasLoadingMedia = attachedMedia.some(m => m.status === 'loading');


  // Helper: get icon for document type
  const getDocIcon = (mimeType) => {
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType === 'text/csv') return 'table_chart';
    if (mimeType === 'text/markdown') return 'article';
    return 'description';
  };

  return (
    <div
      className="ai-chat-panel"
      style={{ width: `${panelWidth}px` }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="ai-resize-handle" onMouseDown={handleMouseDown}>
        <div className="ai-resize-indicator" />
      </div>

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="ai-drop-overlay">
          <div className="ai-drop-overlay-content">
            <span className="material-symbols-outlined">upload_file</span>
            <span>Drop image or document</span>
            <span className="ai-drop-hint">Images, PDFs, code files, and text documents</span>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />
      <input
        ref={docInputRef}
        type="file"
        accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
        multiple
        style={{ display: 'none' }}
        onChange={handleDocInputChange}
      />

      <div className="ai-chat-header">
        <div className="ai-header-left">
          <div className="ai-header-title">
            <span className="text-accent" style={{ fontWeight: 600 }}>Codely</span> <span>AI</span>
          </div>

          <div className="ai-mode-selector-wrapper" ref={modeMenuRef}>
            <button
              className="ai-mode-btn"
              onClick={() => setShowModeMenu(!showModeMenu)}
              title="Shared chats are visible to the room. Private chats are only visible to you."
            >
              <span className="material-symbols-outlined">{aiMode === 'shared' ? 'link' : 'lock'}</span>
              {aiMode === 'shared' ? 'Shared' : 'Private'}
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: '2px' }}>expand_more</span>
            </button>
            {showModeMenu && (
              <div className="ai-dropdown-menu">
                <button className={`ai-dropdown-item ${aiMode === 'shared' ? 'active' : ''}`} onClick={() => { setAiMode('shared'); setShowModeMenu(false); }}>
                  <span className="material-symbols-outlined">link</span> Shared
                </button>
                <button className={`ai-dropdown-item ${aiMode === 'private' ? 'active' : ''}`} onClick={() => { setAiMode('private'); setShowModeMenu(false); }}>
                  <span className="material-symbols-outlined">lock</span> Private
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="ai-header-actions">
          <button className="btn btn-icon btn-ghost" onClick={() => setShowSettings(true)} title="AI Settings">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>apps</span>
          </button>
          <button className="btn btn-icon btn-ghost" onClick={clearChat} title="Clear Chat">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete_outline</span>
          </button>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close Panel">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
      </div>

      <div className="ai-chat-messages" ref={chatContainerRef} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--accent)' }}>robot_2</span>
            </div>
            <p>Ask anything about your code — debug, explain, optimize, or just explore ideas.</p>
            <div className="ai-empty-suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="ai-suggestion-chip"
                  onClick={() => handleSuggestionClick(s.text)}
                >
                  <span className="material-symbols-outlined">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <AIChatMessage key={i} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        {isStreaming && (
          <div className="ai-streaming-controls">
            <button className="btn btn-small" onClick={stopGeneration}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>stop_circle</span> Stop generating
            </button>
          </div>
        )}

        {/* Attached Code Files */}
        {attachedFiles.length > 0 && (
          <div className="ai-attached-files-container">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="ai-attached-chip">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
                <span className="file-name">{file.fileName}</span>
                <button className="btn btn-icon btn-ghost btn-small" onClick={() => removeAttachedFile(file.fileName)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Attached Media Files (Images/Documents) */}
        {attachedMedia.length > 0 && (
          <div className="ai-attached-media-container">
            {attachedMedia.map((media) => (
              <div key={media.id} className={`ai-media-chip ${media.status}`}>
                {/* Thumbnail or Icon */}
                {media.mimeType.startsWith('image/') ? (
                  media.status === 'loading' ? (
                    <div className="ai-media-thumb-placeholder">
                      <div className="ai-media-spinner" />
                    </div>
                  ) : media.status === 'error' ? (
                    <div className="ai-media-thumb-placeholder error">
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                    </div>
                  ) : (
                    <img src={media.previewUrl} alt={media.name} className="ai-media-thumbnail" />
                  )
                ) : (
                  <div className={`ai-media-doc-icon ${media.status === 'error' ? 'error' : ''}`}>
                    {media.status === 'loading' ? (
                      <div className="ai-media-spinner" />
                    ) : media.status === 'error' ? (
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{getDocIcon(media.mimeType)}</span>
                    )}
                  </div>
                )}

                {/* File info */}
                <div className="ai-media-info">
                  <span className="ai-media-name">{media.name}</span>
                  {media.status === 'loading' && <span className="ai-media-status-text">Uploading...</span>}
                  {media.status === 'error' && <span className="ai-media-status-text error">Failed</span>}
                </div>

                {/* Actions */}
                <div className="ai-media-actions">
                  {media.status === 'error' && (
                    <button
                      className="btn btn-icon btn-ghost btn-small ai-media-retry-btn"
                      onClick={() => retryAttachMedia(media.id)}
                      title="Retry upload"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
                    </button>
                  )}
                  <button
                    className="btn btn-icon btn-ghost btn-small"
                    onClick={() => removeAttachedMedia(media.id)}
                    title="Remove"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ai-input-wrapper">
          <div className="ai-attach-menu-wrapper" ref={attachMenuRef}>
            <button
              className="btn btn-icon btn-ghost ai-attach-btn"
              title="Attach context"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add</span>
            </button>
            {showAttachMenu && (
              <div className="ai-dropdown-menu ai-attach-dropdown">
                {/* Code Tabs Section */}
                <div className="ai-attach-section-header">Code Tabs</div>
                {tabsArray.length === 0 ? (
                  <div className="ai-dropdown-empty">No tabs open</div>
                ) : (
                  tabsArray.map(tab => (
                    <button
                      key={tab.id}
                      className="ai-dropdown-item"
                      onClick={() => handleSelectTabToAttach(tab)}
                    >
                      <span className="material-symbols-outlined">code</span> {tab.name}
                    </button>
                  ))
                )}

                {/* Upload Section */}
                <div className="ai-attach-section-header">Upload</div>
                <button
                  className="ai-dropdown-item"
                  onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                >
                  <span className="material-symbols-outlined">image</span> Image
                </button>
                <button
                  className="ai-dropdown-item"
                  onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                >
                  <span className="material-symbols-outlined">upload_file</span> File
                </button>
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            placeholder="Ask a question(Shift + Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
          />
          <button
            className="btn btn-icon btn-primary ai-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || hasLoadingMedia}
            title={hasLoadingMedia ? 'Uploading files...' : 'Send message'}
            style={{ borderRadius: '8px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <AIChatSettings
          provider={provider}
          setProvider={setProvider}
          aiModel={aiModel}
          setAiModel={setAiModel}
          apiKey={apiKey}
          setApiKey={setApiKey}
          getUsageStats={getUsageStats}
          providerLimits={providerLimits}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
