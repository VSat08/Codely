import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useResizable } from '../hooks/useResizable';
import { validateImage, compressImage, getImageFromClipboard, timeAgo } from '../utils/imageUtils';
import { validateFile, fileToBase64, getFileIcon, formatFileSize } from '../utils/fileUtils';
import { ACCEPTED_IMAGE_TYPES, ACCEPTED_FILE_EXTENSIONS } from '../utils/constants';
import './UnifiedPanel.css';

/**
 * Copy an image (from base64 data URL) to clipboard.
 */
async function copyImageToClipboard(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const pngBlob = blob.type === 'image/png' ? blob : await convertToPng(dataUrl);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function convertToPng(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.src = dataUrl;
  });
}

/**
 * Unified IDE Panel — combines Terminal, Web Preview, Screenshots, and Files into
 * a single draggable, dockable, resizable container (VS Code / Antigravity style).
 */
export default function UnifiedPanel({
  isOpen,
  activeTab = 'terminal', // 'terminal' | 'problems' | 'preview' | 'images' | 'files'
  onTabChange,
  onClose,
  dock: externalDock,
  onDockChange,
  height: externalHeight,
  onHeightChange: externalOnHeightChange,
  width: externalWidth,
  onWidthChange: externalOnWidthChange,
  isResizing: externalIsResizing = false,
  isMaximized: externalIsMaximized,
  onToggleMaximize: externalOnToggleMaximize,
  // Interactive Terminal Props
  terminalChunks = [],
  isTerminalRunning = false,
  terminalStatus = null,
  onRun,
  onStop,
  onSendTerminalInput,
  onClearTerminal,
  language,
  output,
  isRunning: legacyIsRunning,
  onClearOutput,
  // Problems Props
  problems = [],
  onNavigateToProblem,
  // Preview Props
  activeHtmlCode,
  activeTabId,
  activeTabObj,
  previewTrigger,
  tabs,
  ydocs,
  // Image Props
  images = [],
  onImageShare,
  onImageDelete,
  onImageClick,
  // File Props
  files = [],
  onFileShare,
  onFileDelete,
  // Toast
  addToast,
}) {
  const [deviceSize, setDeviceSize] = useState('full'); // 'full' | 'tablet' | 'mobile'
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsMaximized !== undefined ? externalIsMaximized : internalIsExpanded;
  const handleToggleMaximize = useCallback(() => {
    if (externalOnToggleMaximize) {
      externalOnToggleMaximize();
    } else {
      setInternalIsExpanded((prev) => !prev);
    }
  }, [externalOnToggleMaximize]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showTabsMenu, setShowTabsMenu] = useState(false);
  const [panelWidth, setPanelWidth] = useState(0);

  // Direct on-screen terminal input state
  const [activeInput, setActiveInput] = useState('');
  const terminalInputRef = useRef(null);

  // Problems filter state
  const [problemsFilter, setProblemsFilter] = useState('');

  const panelRef = useRef(null);
  const tabsMenuRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const terminalContainerRef = useRef(null);
  const terminalEndRef = useRef(null);
  const fileDragCounter = useRef(0);

  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dock = isMobileScreen ? 'bottom' : (externalDock || 'bottom');

  const resizable = useResizable({
    defaultHeight: 280,
    defaultWidth: 480,
    dock,
    defaultDock: dock,
    height: externalHeight,
    onHeightChange: externalOnHeightChange,
    width: externalWidth,
    onWidthChange: externalOnWidthChange,
    minHeight: 140,
    minWidth: 280,
    storageKeyPrefix: 'codely-unified-panel',
  });

  const handleToggleDock = () => {
    if (isMobileScreen) return;
    const nextDock = dock === 'bottom' ? 'right' : 'bottom';
    resizable.setDock(nextDock);
    onDockChange?.(nextDock);
  };

  // Measure panel container width to automatically adapt when compact
  useEffect(() => {
    if (!panelRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setPanelWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, []);

  // Responsive collapse threshold for panel tabs:
  // With 5 tabs (Terminal, Problems, Preview, Screenshots, Files) plus right controls,
  // all tabs fit comfortably whenever panel width is 580px or wider.
  const compactThreshold = 580;
  const isCompact = isMobileScreen || (!isExpanded && (panelWidth > 0 ? panelWidth < compactThreshold : dock === 'right'));

  // Close tabs dropdown on outside click or Escape key
  useEffect(() => {
    if (!showTabsMenu) return;
    const handleClickOutside = (e) => {
      if (tabsMenuRef.current && !tabsMenuRef.current.contains(e.target)) {
        setShowTabsMenu(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowTabsMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTabsMenu]);

  // Auto-scroll terminal output smoothly within container without scrolling outer window
  useEffect(() => {
    if (activeTab === 'terminal' && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [terminalChunks, activeInput, activeTab, isTerminalRunning, output]);

  // Focus terminal input whenever execution starts or tab switches to terminal
  useEffect(() => {
    if (isTerminalRunning && activeTab === 'terminal') {
      terminalInputRef.current?.focus();
    }
  }, [isTerminalRunning, activeTab]);

  const isRunning = isTerminalRunning || legacyIsRunning;
  const hasOutput = terminalChunks.length > 0 || (output && (output.stdout || output.stderr || output.error));
  const isTerminalInterrupted =
    terminalStatus?.signal === 'SIGINT' ||
    terminalStatus?.signal === 'SIGTERM' ||
    terminalStatus?.code === 130 ||
    terminalStatus?.stopped ||
    terminalStatus?.description === 'Stopped';
  const isTerminalError =
    (terminalStatus && !terminalStatus.success && !isTerminalInterrupted) ||
    (output && (!output.success || output.stderr || output.error));

  // Handle direct terminal keystrokes (Enter to submit line, Ctrl+C to stop)
  const handleTerminalKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const submitted = activeInput;
      setActiveInput('');
      onSendTerminalInput?.(submitted);
    } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      const selection = window.getSelection()?.toString();
      if (!selection) {
        e.preventDefault();
        onStop?.();
      }
    }
  };

  // Diagnostic problems statistics
  const errorCount = useMemo(() => {
    return problems.filter((p) => p.severity === 'error').length;
  }, [problems]);

  const warningCount = useMemo(() => {
    return problems.filter((p) => p.severity === 'warning').length;
  }, [problems]);

  // Filtered and grouped problems
  const filteredProblems = useMemo(() => {
    if (!problemsFilter.trim()) return problems;
    const q = problemsFilter.toLowerCase().trim();
    return problems.filter((p) => {
      return (
        p.message.toLowerCase().includes(q) ||
        (p.file && p.file.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        String(p.line).includes(q)
      );
    });
  }, [problems, problemsFilter]);

  const groupedProblems = useMemo(() => {
    const groups = {};
    for (const prob of filteredProblems) {
      const file = prob.file || 'Workspace';
      if (!groups[file]) groups[file] = [];
      groups[file].push(prob);
    }
    return groups;
  }, [filteredProblems]);

  // Available Panel Tabs configuration
  const PANEL_TABS = useMemo(
    () => [
      {
        id: 'terminal',
        name: 'Terminal',
        shortName: 'Terminal',
        icon: 'terminal',
        hasError: isTerminalError,
      },
      {
        id: 'problems',
        name: 'Problems',
        shortName: 'Problems',
        icon: 'warning',
        badge: problems.length > 0 ? String(problems.length) : null,
        badgeType: errorCount > 0 ? 'error' : 'warning',
        hasError: errorCount > 0,
      },
      {
        id: 'preview',
        name: 'Web Preview',
        shortName: 'Preview',
        icon: 'visibility',
      },
      {
        id: 'images',
        name: 'Screenshots',
        shortName: 'Screenshots',
        icon: 'image',
        badge: `${images.length}/10`,
      },
      {
        id: 'files',
        name: 'Shared Files',
        shortName: 'Files',
        icon: 'attach_file',
        badge: `${files.length}/10`,
      },
    ],
    [isTerminalError, problems.length, errorCount, images.length, files.length]
  );

  const currentTabInfo = useMemo(() => {
    return PANEL_TABS.find((t) => t.id === activeTab) || PANEL_TABS[0];
  }, [activeTab, PANEL_TABS]);

  // Trigger preview reload when Run is clicked on HTML/CSS files
  useEffect(() => {
    if (previewTrigger) {
      setRefreshKey((k) => k + 1);
    }
  }, [previewTrigger]);

  // Live Auto-Reload: Debounced live preview when editing HTML/CSS/JS files
  useEffect(() => {
    if (!ydocs || activeTab !== 'preview') return;

    let debounceTimer = null;
    const cleanups = [];

    const handleYTextChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setRefreshKey((k) => k + 1);
      }, 400); // 400ms debounce
    };

    Object.entries(ydocs).forEach(([tabId, ydoc]) => {
      try {
        const ytext = ydoc?.getText('monaco');
        if (ytext && typeof ytext.observe === 'function') {
          ytext.observe(handleYTextChange);
          cleanups.push(() => {
            try {
              ytext.unobserve(handleYTextChange);
            } catch (e) {}
          });
        }
      } catch (err) {
        // Safe fallback
      }
    });

    return () => {
      clearTimeout(debounceTimer);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [ydocs, tabs, activeTab]);

  // Combined Web Preview Source
  const combinedSrcDoc = useMemo(() => {
    let cssContent = '';
    let jsContent = '';

    if (tabs) {
      Object.values(tabs).forEach((tab) => {
        const code = ydocs?.[tab.id]?.getText('monaco')?.toString() || tab.code || '';
        if (tab.language === 'css' || tab.name?.endsWith('.css')) {
          cssContent += `\n/* ${tab.name} */\n${code}\n`;
        } else if (
          (tab.language === 'javascript' || tab.name?.endsWith('.js')) &&
          !tab.name?.endsWith('.jsx')
        ) {
          jsContent += `\n// ${tab.name}\n${code}\n`;
        }
      });
    }

    // Determine latest live HTML code directly from Yjs or activeTab:
    let baseHtml = '';
    // 1. If active tab is HTML, read its live text directly from ydocs
    if (activeTabObj?.language === 'html' || activeTabObj?.name?.endsWith('.html')) {
      const live = ydocs?.[activeTabId]?.getText('monaco')?.toString();
      baseHtml = (live !== undefined && live !== null && live !== '') ? live : (activeTabObj?.code || '');
    }
    // 2. If not found, look for any HTML tab in the workspace
    if (!baseHtml && tabs) {
      for (const tab of Object.values(tabs)) {
        if (tab.language === 'html' || tab.name?.endsWith('.html')) {
          const live = ydocs?.[tab.id]?.getText('monaco')?.toString();
          baseHtml = (live !== undefined && live !== null && live !== '') ? live : (tab.code || '');
          if (baseHtml) break;
        }
      }
    }
    // 3. Fallback to activeHtmlCode prop or default empty placeholder
    if (!baseHtml) {
      baseHtml = activeHtmlCode || '<!DOCTYPE html><html><body><h3 style="font-family:sans-serif;color:#888;">Empty HTML file</h3></body></html>';
    }

    let doc = baseHtml;

    if (cssContent.trim()) {
      const styleTag = `<style id="codely-injected-styles">${cssContent}</style>`;
      if (doc.includes('</head>')) {
        doc = doc.replace('</head>', `${styleTag}</head>`);
      } else {
        doc = `${styleTag}${doc}`;
      }
    }

    if (jsContent.trim()) {
      const scriptTag = `<script id="codely-injected-scripts">${jsContent}</script>`;
      if (doc.includes('</body>')) {
        doc = doc.replace('</body>', `${scriptTag}</body>`);
      } else {
        doc = `${doc}${scriptTag}`;
      }
    }

    return doc;
  }, [activeHtmlCode, activeTabId, activeTabObj, tabs, ydocs, refreshKey]);

  // Handle image upload
  const processAndUploadImage = useCallback(async (file) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      addToast?.(validation.error, 'error');
      return;
    }
    setUploadingImage(true);
    try {
      const base64 = await compressImage(file);
      await onImageShare?.(base64, file.name);
      addToast?.('Screenshot shared!', 'success');
    } catch (err) {
      addToast?.(String(err), 'error');
    } finally {
      setUploadingImage(false);
    }
  }, [onImageShare, addToast]);

  const handleImageFileChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      await processAndUploadImage(file);
    }
    e.target.value = '';
  };

  // Handle generic file upload
  const processAndUploadFile = useCallback(async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      addToast?.(validation.error, 'error');
      return;
    }
    setUploadingFile(true);
    try {
      const base64 = await fileToBase64(file);
      await onFileShare?.(base64, file.name, file.size);
      addToast?.(`📄 Shared ${file.name}`, 'success');
    } catch (err) {
      addToast?.(String(err), 'error');
    } finally {
      setUploadingFile(false);
    }
  }, [onFileShare, addToast]);

  const handleDocFileChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      await processAndUploadFile(file);
    }
    e.target.value = '';
  };

  // Clipboard paste (Ctrl+V) for screenshots
  const handlePanelPaste = useCallback((e) => {
    if (activeTab === 'images') {
      const file = getImageFromClipboard(e.clipboardData);
      if (file) {
        e.preventDefault();
        processAndUploadImage(file);
      }
    }
  }, [activeTab, processAndUploadImage]);

  // Terminal actions
  const handleCopyTerminal = () => {
    let textToCopy = '';
    if (terminalChunks && terminalChunks.length > 0) {
      textToCopy = terminalChunks.map((c) => c.text).join('');
    } else {
      textToCopy = [output?.stdout, output?.stderr, output?.error].filter(Boolean).join('\n');
    }
    if (!textToCopy) {
      addToast?.('Nothing to copy', 'info');
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    addToast?.('Terminal output copied', 'success');
  };

  // Web Preview external window
  const handleOpenPreviewExternal = () => {
    const blob = new Blob([combinedSrcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    addToast?.('Preview opened in new window', 'info');
  };

  // File download helper
  const handleFileDownload = (e, file) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.name || 'document';
    a.click();
  };

  // Image copy to clipboard
  const handleImageCopy = async (e, img) => {
    e.stopPropagation();
    const success = await copyImageToClipboard(img.data);
    if (success) {
      addToast?.('Image copied to clipboard!', 'success');
    } else {
      addToast?.('Could not copy image. Use download instead.', 'error');
    }
  };

  // Image download
  const handleImageDownload = (e, img) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = img.data;
    a.download = img.name || 'screenshot.png';
    a.click();
  };

  if (!isOpen) return null;

  const sizeStyle = isExpanded
    ? {}
    : dock === 'bottom'
    ? { height: `${resizable.height}px` }
    : { width: `${resizable.width}px` };

  const isCurrentlyResizing = resizable.isDragging || externalIsResizing;

  return (
    <div
      ref={panelRef}
      className={`unified-panel dock-${dock} ${isCompact ? 'compact' : 'wide'} ${isExpanded ? 'expanded' : ''} ${isCurrentlyResizing ? 'resizing' : ''}`}
      style={sizeStyle}
      onPaste={handlePanelPaste}
      tabIndex={0}
    >
      {/* Draggable Resize Handle */}
      {!isExpanded && (
        <div
          className={`drawer-drag-handle handle-${dock === 'bottom' ? 'top' : 'left'} ${isCurrentlyResizing ? 'resizing' : ''}`}
          onMouseDown={resizable.startDragging}
          onTouchStart={resizable.startDragging}
          onDoubleClick={handleToggleMaximize}
          title={`Drag to resize ${dock === 'bottom' ? 'height' : 'width'} (Double-click to maximize)`}
        >
          <div className="drag-handle-grip" />
        </div>
      )}

      {/* Unified Panel Header (Tabs on left, Context + Global controls on right) */}
      <div
        className="unified-panel-header"
        onDoubleClick={(e) => {
          if (e.target.closest('button, input, select, textarea, .panel-tab-btn, .more-views-btn, .more-views-dropdown')) {
            return;
          }
          handleToggleMaximize();
        }}
        title="Double-click header to maximize or restore panel size"
      >
        <div className="unified-header-left">
          {/* Main Tab Strip with Responsive Overflow / Dropdown (VS Code style) */}
          <div className={`panel-tab-bar ${isCompact ? 'compact' : 'wide'}`} ref={tabsMenuRef}>
            {isCompact ? (
              /* Compact Mode: "..." button (opens Panel Views) + Active Tab (VS Code style) */
              <>
                <button
                  type="button"
                  className={`panel-tab-btn more-views-btn ${showTabsMenu ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTabsMenu((prev) => !prev);
                  }}
                  title="Views and More Actions... (Select Panel)"
                  aria-expanded={showTabsMenu}
                >
                  <span className="material-symbols-outlined tab-icon">more_horiz</span>
                </button>

                <button
                  type="button"
                  className="panel-tab-btn active"
                  title={`Current View: ${currentTabInfo.name}`}
                >
                  <span className="material-symbols-outlined tab-icon">{currentTabInfo.icon}</span>
                  <span className="tab-title">{currentTabInfo.shortName || currentTabInfo.name}</span>
                  {currentTabInfo.badge && (
                    <span className={`tab-badge ${currentTabInfo.badgeType ? `badge-${currentTabInfo.badgeType}` : ''}`}>
                      {currentTabInfo.badge}
                    </span>
                  )}
                  {currentTabInfo.hasError && <span className="tab-dot error-dot" />}
                </button>
              </>
            ) : (
              /* Wide Mode: All tabs displayed side-by-side (no redundant "..." button) */
              PANEL_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`panel-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange?.(tab.id)}
                    title={tab.name}
                  >
                    <span className="material-symbols-outlined tab-icon">{tab.icon}</span>
                    <span className="tab-title">{tab.shortName || tab.name}</span>
                    {tab.badge && (
                      <span className={`tab-badge ${tab.badgeType ? `badge-${tab.badgeType}` : ''}`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.hasError && <span className="tab-dot error-dot" />}
                  </button>
                );
              })
            )}

            {/* Dropdown Menu (only rendered in Compact Mode when tabs are collapsed) */}
            {showTabsMenu && isCompact && (
              <div className="more-views-dropdown">
                <div className="more-views-dropdown-header">PANEL VIEWS</div>
                {PANEL_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`more-views-item ${isActive ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabChange?.(tab.id);
                        setShowTabsMenu(false);
                      }}
                    >
                      <span className="more-views-check-slot">
                        {isActive && <span className="material-symbols-outlined check-icon">check</span>}
                      </span>
                      <span className="material-symbols-outlined more-views-icon">{tab.icon}</span>
                      <span className="more-views-name">{tab.name}</span>
                      {tab.badge && (
                        <span className={`tab-badge ${tab.badgeType ? `badge-${tab.badgeType}` : ''}`}>
                          {tab.badge}
                        </span>
                      )}
                      {tab.hasError && <span className="tab-dot error-dot" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Global Window Controls on right */}
        <div className="unified-header-right">
          <button
            className="btn btn-ghost btn-icon panel-control-btn panel-dock-toggle-btn"
            onClick={handleToggleDock}
            title={dock === 'bottom' ? 'Dock to Right (Side-by-side)' : 'Dock to Bottom'}
          >
            <span className="material-symbols-outlined">
              {dock === 'bottom' ? 'vertical_split' : 'horizontal_split'}
            </span>
          </button>

          <button
            className="btn btn-ghost btn-icon panel-control-btn"
            onClick={handleToggleMaximize}
            title={isExpanded ? 'Restore Panel Size' : 'Maximize Panel Size'}
          >
            <span className="material-symbols-outlined">
              {isExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>

          <button
            className="btn btn-ghost btn-icon panel-control-btn close-btn"
            onClick={onClose}
            title="Close Panel"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      {/* Unified Panel Body */}
      <div className="unified-panel-body">
        {/* VIEW 1: TERMINAL (Interactive On-Screen Stream) */}
        {activeTab === 'terminal' && (
          <div className="panel-view terminal-view">
            {/* Terminal Inner Sub-Toolbar */}
            <div className="terminal-inner-toolbar">
              <div className="terminal-toolbar-left">
                {isRunning ? (
                  <span className="status-badge running" title="Executing code...">
                    <span className="terminal-spinner" />
                    <span className="status-badge-text">Executing {language || 'code'}...</span>
                  </span>
                ) : terminalStatus ? (
                  <span
                    className={`status-badge ${
                      isTerminalInterrupted
                        ? 'stopped'
                        : terminalStatus.success
                        ? 'success'
                        : 'error'
                    }`}
                    title={terminalStatus.description}
                  >
                    <span className="status-badge-icon">
                      {isTerminalInterrupted ? '⏹' : terminalStatus.success ? '✓' : '⚠️'}
                    </span>
                    <span className="status-badge-text">
                      {terminalStatus.description}
                    </span>
                    {terminalStatus.timeMs != null && (
                      <span className="status-badge-metric">{terminalStatus.timeMs}ms</span>
                    )}
                  </span>
                ) : output ? (
                  <span
                    className={`status-badge ${output.success ? 'success' : 'error'}`}
                    title={`${output.status?.description || (output.success ? 'Success' : 'Error')}${output.time ? ` · ${output.time}` : ''}${output.memory ? ` · ${output.memory}` : ''}`}
                  >
                    <span className="status-badge-icon">{output.success ? '✓' : '⚠️'}</span>
                    <span className="status-badge-text">
                      {output.success
                        ? 'Success'
                        : (output.status?.description && output.status.description.length <= 18
                            ? output.status.description
                            : 'Error')}
                    </span>
                    {output.time && <span className="status-badge-metric">{output.time}</span>}
                  </span>
                ) : (
                  <span className="terminal-idle-indicator">
                    <span className="idle-dot" />
                    <span className="idle-label">Terminal · {language || 'ready'}</span>
                  </span>
                )}
              </div>

              <div className="terminal-toolbar-right">
                {isRunning ? (
                  <button
                    className="btn btn-ghost btn-icon panel-control-btn terminal-stop-btn"
                    onClick={onStop}
                    title="Stop Program (Ctrl+C)"
                  >
                    <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>stop</span>
                  </button>
                ) : (
                  <button
                    className="btn btn-ghost btn-icon panel-control-btn terminal-run-icon-btn"
                    onClick={onRun}
                    title="Run Code (Alt+Enter)"
                  >
                    <span className="material-symbols-outlined">play_arrow</span>
                  </button>
                )}
                <button
                  className="btn btn-ghost btn-icon panel-control-btn"
                  onClick={handleCopyTerminal}
                  disabled={!hasOutput}
                  title="Copy Output"
                >
                  <span className="material-symbols-outlined">content_copy</span>
                </button>
                <button
                  className="btn btn-ghost btn-icon panel-control-btn"
                  onClick={() => {
                    onClearTerminal?.();
                    onClearOutput?.();
                  }}
                  disabled={!hasOutput}
                  title="Clear Terminal"
                >
                  <span className="material-symbols-outlined">delete_sweep</span>
                </button>
              </div>
            </div>

            {/* Terminal Output Log Container */}
            <div
              ref={terminalContainerRef}
              className="terminal-output-container"
              onClick={() => {
                if (isRunning) {
                  const selection = window.getSelection()?.toString();
                  if (!selection) {
                    terminalInputRef.current?.focus();
                  }
                }
              }}
            >
              {!hasOutput && !isRunning ? (
                <div className="terminal-empty-state">
                  <span className="material-symbols-outlined empty-icon">terminal</span>
                  <p>No output yet. Click <strong>Run</strong> or press <strong>Alt+Enter</strong> to execute.</p>
                  <span className="terminal-hint">
                    Language: <strong className="mono">{language || 'plaintext'}</strong>
                  </span>
                </div>
              ) : (
                <pre className="terminal-log">
                  {/* Chunks from interactive runner */}
                  {terminalChunks.length > 0 &&
                    terminalChunks.map((chunk, idx) => {
                      const isInterrupt =
                        chunk.stream === 'system' ||
                        chunk.text.trim() === '^C' ||
                        chunk.text.includes('KeyboardInterrupt') ||
                        chunk.text.includes('Execution stopped by user');

                      return (
                        <span
                          key={idx}
                          className={
                            isInterrupt
                              ? 'log-interrupt'
                              : chunk.stream === 'stderr'
                              ? 'log-stderr'
                              : chunk.stream === 'stdin'
                              ? 'log-stdin-echo'
                              : 'log-stdout'
                          }
                        >
                          {chunk.text}
                        </span>
                      );
                    })}

                  {/* Fallback to static output if no chunks */}
                  {terminalChunks.length === 0 && output && (
                    <>
                      {output.stdout && <span className="log-stdout">{output.stdout}</span>}
                      {output.stderr && <span className="log-stderr">{output.stderr}</span>}
                      {output.error && <span className="log-error">⚠️ {output.error}</span>}
                    </>
                  )}

                  {/* Active prompt typing line with blinking cursor */}
                  {isRunning && (
                    <span className="terminal-active-line">
                      <span className="terminal-inline-user-text">{activeInput}</span>
                      <span className="terminal-cursor">█</span>
                      <input
                        ref={terminalInputRef}
                        type="text"
                        className="terminal-screen-input"
                        value={activeInput}
                        onChange={(e) => setActiveInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        aria-label="Terminal Input"
                      />
                    </span>
                  )}
                  <div ref={terminalEndRef} />
                </pre>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: PROBLEMS (VS Code / Antigravity Style) */}
        {activeTab === 'problems' && (
          <div className="panel-view problems-view">
            {/* Problems Sub-Toolbar */}
            <div className="problems-toolbar">
              <div className="problems-stats">
                <span className={`problems-stat-pill error-stat ${errorCount === 0 ? 'muted' : ''}`}>
                  <span className="material-symbols-outlined">cancel</span>
                  <span>{errorCount} {errorCount === 1 ? 'Error' : 'Errors'}</span>
                </span>
                <span className={`problems-stat-pill warning-stat ${warningCount === 0 ? 'muted' : ''}`}>
                  <span className="material-symbols-outlined">warning</span>
                  <span>{warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}</span>
                </span>
              </div>

              <div className="problems-filter-wrap">
                <span className="material-symbols-outlined problems-filter-icon">filter_alt</span>
                <input
                  type="text"
                  className="problems-filter-input"
                  placeholder="Filter problems..."
                  value={problemsFilter}
                  onChange={(e) => setProblemsFilter(e.target.value)}
                />
                {problemsFilter && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs clear-filter-btn"
                    onClick={() => setProblemsFilter('')}
                    title="Clear filter"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Problems Content */}
            <div className="problems-content">
              {filteredProblems.length === 0 ? (
                <div className="problems-empty-state">
                  <span className="material-symbols-outlined empty-check-icon">verified</span>
                  <p>No problems have been detected in the workspace.</p>
                  <span className="problems-empty-sub">
                    {problems.length > 0
                      ? 'No problems matching your filter.'
                      : 'Compilation and runtime diagnostics will appear here.'}
                  </span>
                </div>
              ) : (
                <div className="problems-tree">
                  {Object.entries(groupedProblems).map(([fileName, items]) => (
                    <div key={fileName} className="problem-file-group">
                      <div className="problem-file-header">
                        <span className="material-symbols-outlined chevron-icon">keyboard_arrow_down</span>
                        <span className="material-symbols-outlined file-icon">description</span>
                        <span className="problem-file-name">{fileName}</span>
                        <span className="problem-file-count">{items.length}</span>
                      </div>
                      <div className="problem-file-items">
                        {items.map((prob) => {
                          const isErr = prob.severity === 'error';
                          return (
                            <div
                              key={prob.id}
                              className={`problem-item-row ${isErr ? 'is-error' : 'is-warning'}`}
                              onClick={() => onNavigateToProblem?.(prob)}
                              title={`Click to jump to line ${prob.line}, col ${prob.column}`}
                            >
                              <span className="material-symbols-outlined problem-severity-icon">
                                {isErr ? 'cancel' : 'warning'}
                              </span>
                              <div className="problem-desc-col">
                                <span className="problem-message">{prob.message}</span>
                                {prob.code && <span className="problem-code-badge">{prob.code}</span>}
                              </div>
                              <span className="problem-location-badge mono">
                                [Ln {prob.line}, Col {prob.column}]
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: WEB PREVIEW */}
        {activeTab === 'preview' && (
          <div className="panel-view preview-view">
            <div className="preview-inner-toolbar">
              <div className="preview-controls-pill">
                <div className="preview-device-group">
                  <button
                    type="button"
                    className={`device-btn ${deviceSize === 'full' ? 'active' : ''}`}
                    onClick={() => setDeviceSize('full')}
                    title="Full Width"
                  >
                    <span className="material-symbols-outlined">desktop_windows</span>
                  </button>
                  <button
                    type="button"
                    className={`device-btn ${deviceSize === 'tablet' ? 'active' : ''}`}
                    onClick={() => setDeviceSize('tablet')}
                    title="Tablet (768px)"
                  >
                    <span className="material-symbols-outlined">tablet</span>
                  </button>
                  <button
                    type="button"
                    className={`device-btn ${deviceSize === 'mobile' ? 'active' : ''}`}
                    onClick={() => setDeviceSize('mobile')}
                    title="Mobile (375px)"
                  >
                    <span className="material-symbols-outlined">smartphone</span>
                  </button>
                </div>

                <span className="preview-pill-divider" />

                <div className="preview-toolbar-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon panel-control-btn"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    title="Reload Preview"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon panel-control-btn"
                    onClick={handleOpenPreviewExternal}
                    title="Open in New Tab"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={`preview-viewport viewport-${deviceSize}`}>
              <iframe
                key={refreshKey}
                title="Codely Live Web Preview"
                srcDoc={combinedSrcDoc}
                sandbox="allow-scripts allow-modals"
                className="preview-iframe"
                style={{ pointerEvents: resizable.isDragging ? 'none' : 'auto' }}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: SCREENSHOTS */}
        {activeTab === 'images' && (
          <div
            className={`panel-view images-view ${isDraggingFile ? 'drop-active' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); fileDragCounter.current++; setIsDraggingFile(true); }}
            onDragLeave={(e) => { e.preventDefault(); fileDragCounter.current--; if (fileDragCounter.current === 0) setIsDraggingFile(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              fileDragCounter.current = 0;
              const dropped = Array.from(e.dataTransfer.files || []);
              for (const file of dropped) {
                if (file.type.startsWith('image/')) await processAndUploadImage(file);
              }
            }}
          >
            <div className="panel-sub-header-hint">
              <span>Paste with <kbd>Ctrl+V</kbd> or drag & drop an image to share</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm panel-action-pill-btn"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage || images.length >= 10}
                title="Upload screenshot"
              >
                {uploadingImage ? (
                  <span className="terminal-spinner" />
                ) : (
                  <span className="material-symbols-outlined">upload</span>
                )}
                <span className="panel-btn-label">Upload</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                onChange={handleImageFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {images.length > 0 ? (
              <div className="image-grid">
                {images.map((img) => (
                  <div key={img.id} className="image-thumb" onClick={() => onImageClick?.(img)}>
                    <img src={img.data} alt={img.name} loading="lazy" />
                    <div className="image-overlay">
                      <span className="image-meta">{img.uploadedBy} · {timeAgo(img.timestamp)}</span>
                      <div className="image-overlay-actions">
                        <button
                          className="btn btn-icon image-action-btn"
                          onClick={(e) => handleImageCopy(e, img)}
                          title="Copy to clipboard"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                        </button>
                        <button
                          className="btn btn-icon image-action-btn"
                          onClick={(e) => handleImageDownload(e, img)}
                          title="Download"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                        </button>
                        <button
                          className="btn btn-icon image-action-btn image-delete-btn"
                          onClick={(e) => { e.stopPropagation(); onImageDelete?.(img.id); }}
                          title="Delete image"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-sub-view">
                <span className="material-symbols-outlined empty-sub-icon">image</span>
                <p>No screenshots shared yet</p>
                <span className="empty-sub-caption">Paste from clipboard or click Upload above</span>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: FILES */}
        {activeTab === 'files' && (
          <div
            className={`panel-view files-view ${isDraggingFile ? 'drop-active' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); fileDragCounter.current++; setIsDraggingFile(true); }}
            onDragLeave={(e) => { e.preventDefault(); fileDragCounter.current--; if (fileDragCounter.current === 0) setIsDraggingFile(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDraggingFile(false);
              fileDragCounter.current = 0;
              const dropped = Array.from(e.dataTransfer.files || []);
              for (const file of dropped) {
                await processAndUploadFile(file);
              }
            }}
          >
            <div className="panel-sub-header-hint">
              <span>Drag & drop any file to share (max 2MB per file)</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm panel-action-pill-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || files.length >= 10}
                title="Upload file"
              >
                {uploadingFile ? (
                  <span className="terminal-spinner" />
                ) : (
                  <span className="material-symbols-outlined">upload</span>
                )}
                <span className="panel-btn-label">Upload</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
                multiple
                onChange={handleDocFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {files.length > 0 ? (
              <div className="file-list">
                {files.map((file) => (
                  <div key={file.id} className="file-row">
                    <div className="file-row-icon">
                      <span className="material-symbols-outlined">{getFileIcon(file.name)}</span>
                    </div>
                    <div className="file-row-info">
                      <span className="file-row-name" title={file.name}>{file.name}</span>
                      <span className="file-row-meta">
                        {formatFileSize(file.size)} · {file.uploadedBy} · {timeAgo(file.timestamp)}
                      </span>
                    </div>
                    <div className="file-row-actions">
                      <button
                        className="btn btn-icon btn-ghost btn-small"
                        onClick={(e) => handleFileDownload(e, file)}
                        title="Download"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                      </button>
                      <button
                        className="btn btn-icon btn-ghost btn-small file-delete-btn"
                        onClick={(e) => { e.stopPropagation(); onFileDelete?.(file.id); }}
                        title="Delete file"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-sub-view">
                <span className="material-symbols-outlined empty-sub-icon">folder_open</span>
                <p>No files shared yet</p>
                <span className="empty-sub-caption">Drag and drop documents or click Upload above</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
