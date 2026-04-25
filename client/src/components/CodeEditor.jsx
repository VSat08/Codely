import Editor from '@monaco-editor/react';
import { useRef, useCallback } from 'react';

/**
 * Monaco Editor wrapper.
 * Handles local edits and applies remote changes without cursor disruption.
 */
function CodeEditor({ code, language, onChange, isRemoteChange }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 16 },
      wordWrap: 'on',
      tabSize: 2,
      automaticLayout: true,
    });

    editor.focus();
  }, []);

  const handleChange = useCallback(
    (value) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange]
  );

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      loading={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-secondary)',
        }}>
          Loading editor...
        </div>
      }
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16 },
        wordWrap: 'on',
        tabSize: 2,
        automaticLayout: true,
      }}
    />
  );
}

export default CodeEditor;
