import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Reusable hook to handle dynamic dragging/resizing of drawers & sidebars.
 * Supports both bottom dock (height resizing) and right dock (width resizing).
 */
export function useResizable({
  defaultHeight = 260,
  defaultWidth = 480,
  dock: externalDock,
  defaultDock = 'bottom',
  height: externalHeight,
  onHeightChange,
  width: externalWidth,
  onWidthChange,
  minHeight = 140,
  maxHeight = null,
  minWidth = 280,
  maxWidth = null,
  storageKeyPrefix = 'codely-drawer',
}) {
  const [internalDock, setDockState] = useState(() => {
    return localStorage.getItem(`${storageKeyPrefix}-dock`) || defaultDock;
  });

  const dock = externalDock || internalDock;

  useEffect(() => {
    if (externalDock) {
      setDockState(externalDock);
    }
  }, [externalDock]);

  const [internalHeight, setInternalHeight] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const defaultMobileH = isMobile ? Math.min(380, Math.floor(window.innerHeight * 0.52)) : defaultHeight;
    const saved = localStorage.getItem(`${storageKeyPrefix}-height`);
    if (isMobile) {
      const parsed = saved ? parseInt(saved, 10) : 0;
      return parsed >= 280 ? Math.min(parsed, window.innerHeight - 80) : defaultMobileH;
    }
    return saved ? parseInt(saved, 10) : defaultHeight;
  });

  const height = externalHeight !== undefined ? externalHeight : internalHeight;
  const setHeight = useCallback((h) => {
    const val = typeof h === 'function' ? h(height) : h;
    setInternalHeight(val);
    onHeightChange?.(val);
  }, [height, onHeightChange]);

  const [internalWidth, setInternalWidth] = useState(() => {
    const saved = localStorage.getItem(`${storageKeyPrefix}-width`);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });

  const width = externalWidth !== undefined ? externalWidth : internalWidth;
  const setWidth = useCallback((w) => {
    const val = typeof w === 'function' ? w(width) : w;
    setInternalWidth(val);
    onWidthChange?.(val);
  }, [width, onWidthChange]);

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const setDock = useCallback((newDock) => {
    setDockState(newDock);
    localStorage.setItem(`${storageKeyPrefix}-dock`, newDock);
  }, [storageKeyPrefix]);

  const toggleDock = useCallback(() => {
    setDockState((prev) => {
      const next = prev === 'bottom' ? 'right' : 'bottom';
      localStorage.setItem(`${storageKeyPrefix}-dock`, next);
      return next;
    });
  }, [storageKeyPrefix]);

  const startDragging = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    dragRef.current = {
      startX: clientX,
      startY: clientY,
      startHeight: height,
      startWidth: width,
      dock,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = dock === 'bottom' ? 'row-resize' : 'col-resize';
  }, [height, width, dock]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!dragRef.current) return;
      const { startX, startY, startHeight, startWidth, dock: currentDock } = dragRef.current;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (currentDock === 'bottom') {
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        const delta = startY - clientY;
        const maxH = maxHeight || (window.innerHeight - (isMobile ? 60 : 100));
        const minH = isMobile ? 260 : minHeight;
        const nextHeight = Math.min(Math.max(minH, startHeight + delta), maxH);
        setHeight(nextHeight);
      } else {
        const delta = startX - clientX;
        const maxW = maxWidth || (window.innerWidth - 260);
        const nextWidth = Math.min(Math.max(minWidth, startWidth + delta), maxW);
        setWidth(nextWidth);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (dock === 'bottom') {
        localStorage.setItem(`${storageKeyPrefix}-height`, String(height));
      } else {
        localStorage.setItem(`${storageKeyPrefix}-width`, String(width));
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dock, minHeight, maxHeight, minWidth, maxWidth, storageKeyPrefix]);

  return {
    dock,
    setDock,
    toggleDock,
    height,
    setHeight,
    width,
    setWidth,
    isDragging,
    startDragging,
  };
}

