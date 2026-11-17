/**
 * Codely Interactive Terminal Manager
 * Manages real-time, bi-directional execution of code processes over WebSockets.
 * Allows interactive stdin (e.g. input(), Scanner, cin, readline) without breaking.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { runCode } = require('./codeRunner');

// Track active running processes: socketId -> ProcessInfo
const activeSessions = new Map();

// Base temporary directory for running scripts
const BASE_TEMP_DIR = path.join(os.tmpdir(), 'codely_interactive');
try {
  if (!fs.existsSync(BASE_TEMP_DIR)) {
    fs.mkdirSync(BASE_TEMP_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('[TerminalManager] Failed to create base temp dir:', err.message);
}

/**
 * Inspect Java code structure to determine appropriate source file name,
 * main execution class, and package handling.
 */
function inspectJavaSource(code, fileName = 'Main.java') {
  const pkgMatch = code.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
  const packageName = pkgMatch ? pkgMatch[1].trim() : '';

  const publicMatch = code.match(/public\s+(?:final\s+)?class\s+([A-Za-z0-9_]+)/);
  const publicClassName = publicMatch ? publicMatch[1] : null;

  let mainClassName = null;
  const mainMatch = code.match(/(?:public\s+static\s+void\s+main|static\s+public\s+void\s+main)/);
  if (mainMatch) {
    const beforeMain = code.slice(0, mainMatch.index);
    const classMatches = [...beforeMain.matchAll(/class\s+([A-Za-z0-9_]+)/g)];
    if (classMatches.length > 0) {
      mainClassName = classMatches[classMatches.length - 1][1];
    }
  }

  const sourceClassName = publicClassName || mainClassName || (fileName || 'Main').replace(/\.java$/i, '') || 'Main';
  const execClassName = mainClassName || publicClassName || sourceClassName;
  const fullyQualifiedExecClass = packageName ? `${packageName}.${execClassName}` : execClassName;

  return {
    sourceClassName,
    execClassName,
    fullyQualifiedExecClass,
    packageName,
  };
}

/**
 * Kill process tree reliably across Windows and POSIX
 */
function killProcessTree(proc) {
  if (!proc || proc.killed) return;
  const pid = proc.pid;
  if (!pid) return;

  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', pid.toString(), '/f', '/t'], { stdio: 'ignore' });
    } catch {
      try { proc.kill('SIGKILL'); } catch {}
    }
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try { proc.kill('SIGKILL'); } catch {}
    }
  }
}

/**
 * Clean up a temporary directory and all files inside it
 */
function cleanTempDir(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return;
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors on busy files
  }
}

/**
 * Setup Socket.io handlers for interactive terminal
 */
function setupTerminalHandlers(io) {
  io.on('connection', (socket) => {
    // ── 1. Start Interactive Execution ──
    socket.on('terminal:start', async (payload, callback) => {
      const { roomId, language = 'python', code = '', fileName = 'script.py' } = payload || {};

      // Kill any existing running process for this socket
      stopSession(socket.id);

      if (!code || !code.trim()) {
        socket.emit('terminal:data', { data: '⚠️ Cannot run empty file.\n', stream: 'stderr' });
        socket.emit('terminal:exit', { code: 1 });
        return callback?.({ error: 'Empty code' });
      }

      const lang = (language || '').toLowerCase().trim();
      const sessionId = `${socket.id}_${Date.now()}`;
      const sessionDir = path.join(BASE_TEMP_DIR, sessionId);

      try {
        fs.mkdirSync(sessionDir, { recursive: true });
      } catch (err) {
        socket.emit('terminal:data', { data: `⚠️ Internal error creating workspace: ${err.message}\n`, stream: 'stderr' });
        socket.emit('terminal:exit', { code: 1 });
        return callback?.({ error: err.message });
      }

      // Determine execution command based on language
      let cmd = null;
      let args = [];
      let scriptFile = path.join(sessionDir, fileName);

      // Write code to file so stack traces and line numbers match user's tab name
      try {
        fs.writeFileSync(scriptFile, code, 'utf8');
      } catch (err) {
        cleanTempDir(sessionDir);
        socket.emit('terminal:data', { data: `⚠️ Failed to write source file: ${err.message}\n`, stream: 'stderr' });
        socket.emit('terminal:exit', { code: 1 });
        return callback?.({ error: err.message });
      }

      if (lang === 'python') {
        cmd = 'python';
        // -u flag forces unbuffered binary stdout and stderr, vital for interactive input() prompts
        args = ['-u', scriptFile];
      } else if (lang === 'javascript' || lang === 'node') {
        cmd = 'node';
        args = [scriptFile];
      } else if (lang === 'java') {
        // Java Support: Detect class structure, package, and main entrypoint
        const { sourceClassName, fullyQualifiedExecClass } = inspectJavaSource(code, fileName);
        const javaSourcePath = path.join(sessionDir, `${sourceClassName}.java`);

        try {
          fs.writeFileSync(javaSourcePath, code, 'utf8');
        } catch (err) {
          cleanTempDir(sessionDir);
          socket.emit('terminal:data', { data: `⚠️ Failed to write Java file: ${err.message}\n`, stream: 'stderr' });
          socket.emit('terminal:exit', { code: 1 });
          return callback?.({ error: err.message });
        }

        // Compile Java source with javac into current session directory
        const startTime = Date.now();
        const javacProc = spawn('javac', ['-d', '.', `${sourceClassName}.java`], { cwd: sessionDir });
        let compileErrors = '';

        const session = {
          proc: javacProc,
          sessionDir,
          startTime,
          timeoutTimer: null,
          exited: false,
          cancelled: false,
        };
        activeSessions.set(socket.id, session);

        javacProc.on('error', (err) => {
          if (session.cancelled || session.exited) return;
          session.exited = true;
          activeSessions.delete(socket.id);
          cleanTempDir(sessionDir);
          socket.emit('terminal:data', { data: `⚠️ Javac error: ${err.message}\n`, stream: 'stderr' });
          socket.emit('terminal:exit', { code: 1 });
        });

        javacProc.stderr.on('data', (d) => {
          compileErrors += d.toString();
        });

        javacProc.on('close', (javacCode) => {
          if (session.cancelled || session.exited) return;

          if (javacCode !== 0) {
            cleanTempDir(sessionDir);
            activeSessions.delete(socket.id);
            socket.emit('terminal:data', { data: compileErrors || '⚠️ Compilation failed.\n', stream: 'stderr' });
            socket.emit('terminal:exit', { code: javacCode || 1, timeMs: Date.now() - startTime });
            return;
          }

          // Compilation succeeded — execute with interactive java process
          let childProc;
          try {
            childProc = spawn('java', ['-cp', '.', fullyQualifiedExecClass], {
              cwd: sessionDir,
              env: {
                ...process.env,
                NODE_DISABLE_COLORS: '1',
              },
            });
          } catch (err) {
            cleanTempDir(sessionDir);
            activeSessions.delete(socket.id);
            socket.emit('terminal:data', { data: `⚠️ Failed to launch Java: ${err.message}\n`, stream: 'stderr' });
            socket.emit('terminal:exit', { code: 1 });
            return;
          }

          session.proc = childProc;

          // Prevent unhandled EPIPE if stdin is written after process terminates
          childProc.stdin?.on('error', () => {});

          childProc.on('error', (err) => {
            if (session.exited) return;
            session.exited = true;
            activeSessions.delete(socket.id);
            cleanTempDir(sessionDir);
            socket.emit('terminal:data', { data: `⚠️ Java runtime error: ${err.message}\n`, stream: 'stderr' });
            socket.emit('terminal:exit', { code: 1 });
          });

          socket.emit('terminal:started', { language, fileName });

          childProc.stdout.on('data', (chunk) => {
            if (session.exited) return;
            socket.emit('terminal:data', { data: chunk.toString(), stream: 'stdout' });
          });

          childProc.stderr.on('data', (chunk) => {
            if (session.exited) return;
            socket.emit('terminal:data', { data: chunk.toString(), stream: 'stderr' });
          });

          childProc.on('close', (code, signal) => {
            if (session.exited) return;
            session.exited = true;
            if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
            activeSessions.delete(socket.id);
            cleanTempDir(sessionDir);
            socket.emit('terminal:exit', {
              code: code != null ? code : (signal ? 130 : 0),
              signal,
              timeMs: Date.now() - startTime,
            });
          });

          session.timeoutTimer = setTimeout(() => {
            if (!session.exited) {
              socket.emit('terminal:data', {
                data: '\n⚠️ Execution timed out after 3 minutes (killed by system).\n',
                stream: 'stderr',
              });
              stopSession(socket.id, true, socket);
            }
          }, 180000);
        });

        return callback?.({ started: true, mode: 'interactive' });
      }

      // Fallback to Judge0 batch runner if language is not locally supported
      if (!cmd) {
        cleanTempDir(sessionDir);
        runWithJudge0Fallback(socket, { language, code, fileName });
        return callback?.({ started: true, mode: 'judge0' });
      }

      const startTime = Date.now();
      let childProc;

      try {
        childProc = spawn(cmd, args, {
          cwd: sessionDir,
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            NODE_DISABLE_COLORS: '1',
          },
        });
      } catch (err) {
        cleanTempDir(sessionDir);
        console.warn(`[TerminalManager] Local spawn failed for ${cmd}, falling back to Judge0:`, err.message);
        runWithJudge0Fallback(socket, { language, code, fileName });
        return callback?.({ started: true, mode: 'judge0' });
      }

      // Session record
      const session = {
        proc: childProc,
        sessionDir,
        startTime,
        timeoutTimer: null,
        exited: false,
      };

      // Guard stdin against unhandled EPIPE if process terminates while writing
      childProc.stdin?.on('error', () => {});

      activeSessions.set(socket.id, session);

      // Notify client that execution has started
      callback?.({ started: true, mode: 'interactive' });
      socket.emit('terminal:started', { language, fileName });

      // Handle stdout data chunks in real time
      childProc.stdout.on('data', (chunk) => {
        if (session.exited) return;
        const text = chunk.toString();
        socket.emit('terminal:data', { data: text, stream: 'stdout' });
      });

      // Handle stderr data chunks in real time
      childProc.stderr.on('data', (chunk) => {
        if (session.exited) return;
        const text = chunk.toString();
        socket.emit('terminal:data', { data: text, stream: 'stderr' });
      });

      // Handle process spawn error (e.g. command not found)
      childProc.on('error', (err) => {
        if (session.exited) return;
        session.exited = true;
        activeSessions.delete(socket.id);
        cleanTempDir(sessionDir);

        console.warn(`[TerminalManager] Child process error for ${cmd}:`, err.message);
        // Fallback to Judge0
        runWithJudge0Fallback(socket, { language, code, fileName });
      });

      // Handle process completion
      childProc.on('close', (code, signal) => {
        if (session.exited) return;
        session.exited = true;
        if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
        activeSessions.delete(socket.id);

        cleanTempDir(sessionDir);

        const elapsed = Date.now() - startTime;
        socket.emit('terminal:exit', {
          code: code != null ? code : (signal ? 130 : 0),
          signal,
          timeMs: elapsed,
        });
      });

      // Safety timeout: 3 minutes max execution time
      session.timeoutTimer = setTimeout(() => {
        if (!session.exited) {
          socket.emit('terminal:data', {
            data: '\n⚠️ Execution timed out after 3 minutes (killed by system).\n',
            stream: 'stderr',
          });
          stopSession(socket.id, true, socket);
        }
      }, 180000);
    });

    // ── 2. Send Interactive Standard Input (stdin) ──
    socket.on('terminal:input', (payload) => {
      const { input = '' } = payload || {};
      const session = activeSessions.get(socket.id);
      if (!session || !session.proc || session.exited) return;

      try {
        if (session.proc.stdin && !session.proc.stdin.destroyed && session.proc.stdin.writable) {
          session.proc.stdin.write(input + '\n');
        }
      } catch (err) {
        console.warn('[TerminalManager] stdin write error:', err.message);
      }
    });

    // ── 3. Kill / Interrupt Active Process (Ctrl+C / Stop) ──
    socket.on('terminal:kill', () => {
      const session = activeSessions.get(socket.id);
      if (!session || !session.proc || session.exited) return;

      socket.emit('terminal:data', {
        data: '\n^C\nKeyboardInterrupt: Execution stopped by user.\n',
        stream: 'system',
      });
      stopSession(socket.id, true, socket);
    });

    // ── 4. Clean up on Socket Disconnect ──
    socket.on('disconnect', () => {
      stopSession(socket.id, false);
    });
  });
}

/**
 * Stop and clean up an active session
 */
function stopSession(socketId, emitExit = false, socket = null) {
  const session = activeSessions.get(socketId);
  if (!session) return;

  session.cancelled = true;
  session.exited = true;
  if (session.timeoutTimer) clearTimeout(session.timeoutTimer);
  killProcessTree(session.proc);
  cleanTempDir(session.sessionDir);
  activeSessions.delete(socketId);

  if (emitExit && socket) {
    socket.emit('terminal:exit', {
      code: 130,
      signal: 'SIGINT',
      timeMs: Date.now() - (session.startTime || Date.now()),
      stopped: true,
    });
  }
}

/**
 * Fallback to Judge0 when a local compiler or runtime is unavailable
 */
async function runWithJudge0Fallback(socket, { language, code, fileName }) {
  socket.emit('terminal:started', { language, fileName, fallback: true });
  socket.emit('terminal:data', { data: `[Running ${fileName} via Cloud Sandbox...]\n`, stream: 'stdout' });

  try {
    const result = await runCode({ language, code, stdin: '' });
    if (result.stdout) {
      socket.emit('terminal:data', { data: result.stdout, stream: 'stdout' });
    }
    if (result.stderr) {
      socket.emit('terminal:data', { data: result.stderr, stream: 'stderr' });
    }
    if (result.error && !result.stderr) {
      socket.emit('terminal:data', { data: `⚠️ ${result.error}\n`, stream: 'stderr' });
    }
    socket.emit('terminal:exit', {
      code: result.success ? 0 : 1,
      timeMs: result.time ? parseInt(result.time, 10) : null,
    });
  } catch (err) {
    socket.emit('terminal:data', { data: `⚠️ Execution failed: ${err.message}\n`, stream: 'stderr' });
    socket.emit('terminal:exit', { code: 1 });
  }
}

module.exports = {
  setupTerminalHandlers,
  stopSession,
};
