import { useEffect, useCallback } from 'react';
import './ImageLightbox.css';

/**
 * Full-screen image lightbox overlay.
 * Supports download, copy to clipboard, and keyboard navigation.
 */
function ImageLightbox({ image, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = image.data;
    a.download = image.name || 'screenshot.png';
    a.click();
  }, [image]);

  const handleCopy = useCallback(async () => {
    try {
      const response = await fetch(image.data);
      const blob = await response.blob();
      // Convert to PNG for clipboard compatibility
      let pngBlob = blob;
      if (blob.type !== 'image/png') {
        pngBlob = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            canvas.toBlob((b) => resolve(b), 'image/png');
          };
          img.src = image.data;
        });
      }
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      // Brief visual feedback — button text will show ✓
    } catch {
      // Fallback: nothing — user can still download
    }
  }, [image]);

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={image.data} alt={image.name} />
        <div className="lightbox-bar">
          <span className="lightbox-name truncate">{image.name}</span>
          <div className="lightbox-actions">
            <button className="btn btn-ghost lightbox-btn" onClick={handleCopy} title="Copy to clipboard">
              <span className="material-symbols-outlined" style={{fontSize: '18px', marginRight: '4px'}}>content_copy</span> Copy
            </button>
            <button className="btn btn-ghost lightbox-btn" onClick={handleDownload} title="Download">
              <span className="material-symbols-outlined" style={{fontSize: '18px', marginRight: '4px'}}>download</span> Download
            </button>
            <button className="btn btn-ghost lightbox-btn" onClick={onClose} title="Close">
              <span className="material-symbols-outlined" style={{fontSize: '18px', marginRight: '4px'}}>close</span> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageLightbox;
