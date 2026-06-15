import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Y from 'yjs';/**
 * Hook to manage room state — tabs, users, images.
 * Handles all socket events related to room synchronization.
 */
export function useRoom(socket, roomId) {
  const navigate = useNavigate();
  const [tabs, setTabs] = useState({});
  const [activeTabId, setActiveTabId] = useState(null);
  
  const [users, setUsers] = useState({});
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Track whether a code change came from a remote user (per tab)
  const remoteChanges = useRef({});
  const ydocs = useRef({});
  const debounceTimers = useRef({});

  // Get or create user identity from localStorage
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

  // Join the room on mount
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
          const ydoc = new Y.Doc();
          if (tabData.yjsState) {
            const binaryString = atob(tabData.yjsState);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            Y.applyUpdate(ydoc, bytes, 'initial');
          } else if (tabData.code) {
             ydoc.getText('monaco').insert(0, tabData.code);
          }
          ydoc.on('update', (update, origin) => {
            if (origin !== socket && origin !== 'initial') {
              socket.emit('yjs-update', { tabId, update });
            }
          });
          ydocs.current[tabId] = ydoc;
          parsedTabs[tabId] = { ...tabData, ydoc };
        }
        setTabs(parsedTabs);
        // Set first tab as active initially
        const tabIds = Object.keys(state.tabs || {});
        if (tabIds.length > 0) setActiveTabId(tabIds[0]);
        
        setImages(state.images || []);
        setFiles(state.files || []);
        setUsers(state.users || {});
      }
      setCurrentUser(user);
      setIsJoined(true);
    });

    // ── Socket Listeners ──

    const onTabAdded = ({ tab }) => {
      const ydoc = new Y.Doc();
      if (tab.yjsState) {
        const binaryString = atob(tab.yjsState);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        Y.applyUpdate(ydoc, bytes, 'initial');
      }
      ydoc.on('update', (update, origin) => {
        if (origin !== socket && origin !== 'initial') {
          socket.emit('yjs-update', { tabId: tab.id, update });
        }
      });
      ydocs.current[tab.id] = ydoc;
      setTabs((prev) => ({ ...prev, [tab.id]: { ...tab, ydoc } }));
    };

    const onTabDeleted = ({ tabId }) => {
      setTabs((prev) => {
        const next = { ...prev };
        delete next[tabId];
        return next;
      });
    };

    const onTabRenamed = ({ tabId, newName, newLanguage }) => {
      setTabs((prev) => ({
        ...prev,
        [tabId]: { ...prev[tabId], name: newName, language: newLanguage || prev[tabId].language }
      }));
    };

    const onYjsUpdate = ({ tabId, update }) => {
      const ydoc = ydocs.current[tabId];
      if (ydoc) {
        Y.applyUpdate(ydoc, new Uint8Array(update), socket);
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
    };
  }, [socket, roomId, getUserIdentity]);

  // Fix active tab deletion edge case via effect
  useEffect(() => {
    if (activeTabId && !tabs[activeTabId]) {
      const keys = Object.keys(tabs);
      if (keys.length > 0) setActiveTabId(keys[0]);
    }
  }, [tabs, activeTabId]);

  // ── Actions ──

  const handleTabCodeChange = useCallback((tabId, newCode) => {}, []);

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
    isRemoteChange: activeTabId ? !!remoteChanges.current[activeTabId] : false,
    handleTabCodeChange,
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
