import React, { useEffect, useRef } from 'react';
import { THEME_OPTIONS } from '../utils/monacoThemes';
import './ThemeModal.css';

function ThemeModal({ currentTheme, onSelectTheme, onClose }) {
  const modalRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const darkThemes = THEME_OPTIONS.filter(t => t.type === 'dark');
  const lightThemes = THEME_OPTIONS.filter(t => t.type === 'light');

  return (
    <div className="modal-overlay">
      <div className="theme-modal" ref={modalRef}>
        <div className="theme-modal-header">
          <h2>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>palette</span>
            Color Theme
          </h2>
          <button className="btn-icon btn-ghost" onClick={onClose} title="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="theme-modal-content">
          <div className="theme-category">Dark Themes</div>
          {darkThemes.map((theme) => (
            <button
              key={theme.value}
              className={`theme-option ${currentTheme === theme.value ? 'active' : ''}`}
              onClick={() => {
                onSelectTheme(theme.value);
                onClose();
              }}
            >
              <div className="theme-option-left">
                <div 
                  className="theme-color-preview" 
                  style={{ background: theme.hex }}
                />
                <span className="theme-name">{theme.label}</span>
              </div>
              {currentTheme === theme.value && (
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>check</span>
              )}
            </button>
          ))}

          <div className="theme-category" style={{ marginTop: '16px' }}>Light Themes</div>
          {lightThemes.map((theme) => (
            <button
              key={theme.value}
              className={`theme-option ${currentTheme === theme.value ? 'active' : ''}`}
              onClick={() => {
                onSelectTheme(theme.value);
                onClose();
              }}
            >
              <div className="theme-option-left">
                <div 
                  className="theme-color-preview" 
                  style={{ background: theme.hex }}
                />
                <span className="theme-name">{theme.label}</span>
              </div>
              {currentTheme === theme.value && (
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent)' }}>check</span>
              )}
            </button>
          ))}
        </div>

        <div className="theme-modal-footer">
          <span className="theme-modal-hint">
            <span className="mono" style={{ padding: '2px 6px', background: 'var(--bg-primary)', borderRadius: '4px', border: '1px solid var(--border-primary)', marginRight: '6px' }}>Alt + T</span>
            to toggle this menu
          </span>
        </div>
      </div>
    </div>
  );
}

export default ThemeModal;
