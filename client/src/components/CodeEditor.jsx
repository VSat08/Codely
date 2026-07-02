import Editor from '@monaco-editor/react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { MonacoBinding } from 'y-monaco';
import * as Y from 'yjs';

import { CUSTOM_THEMES } from '../utils/monacoThemes';

/**
 * Monaco Editor wrapper.
 * Handles local edits and applies remote changes using Yjs and CRDTs (y-monaco).
 */
function CodeEditor({ ydoc, awareness, language, theme, tabId }) {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef([]);
  const [awarenessStates, setAwarenessStates] = useState(new Map());
  const [isEditorReady, setIsEditorReady] = useState(false);

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
      padding: { top: 24, bottom: window.innerWidth <= 768 ? 88 : 16 },
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
    if (ydoc && awareness) {
      bindYjsToMonaco(editor, ydoc, awareness);
    }
    
    // Signal that the editor is ready for the cursor engine to attach
    setIsEditorReady(true);
  }, [ydoc, awareness]);

  const bindYjsToMonaco = (editor, ydoc) => {
    if (bindingRef.current) {
      bindingRef.current.destroy();
    }
    const model = editor.getModel();
    const ytext = ydoc.getText('monaco');
    // We intentionally pass null for awareness to disable y-monaco's built-in 
    // awareness so we can implement a custom, robust one below.
    bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]), null);
  };

  useEffect(() => {
    if (!isEditorReady) return;
    
    if (editorRef.current && ydoc && awareness) {
      bindYjsToMonaco(editorRef.current, ydoc);
    }
    
    // --- CUSTOM ROBUST CURSOR ENGINE ---
    let cursorListener = null;
    
    if (editorRef.current && ydoc && awareness) {
      const editor = editorRef.current;
      const model = editor.getModel();
      const ytext = ydoc.getText('monaco');

      // 1. Send our cursor position to others
      const broadcastCursor = () => {
        const selection = editor.getSelection();
        if (!selection) return;
        
        const startOffset = model.getOffsetAt(selection.getStartPosition());
        const endOffset = model.getOffsetAt(selection.getEndPosition());
        
        awareness.setLocalStateField('cursor', {
          anchor: Y.createRelativePositionFromTypeIndex(ytext, startOffset),
          head: Y.createRelativePositionFromTypeIndex(ytext, endOffset)
        });
      };

      cursorListener = editor.onDidChangeCursorSelection(broadcastCursor);
      
      // Bootstrap: Broadcast our initial cursor position immediately so others see us!
      setTimeout(broadcastCursor, 100);
    }

    // 2. Listen to others and render their cursors
    const updateAwarenessState = () => {
      if (awareness && editorRef.current && ydoc) {
        const states = new Map(awareness.getStates());
        setAwarenessStates(states);
        
        const editor = editorRef.current;
        const model = editor.getModel();
        const newDecorations = [];
        
        states.forEach((state, clientId) => {
          if (clientId !== awareness.clientID && state.cursor && state.user) {
            const anchorAbs = Y.createAbsolutePositionFromRelativePosition(state.cursor.anchor, ydoc);
            const headAbs = Y.createAbsolutePositionFromRelativePosition(state.cursor.head, ydoc);
            
            if (anchorAbs && headAbs) {
              let startPos = model.getPositionAt(anchorAbs.index);
              let endPos = model.getPositionAt(headAbs.index);
              
              const headPos = endPos; // Save the actual caret location
              
              // Handle backwards highlighting for the selection range
              if (anchorAbs.index > headAbs.index) {
                const temp = startPos;
                startPos = endPos;
                endPos = temp;
              }
              
              const selectionRange = {
                startLineNumber: startPos.lineNumber,
                startColumn: startPos.column,
                endLineNumber: endPos.lineNumber,
                endColumn: endPos.column
              };
              
              // Only draw if we have a valid color
              const color = state.user.color || '#3B82F6';
              const name = state.user.name || 'Anonymous';
              const initials = name.substring(0, 2).toUpperCase();
              
              // Caret decoration (the vertical blinking line and hover flag)
              newDecorations.push({
                range: {
                  startLineNumber: headPos.lineNumber,
                  startColumn: headPos.column,
                  endLineNumber: headPos.lineNumber,
                  endColumn: headPos.column
                },
                options: {
                  className: `custom-remote-caret custom-caret-${clientId} ${headPos.lineNumber === 1 ? 'custom-caret-top' : ''}`,
                  stickiness: 1 // TrackAfter
                }
              });

              // Selection highlight (if they highlighted text)
              if (anchorAbs.index !== headAbs.index) {
                newDecorations.push({
                  range: selectionRange,
                  options: {
                    className: `custom-remote-selection custom-sel-${clientId}`,
                    stickiness: 1
                  }
                });
              }
            }
          }
        });
        
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
      }
    };
    
    let contentListener = null;

    if (awareness) {
      awareness.on('change', updateAwarenessState);
      
      // CRITICAL FIX: Redraw cursors whenever the text changes! 
      // If a cursor update arrives before the text update, the cursor position is invalid. 
      // Re-evaluating when the text arrives ensures cursors snap to the correct location.
      if (editorRef.current) {
        contentListener = editorRef.current.onDidChangeModelContent(updateAwarenessState);
      }
      
      updateAwarenessState();
    }

    return () => {
      if (cursorListener) {
        cursorListener.dispose();
      }
      if (contentListener) {
        contentListener.dispose();
      }
      if (awareness) {
        try {
          awareness.setLocalStateField('cursor', null); // Prevent ghost cursors when switching tabs
        } catch (e) {
          // Awareness might already be destroyed if the tab was deleted
        }
        awareness.off('change', updateAwarenessState);
      }
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [ydoc, awareness, tabId, isEditorReady]);

  // Generate dynamic CSS for remote cursors to show initials on hover
  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const generateCursorStyles = () => {
    let css = `
      /* Global rule to flip the chat bubble downwards if it's on line 1 so it never gets clipped */
      .custom-caret-top::after {
        top: 18px !important;
        border-radius: 0px 12px 12px 12px !important;
      }
    `;
    awarenessStates.forEach((state, clientId) => {
      if (state.user && state.user.name && state.user.color && clientId !== awareness?.clientID) {
        const initials = getInitials(state.user.name);
        const color = state.user.color;
        
        css += `
          /* The blinking vertical caret line */
          .custom-caret-${clientId} {
            position: absolute;
            border-left: 2px solid ${color};
            box-sizing: border-box;
            height: 100%;
            z-index: 99;
          }
          /* Invisible 16px hitbox for easier mouse hovering */
          .custom-caret-${clientId}::before {
            content: "";
            position: absolute;
            top: 0;
            left: -8px;
            width: 16px;
            height: 100%;
            background-color: transparent;
          }
          /* The elegant pill flag containing initials */
          .custom-caret-${clientId}::after {
            content: "${initials}";
            position: absolute;
            top: -22px;
            left: -2px; /* Align precisely with the border-left caret */
            background-color: ${color};
            color: white;
            padding: 2px 8px; /* Slightly wider padding for the capsule look */
            border-radius: 12px 12px 12px 0px; /* Chat bubble pointing down-left at the caret */
            border: none;
            font-size: 10px;
            font-family: var(--font-ui), sans-serif;
            font-weight: 600;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s ease-in-out;
            z-index: 100;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          /* Show on hover of the cursor line */
          .custom-caret-${clientId}:hover::after {
            opacity: 1;
          }
          /* The transparent selection background */
          .custom-sel-${clientId} {
            background-color: ${color}40; /* 40 is hex for 25% opacity */
          }
        `;
      }
    });
    return css;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{generateCursorStyles()}</style>
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
    </div>
  );
}

export default CodeEditor;
