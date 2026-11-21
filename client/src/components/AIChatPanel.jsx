import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { AIChatMessage, AIChatCodeActionsContext } from './AIChatMessage';
import { AIChatSettings } from './AIChatSettings';
import { ErrorBoundary } from './ErrorBoundary';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_FILE_EXTENSIONS } from '../utils/constants';
import { getTabFileIcon } from '../utils/fileIconHelper';
import './AIChatPanel.css';

const SUGGESTIONS = [
  { icon: 'cloud_done', text: 'Optimise my code' },
  { icon: 'bug_report', text: 'Find bugs in my code' },
  { icon: 'lightbulb', text: 'Explain how this works' },
  { icon: 'help', text: 'How do I fix this error' },
];
export function AIChatPanel({
  aiChat,
  activeTab,
  tabs,
  ydocs,
  onClose,
  addToast,
  onApplyCode,
  onOpenNewTab,
  width: externalWidth,
  onWidthChange: externalOnWidthChange,
  isResizing: externalIsResizing = false,
}) {
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
    editAndResubmitMessage,
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
  const [dragType, setDragType] = useState(null); // 'tab' | 'file' | null

  const [internalWidth, setInternalWidth] = useState(() => {
    const saved = localStorage.getItem('codely-ai-panel-width');
    return saved ? parseInt(saved, 10) : 400;
  });

  const panelWidth = externalWidth !== undefined ? externalWidth : internalWidth;
  const setPanelWidth = externalOnWidthChange || setInternalWidth;
  const [internalIsResizing, setInternalIsResizing] = useState(false);
  const isResizing = externalIsResizing || internalIsResizing;

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(null);
  const panelElementRef = useRef(null);
  const modeMenuRef = useRef(null);
  const attachMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const dragCounter = useRef(0);
  const chatContainerRef = useRef(null);
  const isUserScrolledUp = useRef(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isInitialMount = useRef(true);

  // Instantly pin to the bottom before paint when opening the panel (no top-to-bottom scroll animation)
  useLayoutEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      // Re-verify bottom position after any initial child layouts settle without animating
      const timer = setTimeout(() => {
        if (chatContainerRef.current && !isUserScrolledUp.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
        isInitialMount.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }

    if (!isUserScrolledUp.current && chatContainerRef.current) {
      if (isStreaming) {
        // While streaming response tokens, pin instantly to prevent jumping/jitter
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      } else {
        // When new message arrives while panel is open, smooth scroll
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isUserScrolledUp.current = distanceFromBottom > 60;
    setShowScrollBottom(distanceFromBottom > 80);
  };

  const scrollToBottom = () => {
    isUserScrolledUp.current = false;
    setShowScrollBottom(false);
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(42, Math.min(textareaRef.current.scrollHeight, 160)) + 'px';
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
    e.preventDefault();
    isDragging.current = true;
    setInternalIsResizing(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const panelRect = panelElementRef.current?.getBoundingClientRect();
    const rightEdge = panelRect ? panelRect.right : document.body.clientWidth;
    dragStartX.current = { rightEdge };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const rightEdge = dragStartX.current?.rightEdge ?? document.body.clientWidth;
    const newWidth = Math.min(Math.max(280, rightEdge - clientX), window.innerWidth - 300);
    setPanelWidth(newWidth);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setInternalIsResizing(false);
    dragStartX.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove);
    document.removeEventListener('touchend', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    setPanelWidth((w) => {
      localStorage.setItem('codely-ai-panel-width', String(w));
      return w;
    });
  };

  const handleResetWidth = () => {
    setPanelWidth(400);
    localStorage.setItem('codely-ai-panel-width', '400');
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

  const handleEditMessage = (messageIndex, newText) => {
    if (!messages || messageIndex < 0 || messageIndex >= messages.length) return;
    isUserScrolledUp.current = false;
    const targetMsg = messages[messageIndex];
    let freshFiles = [];
    if (targetMsg?.attachedFiles && Array.isArray(targetMsg.attachedFiles) && targetMsg.attachedFiles.length > 0) {
      freshFiles = targetMsg.attachedFiles.map(f => {
        const tab = (tabsArray || []).find(t => t && t.name === f.fileName);
        if (tab) {
          return { ...f, code: getLiveCode(tab) };
        }
        return f;
      });
    }
    editAndResubmitMessage(messageIndex, newText, freshFiles);
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
    const types = e.dataTransfer?.types ? Array.from(e.dataTransfer.types) : [];
    const isTab = types.includes('application/codely-tab');
    const isFile = types.includes('Files');
    if (isTab || isFile) {
      setIsDragOver(true);
      setDragType(isTab ? 'tab' : 'file');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragOver(false);
      setDragType(null);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragType(null);
    dragCounter.current = 0;

    // 1. Check if dropped item is an editor tab
    const tabDataStr = e.dataTransfer?.getData('application/codely-tab');
    if (tabDataStr) {
      try {
        const tabInfo = JSON.parse(tabDataStr);
        const targetTab = tabs[tabInfo.id] || tabsArray.find(t => t.id === tabInfo.id || t.name === tabInfo.name);
        if (targetTab) {
          handleSelectTabToAttach(targetTab);
          setTimeout(() => textareaRef.current?.focus(), 50);
          return;
        }
      } catch (err) {
        console.error('Failed to parse dropped tab:', err);
      }
    }

    // 2. Check if dropped items are files or images from the operating system
    if (e.dataTransfer?.files?.length) {
      handleMediaFiles(Array.from(e.dataTransfer.files));
    }
  };

  // ── Clipboard Paste (Ctrl+V) Handler for Images & Files ──
  const handlePaste = (e) => {
    if (e.defaultPrevented) return;
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const filesToAttach = [];

    // 1. Check clipboard files (e.g. copied from Windows Explorer / macOS Finder)
    if (clipboardData.files && clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        filesToAttach.push(clipboardData.files[i]);
      }
    }

    // 2. Check clipboard items (e.g. screenshots, browser copied images)
    if (filesToAttach.length === 0 && clipboardData.items) {
      for (const item of clipboardData.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            filesToAttach.push(file);
          }
        }
      }
    }

    // If any files/images were found in the clipboard, attach them!
    if (filesToAttach.length > 0) {
      // Prevent default only if we attached files, so plain text paste is untouched!
      e.preventDefault();

      const normalizedFiles = filesToAttach.map((file) => {
        if (!file.name || file.name === 'blob' || file.name === 'image') {
          const ext = file.type === 'image/jpeg' ? '.jpg' : file.type === 'image/webp' ? '.webp' : '.png';
          return new File([file], `pasted-image-${Date.now()}${ext}`, { type: file.type || 'image/png' });
        }
        return file;
      });

      handleMediaFiles(normalizedFiles);
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
      ref={panelElementRef}
      className={`ai-chat-panel ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${panelWidth}px` }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <div
        className={`ai-resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onDoubleClick={handleResetWidth}
        title="Drag to resize AI sidebar (Double click to reset)"
      >
        <div className="ai-resize-indicator" />
      </div>

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="ai-drop-overlay">
          <div className="ai-drop-overlay-content">
            <span className="material-symbols-outlined">
              {dragType === 'tab' ? 'tab' : 'upload_file'}
            </span>
            <span>
              {dragType === 'tab' ? 'Drop tab to attach as context' : 'Drop image or document'}
            </span>
            <span className="ai-drop-hint">
              {dragType === 'tab'
                ? 'File code will be attached as context for your prompt'
                : 'Images, PDFs, code files, and text documents'}
            </span>
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
          <ErrorBoundary title="Error displaying chat messages">
            <AIChatCodeActionsContext.Provider value={{ onApplyCode, onOpenNewTab }}>
              {messages.map((msg, i) => (
                <AIChatMessage
                  key={msg?.id || `msg-${i}`}
                  message={msg}
                  messageIndex={i}
                  isStreaming={isStreaming}
                  onEditMessage={(newText) => handleEditMessage(i, newText)}
                />
              ))}
            </AIChatCodeActionsContext.Provider>
          </ErrorBoundary>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        {/* Centered Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            className="ai-scroll-bottom-btn"
            onClick={scrollToBottom}
            title="Scroll to bottom"
            aria-label="Scroll to bottom"
          >
            <span className="material-symbols-outlined">arrow_downward</span>
          </button>
        )}

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
                <span className="tab-icon" aria-hidden="true">
                  {getTabFileIcon(file.fileName, file.language)}
                </span>
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
          <textarea
            ref={textareaRef}
            className="ai-textarea"
            placeholder="Ask a question (Shift + Enter for new line)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isStreaming}
            rows={2}
          />
          <div className="ai-input-toolbar">
            <div className="ai-input-toolbar-left">
              <div className="ai-attach-menu-wrapper" ref={attachMenuRef}>
                <button
                  type="button"
                  className="ai-attach-btn"
                  title="Add context"
                  aria-label="Add context"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                >
                  <span className="material-symbols-outlined">add</span>
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
            </div>

            <div className="ai-input-toolbar-right">
              <button
                type="button"
                className="ai-send-btn"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || hasLoadingMedia}
                title={hasLoadingMedia ? 'Uploading files...' : 'Send message (Enter)'}
                aria-label="Send message"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
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
