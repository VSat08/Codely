import { useState, useEffect, useCallback, useRef } from 'react';

// Binary media types that are sent as inlineData (images, PDFs)
const BINARY_MEDIA_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
];

// File extensions that are BLOCKED (dangerous/unsupported binary formats)
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.msi', '.com', '.scr',  // Executables
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',     // Archives
  '.iso', '.dmg', '.img',                                    // Disk images
  '.bin', '.dat', '.db', '.sqlite',                          // Binary data
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav', '.flac',  // Audio/Video
  '.psd', '.ai', '.sketch', '.fig',                          // Design files
  '.ttf', '.otf', '.woff', '.woff2',                         // Fonts
  '.class', '.jar', '.war', '.pyc', '.o', '.so', '.dylib',  // Compiled
]);

const MAX_MEDIA_SIZE = 4 * 1024 * 1024; // 4MB per file
const MAX_MEDIA_FILES = 5;

// Map of common code/text file extensions to MIME types
// Browsers often report empty or 'application/octet-stream' for these
const EXTENSION_MIME_MAP = {
  // Documents
  '.md': 'text/markdown', '.markdown': 'text/markdown',
  '.txt': 'text/plain', '.csv': 'text/csv',
  '.pdf': 'application/pdf',
  // Images
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif',
  // Code files
  '.js': 'text/javascript', '.jsx': 'text/javascript',
  '.ts': 'text/typescript', '.tsx': 'text/typescript',
  '.html': 'text/html', '.htm': 'text/html',
  '.css': 'text/css', '.scss': 'text/css', '.less': 'text/css',
  '.json': 'application/json', '.jsonc': 'application/json',
  '.xml': 'text/xml', '.svg': 'text/xml',
  '.yaml': 'text/yaml', '.yml': 'text/yaml',
  '.toml': 'text/plain',
  '.py': 'text/x-python', '.rb': 'text/x-ruby',
  '.java': 'text/x-java', '.kt': 'text/x-kotlin',
  '.c': 'text/x-c', '.cpp': 'text/x-c++', '.h': 'text/x-c',
  '.cs': 'text/x-csharp',
  '.go': 'text/x-go', '.rs': 'text/x-rust',
  '.swift': 'text/x-swift', '.dart': 'text/x-dart',
  '.php': 'text/x-php', '.lua': 'text/x-lua',
  '.sh': 'text/x-shellscript', '.bash': 'text/x-shellscript',
  '.ps1': 'text/x-powershell',
  '.sql': 'text/x-sql',
  '.r': 'text/x-r', '.R': 'text/x-r',
  '.dockerfile': 'text/plain', '.dockerignore': 'text/plain',
  '.gitignore': 'text/plain', '.env': 'text/plain',
  '.ini': 'text/plain', '.cfg': 'text/plain', '.conf': 'text/plain',
  '.log': 'text/plain', '.lock': 'text/plain',
};

function resolveMimeType(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  // Check our extension map first (most reliable for code files)
  if (EXTENSION_MIME_MAP[ext]) return EXTENSION_MIME_MAP[ext];
  // Fall back to browser-reported type
  if (file.type) return file.type;
  // If all else fails, treat as plain text (better than blocking)
  return 'text/plain';
}

function isFileAllowed(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  return !BLOCKED_EXTENSIONS.has(ext);
}

// Check if a MIME type is a text/code type (not binary image/PDF)
function isTextMime(mimeType) {
  if (BINARY_MEDIA_TYPES.includes(mimeType)) return false;
  return true; // Everything else is treated as text
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// Helper: read File as base64 (returns raw base64 without data URI prefix)
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the data URI prefix: "data:image/png;base64,..." → just the base64 part
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onabort = () => reject(new Error('File read was cancelled'));
    reader.readAsDataURL(file);
    // Store the reader on the file for potential abort
    file._reader = reader;
  });
}

export function useAIChat(socket, roomId, userName) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiMode, setAiMode] = useState('shared'); // 'shared' | 'private'
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'openai' | 'claude'
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');
  // Store a map of keys per provider
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const stored = sessionStorage.getItem('codely-ai-apikeys');
      // Migration from old string-based key (backward compatibility)
      if (stored && !stored.startsWith('{')) {
        return { gemini: stored };
      }
      return stored ? JSON.parse(stored) : { gemini: '', claude: '', openai: '' };
    } catch { return { gemini: '', claude: '', openai: '' }; }
  });

  const apiKey = apiKeys[provider] || '';

  const setApiKey = (key) => {
    setApiKeys(prev => {
      const next = { ...prev, [provider]: key };
      sessionStorage.setItem('codely-ai-apikeys', JSON.stringify(next));
      return next;
    });
  };

  const [attachedFiles, setAttachedFiles] = useState([]); // [{ code, language, fileName }]
  const [attachedMedia, setAttachedMedia] = useState([]); // [{ id, name, mimeType, base64, previewUrl, status, file }]
  const [providerLimits, setProviderLimits] = useState(null); // Last-known API provider rate limits
  const currentRequestIdRef = useRef(null);

  // Ensure aiModel is valid when provider or apiKey changes
  useEffect(() => {
    if (provider === 'gemini') {
      // If switching to free tier but holding a BYOK model, or vice versa, reset to safe default
      if (!apiKey && aiModel !== 'gemini-2.5-flash' && aiModel !== 'gemini-3.5-flash' && aiModel !== 'gemini-2.0-flash' && aiModel !== 'gemini-2.0-flash-lite') {
        setAiModel('gemini-2.5-flash');
      } else if (!aiModel.startsWith('gemini-')) {
        setAiModel('gemini-2.5-flash');
      }
    } else if (provider === 'claude' && !aiModel.startsWith('claude-')) {
      setAiModel('claude-3-5-sonnet-20241022');
    } else if (provider === 'openai' && !aiModel.startsWith('gpt-') && !aiModel.startsWith('o1-')) {
      setAiModel('gpt-4o');
    }
  }, [provider, apiKey]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Server sends this right after receiving ai-chat, so we know the requestId
    const handleStart = ({ requestId }) => {
      currentRequestIdRef.current = requestId;
      // Tag the last placeholder message with this requestId
      setMessages((prev) => {
        const updated = [...prev];
        // Find the last AI message that is streaming and has no requestId
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'ai' && updated[i].isStreaming && !updated[i].requestId) {
            updated[i] = { ...updated[i], requestId };
            break;
          }
        }
        return updated;
      });
    };

    // Status updates ("Reading file...", "Thinking...", etc.)
    const handleStatus = ({ requestId, status }) => {
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'ai' && (updated[i].requestId === requestId || (!updated[i].requestId && updated[i].isStreaming))) {
            updated[i] = { ...updated[i], statusText: status };
            return updated;
          }
        }
        return prev;
      });
    };

    const handleChunk = ({ requestId, chunk }) => {
      setMessages((prev) => {
        const updated = [...prev];
        // Find the AI message with this requestId
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].requestId === requestId && updated[i].role === 'ai') {
            updated[i] = { ...updated[i], content: updated[i].content + chunk, statusText: null };
            return updated;
          }
        }
        // Fallback: append to the last AI streaming message, or create one
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'ai' && lastMsg.isStreaming) {
          updated[updated.length - 1] = { ...lastMsg, content: lastMsg.content + chunk, requestId, statusText: null };
          return updated;
        }
        return [...prev, { role: 'ai', content: chunk, requestId, isStreaming: true }];
      });
    };

    const handleDone = ({ requestId }) => {
      setIsStreaming(false);
      currentRequestIdRef.current = null;
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].requestId === requestId && updated[i].role === 'ai') {
            updated[i] = { ...updated[i], isStreaming: false };
            break;
          }
        }
        return updated;
      });
    };

    const handleError = ({ requestId, error }) => {
      setIsStreaming(false);
      currentRequestIdRef.current = null;
      setMessages((prev) => {
        // Remove any empty placeholder for this request
        const filtered = prev.filter(
          (m) => !(m.requestId === requestId && m.role === 'ai' && m.content === '')
        );
        return [
          ...filtered,
          { role: 'ai', content: `**Error:** ${error}`, isError: true, requestId }
        ];
      });
    };

    const handleSharedChat = ({ sender, message, attachedFiles, requestId }) => {
      // Only process if we're in shared mode. 
      // Also skip if this was our own message (we already added it locally)
      setMessages((prev) => {
        // Check if we already have a user message with similar content recently
        const lastUserMsg = [...prev].reverse().find(m => m.role === 'user');
        if (lastUserMsg && lastUserMsg.content === message && !lastUserMsg.isRemote) {
          // This is our own message echoed back — just tag the placeholder
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'ai' && updated[i].isStreaming && !updated[i].requestId) {
              updated[i] = { ...updated[i], requestId };
              break;
            }
          }
          return updated;
        }
        // It's from another user
        return [
          ...prev,
          {
            role: 'user',
            content: message,
            sender,
            isRemote: true,
            attachedFiles,
            requestId
          },
          { role: 'ai', content: '', requestId, isStreaming: true }
        ];
      });
      setIsStreaming(true);
    };

    const handleSharedChunk = ({ requestId, chunk }) => {
      handleChunk({ requestId, chunk });
    };

    const handleSharedDone = ({ requestId }) => {
      handleDone({ requestId });
    };

    socket.on('ai-response-start', handleStart);
    socket.on('ai-response-status', handleStatus);
    socket.on('ai-response-chunk', handleChunk);
    socket.on('ai-response-done', handleDone);
    socket.on('ai-response-error', handleError);
    
    socket.on('ai-chat-shared', handleSharedChat);
    socket.on('ai-response-shared', handleSharedChunk);

    // Listen for provider rate-limit data from response headers (OpenAI/Claude)
    const handleProviderLimits = ({ provider: p, limits }) => {
      setProviderLimits({ provider: p, limits, timestamp: Date.now() });
    };
    socket.on('ai-provider-limits', handleProviderLimits);

    // Handle socket disconnect during streaming
    const handleDisconnect = (reason) => {
      if (currentRequestIdRef.current) {
        setIsStreaming(false);
        currentRequestIdRef.current = null;
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: '**Error:** Connection lost. Please check your network and try again.', isError: true }
        ]);
      }
    };
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socket.off('ai-response-start', handleStart);
      socket.off('ai-response-status', handleStatus);
      socket.off('ai-response-chunk', handleChunk);
      socket.off('ai-response-done', handleDone);
      socket.off('ai-response-error', handleError);
      socket.off('ai-chat-shared', handleSharedChat);
      socket.off('ai-response-shared', handleSharedChunk);
      socket.off('ai-provider-limits', handleProviderLimits);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, aiMode]);

  const sendMessage = useCallback((text, overrideAttachedFiles = undefined) => {
    if (!socket || !text.trim()) return;

    // Validate media upload states
    const loadingMedia = attachedMedia.filter(m => m.status === 'loading');
    const errorMedia = attachedMedia.filter(m => m.status === 'error');
    if (loadingMedia.length > 0) {
      return { error: 'Please wait for files to finish uploading' };
    }
    if (errorMedia.length > 0) {
      return { error: 'Some files failed to upload. Remove or retry them.' };
    }

    const filesToUse = overrideAttachedFiles !== undefined ? overrideAttachedFiles : attachedFiles;
    const readyMedia = attachedMedia.filter(m => m.status === 'ready');

    // Add user message to local state immediately
    const newMsg = {
      role: 'user',
      content: text,
      sender: userName,
      attachedFiles: filesToUse.length > 0 ? filesToUse.map(f => ({ ...f, timestamp: Date.now() })) : null,
      attachedMedia: readyMedia.length > 0 ? readyMedia.map(m => ({
        name: m.name,
        mimeType: m.mimeType,
        previewUrl: m.previewUrl,
        type: m.mimeType.startsWith('image/') ? 'image' : 'document'
      })) : null,
      isRemote: false
    };
    
    setMessages((prev) => [...prev, newMsg]);
    setIsStreaming(true);
    
    // Add placeholder for the AI response (requestId will be set by handleStart)
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    socket.emit('ai-chat', {
      message: text,
      attachedFiles: filesToUse,
      attachedMedia: readyMedia.map(m => ({
        name: m.name,
        mimeType: m.mimeType,
        base64: m.base64
      })),
      history: messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
      mode: aiMode,
      provider,
      aiModel,
      apiKey,
      roomId,
      userName
    });

    // Clear media after sending
    setAttachedMedia((prev) => {
      // Revoke object URLs to prevent memory leaks
      prev.forEach(m => { if (m.previewUrl) URL.revokeObjectURL(m.previewUrl); });
      return [];
    });

    return null; // No error
  }, [socket, attachedFiles, attachedMedia, messages, aiMode, provider, aiModel, apiKey, roomId, userName]);

  const attachFile = useCallback((code, language, fileName) => {
    setAttachedFiles((prev) => {
      if (prev.some(f => f.fileName === fileName)) return prev;
      if (prev.length >= 5) return prev; // Limit to 5 files to prevent overload
      return [...prev, { code, language, fileName }];
    });
  }, []);

  const removeAttachedFile = useCallback((fileName) => {
    setAttachedFiles((prev) => prev.filter(f => f.fileName !== fileName));
  }, []);

  // ── Media Upload Functions ──

  const attachMedia = useCallback((file) => {
    // Block dangerous/unsupported binary file types
    if (!isFileAllowed(file)) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return { error: `File type "${ext}" is not supported. Executables, archives, and binary files cannot be uploaded.` };
    }

    // Resolve MIME type (browsers often report empty/wrong types for code files)
    const resolvedMime = resolveMimeType(file);
    // Validate size
    if (file.size > MAX_MEDIA_SIZE) {
      return { error: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is 4MB.` };
    }
    // Check count
    if (attachedMedia.length >= MAX_MEDIA_FILES) {
      return { error: `Maximum ${MAX_MEDIA_FILES} media files can be attached.` };
    }
    // Check duplicates
    if (attachedMedia.some(m => m.name === file.name && m.status !== 'error')) {
      return { error: `"${file.name}" is already attached.` };
    }

    const id = generateId();
    const isImage = resolvedMime.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    // Add with loading status immediately (use resolvedMime, not file.type)
    setAttachedMedia((prev) => [
      ...prev.filter(m => !(m.name === file.name && m.status === 'error')), // Remove previous error for same file
      { id, name: file.name, mimeType: resolvedMime, base64: null, previewUrl, status: 'loading', file }
    ]);

    // Read file in background
    readFileAsBase64(file)
      .then((base64) => {
        setAttachedMedia((prev) =>
          prev.map(m => m.id === id ? { ...m, base64, status: 'ready' } : m)
        );
      })
      .catch((err) => {
        setAttachedMedia((prev) =>
          prev.map(m => m.id === id ? { ...m, status: 'error' } : m)
        );
      });

    return null; // No error (async processing started)
  }, [attachedMedia]);

  const removeAttachedMedia = useCallback((id) => {
    setAttachedMedia((prev) => {
      const item = prev.find(m => m.id === id);
      if (item) {
        // Revoke object URL to prevent memory leak
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        // Abort FileReader if still loading
        if (item.status === 'loading' && item.file?._reader) {
          try { item.file._reader.abort(); } catch(e) {}
        }
      }
      return prev.filter(m => m.id !== id);
    });
  }, []);

  const retryAttachMedia = useCallback((id) => {
    setAttachedMedia((prev) => {
      const item = prev.find(m => m.id === id);
      if (!item || !item.file) return prev;
      // Update status to loading
      const updated = prev.map(m => m.id === id ? { ...m, status: 'loading', base64: null } : m);
      // Re-read the file
      readFileAsBase64(item.file)
        .then((base64) => {
          setAttachedMedia((p) =>
            p.map(m => m.id === id ? { ...m, base64, status: 'ready' } : m)
          );
        })
        .catch(() => {
          setAttachedMedia((p) =>
            p.map(m => m.id === id ? { ...m, status: 'error' } : m)
          );
        });
      return updated;
    });
  }, []);

  const stopGeneration = useCallback(() => {
    if (socket && currentRequestIdRef.current) {
      socket.emit('ai-stop', { requestId: currentRequestIdRef.current });
      setIsStreaming(false);
      currentRequestIdRef.current = null;
    }
  }, [socket]);

  const getUsageStats = useCallback((modelName) => {
    return new Promise((resolve) => {
      if (!socket) return resolve(null);
      socket.emit('ai-get-usage', { model: modelName, provider });
      socket.once('ai-usage-data', (data) => {
        resolve(data);
      });
      // Timeout just in case
      setTimeout(() => resolve(null), 3000);
    });
  }, [socket, provider]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    currentRequestIdRef.current = null;
  }, []);

  return {
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
    clearChat,
  };
}
