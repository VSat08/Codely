import { useState, useRef, useEffect, useCallback } from 'react';
import './TabsBar.css';
import { getExtensionForLanguage } from '../utils/constants';

function TabsBar({ tabs, activeTabId, onTabChange, onTabAdd, onTabDelete, onTabRename }) {
  const [editingTabId, setEditingTabId] = useState(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const activeTabRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Check scroll overflow state
  const updateScrollIndicators = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // Update scroll indicators on scroll, resize, and tab changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollIndicators();
    container.addEventListener('scroll', updateScrollIndicators, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [updateScrollIndicators, tabs]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
      // Update indicators after scroll animation
      setTimeout(updateScrollIndicators, 350);
    }
  }, [activeTabId, updateScrollIndicators]);

  const handleStartEdit = (tab, e) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditName(tab.name);
  };

  const handleSaveRename = async () => {
    if (!editingTabId) return;
    const name = editName.trim();
    if (name && name !== tabs[editingTabId].name) {
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

  const scrollBy = (direction) => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollBy({ left: direction * 120, behavior: 'smooth' });
  };

  const tabCount = Object.keys(tabs).length;

  return (
    <div className={`tabs-bar ${canScrollLeft ? 'has-scroll-left' : ''} ${canScrollRight ? 'has-scroll-right' : ''}`}>
      {/* Scroll left arrow (visible when overflowing) */}
      {canScrollLeft && (
        <button
          className="tabs-scroll-btn tabs-scroll-left"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll tabs left"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
        </button>
      )}

      <div className="tabs-container" ref={containerRef}>
        {Object.values(tabs).map((tab) => {
          const isActive = tab.id === activeTabId;
          const isEditing = tab.id === editingTabId;

          return (
            <div
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              className={`tab ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              onDoubleClick={(e) => handleStartEdit(tab, e)}
              title={tab.name || 'Double click to rename'}
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
              
              {!isEditing && tabCount > 1 && (
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

      {/* Scroll right arrow (visible when overflowing) */}
      {canScrollRight && (
        <button
          className="tabs-scroll-btn tabs-scroll-right"
          onClick={() => scrollBy(1)}
          aria-label="Scroll tabs right"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
        </button>
      )}
      
      {/* Tab count badge on mobile when overflowing */}
      <span className="tabs-count-badge" title={`${tabCount} tabs open`}>{tabCount}</span>

      <button className="btn btn-icon btn-ghost tab-add-btn" onClick={handleAdd} title="Add new file">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
      </button>
    </div>
  );
}

export default TabsBar;
