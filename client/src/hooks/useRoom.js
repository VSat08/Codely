import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Y from 'yjs';

// ─── Base64 Utilities (Bug 3: batch-chunked, ~50x faster for large payloads) ──

const B64_CHUNK = 0x8000; // 32KB — safe for Function.apply() stack limit

/** Convert Uint8Array → base64 string using chunked String.fromCharCode */
function uint8ToBase64(bytes) {
  const parts = [];
  for (let i = 0; i < bytes.length; i += B64_CHUNK) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + B64_CHUNK)));
  }
  return btoa(parts.join(''));
}

/** Convert base64 string → Uint8Array */
function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Chunk threshold: split base64 payloads larger than this (bytes) */
const CHUNK_SIZE = 512 * 1024; // 512KB per chunk

/** Batch window: coalesce rapid Yjs updates within this interval */
const UPDATE_BATCH_MS = 50;

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Hook to manage room state — tabs, users, images, files.
 * Handles all socket events related to room synchronization.
 *
 * Key architecture decisions:
 * - Yjs CRDTs for conflict-free code sync (replaces old string-diffing)
 * - Base64 encoding for binary transport through Socket.io JSON
 * - Chunked emission for large payloads (>512KB)
 * - Batched updates to avoid flooding the socket on rapid typing
 * - Auto-rejoin + state-vector resync on network reconnection
 */
export function useRoom(socket, roomId, reconnectCount) {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState({});
  const [activeTabId, setActiveTabId] = useState(null);
  const [users, setUsers] = useState({});
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const ydocs = useRef({});
  const batchTimers = useRef({});
  const pendingUpdates = useRef({}); // tabId → [Uint8Array, ...]

  // ─── User Identity ──────────────────────────────────────────────────────

  const getUserIdentity = useCallback(() => {
    let userId = localStorage.getItem('codely-user-id');
    let userName = localStorage.getItem('codely-user-name');
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substring(2, 6);
      localStorage.setItem('codely-user-id', userId);
    }
    if (!userName) {
      userName = userId;
      localStorage.setItem('codely-user-name', userName);
    }
    return { userId, userName };
  }, []);

  // ─── Chunked + Batched Emit (Bug 2 + Optimization) ─────────────────────

  /**
   * Queue a Yjs update for batched emission. Multiple rapid updates within
   * UPDATE_BATCH_MS are merged into a single Yjs update using Y.mergeUpdates,
   * then chunked if the result exceeds CHUNK_SIZE.
   */
  const emitYjsUpdate = useCallback((tabId, update) => {
    if (!socket) return;

    // Queue the update
    if (!pendingUpdates.current[tabId]) {
      pendingUpdates.current[tabId] = [];
    }
    pendingUpdates.current[tabId].push(update);

    // Reset the batch timer
    if (batchTimers.current[tabId]) {
      clearTimeout(batchTimers.current[tabId]);
    }

    batchTimers.current[tabId] = setTimeout(() => {
      const updates = pendingUpdates.current[tabId];
      if (!updates || updates.length === 0) return;
      delete pendingUpdates.current[tabId];

      // Merge all queued updates into one
      const merged = updates.length === 1 ? updates[0] : Y.mergeUpdates(updates);
      const b64 = uint8ToBase64(merged);

      // Chunk if necessary
      if (b64.length > CHUNK_SIZE) {
        const totalChunks = Math.ceil(b64.length / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          socket.emit('yjs-update', {
            tabId,
            update: b64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
            chunkIndex: i,
            totalChunks,
          });
        }
      } else {
        socket.emit('yjs-update', { tabId, update: b64 });
      }
    }, UPDATE_BATCH_MS);
  }, [socket]);

  // ─── Ydoc Factory ──────────────────────────────────────────────────────

  /** Create a Yjs doc for a tab, wire its update listener, and store it. */
  const createYdoc = useCallback((tabId, initialState, initialCode) => {
    // Destroy existing doc if any (prevents leaks)
    if (ydocs.current[tabId]) {
      ydocs.current[tabId].destroy();
    }

    const ydoc = new Y.Doc();

    // Apply initial state
    if (initialState) {
      try {
        Y.applyUpdate(ydoc, base64ToUint8(initialState), 'initial');
      } catch (err) {
        console.warn(`[Yjs] Failed to apply initial state for tab ${tabId}:`, err);
      }
    } else if (initialCode) {
      ydoc.getText('monaco').insert(0, initialCode);
    }

    // Wire the update listener — batched emission
    ydoc.on('update', (update, origin) => {
      if (origin !== socket && origin !== 'initial') {
        emitYjsUpdate(tabId, update);
      }
    });

    ydocs.current[tabId] = ydoc;
    return ydoc;
  }, [socket, emitYjsUpdate]);

  // ─── Join Room (initial + reconnect) ────────────────────────────────────

  useEffect(() => {
    if (!socket || !roomId) return;

    const { userId, userName } = getUserIdentity();

    socket.emit('join-room', { roomId, userName, userId }, (response) => {
      if (response.error) {
        console.error('Join error:', response.error);
        return;
      }
      const { state, user, creatorToken } = response;

      if (creatorToken) {
        localStorage.setItem(`codely-creator-${roomId}`, creatorToken);
      }

      if (state) {
        const parsedTabs = {};
        for (const tabId in state.tabs || {}) {
          const tabData = state.tabs[tabId];
          const ydoc = createYdoc(tabId, tabData.yjsState, tabData.code);
          parsedTabs[tabId] = { ...tabData, ydoc };
        }
        setTabs(parsedTabs);

        const tabIds = Object.keys(state.tabs || {});
        if (tabIds.length > 0) {
          setActiveTabId((prev) => (prev && tabIds.includes(prev)) ? prev : tabIds[0]);
        }

        setImages(state.images || []);
        setFiles(state.files || []);
        setUsers(state.users || {});
      }
      setCurrentUser(user);
      setIsJoined(true);
    });

    // ── Socket Listeners ──────────────────────────────────────────────

    const onTabAdded = ({ tab }) => {
      const ydoc = createYdoc(tab.id, tab.yjsState, null);
      setTabs((prev) => ({ ...prev, [tab.id]: { ...tab, ydoc } }));
    };

    const onTabDeleted = ({ tabId }) => {
      // Bug 4: Clean up Yjs doc to prevent memory leak
      const ydoc = ydocs.current[tabId];
      if (ydoc) {
        ydoc.destroy();
        delete ydocs.current[tabId];
      }
      // Clear any pending batch for this tab
      if (batchTimers.current[tabId]) {
        clearTimeout(batchTimers.current[tabId]);
        delete batchTimers.current[tabId];
      }
      delete pendingUpdates.current[tabId];

      setTabs((prev) => {
        const next = { ...prev };
        delete next[tabId];
        return next;
      });
    };

    const onTabRenamed = ({ tabId, newName, newLanguage }) => {
      setTabs((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], name: newName, language: newLanguage || prev[tabId]?.language }
      }));
    };

    // ── Chunked Yjs Update Receiver ──

    const chunkBuffers = {}; // tabId → { chunks: [], received: 0, total: 0 }

    const onYjsUpdate = ({ tabId, update, chunkIndex, totalChunks }) => {
      const ydoc = ydocs.current[tabId];
      if (!ydoc) return;

      // Non-chunked message (fast path)
      if (totalChunks === undefined) {
        try {
          Y.applyUpdate(ydoc, base64ToUint8(update), socket);
        } catch (err) {
          console.warn(`[Yjs] Failed to apply remote update for tab ${tabId}:`, err);
        }
        return;
      }

      // Chunked message — reassemble
      const key = tabId;
      if (!chunkBuffers[key] || chunkIndex === 0) {
        chunkBuffers[key] = { chunks: new Array(totalChunks), received: 0, total: totalChunks };
      }
      const buf = chunkBuffers[key];
      buf.chunks[chunkIndex] = update;
      buf.received++;

      if (buf.received === buf.total) {
        const fullB64 = buf.chunks.join('');
        delete chunkBuffers[key];
        try {
          Y.applyUpdate(ydoc, base64ToUint8(fullB64), socket);
        } catch (err) {
          console.warn(`[Yjs] Failed to apply chunked update for tab ${tabId}:`, err);
        }
      }
    };

    const onTabLanguageChange = ({ tabId, language: lang }) => {
      setTabs((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], language: lang }
      }));
    };

    const onUserJoined = ({ socketId, user }) => {
      setUsers((prev) => ({ ...prev, [socketId]: user }));
    };

    const onUserLeft = ({ socketId }) => {
      setUsers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    const onUserRenamed = ({ socketId, newName }) => {
      setUsers((prev) => ({
        ...prev,
        [socketId]: prev[socketId] ? { ...prev[socketId], name: newName } : prev[socketId],
      }));
    };

    const onImageAdded = ({ image }) => {
      setImages((prev) => {
        if (prev.some((img) => img.id === image.id)) return prev;
        return [...prev, image];
      });
    };

    const onImageRemoved = ({ imageId }) => {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const onRoomRenamed = ({ newId }) => {
      navigate(`/${newId}`, { replace: true });
    };

    const onRoomDeleted = () => {
      navigate('/');
    };

    const onFileAdded = ({ file }) => {
      setFiles((prev) => {
        if (prev.some((f) => f.id === file.id)) return prev;
        return [...prev, file];
      });
    };

    const onFileRemoved = ({ fileId }) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    socket.on('tab-added', onTabAdded);
    socket.on('tab-deleted', onTabDeleted);
    socket.on('tab-renamed', onTabRenamed);
    socket.on('yjs-update', onYjsUpdate);
    socket.on('tab-language-change', onTabLanguageChange);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('user-renamed', onUserRenamed);
    socket.on('image-added', onImageAdded);
    socket.on('image-removed', onImageRemoved);
    socket.on('room-renamed', onRoomRenamed);
    socket.on('room-deleted', onRoomDeleted);
    socket.on('file-added', onFileAdded);
    socket.on('file-removed', onFileRemoved);

    return () => {
      socket.off('tab-added', onTabAdded);
      socket.off('tab-deleted', onTabDeleted);
      socket.off('tab-renamed', onTabRenamed);
      socket.off('yjs-update', onYjsUpdate);
      socket.off('tab-language-change', onTabLanguageChange);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('user-renamed', onUserRenamed);
      socket.off('image-added', onImageAdded);
      socket.off('image-removed', onImageRemoved);
      socket.off('room-renamed', onRoomRenamed);
      socket.off('room-deleted', onRoomDeleted);
      socket.off('file-added', onFileAdded);
      socket.off('file-removed', onFileRemoved);

      // Flush pending batch timers
      Object.values(batchTimers.current).forEach(clearTimeout);
      batchTimers.current = {};
      pendingUpdates.current = {};
    };
  }, [socket, roomId, getUserIdentity, createYdoc]);

  // ─── Bug 1: Auto-Resync on Reconnect ────────────────────────────────────

  useEffect(() => {
    if (!socket || !roomId || reconnectCount === 0) return;

    console.log(`[Resync] Reconnected (attempt #${reconnectCount}), re-joining room...`);

    const { userId, userName } = getUserIdentity();

    // Re-join the room — server assigns us back into the Socket.io room
    socket.emit('join-room', { roomId, userName, userId }, (response) => {
      if (response.error) {
        console.error('[Resync] Re-join failed:', response.error);
        return;
      }

      const { state, user } = response;
      if (!state) return;

      // For each local ydoc, compute what we're missing and request the diff
      for (const tabId in ydocs.current) {
        const localDoc = ydocs.current[tabId];
        if (!localDoc) continue;

        const localSv = Y.encodeStateVector(localDoc);
        const localSvB64 = uint8ToBase64(localSv);

        socket.emit('yjs-resync', { tabId, stateVector: localSvB64 }, (res) => {
          if (res.error || !res.update) return;
          try {
            Y.applyUpdate(localDoc, base64ToUint8(res.update), socket);
            console.log(`[Resync] Tab ${tabId} synced successfully`);
          } catch (err) {
            console.warn(`[Resync] Failed to apply resync for tab ${tabId}:`, err);
          }
        });
      }

      // Also push any local changes the server might have missed
      for (const tabId in ydocs.current) {
        const localDoc = ydocs.current[tabId];
        if (!localDoc) continue;

        // Get the server's state vector from the join response
        const serverTab = state.tabs?.[tabId];
        if (serverTab?.yjsState) {
          // Build a temporary doc from server state to get its state vector
          const tempDoc = new Y.Doc();
          try {
            Y.applyUpdate(tempDoc, base64ToUint8(serverTab.yjsState), 'temp');
            const serverSv = Y.encodeStateVector(tempDoc);
            const localDiff = Y.encodeStateAsUpdate(localDoc, serverSv);
            if (localDiff.length > 2) { // Non-empty update (Yjs empty update is 2 bytes)
              socket.emit('yjs-update', { tabId, update: uint8ToBase64(localDiff) });
            }
          } catch (err) {
            console.warn(`[Resync] Failed to push local diff for tab ${tabId}:`, err);
          } finally {
            tempDoc.destroy();
          }
        }
      }

      // Sync any new tabs we don't have locally
      for (const tabId in state.tabs) {
        if (!ydocs.current[tabId]) {
          const tabData = state.tabs[tabId];
          const ydoc = createYdoc(tabId, tabData.yjsState, tabData.code);
          setTabs((prev) => ({ ...prev, [tabId]: { ...tabData, ydoc } }));
        }
      }

      // Update users/images/files
      setUsers(state.users || {});
      setImages(state.images || []);
      setFiles(state.files || []);
      setCurrentUser(user);
    });
  }, [reconnectCount]); // Only triggers on reconnect, not initial connect

  // ─── Fix active tab deletion edge case ──────────────────────────────────

  useEffect(() => {
    if (activeTabId && !tabs[activeTabId]) {
      const keys = Object.keys(tabs);
      if (keys.length > 0) setActiveTabId(keys[0]);
    }
  }, [tabs, activeTabId]);

  // ─── Cleanup all ydocs on unmount ───────────────────────────────────────

  useEffect(() => {
    return () => {
      Object.values(ydocs.current).forEach((doc) => {
        try { doc.destroy(); } catch (_) { /* ignore */ }
      });
      ydocs.current = {};
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleTabLanguageChange = useCallback(
    (tabId, lang) => {
      setTabs((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], language: lang }
      }));
      if (socket) socket.emit('tab-language-change', { tabId, language: lang });
    },
    [socket]
  );

  const handleAddTab = useCallback((name, language) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Not connected');
      socket.emit('add-tab', { name, language }, (res) => {
        if (res.error) reject(res.error);
        else resolve(res.tab);
      });
    });
  }, [socket]);

  const handleDeleteTab = useCallback((tabId) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Not connected');
      socket.emit('delete-tab', { tabId }, (res) => {
        if (res.error) reject(res.error);
        else resolve();
      });
    });
  }, [socket]);

  const handleRenameTab = useCallback((tabId, newName, newLanguage) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Not connected');
      socket.emit('rename-tab', { tabId, newName, newLanguage }, (res) => {
        if (res.error) reject(res.error);
        else resolve();
      });
    });
  }, [socket]);

  const handleImageShare = useCallback(
    (imageData, imageName) => {
      return new Promise((resolve, reject) => {
        if (!socket) return reject('Not connected');
        const { userName } = getUserIdentity();
        socket.emit(
          'image-share',
          { imageData, name: imageName, uploadedBy: userName },
          (res) => {
            if (res.error) reject(res.error);
            else resolve(res);
          }
        );
      });
    },
    [socket, getUserIdentity]
  );

  const handleImageDelete = useCallback(
    (imageId) => {
      if (socket) socket.emit('image-delete', { imageId });
    },
    [socket]
  );

  const handleFileShare = useCallback(
    (fileData, fileName, fileSize) => {
      return new Promise((resolve, reject) => {
        if (!socket) return reject('Not connected');
        const { userName } = getUserIdentity();
        socket.emit(
          'file-share',
          { fileData, name: fileName, size: fileSize, uploadedBy: userName },
          (res) => {
            if (res.error) reject(res.error);
            else resolve(res);
          }
        );
      });
    },
    [socket, getUserIdentity]
  );

  const handleFileDelete = useCallback(
    (fileId) => {
      if (socket) socket.emit('file-delete', { fileId });
    },
    [socket]
  );

  const handleRenameUser = useCallback(
    (newName) => {
      localStorage.setItem('codely-user-name', newName);
      if (socket) socket.emit('rename-user', { newName });
    },
    [socket]
  );

  const handleRenameRoom = useCallback(
    (newId) => {
      return new Promise((resolve, reject) => {
        if (!socket) return reject('Not connected');
        socket.emit('rename-room', { newId }, (res) => {
          if (res.error) reject(res.error);
          else resolve(res);
        });
      });
    },
    [socket]
  );

  const handleDeleteRoom = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject('Not connected');
      socket.emit('delete-room', {}, (res) => {
        if (res.error) reject(res.error);
        else resolve(res);
      });
    });
  }, [socket]);

  const activeTab = activeTabId ? tabs[activeTabId] : null;

  return {
    tabs,
    activeTabId,
    activeTab,
    ydocs: ydocs.current,
    setActiveTabId,
    users,
    images,
    files,
    isJoined,
    currentUser,
    handleTabLanguageChange,
    handleAddTab,
    handleDeleteTab,
    handleRenameTab,
    handleImageShare,
    handleImageDelete,
    handleFileShare,
    handleFileDelete,
    handleRenameUser,
    handleRenameRoom,
    handleDeleteRoom,
  };
}
