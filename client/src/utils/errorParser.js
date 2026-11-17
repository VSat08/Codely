/**
 * Codely Compiler & Runtime Error Parser
 * Parses terminal tracebacks, compilation errors, and linter warnings
 * into structured diagnostic problem items for the Problems tab and Monaco markers.
 */

/**
 * @typedef {Object} ProblemItem
 * @property {string} id - Unique identifier
 * @property {string} file - Filename (e.g. main.py, Main.java)
 * @property {number} line - 1-indexed line number
 * @property {number} column - 1-indexed column number
 * @property {number} [endColumn] - Optional ending column
 * @property {'error' | 'warning' | 'info'} severity - Problem severity
 * @property {string} message - Clean human-readable error description
 * @property {string} [code] - Error code (e.g. CS0103, E0425, F541, SyntaxError)
 * @property {string} source - Source language/compiler
 */

/**
 * Parse raw terminal execution output into structured Problem items.
 * @param {Object} output - Terminal output object ({ stderr, stdout, error, compile_output, status })
 * @param {string} defaultFileName - Current active file name (e.g. main.py)
 * @param {string} language - Current language identifier (e.g. python, java)
 * @returns {ProblemItem[]} Array of structured diagnostic problems
 */
export function parseErrors(output, defaultFileName = 'main', language = '') {
  if (!output) return [];

  // 1. Process termination / interrupt by user (Ctrl+C, SIGINT, SIGTERM, exit code 130, stopped flag) is NOT a code defect
  if (
    output.stopped === true ||
    output.signal === 'SIGINT' ||
    output.signal === 'SIGTERM' ||
    output.code === 130
  ) {
    return [];
  }

  const rawText = [
    output.compile_output,
    output.stderr,
    output.error,
  ].filter(Boolean).join('\n').trim();

  if (!rawText) return [];

  // Filter out any pure user interrupt / termination output
  const textWithoutInterrupts = rawText
    .replace(/\^C/g, '')
    .replace(/KeyboardInterrupt: Execution stopped by user\.?/gi, '')
    .replace(/KeyboardInterrupt/gi, '')
    .replace(/Execution stopped by user\.?/gi, '')
    .trim();

  if (!textWithoutInterrupts) {
    return [];
  }

  const problems = [];
  const lines = rawText.split('\n');
  const lang = (language || '').toLowerCase().trim();
  const baseName = defaultFileName.trim() || 'main';
  const GENERIC_RUNNER_FILES = new Set(['script', 'source', 'solution', 'input', 'code', 'temp', 'app', 'main', 'program']);

  // Helper to push deduplicated problem
  const addProblem = ({ file, line, column, severity, message, code, source }) => {
    const cleanLine = Math.max(1, parseInt(line, 10) || 1);
    const cleanCol = Math.max(1, parseInt(column, 10) || 1);
    let cleanFile = (file || baseName).replace(/^\.\//, '').replace(/^.*[\\/]/, '');
    // Strip ANSI escape codes
    let cleanMsg = (message || 'Unknown error')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .trim()
      .replace(/^[A-Z]:\\[^\n:]+:\s*/i, '');

    let cleanCode = code || '';

    // Normalize OS / container limit signals across all sandbox languages
    if (cleanMsg.toLowerCase().includes('file size limit exceeded')) {
      cleanMsg = 'Output limit exceeded: Process exceeded maximum output size (infinite loop or excessive logging).';
      cleanCode = 'SIGXFSZ';
    }

    // Map Judge0 / runner container paths (e.g. /box/script.py, /tmp/source.cpp, run.sh) to active tab name
    const rawFileLower = (file || '').toLowerCase();
    const fileNameWithoutExt = cleanFile.replace(/\.[^/.]+$/, '').toLowerCase();
    const isSandboxPath = rawFileLower.startsWith('/box/') || rawFileLower.startsWith('/tmp/') || rawFileLower.startsWith('/sandbox/');
    const isSandboxScript = cleanFile.endsWith('.sh') || cleanFile.startsWith('run.') || cleanFile.startsWith('exec.');
    const isGenericName = GENERIC_RUNNER_FILES.has(fileNameWithoutExt);
    const fileExt = cleanFile.includes('.') ? cleanFile.split('.').pop().toLowerCase() : '';
    const baseExt = baseName.includes('.') ? baseName.split('.').pop().toLowerCase() : '';

    if (baseName && (isSandboxPath || isSandboxScript || isGenericName || (fileExt && baseExt && fileExt === baseExt))) {
      cleanFile = baseName;
    }

    // Prevent duplicate entries
    const key = `${cleanFile}:${cleanLine}:${cleanCol}:${cleanMsg}`;
    if (problems.some((p) => `${p.file}:${p.line}:${p.column}:${p.message}` === key)) {
      return;
    }

    problems.push({
      id: `prob-${problems.length + 1}-${cleanLine}-${cleanCol}`,
      file: cleanFile || baseName,
      line: cleanLine,
      column: cleanCol,
      severity: severity || 'error',
      message: cleanMsg,
      code: cleanCode,
      source: source || lang || 'compiler',
    });
  };

  // 1. Python tracebacks & syntax errors
  // Pattern: File "script.py", line 74, in ...
  const pyTracebackRegex = /File\s+["']?([^"',\n]+)["']?,\s+line\s+(\d+)(?:,\s+in\s+([^\n]+))?/gi;
  let pyMatch;
  const pyFrames = [];
  while ((pyMatch = pyTracebackRegex.exec(rawText)) !== null) {
    const file = pyMatch[1];
    const line = pyMatch[2];
    const scope = pyMatch[3] ? ` (in ${pyMatch[3].trim()})` : '';
    
    // Find the error message that follows this traceback frame
    const restOfText = rawText.slice(pyMatch.index + pyMatch[0].length);
    // Ignore user interrupts in traceback
    if (restOfText.includes('KeyboardInterrupt')) {
      continue;
    }
    const errMatch = restOfText.match(/(?:(?:[A-Z][a-zA-Z0-9_]*Error|[A-Z][a-zA-Z0-9_]*Exception):\s*[^\n]+)/);
    const msg = errMatch ? errMatch[0].trim() : 'Runtime Exception';
    const code = msg.split(':')[0] || 'Error';

    // Capture syntax error column from caret ^ if present
    let col = 1;
    const caretMatch = restOfText.match(/\n([ \t]*)\^[^\n]*/);
    if (caretMatch && caretMatch.index < 250) {
      col = caretMatch[1].length + 1;
    }

    pyFrames.push({
      file,
      line,
      column: col,
      severity: 'error',
      message: `${msg}${scope}`,
      code,
      source: 'python',
    });
  }

  // Reverse so innermost frame (point of failure) appears first in problems list
  for (let i = pyFrames.length - 1; i >= 0; i--) {
    addProblem(pyFrames[i]);
  }

  // Python flake8/linter style: main.py:74:11: F541 f-string without any placeholders
  const pyLinterRegex = /([^:\n]+):(\d+):(\d+):\s*([A-Z]\d+)\s+([^\n]+)/gi;
  let pyLintMatch;
  while ((pyLintMatch = pyLinterRegex.exec(rawText)) !== null) {
    addProblem({
      file: pyLintMatch[1],
      line: pyLintMatch[2],
      column: pyLintMatch[3],
      severity: pyLintMatch[4].startsWith('W') ? 'warning' : 'error',
      message: `${pyLintMatch[4]}: ${pyLintMatch[5]}`,
      code: pyLintMatch[4],
      source: 'flake8',
    });
  }

  // 2. Java errors: Main.java:12: error: cannot find symbol
  // Main.java:12: warning: [deprecation] ...
  const javaRegex = /([^:\n]+\.java):(\d+):\s*(error|warning):\s*([^\n]+)/gi;
  let javaMatch;
  while ((javaMatch = javaRegex.exec(rawText)) !== null) {
    addProblem({
      file: javaMatch[1],
      line: javaMatch[2],
      column: 1,
      severity: javaMatch[3].toLowerCase() === 'warning' ? 'warning' : 'error',
      message: javaMatch[4],
      code: javaMatch[3].toUpperCase(),
      source: 'javac',
    });
  }

  // 2b. Java Runtime Exceptions & Stack Traces:
  // Exception in thread "main" java.lang.NullPointerException: ...
  //     at Main.myMethod(Main.java:42)
  //     at Main.main(Main.java:144)
  const javaErrHeaderMatch = rawText.match(/(?:Exception in thread "[^"]*"\s+)?([A-Za-z0-9_.]*(?:Exception|Error)[^\n]*)/);
  const javaErrHeader = javaErrHeaderMatch ? javaErrHeaderMatch[1].trim() : '';

  if (javaErrHeader) {
    const javaRuntimeRegex = /at\s+([A-Za-z0-9_$./]+)\.([A-Za-z0-9_$]+)\(([^:\n]+\.java):(\d+)\)/gi;
    let jm;
    const frames = [];
    while ((jm = javaRuntimeRegex.exec(rawText)) !== null) {
      frames.push({
        fullClass: jm[1],
        method: jm[2],
        file: jm[3],
        line: parseInt(jm[4], 10),
      });
    }

    // Filter out standard library internal frames (e.g. java.base, java.util)
    const userFrames = frames.filter((f) => !f.fullClass.startsWith('java.') && !f.fullClass.startsWith('javax.') && !f.fullClass.startsWith('sun.'));
    const targetFrames = userFrames.length > 0 ? userFrames : frames;

    for (const frame of targetFrames) {
      addProblem({
        file: frame.file,
        line: frame.line,
        column: 1,
        severity: 'error',
        message: frame.method ? `${javaErrHeader} (in ${frame.method})` : javaErrHeader,
        code: javaErrHeader.split(':')[0].split('.').pop() || 'Exception',
        source: 'java',
      });
    }
  }

  // 3. C / C++ (GCC, Clang): main.cpp:5:10: error: 'x' was not declared in this scope
  const gccRegex = /([^:\n]+):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*([^\n]+)/gi;
  let gccMatch;
  while ((gccMatch = gccRegex.exec(rawText)) !== null) {
    const sev = gccMatch[4].toLowerCase().includes('warning') ? 'warning' : 'error';
    addProblem({
      file: gccMatch[1],
      line: gccMatch[2],
      column: gccMatch[3],
      severity: sev,
      message: gccMatch[5],
      code: gccMatch[4],
      source: 'gcc',
    });
  }

  // 4. JavaScript / Node.js:
  // /tmp/script.js:14
  // TypeError: Cannot read properties...
  const nodeStackRegex = /(?:at\s+[^\n]+\s+\()?([^:\n()]+\.(?:js|ts|mjs|cjs)):(\d+):(\d+)\)?/gi;
  let nodeMatch;
  while ((nodeMatch = nodeStackRegex.exec(rawText)) !== null) {
    // Find the error header (usually first line of rawText)
    const firstLineErr = lines.find((l) => /^[A-Z][a-zA-Z0-9_]*(?:Error|Exception):/.test(l.trim()));
    addProblem({
      file: nodeMatch[1],
      line: nodeMatch[2],
      column: nodeMatch[3],
      severity: 'error',
      message: firstLineErr ? firstLineErr.trim() : 'Runtime Error',
      code: firstLineErr ? firstLineErr.split(':')[0] : 'Error',
      source: 'node',
    });
  }

  // Node.js syntax error: script.js:3 \n const x = ; \n SyntaxError: Unexpected token
  const nodeSyntaxRegex = /([^:\n]+):(\d+)\n[^\n]*\n\s*\^\s*\n([A-Z][a-zA-Z0-9_]*Error:[^\n]+)/g;
  let nodeSyntaxMatch;
  while ((nodeSyntaxMatch = nodeSyntaxRegex.exec(rawText)) !== null) {
    addProblem({
      file: nodeSyntaxMatch[1],
      line: nodeSyntaxMatch[2],
      column: 1,
      severity: 'error',
      message: nodeSyntaxMatch[3],
      code: 'SyntaxError',
      source: 'node',
    });
  }

  // 5. Rust (rustc):
  // error[E0425]: cannot find value `x` in this scope
  //  --> src/main.rs:2:5
  const rustRegex = /error(?:\[([A-Z0-9]+)\])?:\s*([^\n]+)\n\s*-->\s*([^:\n]+):(\d+):(\d+)/gi;
  let rustMatch;
  while ((rustMatch = rustRegex.exec(rawText)) !== null) {
    addProblem({
      file: rustMatch[3],
      line: rustMatch[4],
      column: rustMatch[5],
      severity: 'error',
      message: rustMatch[2],
      code: rustMatch[1] || 'E0000',
      source: 'rustc',
    });
  }

  // 6. Go: ./main.go:5:2: undefined: fmt.Printl
  const goRegex = /([^:\n]+\.go):(\d+):(\d+):\s*([^\n]+)/gi;
  let goMatch;
  while ((goMatch = goRegex.exec(rawText)) !== null) {
    addProblem({
      file: goMatch[1],
      line: goMatch[2],
      column: goMatch[3],
      severity: 'error',
      message: goMatch[4],
      code: 'go-build',
      source: 'go',
    });
  }

  // 7. C# (csc/mono): Program.cs(8,9): error CS0103: The name 'x' does not exist
  const csharpRegex = /([^(:\n]+)\((\d+),(\d+)\):\s*(error|warning)\s+([A-Z0-9]+):\s*([^\n]+)/gi;
  let csMatch;
  while ((csMatch = csharpRegex.exec(rawText)) !== null) {
    addProblem({
      file: csMatch[1],
      line: csMatch[2],
      column: csMatch[3],
      severity: csMatch[4].toLowerCase() === 'warning' ? 'warning' : 'error',
      message: `${csMatch[5]}: ${csMatch[6]}`,
      code: csMatch[5],
      source: 'csc',
    });
  }

  // 8. PHP: Parse error: syntax error... in script.php on line 4
  const phpRegex = /(?:Parse error|Fatal error):\s*([^\n]+)\s+in\s+([^:\n]+)\s+on\s+line\s+(\d+)/gi;
  let phpMatch;
  while ((phpMatch = phpRegex.exec(rawText)) !== null) {
    addProblem({
      file: phpMatch[2],
      line: phpMatch[3],
      column: 1,
      severity: 'error',
      message: phpMatch[1],
      code: 'ParseError',
      source: 'php',
    });
  }

  // 9. Ruby: script.rb:3:in `<main>': undefined local variable (NameError)
  const rubyRegex = /([^:\n]+\.rb):(\d+):in\s+[^:]+:\s*([^\n]+)/gi;
  let rubyMatch;
  while ((rubyMatch = rubyRegex.exec(rawText)) !== null) {
    addProblem({
      file: rubyMatch[1],
      line: rubyMatch[2],
      column: 1,
      severity: 'error',
      message: rubyMatch[3],
      code: 'RubyError',
      source: 'ruby',
    });
  }

  // Fallback: If output has an error status or error text, but no regex matched line numbers
  if (problems.length === 0 && (!output.success || output.status?.id > 3 || output.error)) {
    // If output was stopped/interrupted by user, do not generate synthetic errors
    if (
      output.stopped === true ||
      output.signal === 'SIGINT' ||
      output.signal === 'SIGTERM' ||
      output.code === 130
    ) {
      return [];
    }

    const isInterruptLine = (text) => {
      const clean = text.trim();
      return (
        !clean ||
        clean.includes('Process exited') ||
        clean.startsWith('^C') ||
        clean.includes('KeyboardInterrupt') ||
        clean.includes('Execution stopped by user')
      );
    };

    const errorTitle = output.error || output.status?.description || 'Execution Error';
    const firstUsefulLine = lines.find((l) => !isInterruptLine(l));

    if (!firstUsefulLine || isInterruptLine(firstUsefulLine)) {
      return [];
    }

    addProblem({
      file: baseName,
      line: 1,
      column: 1,
      severity: 'error',
      message: firstUsefulLine.replace(/⚠️\s*/, ''),
      code: output.status?.description || 'Error',
      source: lang || 'runner',
    });
  }

  return problems;
}

