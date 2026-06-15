import Editor from '@monaco-editor/react';
import { useRef, useCallback, useEffect } from 'react';
import { MonacoBinding } from 'y-monaco';

import { CUSTOM_THEMES } from '../utils/monacoThemes';

/**
 * Monaco Editor wrapper.
 * Handles local edits and applies remote changes using Yjs and CRDTs (y-monaco).
 */
function CodeEditor({ ydoc, language, theme, tabId }) {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  const handleBeforeMount = useCallback((monaco) => {
    // Register custom themes before the editor instantiates
    Object.keys(CUSTOM_THEMES).forEach((themeName) => {
      monaco.editor.defineTheme(themeName, CUSTOM_THEMES[themeName]);
    });
  }, []);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

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
      padding: { top: 16, bottom: window.innerWidth <= 768 ? 88 : 16 },
      wordWrap: 'on',
      tabSize: 2,
      automaticLayout: true,
    });

    // Intercept our global shortcuts before Monaco swallows them
    editor.onKeyDown((e) => {
      if (e.altKey) {
        const key = e.browserEvent.key.toLowerCase();
        // List of our global shortcut keys
        if (['n', 'w', 'r', 'e', '1', '2', '3', '4', 't', '/'].includes(key)) {
          // Re-dispatch the event to the window so Room.jsx can catch it
          window.dispatchEvent(new KeyboardEvent('keydown', {
            key: e.browserEvent.key,
            code: e.browserEvent.code,
            altKey: true,
            shiftKey: e.browserEvent.shiftKey,
            ctrlKey: e.browserEvent.ctrlKey,
            metaKey: e.browserEvent.metaKey,
            bubbles: true,
            cancelable: true
          }));
          // Prevent Monaco's default behavior for this key
          e.preventDefault();
          e.stopPropagation();
        }
      }
    });

    // If ydoc is already available, bind immediately
    if (ydoc) {
      bindYjsToMonaco(editor, ydoc);
    }
  }, [ydoc]);

  const bindYjsToMonaco = (editor, ydoc) => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
    }
    const model = editor.getModel();
    const ytext = ydoc.getText('monaco');
    bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]), null);
  };

  useEffect(() => {
    if (editorRef.current && ydoc) {
      bindYjsToMonaco(editorRef.current, ydoc);
    }
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [ydoc, tabId]);

  return (
    <Editor
      height="100%"
      language={language}
      beforeMount={handleBeforeMount}
      onMount={handleEditorMount}
      theme={theme || 'vs-dark'}
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
