import { useState, useRef, useCallback } from 'react';
import { validateImage, compressImage, getImageFromClipboard, timeAgo } from '../utils/imageUtils';
import './ImagePanel.css';

/**
 * Copy an image (from base64 data URL) to the user's clipboard.
 */
async function copyImageToClipboard(dataUrl) {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    // Convert to PNG for maximum clipboard compatibility
    const pngBlob = blob.type === 'image/png' ? blob : await convertToPng(dataUrl);
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob }),
    ]);
    return true;
  } catch {
    // Fallback: open in new tab so user can right-click → copy
    return false;
  }
}

/** Convert a data URL to PNG blob via canvas */
function convertToPng(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    };
    img.src = dataUrl;
  });
}

/**
 * Image panel — upload screenshots via file input, drag & drop, or clipboard paste.
 * Displays a thumbnail grid of shared images.
 * Any user in the room can delete or copy any image.
 */
function ImagePanel({ images, onImageShare, onImageDelete, onImageClick, addToast, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const processAndUpload = useCallback(async (file) => {
    const validation = validateImage(file);
    if (!validation.valid) {
      addToast(validation.error, 'error');
      return;
    }

    setUploading(true);
    try {
      const base64 = await compressImage(file);
      await onImageShare(base64, file.name);
      addToast('Screenshot shared!', 'success');
    } catch (err) {
      addToast(String(err), 'error');
    } finally {
      setUploading(false);
    }
  }, [onImageShare, addToast]);

  // File input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processAndUpload(file);
    e.target.value = '';
  };

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processAndUpload(file);
    }
  };

  // Clipboard paste (Ctrl+V)
  const handlePaste = useCallback((e) => {
    const file = getImageFromClipboard(e.clipboardData);
    if (file) {
      e.preventDefault();
      processAndUpload(file);
    }
  }, [processAndUpload]);

  // Copy image to clipboard
  const handleCopy = useCallback(async (e, img) => {
    e.stopPropagation();
    const success = await copyImageToClipboard(img.data);
    if (success) {
      addToast('Image copied to clipboard!', 'success');
    } else {
      addToast('Could not copy. Use Download instead.', 'error');
    }
  }, [addToast]);

  // Download image
  const handleDownload = useCallback((e, img) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = img.data;
    a.download = img.name || 'screenshot.png';
    a.click();
  }, []);

  return (
    <div
      className={`image-panel ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
    >
      {/* Header */}
      <div className="image-panel-header">
        <h3>Screenshots <span className="image-count">{images.length}/10</span></h3>
        <div className="image-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= 10}
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
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Hint */}
      <p className="image-hint">
        Paste with <kbd>Ctrl+V</kbd> or drag & drop an image
      </p>

      {/* Grid */}
      {images.length > 0 ? (
        <div className="image-grid">
          {images.map((img) => (
            <div key={img.id} className="image-thumb" onClick={() => onImageClick(img)}>
              <img src={img.data} alt={img.name} loading="lazy" />
              <div className="image-overlay">
                <span className="image-meta">{img.uploadedBy} · {timeAgo(img.timestamp)}</span>
                <div className="image-overlay-actions">
                  <button
                    className="btn btn-icon image-action-btn"
                    onClick={(e) => handleCopy(e, img)}
                    title="Copy to clipboard"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '16px'}}>content_copy</span>
                  </button>
                  <button
                    className="btn btn-icon image-action-btn"
                    onClick={(e) => handleDownload(e, img)}
                    title="Download"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '16px'}}>download</span>
                  </button>
                  <button
                    className="btn btn-icon image-action-btn image-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageDelete(img.id);
                    }}
                    title="Delete image"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '16px'}}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="image-empty">
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.5 }}>image</span>
          <p>No screenshots yet</p>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <span><span className="material-symbols-outlined" style={{verticalAlign: 'middle', marginRight: '8px'}}>add_photo_alternate</span> Drop image here</span>
        </div>
      )}
    </div>
  );
}

export default ImagePanel;
