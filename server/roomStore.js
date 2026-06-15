/**
 * In-memory room store for Codely.
 * All room data lives here — no database, no persistence.
 * Rooms are lost on server restart (by design for privacy).
 */

const crypto = require('crypto');
const Y = require('yjs');

const rooms = new Map();

function generateId(length = 8) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

function createRoom(id, defaultLanguage = 'javascript') {
  const defaultTabId = generateId();
  const ydoc = new Y.Doc();
  const room = {
    id,
    tabs: {
      [defaultTabId]: {
        id: defaultTabId,
        name: `main.${getExtension(defaultLanguage)}`,
        language: defaultLanguage,
        code: '',
        ydoc: ydoc
      }
    },
    images: [],
    files: [],
    users: new Map(),
    lastActivity: Date.now(),
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

function getExtension(language) {
  const map = {
    javascript: 'js', typescript: 'ts', python: 'py', html: 'html',
    css: 'css', json: 'json', markdown: 'md', java: 'java', c: 'c',
    cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', sql: 'sql',
    ruby: 'rb', php: 'php', swift: 'swift', kotlin: 'kt',
    dart: 'dart', shell: 'sh', plaintext: 'txt'
  };
  return map[language] || 'txt';
}

function getRoom(id) {
  const room = rooms.get(id);
  if (room) room.lastActivity = Date.now();
  return room || null;
}

function roomExists(id) {
  return rooms.has(id);
}

// ── Tab Management ──

function addTab(roomId, tabId, name, language) {
  const room = rooms.get(roomId);
  if (room) {
    room.tabs[tabId] = { id: tabId, name, language, code: '', ydoc: new Y.Doc() };
    room.lastActivity = Date.now();
    return {
      id: tabId,
      name,
      language,
      code: '',
      yjsState: Buffer.from(Y.encodeStateAsUpdate(room.tabs[tabId].ydoc)).toString('base64')
    };
  }
  return null;
}

function removeTab(roomId, tabId) {
  const room = rooms.get(roomId);
  if (room && room.tabs[tabId]) {
    // Prevent deleting the very last tab
    if (Object.keys(room.tabs).length <= 1) return false;
    delete room.tabs[tabId];
    room.lastActivity = Date.now();
    return true;
  }
  return false;
}

function renameTab(roomId, tabId, newName, newLanguage) {
  const room = rooms.get(roomId);
  if (room && room.tabs[tabId]) {
    room.tabs[tabId].name = newName;
    if (newLanguage) room.tabs[tabId].language = newLanguage;
    room.lastActivity = Date.now();
    return room.tabs[tabId];
  }
  return null;
}

function updateTabCode(roomId, tabId, code) {
  const room = rooms.get(roomId);
  if (room && room.tabs[tabId]) {
    room.tabs[tabId].code = code;
    room.lastActivity = Date.now();
  }
}

function applyYjsUpdate(roomId, tabId, updateBuffer) {
  const room = rooms.get(roomId);
  if (room && room.tabs[tabId]) {
    const ydoc = room.tabs[tabId].ydoc;
    Y.applyUpdate(ydoc, new Uint8Array(updateBuffer));
    room.tabs[tabId].code = ydoc.getText('monaco').toString();
    room.lastActivity = Date.now();
  }
}

function updateTabLanguage(roomId, tabId, language) {
  const room = rooms.get(roomId);
  if (room && room.tabs[tabId]) {
    room.tabs[tabId].language = language;
    room.lastActivity = Date.now();
  }
}

// ── Image & User Management ──

function addImage(roomId, image) {
  const room = rooms.get(roomId);
  if (!room || room.images.length >= 10) return false;
  room.images.push(image);
  room.lastActivity = Date.now();
  return true;
}

function removeImage(roomId, imageId) {
  const room = rooms.get(roomId);
  if (room) {
    room.images = room.images.filter((img) => img.id !== imageId);
    room.lastActivity = Date.now();
  }
}

// ── File Management ──

function addFile(roomId, file) {
  const room = rooms.get(roomId);
  if (!room || room.files.length >= 10) return false;
  room.files.push(file);
  room.lastActivity = Date.now();
  return true;
}

function removeFile(roomId, fileId) {
  const room = rooms.get(roomId);
  if (room) {
    room.files = room.files.filter((f) => f.id !== fileId);
    room.lastActivity = Date.now();
  }
}

function addUser(roomId, socketId, user) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.set(socketId, user);
    room.lastActivity = Date.now();
  }
}

function removeUser(roomId, socketId) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(socketId);
    room.lastActivity = Date.now();
  }
}

function renameRoom(oldId, newId) {
  const room = rooms.get(oldId);
  if (!room || rooms.has(newId)) return false;
  room.id = newId;
  rooms.delete(oldId);
  rooms.set(newId, room);
  room.lastActivity = Date.now();
  return true;
}

function deleteRoom(id) {
  return rooms.delete(id);
}

/** Serialize room state for sending to clients */
function getRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  const usersObj = {};
  for (const [sid, user] of room.users) {
    usersObj[sid] = user;
  }
  
  const serializedTabs = {};
  for (const tabId in room.tabs) {
    const tab = room.tabs[tabId];
    serializedTabs[tabId] = {
      id: tab.id,
      name: tab.name,
      language: tab.language,
      code: tab.code,
      yjsState: Buffer.from(Y.encodeStateAsUpdate(tab.ydoc)).toString('base64')
    };
  }

  return {
    id: room.id,
    tabs: serializedTabs,
    images: room.images,
    files: room.files || [],
    users: usersObj,
  };
}

module.exports = {
  rooms,
  generateId,
  createRoom,
  getRoom,
  roomExists,
  addTab,
  removeTab,
  renameTab,
  updateTabCode,
  applyYjsUpdate,
  updateTabLanguage,
  addImage,
  removeImage,
  addFile,
  removeFile,
  addUser,
  removeUser,
  renameRoom,
  deleteRoom,
  getRoomState,
};
