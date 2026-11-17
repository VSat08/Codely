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
const { setupTerminalHandlers } = require('./terminalManager');
const { runCode } = require('./codeRunner');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// CORS for development
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '1mb' }));

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
  pingTimeout: 60000,   // 60s — tolerate slow/lossy networks (default 20s)
  pingInterval: 25000,  // 25s heartbeat
});

// Wire up all socket event handlers
setupSocketHandlers(io);
setupAIHandlers(io);
setupTerminalHandlers(io);

// Start the 30-day room cleanup job
startCleanup();

// Code Execution API endpoint
app.post('/api/run', async (req, res) => {
  try {
    const { language, code, stdin } = req.body || {};
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const result = await runCode({ language, code, stdin, ip });
    return res.json(result);
  } catch (err) {
    console.error('[CodeRunner Route Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal execution error occurred.',
      status: { id: 0, description: 'Server Error' }
    });
  }
});

// SPA fallback — all routes serve index.html (React Router handles routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global crash guards
process.on('uncaughtException', (err) => {
  console.error('[Server Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server Unhandled Rejection]:', reason);
});

server.listen(PORT, () => {
  console.log(`\n  🚀 Codely server running on http://localhost:${PORT}\n`);
});
