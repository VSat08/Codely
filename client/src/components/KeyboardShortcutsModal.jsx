import React, { useEffect } from 'react';
import './KeyboardShortcutsModal.css';

function KeyboardShortcutsModal({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Platform detection
  const isMac = /Mac|iPhone|iPad|iPod/.test(
    navigator.userAgentData?.platform || navigator.platform
  );

  // Platform-aware key symbols
  // Mac: ⌃ = Control, ⇧ = Shift
  // Windows: Alt, Shift
  const modKey = isMac ? '⌃' : 'Alt';
  const shiftKey = isMac ? '⇧' : 'Shift';

  const shortcuts = [
    {
      group: 'Tabs & Workspace',
      items: [
        { desc: 'Create New Tab', keys: [modKey, 'N'] },
        { desc: 'Close Current Tab', keys: [modKey, 'W'] },
        { desc: 'Close Other Tabs', keys: [modKey, shiftKey, 'W'] },
        { desc: 'Rename Current Tab', keys: [modKey, 'E'] },
        { desc: 'Previous Tab', keys: [modKey, ','] },
        { desc: 'Next Tab', keys: [modKey, '.'] },
        { desc: 'Rename Room', keys: [modKey, 'R'] },
      ]
    },
    {
      group: 'Panels & Sidebars',
      items: [
        { desc: 'Toggle Color Theme', keys: [modKey, 'T'] },
        { desc: 'Toggle Users Sidebar', keys: [modKey, '1'] },
        { desc: 'Toggle Screenshots', keys: [modKey, '2'] },
        { desc: 'Toggle Files', keys: [modKey, '3'] },
        { desc: 'Toggle AI Assistant', keys: [modKey, '4'] },
        { desc: 'Show Keyboard Shortcuts', keys: [modKey, '/'] },
      ]
    }
  ];

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-header">
          <h2>
            <span className="material-symbols-outlined">keyboard</span>
            Keyboard Shortcuts
          </h2>
          <div className="shortcuts-platform-badge">
            {isMac ? '⌘ macOS' : '⊞ Windows'}
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} title="Close">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
        
        <div className="shortcuts-body">
          {shortcuts.map((section, idx) => (
            <div key={idx} className="shortcuts-group">
              <h3>{section.group}</h3>
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="shortcut-row">
                  <span className="shortcut-desc">{item.desc}</span>
                  <div className="shortcut-keys">
                    {item.keys.map((key, kIdx) => (
                      <React.Fragment key={kIdx}>
                        <kbd className={
                          key === modKey ? 'kbd-modifier' :
                          key === shiftKey ? 'kbd-modifier' :
                          'kbd-key'
                        }>{key}</kbd>
                        {kIdx < item.keys.length - 1 && <span className="shortcut-plus">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span className="shortcuts-hint">
            {isMac ? 'Using ⌃ Control as modifier (conflict-free)' : 'Using Alt as modifier'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
