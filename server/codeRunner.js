/**
 * Codely Code Runner
 * Proxies code execution to Judge0 CE (Community Edition) - 100% free, no API key required.
 * Configurable via CODE_RUNNER_API_URL environment variable if self-hosting.
 */

const DEFAULT_JUDGE0_URL = process.env.CODE_RUNNER_API_URL || 'https://ce.judge0.com';
const TIMEOUT_MS = 15000; // 15 seconds max execution wait time
const MAX_CODE_BYTES = 64 * 1024; // 64KB limit

// Map Codely languages to Judge0 language IDs
const LANGUAGE_ID_MAP = {
  javascript: 102, // Node.js 22.08.0 (fallback: 97, 93, 63)
  typescript: 101, // TypeScript 5.6.2 (fallback: 94, 74)
  python: 100,     // Python 3.12.5 (fallback: 92, 71)
  java: 91,        // Java JDK 17 (fallback: 62)
  cpp: 105,        // C++ GCC 14.1.0 (fallback: 54)
  c: 103,          // C GCC 14.1.0 (fallback: 50)
  csharp: 51,      // C# Mono 6.6
  go: 107,         // Go 1.23.5 (fallback: 106, 95)
  rust: 108,       // Rust 1.85.0 (fallback: 73)
  ruby: 72,        // Ruby 2.7.0
  php: 98,         // PHP 8.3.11 (fallback: 68)
  swift: 83,       // Swift 5.2.3
  kotlin: 111,     // Kotlin 2.1.10 (fallback: 78)
  shell: 46,       // Bash 5.0.0
  sql: 82,         // SQLite 3.27.2
};

// Rate limiting map (in-memory, sliding window per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 request per second per IP

function isRateLimited(ip) {
  const now = Date.now();
  const lastTime = rateLimitMap.get(ip) || 0;
  if (now - lastTime < RATE_LIMIT_WINDOW_MS) {
    return true;
  }
  rateLimitMap.set(ip, now);
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > 10000) rateLimitMap.delete(key);
    }
  }
  return false;
}

/**
 * Execute code with Judge0 CE
 * @param {Object} options
 * @param {string} options.language - Codely language identifier
 * @param {string} options.code - Source code to execute
 * @param {string} [options.stdin] - Standard input
 * @param {string} [options.ip] - Client IP for rate limiting
 * @returns {Promise<Object>}
 */
async function runCode({ language, code, stdin = '', ip = '127.0.0.1' }) {
  if (isRateLimited(ip)) {
    return {
      success: false,
      error: 'Please wait a moment before running code again (rate limit).',
      status: { id: 0, description: 'Rate Limited' }
    };
  }

  if (!code || typeof code !== 'string' || !code.trim()) {
    return {
      success: false,
      error: 'No code provided to execute.',
      status: { id: 0, description: 'Empty Code' }
    };
  }

  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return {
      success: false,
      error: `Code size exceeds maximum limit of ${MAX_CODE_BYTES / 1024}KB.`,
      status: { id: 0, description: 'Payload Too Large' }
    };
  }

  const langKey = (language || '').toLowerCase().trim();
  const languageId = LANGUAGE_ID_MAP[langKey];

  if (!languageId) {
    return {
      success: false,
      error: `Language "${language}" does not support terminal execution.`,
      status: { id: 0, description: 'Unsupported Language' }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const endpoint = `${DEFAULT_JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: typeof stdin === 'string' ? stdin : ''
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        success: false,
        error: `Runner API returned error ${response.status}: ${errText.slice(0, 150) || 'Unknown error'}`,
        status: { id: response.status, description: 'API Error' }
      };
    }

    const result = await response.json();

    // Standardize the response
    const statusDesc = result.status?.description || 'Unknown';
    const isAccepted = result.status?.id === 3; // 3 = Accepted in Judge0
    const stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const compileOutput = result.compile_output || '';

    // If there is compilation error or runtime error, report success=false
    const success = isAccepted && !stderr;

    return {
      success,
      stdout,
      stderr: stderr || compileOutput, // If compile failed, output is in compile_output
      time: result.time != null ? `${Math.round(parseFloat(result.time) * 1000)}ms` : null,
      memory: result.memory ? `${Math.round(result.memory / 1024 * 10) / 10} MB` : null,
      status: {
        id: result.status?.id || 0,
        description: statusDesc
      }
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: `Execution timed out after ${TIMEOUT_MS / 1000} seconds. Check for infinite loops or long-running operations.`,
        status: { id: 5, description: 'Time Limit Exceeded' }
      };
    }

    return {
      success: false,
      error: `Failed to contact execution server: ${err.message || 'Network error'}`,
      status: { id: 0, description: 'Network Failure' }
    };
  }
}

module.exports = {
  runCode,
  LANGUAGE_ID_MAP
};

