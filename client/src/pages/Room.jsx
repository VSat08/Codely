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
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAIChat } from '../hooks/useAIChat';
import { AIChatPanel } from '../components/AIChatPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import KeyboardShortcutsModal from '../components/KeyboardShortcutsModal';
import ThemeModal from '../components/ThemeModal';
import UnifiedPanel from '../components/UnifiedPanel';
import { parseErrors } from '../utils/errorParser';
import { getExtensionForLanguage, normalizeLanguage } from '../utils/constants';
import { getRunMode, getRunTooltip } from '../utils/languageRunner';
import './Room.css';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

function Room() {
  const { roomId } = useParams();
  const { socket, isConnected, reconnectCount } = useSocket();
  const room = useRoom(socket, roomId, reconnectCount);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'terminal' | 'preview' | 'images' | 'files' | null
  const [panelDock, setPanelDock] = useState(
    () => localStorage.getItem('codely-panel-dock') || 'bottom'
  );
  const [isMobileScreen, setIsMobileScreen] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveDock = isMobileScreen ? 'bottom' : panelDock;
  const [terminalChunks, setTerminalChunks] = useState([]);
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState(null);
  const [problems, setProblems] = useState([]);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showLineRange, setShowLineRange] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editorTheme, setEditorTheme] = useState(
    () => localStorage.getItem('codely-editor-theme') || 'vs-dark'
  );
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', editorTheme);
  }, [editorTheme]);

  const aiChat = useAIChat(socket, roomId, room.currentUser?.name);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.length > 3 ? next.slice(-3) : next;
    });
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

  const handleThemeChange = (newTheme) => {
    setEditorTheme(newTheme);
    localStorage.setItem('codely-editor-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    addToast('Theme applied', 'success');
  };

  const [unifiedPanelHeight, setUnifiedPanelHeight] = useState(() => {
    const saved = localStorage.getItem('codely-unified-panel-height');
    return saved ? parseInt(saved, 10) : 280;
  });

  const [unifiedPanelWidth, setUnifiedPanelWidth] = useState(() => {
    const saved = localStorage.getItem('codely-unified-panel-width');
    return saved ? parseInt(saved, 10) : 480;
  });

  const [aiPanelWidth, setAiPanelWidth] = useState(() => {
    const saved = localStorage.getItem('codely-ai-panel-width');
    return saved ? parseInt(saved, 10) : 400;
  });

  const [isPanelMaximized, setIsPanelMaximized] = useState(false);
  const [isCornerDragging, setIsCornerDragging] = useState(false);
  const cornerDragRef = useRef(null);

  const handleCornerStartDrag = useCallback((e) => {
    e.preventDefault();
    setIsCornerDragging(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    cornerDragRef.current = {
      startX: clientX,
      startY: clientY,
      startHeight: unifiedPanelHeight,
      startWidth: aiPanelWidth,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  }, [unifiedPanelHeight, aiPanelWidth]);

  useEffect(() => {
    if (!isCornerDragging) return;

    const handleCornerMove = (e) => {
      if (!cornerDragRef.current) return;
      const { startX, startY, startHeight, startWidth } = cornerDragRef.current;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaY = startY - clientY;
      const deltaX = startX - clientX;

      const maxH = window.innerHeight - 100;
      const minH = 140;
      const nextH = Math.min(Math.max(minH, startHeight + deltaY), maxH);

      const maxW = window.innerWidth - 300;
      const minW = 280;
      const nextW = Math.min(Math.max(minW, startWidth + deltaX), maxW);

      setUnifiedPanelHeight(nextH);
      setAiPanelWidth(nextW);
    };

    const handleCornerEnd = () => {
      setIsCornerDragging(false);
      cornerDragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      setUnifiedPanelHeight((h) => {
        localStorage.setItem('codely-unified-panel-height', String(h));
        return h;
      });
      setAiPanelWidth((w) => {
        localStorage.setItem('codely-ai-panel-width', String(w));
        return w;
      });
    };

    window.addEventListener('mousemove', handleCornerMove);
    window.addEventListener('mouseup', handleCornerEnd);
    window.addEventListener('touchmove', handleCornerMove);
    window.addEventListener('touchend', handleCornerEnd);

    return () => {
      window.removeEventListener('mousemove', handleCornerMove);
      window.removeEventListener('mouseup', handleCornerEnd);
      window.removeEventListener('touchmove', handleCornerMove);
      window.removeEventListener('touchend', handleCornerEnd);
    };
  }, [isCornerDragging]);

  const togglePanel = useCallback((panelName) => {
    setActivePanel((current) => {
      if (current === panelName) {
        setIsPanelMaximized(false);
        return null;
      }
      return panelName;
    });
  }, []);

  const handleNavigateToProblem = useCallback((problem) => {
    if (!problem) return;
    if (problem.file && room.tabs) {
      const matchingTab = Object.values(room.tabs).find(
        (t) => t.name?.toLowerCase() === problem.file?.toLowerCase()
      );
      if (matchingTab && matchingTab.id !== room.activeTabId) {
        room.setActiveTabId(matchingTab.id);
        // Delay navigation slightly so Monaco has time to mount / switch model
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('codely:navigate-to-line', {
              detail: { line: problem.line, column: problem.column },
            })
          );
        }, 80);
        return;
      }
    }
    window.dispatchEvent(
      new CustomEvent('codely:navigate-to-line', {
        detail: { line: problem.line, column: problem.column },
      })
    );
  }, [room.tabs, room.activeTabId, room.setActiveTabId]);

  // Keep track of the active running file across tab switches
  const runningFileRef = useRef(null);

  // Socket.io Interactive Terminal event listeners
  useEffect(() => {
    if (!socket) return;

    const handleStarted = (payload) => {
      setIsTerminalRunning(true);
      setTerminalStatus(null);
      if (payload?.fileName) {
        runningFileRef.current = {
          fileName: payload.fileName,
          language: payload.language,
        };
      }
    };

    const handleData = ({ data, stream }) => {
      setTerminalChunks((prev) => {
        const next = [...prev, { text: data, stream }];
        if (next.length > 3000) {
          return next.slice(-2000);
        }
        return next;
      });
    };

    const handleExit = ({ code, signal, timeMs, stopped }) => {
      setIsTerminalRunning(false);
      const isUserInterrupt = signal === 'SIGINT' || signal === 'SIGTERM' || code === 130 || stopped === true;
      const success = code === 0 && !signal && !isUserInterrupt;
      setTerminalStatus({
        success,
        code,
        signal,
        timeMs,
        description: isUserInterrupt ? 'Stopped' : (success ? 'Success' : `Exit ${code}`)
      });

      if (isUserInterrupt) {
        addToast('Execution stopped', 'info');
      } else if (success) {
        addToast(`Executed in ${timeMs ? `${timeMs}ms` : '0ms'}`, 'success');
      } else {
        addToast(`Process exited with code ${code}`, 'error');
      }

      // If execution was interrupted/stopped by user (Ctrl+C / Stop), do not create synthetic code problems!
      if (isUserInterrupt) {
        setProblems([]);
        return;
      }

      // Parse accumulated errors for Problems tab & Monaco squigglies
      const activeRunningInfo = runningFileRef.current;
      setTerminalChunks((currentChunks) => {
        const errText = currentChunks
          .filter((c) => c.stream === 'stderr')
          .map((c) => c.text)
          .join('');
        const outText = currentChunks
          .filter((c) => c.stream === 'stdout')
          .map((c) => c.text)
          .join('');

        if (errText || !success) {
          const parsed = parseErrors(
            { stderr: errText, stdout: outText, success, code, signal, stopped },
            activeRunningInfo?.fileName || 'main',
            activeRunningInfo?.language
          );
          setProblems(parsed);
        }
        return currentChunks;
      });
    };

    socket.on('terminal:started', handleStarted);
    socket.on('terminal:data', handleData);
    socket.on('terminal:exit', handleExit);

    return () => {
      socket.off('terminal:started', handleStarted);
      socket.off('terminal:data', handleData);
      socket.off('terminal:exit', handleExit);
    };
  }, [socket, addToast]);

  const handleRunCode = useCallback(() => {
    if (!room.activeTab) {
      addToast('No active file to run', 'error');
      return;
    }

    const currentLanguage = room.activeTab.language;
    const currentFileName = room.activeTab.name || 'main';
    const mode = getRunMode(currentLanguage);

    if (mode === 'preview') {
      setActivePanel('preview');
      return;
    }

    if (mode === 'unsupported') {
      const tooltip = getRunTooltip(currentLanguage, room.activeTab.name);
      addToast(tooltip, 'info');
      return;
    }

    const liveCode = room.ydocs?.[room.activeTabId]?.getText('monaco').toString() || room.activeTab.code || '';

    if (!liveCode.trim()) {
      addToast('Cannot execute an empty file. Write some code first!', 'error');
      return;
    }

    // Open unified panel on terminal tab
    runningFileRef.current = {
      fileName: currentFileName,
      language: currentLanguage,
    };
    setActivePanel('terminal');
    setTerminalChunks([]);
    setTerminalStatus(null);
    setProblems([]);
    setIsTerminalRunning(true);

    if (socket && isConnected) {
      socket.emit('terminal:start', {
        roomId,
        language: currentLanguage,
        code: liveCode,
        fileName: currentFileName,
      }, (ack) => {
        if (ack?.error) {
          setIsTerminalRunning(false);
          addToast(ack.error, 'error');
        }
      });
    } else {
      addToast('Connecting to execution server...', 'info');
    }
  }, [room.activeTab, room.activeTabId, room.ydocs, socket, isConnected, roomId, addToast]);

  const handleSendTerminalInput = useCallback((input) => {
    setTerminalChunks((prev) => [...prev, { text: `${input}\n`, stream: 'stdin' }]);
    if (socket && isConnected) {
      socket.emit('terminal:input', { input });
    }
  }, [socket, isConnected]);

  const handleStopTerminal = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('terminal:kill');
    }
    setIsTerminalRunning(false);
  }, [socket, isConnected]);

  const handleClearTerminal = useCallback(() => {
    setTerminalChunks([]);
    setTerminalStatus(null);
    setProblems([]);
  }, []);

  const handleOpenCodeInNewTab = useCallback(async (code, lang) => {
    const normalizedLang = normalizeLanguage(lang);
    const ext = getExtensionForLanguage(normalizedLang);
    const tabCount = Object.keys(room.tabs || {}).length + 1;
    const defaultName = `Untitled-${tabCount}.${ext}`;

    try {
      const newTab = await room.handleAddTab(defaultName, normalizedLang);
      if (newTab && newTab.id) {
        room.setActiveTabId(newTab.id);
        // Populate code into Yjs document for the new tab
        const doc = room.ydocs?.[newTab.id];
        if (doc) {
          const ytext = doc.getText('monaco');
          doc.transact(() => {
            ytext.delete(0, ytext.length);
            ytext.insert(0, code);
          });
        }
        addToast(`Opened ${newTab.name || defaultName} in new tab`, 'success');
      }
    } catch (err) {
      addToast('Failed to create new tab', 'error');
    }
  }, [room.tabs, room.handleAddTab, room.setActiveTabId, room.ydocs, addToast]);

  const handleApplyCodeToEditor = useCallback((code, lang) => {
    if (!room.activeTabId || !room.activeTab) {
      handleOpenCodeInNewTab(code, lang);
      return;
    }

    const currentTab = room.activeTab;
    const normalizedSnippetLang = normalizeLanguage(lang);
    let appliedTabName = currentTab.name;

    // Language & Extension Sync:
    // If snippet has a valid programming language that differs from active tab's language,
    // sync the language and tab extension to match the snippet!
    if (normalizedSnippetLang && normalizedSnippetLang !== 'plaintext' && normalizedSnippetLang !== 'text') {
      if (currentTab.language !== normalizedSnippetLang) {
        const newExt = getExtensionForLanguage(normalizedSnippetLang);
        const baseName = currentTab.name ? currentTab.name.replace(/\.[^/.]+$/, '') : 'main';
        const newName = `${baseName}.${newExt}`;
        appliedTabName = newName;

        room.handleRenameTab(room.activeTabId, newName, normalizedSnippetLang).catch((err) => {
          console.warn('Failed to rename tab during language sync:', err);
        });
        room.handleTabLanguageChange(room.activeTabId, normalizedSnippetLang);
      }
    }

    // Dispatch event to Monaco editor
    window.dispatchEvent(new CustomEvent('codely:insert-code', {
      detail: { code }
    }));

    // Single unified toast notification
    addToast(`Applied code to ${appliedTabName} (Ctrl+Z to undo)`, 'success');
  }, [room.activeTabId, room.activeTab, room.handleTabLanguageChange, room.handleRenameTab, handleOpenCodeInNewTab, addToast]);

  // Platform detection for keyboard shortcuts
  const isMac = typeof navigator !== 'undefined' &&
    /mac|iphone|ipad|ipod/i.test(navigator.userAgentData?.platform || navigator.platform);

  // Keyboard Shortcuts — uses Ctrl (⌃) on Mac, Alt on Windows/Linux
  // Rationale: Option on Mac produces special chars, ⌘ Cmd conflicts with browser shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Support Ctrl+Enter / Cmd+Enter universally for running code
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
        return;
      }

      // Cross-platform modifier check: ctrlKey on Mac, altKey on Windows/Linux
      const modifierActive = isMac ? (e.ctrlKey && !e.metaKey) : e.altKey;
      if (!modifierActive) return;

      switch (e.key.toLowerCase()) {
        case 'enter': // Run Code
          e.preventDefault();
          handleRunCode();
          break;
        case 'j': // Toggle Terminal
          e.preventDefault();
          togglePanel('terminal');
          break;
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
              const keepId = room.activeTabId || tabIds[0];
              for (const id of tabIds) {
                if (id !== keepId) {
                  room.handleDeleteTab(id).catch(() => {});
                }
              }
              addToast('Closed other tabs', 'info');
            }
          } else if (room.activeTabId && Object.keys(room.tabs).length > 1) {
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
          togglePanel('images');
          break;
        case '3': // Toggle Files
          e.preventDefault();
          togglePanel('files');
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
        case ',': // Previous Tab
          e.preventDefault();
          {
            const tabIds = Object.keys(room.tabs);
            if (tabIds.length > 1 && room.activeTabId) {
              const currentIndex = tabIds.indexOf(room.activeTabId);
              const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
              room.setActiveTabId(tabIds[prevIndex]);
            }
          }
          break;
        case '.': // Next Tab
          e.preventDefault();
          {
            const tabIds = Object.keys(room.tabs);
            if (tabIds.length > 1 && room.activeTabId) {
              const currentIndex = tabIds.indexOf(room.activeTabId);
              const nextIndex = (currentIndex + 1) % tabIds.length;
              room.setActiveTabId(tabIds[nextIndex]);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room, addToast, isMac]);

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
        onToggleImages={() => togglePanel('images')}
        onToggleFiles={() => togglePanel('files')}
        onToggleAI={() => setShowAIPanel(!showAIPanel)}
        showSidebar={showSidebar}
        showImagePanel={activePanel === 'images'}
        showFilePanel={activePanel === 'files'}
        showAIPanel={showAIPanel}
        isConnected={isConnected}
        onRenameRoom={room.handleRenameRoom}
        onDeleteRoom={room.handleDeleteRoom}
        addToast={addToast}
        userCount={Object.keys(room.users).length}
        users={room.users}
        activeTab={room.activeTab}
        tabs={room.tabs}
        onOpenLineRange={() => setShowLineRange(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenThemeModal={() => setShowThemeModal(true)}
        liveCode={room.ydocs?.[room.activeTabId]?.getText('monaco').toString() || room.activeTab?.code || ''}
        ydocs={room.ydocs}
        onRunCode={handleRunCode}
        onStopCode={handleStopTerminal}
        isExecuting={isTerminalRunning}
        showTerminal={activePanel === 'terminal'}
        showWebPreview={activePanel === 'preview'}
        onToggleTerminal={() => togglePanel('terminal')}
        onToggleWebPreview={() => togglePanel('preview')}
      />

      {/* Main Area */}
      <div className="room-body">
        {/* Editor Area */}
        <div className={`editor-area ${activePanel ? 'panel-open' : 'panel-closed'} ${isPanelMaximized && activePanel ? `panel-maximized dock-${effectiveDock}` : ''}`}>
          <TabsBar
            tabs={room.tabs}
            activeTabId={room.activeTabId}
            onTabChange={room.setActiveTabId}
            onTabAdd={room.handleAddTab}
            onTabDelete={room.handleDeleteTab}
            onTabRename={room.handleRenameTab}
          />
          <div className="editor-workspace-row">
            <div className="editor-canvas-pane">
              {room.activeTab ? (
                <CodeEditor
                  ydoc={room.ydocs?.[room.activeTabId]}
                  awareness={room.awarenesses?.[room.activeTabId]}
                  language={room.activeTab.language}
                  theme={editorTheme}
                  tabId={room.activeTabId}
                  problems={problems}
                  activeTabName={room.activeTab?.name}
                />
              ) : (
                <div className="empty-editor">
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', opacity: 0.5 }}>code_blocks</span>
                  <p>No tabs open. Create one to start coding.</p>
                </div>
              )}
            </div>

            {/* Right-docked Unified Panel (VS Code style - Desktop only) */}
            {activePanel && effectiveDock === 'right' && (
              <UnifiedPanel
                isOpen={true}
                activeTab={activePanel}
                onTabChange={setActivePanel}
                onClose={() => { setActivePanel(null); setIsPanelMaximized(false); }}
                dock="right"
                onDockChange={(next) => { if (!isMobileScreen) setPanelDock(next); }}
                width={unifiedPanelWidth}
                onWidthChange={setUnifiedPanelWidth}
                height={unifiedPanelHeight}
                onHeightChange={setUnifiedPanelHeight}
                isMaximized={isPanelMaximized}
                onToggleMaximize={() => setIsPanelMaximized((prev) => !prev)}
                terminalChunks={terminalChunks}
                isTerminalRunning={isTerminalRunning}
                terminalStatus={terminalStatus}
                onRun={handleRunCode}
                onStop={handleStopTerminal}
                onSendTerminalInput={handleSendTerminalInput}
                onClearTerminal={handleClearTerminal}
                language={room.activeTab?.language}
                problems={problems}
                onNavigateToProblem={handleNavigateToProblem}
                activeHtmlCode={room.ydocs?.[room.activeTabId]?.getText('monaco').toString() || room.activeTab?.code || ''}
                tabs={room.tabs}
                ydocs={room.ydocs}
                images={room.images}
                onImageShare={room.handleImageShare}
                onImageDelete={room.handleImageDelete}
                onImageClick={setLightboxImage}
                files={room.files}
                onFileShare={room.handleFileShare}
                onFileDelete={room.handleFileDelete}
                addToast={addToast}
              />
            )}
          </div>

          {/* Bottom-docked Unified Panel (Desktop bottom or Mobile) */}
          {activePanel && effectiveDock === 'bottom' && (
            <UnifiedPanel
              isOpen={true}
              activeTab={activePanel}
              onTabChange={setActivePanel}
              onClose={() => { setActivePanel(null); setIsPanelMaximized(false); }}
              dock="bottom"
              onDockChange={(next) => { if (!isMobileScreen) setPanelDock(next); }}
              height={unifiedPanelHeight}
              onHeightChange={setUnifiedPanelHeight}
              width={unifiedPanelWidth}
              onWidthChange={setUnifiedPanelWidth}
              isResizing={isCornerDragging}
              isMaximized={isPanelMaximized}
              onToggleMaximize={() => setIsPanelMaximized((prev) => !prev)}
              terminalChunks={terminalChunks}
              isTerminalRunning={isTerminalRunning}
              terminalStatus={terminalStatus}
              onRun={handleRunCode}
              onStop={handleStopTerminal}
              onSendTerminalInput={handleSendTerminalInput}
              onClearTerminal={handleClearTerminal}
              language={room.activeTab?.language}
              problems={problems}
              onNavigateToProblem={handleNavigateToProblem}
              activeHtmlCode={room.ydocs?.[room.activeTabId]?.getText('monaco').toString() || room.activeTab?.code || ''}
              tabs={room.tabs}
              ydocs={room.ydocs}
              images={room.images}
              onImageShare={room.handleImageShare}
              onImageDelete={room.handleImageDelete}
              onImageClick={setLightboxImage}
              files={room.files}
              onFileShare={room.handleFileShare}
              onFileDelete={room.handleFileDelete}
              addToast={addToast}
            />
          )}
        </div>

        {showAIPanel && (
          <ErrorBoundary title="Codely AI Panel Error">
            <AIChatPanel
              aiChat={aiChat}
              activeTab={room.activeTabId}
              tabs={room.tabs}
              ydocs={room.ydocs}
              onClose={() => setShowAIPanel(false)}
              addToast={addToast}
              onApplyCode={handleApplyCodeToEditor}
              onOpenNewTab={handleOpenCodeInNewTab}
              width={aiPanelWidth}
              onWidthChange={setAiPanelWidth}
              isResizing={isCornerDragging}
            />
          </ErrorBoundary>
        )}

        {/* Corner Sash Intersection (Diagonal 2-Way Resize) */}
        {!isPanelMaximized && activePanel && effectiveDock === 'bottom' && showAIPanel && (
          <div
            className={`sash-corner-intersection ${isCornerDragging ? 'resizing' : ''}`}
            style={{
              right: `${(showSidebar ? 240 : 0) + aiPanelWidth - 7}px`,
              bottom: `${unifiedPanelHeight - 7}px`,
            }}
            onMouseDown={handleCornerStartDrag}
            onTouchStart={handleCornerStartDrag}
            onDoubleClick={() => {
              setUnifiedPanelHeight(280);
              setAiPanelWidth(400);
              localStorage.setItem('codely-unified-panel-height', '280');
              localStorage.setItem('codely-ai-panel-width', '400');
            }}
            title="Drag corner to resize both bottom and side panels (Double-click to reset)"
          >
            <div className="sash-corner-dot" />
          </div>
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
          code={room.ydocs?.[room.activeTabId]?.getText('monaco').toString() || room.activeTab.code || ''}
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
          <Toast 
            key={t.id} 
            message={t.message} 
            type={t.type} 
          />
        ))}
      </div>
    </div>
  );
}

export default Room;
