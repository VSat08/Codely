import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function AIChatMessage({ message }) {
  const isAI = message.role === 'ai';
  const isError = message.isError;
  const isStreaming = message.isStreaming;

  // Custom renderer for code blocks to correctly differentiate inline vs block
  const CodeBlockRenderer = ({ node, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    // In react-markdown v10, the `inline` prop was removed.
    // We treat it as a block if it specifies a language OR contains newlines.
    const isBlock = match || code.includes('\n');

    if (isBlock) {
      const lang = match ? match[1] : 'text';
      return (
        <div className="code-block-container">
          <div className="code-block-header">
            <span className="code-block-lang">{lang}</span>
            <div className="code-block-actions">
              <button
                className="btn btn-icon btn-ghost btn-small"
                title="Copy Code"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
              </button>
            </div>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={lang}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: '0 0 8px 8px', fontSize: '0.82rem' }}
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
    <div className={`chat-message ${isAI ? 'ai-message' : 'user-message'} ${isError ? 'error-message' : ''}`}>
      <div className="chat-message-header">
        {renderAvatar()}
        <span className="chat-message-sender">{senderName}</span>
      </div>

      {/* Attached Code Files */}
      {message.attachedFiles && message.attachedFiles.length > 0 && (
        <div className="attached-code-badge-container">
          {message.attachedFiles.map((f, idx) => (
            <div key={`file-${idx}`} className="attached-code-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>code</span>
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
                code: CodeBlockRenderer
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : isStreaming ? null : (
            <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No response</span>
          )
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
  );
}
