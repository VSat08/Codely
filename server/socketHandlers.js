/**
 * Socket.io event handlers for Codely.
 * Handles room creation, joining, code sync, image sharing, and user presence.
 */

const roomStore = require('./roomStore');

const USER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#F43F5E', '#22D3EE', '#E879F9',
];

function getRandomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    let currentRoom = null;

    // ── Create Room ──
    socket.on('create-room', (data, callback) => {
      const { language, customId } = data || {};
      const roomId = customId || roomStore.generateId(8);

      if (customId && roomStore.roomExists(customId)) {
        return callback({ error: 'Room ID already exists. Try a different name.' });
      }

      const creatorToken = roomStore.generateId(32);
      roomStore.createRoom(roomId, language || 'javascript', creatorToken);
      callback({ roomId, creatorToken });
    });

    // ── Join Room ──
    socket.on('join-room', (data, callback) => {
      const { roomId, userName, userId } = data || {};
      if (!roomId) return callback({ error: 'Room ID required' });

      // Auto-create room if accessed via direct URL
      if (!roomStore.getRoom(roomId)) {
        roomStore.createRoom(roomId, 'javascript');
      }

      // Leave previous room
      if (currentRoom) {
        socket.leave(currentRoom);
        roomStore.removeUser(currentRoom, socket.id);
        io.to(currentRoom).emit('user-left', { socketId: socket.id });
      }

      currentRoom = roomId;
      socket.join(roomId);

      const user = {
        id: userId || `user-${roomStore.generateId(4)}`,
        name: userName || userId || `user-${roomStore.generateId(4)}`,
        color: getRandomColor(),
      };

      roomStore.addUser(roomId, socket.id, user);

      // Send full room state to the joiner
      const state = roomStore.getRoomState(roomId);
      callback({ 
        state, 
        user
      });

      // Notify others
      socket.to(roomId).emit('user-joined', { socketId: socket.id, user });
    });

    // ── Tab Management ──
    socket.on('add-tab', (data, callback) => {
      if (!currentRoom) return callback?.({ error: 'Not in a room' });
      const { name, language } = data;
      const tabId = roomStore.generateId(8);
      const tab = roomStore.addTab(currentRoom, tabId, name, language);
      if (tab) {
        io.to(currentRoom).emit('tab-added', { tab });
        if (callback) callback({ success: true, tab });
      } else {
        if (callback) callback({ error: 'Failed to add tab' });
      }
    });

    socket.on('delete-tab', ({ tabId }, callback) => {
      if (!currentRoom) return callback?.({ error: 'Not in a room' });
      const success = roomStore.removeTab(currentRoom, tabId);
      if (success) {
        io.to(currentRoom).emit('tab-deleted', { tabId });
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ error: 'Cannot delete the last tab' });
      }
    });

    socket.on('rename-tab', ({ tabId, newName, newLanguage }, callback) => {
      if (!currentRoom) return callback?.({ error: 'Not in a room' });
      const tab = roomStore.renameTab(currentRoom, tabId, newName, newLanguage);
      if (tab) {
        io.to(currentRoom).emit('tab-renamed', { tabId, newName, newLanguage });
        if (callback) callback({ success: true });
      }
    });

    // ── Code Sync ──
    socket.on('tab-code-change', ({ tabId, code }) => {
      if (!currentRoom) return;
      roomStore.updateTabCode(currentRoom, tabId, code);
      socket.to(currentRoom).emit('tab-code-change', { tabId, code });
    });

    // ── Language Change ──
    socket.on('tab-language-change', ({ tabId, language }) => {
      if (!currentRoom) return;
      roomStore.updateTabLanguage(currentRoom, tabId, language);
      socket.to(currentRoom).emit('tab-language-change', { tabId, language });
    });

    // ── Cursor Sync ──
    socket.on('cursor-update', (data) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('cursor-update', {
        socketId: socket.id,
        ...data,
      });
    });

    // ── Image Share ──
    socket.on('image-share', (data, callback) => {
      if (!currentRoom) return callback({ error: 'Not in a room' });

      const { imageData, name, uploadedBy } = data;

      // Validate size (~2MB in base64 ≈ 2.67M chars)
      if (imageData && imageData.length > 2.67 * 1024 * 1024) {
        return callback({ error: 'Image too large. Max 2MB.' });
      }

      const image = {
        id: roomStore.generateId(8),
        data: imageData,
        name: name || 'screenshot.png',
        uploadedBy: uploadedBy || 'Anonymous',
        timestamp: Date.now(),
      };

      const success = roomStore.addImage(currentRoom, image);
      if (!success) {
        return callback({ error: 'Room image limit reached (max 10).' });
      }

      callback({ success: true, imageId: image.id });
      io.to(currentRoom).emit('image-added', { image });
    });

    // ── Image Delete ──
    socket.on('image-delete', ({ imageId }) => {
      if (!currentRoom) return;
      roomStore.removeImage(currentRoom, imageId);
      io.to(currentRoom).emit('image-removed', { imageId });
    });

    // ── File Share ──
    socket.on('file-share', (data, callback) => {
      if (!currentRoom) return callback({ error: 'Not in a room' });

      const { fileData, name, size, uploadedBy } = data;

      // Validate size (~2MB in base64 ≈ 2.67M chars)
      if (fileData && fileData.length > 2.67 * 1024 * 1024) {
        return callback({ error: 'File too large. Max 2MB.' });
      }

      const file = {
        id: roomStore.generateId(8),
        data: fileData,
        name: name || 'document',
        size: size || 0,
        uploadedBy: uploadedBy || 'Anonymous',
        timestamp: Date.now(),
      };

      const success = roomStore.addFile(currentRoom, file);
      if (!success) {
        return callback({ error: 'Room file limit reached (max 10).' });
      }

      callback({ success: true, fileId: file.id });
      io.to(currentRoom).emit('file-added', { file });
    });

    // ── File Delete ──
    socket.on('file-delete', ({ fileId }) => {
      if (!currentRoom) return;
      roomStore.removeFile(currentRoom, fileId);
      io.to(currentRoom).emit('file-removed', { fileId });
    });

    // ── Rename Room ──
    socket.on('rename-room', ({ newId }, callback) => {
      if (!currentRoom) return callback?.({ error: 'Not in a room' });

      if (!/^[a-zA-Z0-9_-]+$/.test(newId) || newId.length < 2 || newId.length > 32) {
        return callback?.({ error: 'Invalid ID. Use 2-32 alphanumeric characters, hyphens, or underscores.' });
      }

      const success = roomStore.renameRoom(currentRoom, newId);
      if (!success) return callback?.({ error: 'Room ID already taken.' });

      const oldRoom = currentRoom;
      // Move all sockets to new room name
      const socketsInRoom = io.sockets.adapter.rooms.get(oldRoom);
      if (socketsInRoom) {
        for (const sid of socketsInRoom) {
          const s = io.sockets.sockets.get(sid);
          if (s) {
            s.leave(oldRoom);
            s.join(newId);
          }
        }
      }

      currentRoom = newId;
      io.to(newId).emit('room-renamed', { oldId: oldRoom, newId });
      if (callback) callback({ success: true });
    });

    // ── Delete Room ──
    socket.on('delete-room', (data, callback) => {
      if (!currentRoom) return callback?.({ error: 'Not in a room' });

      io.to(currentRoom).emit('room-deleted', { roomId: currentRoom });

      // Remove all sockets from room
      const socketsInRoom = io.sockets.adapter.rooms.get(currentRoom);
      if (socketsInRoom) {
        for (const sid of socketsInRoom) {
          const s = io.sockets.sockets.get(sid);
          if (s) s.leave(currentRoom);
        }
      }

      roomStore.deleteRoom(currentRoom);
      currentRoom = null;
      if (callback) callback({ success: true });
    });

    // ── Rename User ──
    socket.on('rename-user', ({ newName }) => {
      if (!currentRoom) return;
      const room = roomStore.getRoom(currentRoom);
      if (!room) return;
      const user = room.users.get(socket.id);
      if (user) {
        user.name = newName;
        io.to(currentRoom).emit('user-renamed', {
          socketId: socket.id,
          newName,
        });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      if (currentRoom) {
        roomStore.removeUser(currentRoom, socket.id);
        io.to(currentRoom).emit('user-left', { socketId: socket.id });
      }
    });
  });
}

module.exports = { setupSocketHandlers };
