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

  // Determine platform modifier for display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const altKey = isMac ? 'Option' : 'Alt';

  const shortcuts = [
    {
      group: 'Tabs & Workspace',
      items: [
        { desc: 'Create New Tab', keys: [altKey, 'N'] },
        { desc: 'Close Current Tab', keys: [altKey, 'W'] },
        { desc: 'Close Other Tabs', keys: [altKey, 'Shift', 'W'] },
        { desc: 'Rename Current Tab', keys: [altKey, 'E'] },
        { desc: 'Rename Room', keys: [altKey, 'R'] },
      ]
    },
    {
      group: 'Panels & Sidebars',
      items: [
        { desc: 'Toggle Color Theme', keys: [altKey, 'T'] },
        { desc: 'Toggle Users Sidebar', keys: [altKey, '1'] },
        { desc: 'Toggle Screenshots', keys: [altKey, '2'] },
        { desc: 'Toggle Files', keys: [altKey, '3'] },
        { desc: 'Toggle AI Assistant', keys: [altKey, '4'] },
        { desc: 'Show Keyboard Shortcuts', keys: [altKey, '/'] },
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
                        <kbd>{key}</kbd>
                        {kIdx < item.keys.length - 1 && <span className="shortcut-plus">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
