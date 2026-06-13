import { useState, useRef, useEffect } from 'react';
import './TabsBar.css';
import { getExtensionForLanguage } from '../utils/constants';

function TabsBar({ tabs, activeTabId, onTabChange, onTabAdd, onTabDelete, onTabRename }) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  useEffect(() => {
    const handleTriggerRename = () => {
      if (activeTabId && tabs[activeTabId]) {
        setEditingTabId(activeTabId);
        setEditName(tabs[activeTabId].name);
      }
    };
    window.addEventListener('trigger-rename-tab', handleTriggerRename);
    return () => window.removeEventListener('trigger-rename-tab', handleTriggerRename);
  }, [activeTabId, tabs]);

  const handleStartEdit = (tab, e) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditName(tab.name);
  };

  const handleSaveRename = async () => {
    if (!editingTabId) return;
    const name = editName.trim();
    if (name && name !== tabs[editingTabId].name) {
      // Very basic language inference from extension
      const ext = name.split('.').pop()?.toLowerCase();
      const reverseMap = {
        js: 'javascript', ts: 'typescript', py: 'python', html: 'html',
        css: 'css', json: 'json', md: 'markdown', java: 'java', c: 'c',
        cpp: 'cpp', cs: 'csharp', go: 'go', rs: 'rust', sql: 'sql',
        rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
        dart: 'dart', sh: 'shell', txt: 'plaintext', xml: 'xml', yaml: 'yaml', dockerfile: 'dockerfile'
      };
      const language = reverseMap[ext] || tabs[editingTabId].language;
      try {
        await onTabRename(editingTabId, name, language);
      } catch (e) {
        console.error('Failed to rename tab', e);
      }
    }
    setEditingTabId(null);
  };

  const handleAdd = async () => {
    const defaultLanguage = 'javascript';
    const defaultName = `Untitled-${Object.keys(tabs).length + 1}.${getExtensionForLanguage(defaultLanguage)}`;
    try {
      const newTab = await onTabAdd(defaultName, defaultLanguage);
      onTabChange(newTab.id);
    } catch (e) {
      console.error('Failed to add tab', e);
    }
  };

  const handleDelete = async (tabId, e) => {
    e.stopPropagation();
    try {
      await onTabDelete(tabId);
    } catch (e) {
      console.error('Failed to delete tab', e);
    }
  };

  return (
    <div className="tabs-bar">
      <div className="tabs-container">
        {Object.values(tabs).map((tab) => {
          const isActive = tab.id === activeTabId;
          const isEditing = tab.id === editingTabId;

          return (
            <div
              key={tab.id}
              className={`tab ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              onDoubleClick={(e) => handleStartEdit(tab, e)}
              title="Double click to rename"
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  className="tab-rename-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="tab-name truncate">{tab.name}</span>
              )}
              
              {!isEditing && Object.keys(tabs).length > 1 && (
                <button
                  className="btn btn-icon btn-ghost tab-close-btn"
                  onClick={(e) => handleDelete(tab.id, e)}
                  title="Close tab"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <button className="btn btn-icon btn-ghost tab-add-btn" onClick={handleAdd} title="Add new file">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </button>
    </div>
  );
}

export default TabsBar;
