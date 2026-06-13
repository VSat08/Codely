/**
 * Codely Server — Express + Socket.io
 * Serves the React build in production and handles real-time WebSocket communication.
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const { setupSocketHandlers } = require('./socketHandlers');
const { startCleanup } = require('./cleanup');
const { setupAIHandlers } = require('./aiHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// CORS for development
app.use(cors());

// Serve React build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB to accommodate base64 images + media uploads
});

// Wire up all socket event handlers
setupSocketHandlers(io);
setupAIHandlers(io);

// Start the 30-day room cleanup job
startCleanup();

// SPA fallback — all routes serve index.html (React Router handles routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

server.listen(PORT, () => {
  console.log(`\n  🚀 Codely server running on http://localhost:${PORT}\n`);
});
