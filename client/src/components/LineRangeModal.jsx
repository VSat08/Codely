import { useState, useRef, useEffect } from 'react';
import './LineRangeModal.css';

function LineRangeModal({ code, fileName, onClose, addToast }) {
  const lines = (code || '').split('\n');
  const totalLines = lines.length;

  const [startLine, setStartLine] = useState(1);
  const [endLine, setEndLine] = useState(totalLines);
  const previewRef = useRef(null);

  useEffect(() => {
    setEndLine(totalLines);
  }, [totalLines]);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const handleStartChange = (val) => {
    const n = clamp(parseInt(val) || 1, 1, totalLines);
    setStartLine(n);
    if (n > endLine) setEndLine(n);
  };

  const handleEndChange = (val) => {
    const n = clamp(parseInt(val) || 1, 1, totalLines);
    setEndLine(n);
    if (n < startLine) setStartLine(n);
  };

  const selectedLines = lines.slice(
    clamp(startLine, 1, totalLines) - 1,
    clamp(endLine, 1, totalLines)
  );

  const selectedText = selectedLines.join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    addToast(`Copied lines ${startLine}-${endLine}`, 'success');
    onClose();
  };

  const handleSelectAll = () => {
    setStartLine(1);
    setEndLine(totalLines);
  };

  return (
    <div className="line-range-overlay" onClick={onClose}>
      <div className="line-range-modal" onClick={(e) => e.stopPropagation()}>
        <div className="line-range-header">
          <span className="line-range-title">Copy Lines — {fileName}</span>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <div className="line-range-controls">
          <div className="line-range-inputs">
            <label className="line-range-label">
              From
              <input
                type="number"
                className="line-range-input"
                min={1}
                max={totalLines}
                value={startLine}
                onChange={(e) => handleStartChange(e.target.value)}
              />
            </label>
            <span className="line-range-separator">—</span>
            <label className="line-range-label">
              To
              <input
                type="number"
                className="line-range-input"
                min={1}
                max={totalLines}
                value={endLine}
                onChange={(e) => handleEndChange(e.target.value)}
              />
            </label>
            <span className="line-range-total">of {totalLines}</span>
          </div>
          <div className="line-range-quick">
            <button className="btn btn-ghost btn-sm" onClick={handleSelectAll}>
              Select All
            </button>
          </div>
        </div>

        <div className="line-range-preview" ref={previewRef}>
          {selectedLines.map((line, i) => (
            <div key={i} className="line-range-line">
              <span className="line-range-num">{startLine + i}</span>
              <span className="line-range-code">{line || ' '}</span>
            </div>
          ))}
        </div>

        <div className="line-range-footer">
          <span className="line-range-info">
            {endLine - startLine + 1} line{endLine - startLine + 1 !== 1 ? 's' : ''} selected
          </span>
          <div className="line-range-actions">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCopy}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LineRangeModal;
