import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getTabFileIcon } from '../utils/fileIconHelper';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
export const AIChatCodeActionsContext = React.createContext({
  onApplyCode: null,
  onOpenNewTab: null,
});

// Custom renderer for code blocks to correctly differentiate inline vs block
const CodeBlockRenderer = ({ node, className, children, ...props }) => {
  const { onApplyCode, onOpenNewTab } = React.useContext(AIChatCodeActionsContext);
  const [copied, setCopied] = React.useState(false);
  const [applied, setApplied] = React.useState(false);
  const [opened, setOpened] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');

  // In react-markdown v10, the `inline` prop was removed.
  // We treat it as a block if it specifies a language OR contains newlines.
  const isBlock = match || code.includes('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleApply = () => {
    if (onApplyCode) {
      onApplyCode(code, match ? match[1] : 'text');
      setApplied(true);
      setTimeout(() => setApplied(false), 1500);
    }
  };

  const handleNewTab = () => {
    if (onOpenNewTab) {
      onOpenNewTab(code, match ? match[1] : 'text');
      setOpened(true);
      setTimeout(() => setOpened(false), 1500);
    }
  };

  if (isBlock) {
    const lang = match ? match[1] : 'text';
    return (
      <div className="code-block-container">
        <div className="code-block-header">
          <span className="code-block-lang">{lang}</span>
          <div className="code-block-actions">
            {onApplyCode && (
              <button
                type="button"
                className="code-action-btn"
                title={applied ? "Applied to active editor!" : "Apply to active tab (Insert at cursor / Replace selection)"}
                onClick={handleApply}
              >
                <span 
                  className="material-symbols-outlined"
                  style={{
                    color: applied ? 'var(--success, #10b981)' : 'inherit',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {applied ? 'check' : 'edit_note'}
                </span>
              </button>
            )}
            {onOpenNewTab && (
              <button
                type="button"
                className="code-action-btn"
                title={opened ? "Opened in new tab!" : "Open code in a new tab"}
                onClick={handleNewTab}
              >
                <span 
                  className="material-symbols-outlined"
                  style={{
                    color: opened ? 'var(--success, #10b981)' : 'inherit',
                    transition: 'color 0.2s ease'
                  }}
                >
                  {opened ? 'check' : 'open_in_new'}
                </span>
              </button>
            )}
            <button
              type="button"
              className="code-action-btn"
              title={copied ? "Copied!" : "Copy code"}
              onClick={handleCopy}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ 
                  color: copied ? 'var(--success, #10b981)' : 'inherit',
                  transition: 'color 0.2s ease'
                }}
              >
                {copied ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>
        <SyntaxHighlighter
          style={
            typeof document !== 'undefined' && (
              document.documentElement.getAttribute('data-theme')?.includes('light') ||
              document.documentElement.getAttribute('data-theme') === 'vs'
            ) ? vs : vscDarkPlus
          }
          language={lang}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '12px 14px',
            borderRadius: '0 0 8px 8px',
            fontSize: '0.82rem',
            background: 'var(--bg-tertiary)',
            backgroundColor: 'var(--bg-tertiary)',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: {
              background: 'transparent',
              backgroundColor: 'transparent',
              padding: 0,
              borderRadius: 0,
              border: 'none',
              boxShadow: 'none',
              display: 'block',
            }
          }}
          {...props}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  // Inline code
  return (
    <code className={`inline-code ${className || ''}`.trim()} {...props}>
      {children}
    </code>
  );
};

export function AIChatMessage({
  message,
  messageIndex,
  isStreaming: globalIsStreaming,
  onEditMessage,
}) {
  if (!message) return null;

  const isAI = message?.role === 'ai';
  const isError = Boolean(message?.isError);
  const isStreaming = Boolean(message?.isStreaming || (isAI && globalIsStreaming && !message?.content));
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message?.content || '');
  const editTextareaRef = React.useRef(null);

  // Sync editText when message.content changes
  React.useEffect(() => {
    setEditText(message?.content || '');
  }, [message?.content]);

  // Focus and select end of textarea when entering edit mode
  React.useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      const len = editTextareaRef.current.value.length;
      editTextareaRef.current.setSelectionRange(len, len);
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${Math.min(Math.max(editTextareaRef.current.scrollHeight, 48), 220)}px`;
    }
  }, [isEditing]);

  // Auto-resize edit textarea to fit content smoothly
  React.useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${Math.min(Math.max(editTextareaRef.current.scrollHeight, 48), 220)}px`;
    }
  }, [editText, isEditing]);

  const handleStartEdit = () => {
    setEditText(message?.content || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message?.content || '');
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (trimmed === (message?.content || '').trim()) {
      setIsEditing(false);
      return;
    }
    setIsEditing(false);
    onEditMessage?.(trimmed);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const handleCopyMessage = () => {
    if (!message?.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMessage = () => {
    if (!message?.content) return;
    const blob = new Blob([message.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderAvatar = () => {
    if (isAI) {
      return (
        <div className="chat-avatar ai-avatar">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>robot_2</span>
        </div>
      );
    }
    const name = message.sender || 'Anonymous';
    return (
      <div className="chat-avatar user-avatar">
        {getInitials(name)}
      </div>
    );
  };

  const senderName = isAI
    ? 'Codely AI'
    : (message.sender || 'Anonymous');

  return (
    <div className={`chat-message-wrapper ${isAI ? 'ai-wrapper' : 'user-wrapper'} ${isEditing ? 'editing' : ''}`}>
      <div className={`chat-message ${isAI ? 'ai-message' : 'user-message'} ${isError ? 'error-message' : ''} ${isEditing ? 'editing' : ''}`}>
        <div className="chat-message-header">
          {renderAvatar()}
          <span className="chat-message-sender">{senderName}</span>
        </div>

        {/* Attached Code Files */}
        {message.attachedFiles && message.attachedFiles.length > 0 && (
          <div className="attached-code-badge-container">
            {message.attachedFiles.map((f, idx) => (
              <div key={`file-${idx}`} className="attached-code-badge">
                <span className="tab-icon" aria-hidden="true">
                  {getTabFileIcon(f.fileName, f.language)}
                </span>
                <strong>{f.fileName || 'file'}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Attached Media (Images & Documents) */}
        {message.attachedMedia && message.attachedMedia.length > 0 && (
          <div className="attached-media-msg-container">
            {message.attachedMedia.map((m, idx) => {
              if (m.type === 'image') {
                return (
                  <div key={`media-${idx}`} className="ai-media-thumbnail-msg-container">
                    <img src={m.previewUrl || `data:${m.mimeType};base64,${m.base64}`} alt={m.name} className="ai-media-thumbnail-msg" />
                    <div className="ai-media-msg-tooltip">{m.name}</div>
                  </div>
                );
              } else {
                return (
                  <div key={`media-${idx}`} className="attached-code-badge doc">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      {m.mimeType === 'application/pdf' ? 'picture_as_pdf' : m.mimeType === 'text/csv' ? 'table_chart' : 'description'}
                    </span>
                    <strong>{m.name}</strong>
                  </div>
                );
              }
            })}
          </div>
        )}

      <div className="chat-message-content">
        {isAI ? (
          message.content ? (
            <ReactMarkdown
              components={{
                pre: ({ children }) => children,
                code: CodeBlockRenderer
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : isStreaming ? null : (
            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No response</span>
          )
        ) : isEditing ? (
          <div className="chat-message-edit-wrapper">
            <textarea
              ref={editTextareaRef}
              className="chat-message-edit-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              placeholder="Edit your prompt..."
              rows={Math.min(8, Math.max(2, (editText.match(/\n/g) || []).length + 1))}
            />
            <div className="chat-message-edit-actions">
              <span className="chat-edit-hint">Esc to cancel • Enter to submit • Shift+Enter for newline</span>
              <div className="chat-edit-btn-group">
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  disabled={!editText.trim() || editText.trim() === (message?.content || '').trim()}
                  onClick={handleSaveEdit}
                >
                  Save &amp; Submit
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        )}

        {/* Thinking / Status Indicator */}
        {isStreaming && !message.content && (
          <div className="ai-thinking-indicator">
            <span className="ai-thinking-text">
              {message.statusText || 'Thinking...'}
            </span>
          </div>
        )}
        {isStreaming && message.content && (
          <div className="typing-indicator" style={{ marginTop: '4px' }}>
            <span></span><span></span><span></span>
          </div>
        )}
      </div>
    </div>

      {/* Message Actions */}
      {!globalIsStreaming && !isEditing && message.content && !isError && (
        <div className="chat-message-actions">
          {!isAI && onEditMessage && (
            <button
              type="button"
              className="chat-action-btn"
              title="Edit prompt"
              onClick={handleStartEdit}
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          )}
          <button
            className="chat-action-btn"
            title={copied ? "Copied!" : "Copy message"}
            onClick={handleCopyMessage}
          >
            <span 
              className="material-symbols-outlined" 
              style={{ 
                color: copied ? 'var(--success, #10b981)' : 'inherit',
                transition: 'color 0.2s ease'
              }}
            >
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
          {isAI && (
            <button
              className="chat-action-btn"
              title="Download response"
              onClick={handleDownloadMessage}
            >
              <span className="material-symbols-outlined">download</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
