import { useState, useRef, useCallback } from 'react';
import { validateFile, fileToBase64, getFileIcon, formatFileSize } from '../utils/fileUtils';
import { timeAgo } from '../utils/imageUtils';
import { ACCEPTED_FILE_EXTENSIONS } from '../utils/constants';
import './FilePanel.css';

/**
 * File panel — upload & share documents of any type.
 * Displays a list of shared files with download & delete actions.
 */
function FilePanel({ files, onFileShare, onFileDelete, addToast, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const processAndUpload = useCallback(async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await onFileShare(base64, file.name, file.size);
      addToast(`📄 Shared ${file.name}`, 'success');
    } catch (err) {
      addToast(String(err), 'error');
    } finally {
      setUploading(false);
    }
  }, [onFileShare, addToast]);

  // File input
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processAndUpload(file);
    }
    e.target.value = '';
  };

  // Drag & Drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      await processAndUpload(file);
    }
  };

  // Download
  const handleDownload = useCallback((e, file) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = file.data;
    a.download = file.name || 'document';
    a.click();
  }, []);

  return (
    <div
      className={`file-panel ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* Header */}
      <div className="file-panel-header">
        <h3>Files <span className="file-count">{files.length}/10</span></h3>
        <div className="file-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || files.length >= 10}
          >
            {uploading ? <span className="spinner-sm" /> : <span className="material-symbols-outlined" style={{fontSize: '18px'}}>upload_file</span>}
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {onClose && (
            <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close panel" style={{ width: '32px', height: '32px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_EXTENSIONS.join(',')}
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="file-hint">
        Drag & drop any file to share (max 2MB per file)
      </p>

      {/* File list */}
      {files.length > 0 ? (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id} className="file-row">
              <div className="file-row-icon">
                <span className="material-symbols-outlined">{getFileIcon(file.name)}</span>
              </div>
              <div className="file-row-info">
                <span className="file-row-name" title={file.name}>{file.name}</span>
                <span className="file-row-meta">
                  {formatFileSize(file.size)} · {file.uploadedBy} · {timeAgo(file.timestamp)}
                </span>
              </div>
              <div className="file-row-actions">
                <button
                  className="btn btn-icon btn-ghost btn-small"
                  onClick={(e) => handleDownload(e, file)}
                  title="Download"
                >
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>download</span>
                </button>
                <button
                  className="btn btn-icon btn-ghost btn-small file-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(file.id);
                  }}
                  title="Delete file"
                >
                  <span className="material-symbols-outlined" style={{fontSize: '18px'}}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="file-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.5 }}>folder_open</span>
          <p>No files shared yet</p>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <span><span className="material-symbols-outlined" style={{verticalAlign: 'middle', marginRight: '8px'}}>upload_file</span>Drop file here</span>
        </div>
      )}
    </div>
  );
}

export default FilePanel;
