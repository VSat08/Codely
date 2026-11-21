import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DOCS_SECTIONS, DOCS_CONTENT } from './docsData';
import { FULL_VERSION_BADGE } from '../version';
import './Docs.css';

function Docs() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const isMac = typeof window !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const activeSlug = slug && DOCS_CONTENT[slug] ? slug : 'overview';
  const currentDoc = DOCS_CONTENT[activeSlug];

  // Gracefully redirect invalid slug to overview
  useEffect(() => {
    if (slug && !DOCS_CONTENT[slug]) {
      navigate('/docs/overview', { replace: true });
    }
  }, [slug, navigate]);

  const [theme, setTheme] = useState(() => localStorage.getItem('codely-home-theme') || 'dark');
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem('codely-docs-banner-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem('codely-docs-banner-dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState('');
  const searchInputRef = useRef(null);

  // Sync browser document tab title with current doc
  useEffect(() => {
    if (currentDoc) {
      document.title = `${currentDoc.title} | Codely Docs`;
    }
    return () => {
      document.title = 'Codely | Real-time Collaborative Code Editor';
    };
  }, [currentDoc]);

  // Sync theme with data-theme & data-home-mode
  useEffect(() => {
    const activeMonacoTheme = theme === 'light' ? 'vs' : 'vs-dark';
    document.documentElement.setAttribute('data-theme', activeMonacoTheme);
    document.documentElement.setAttribute('data-home-mode', theme);
  }, [theme]);

  // Reset scroll to top when changing doc pages
  useEffect(() => {
    const page = document.querySelector('.docs-page');
    if (page) page.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSlug]);

  // Scroll spy to highlight active heading in right TOC ("On this page")
  useEffect(() => {
    const page = document.querySelector('.docs-page');
    if (!page || !currentDoc?.toc || currentDoc.toc.length === 0) return;

    setActiveHeadingId(currentDoc.toc[0].id);

    const handleScroll = () => {
      const tocItems = currentDoc.toc;
      let current = tocItems[0].id;
      for (let i = 0; i < tocItems.length; i++) {
        const el = document.getElementById(tocItems[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // 140px accommodates the 104px sticky header + breathing room
          if (rect.top <= 140) {
            current = tocItems[i].id;
          }
        }
      }
      setActiveHeadingId(current);
    };

    page.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => page.removeEventListener('scroll', handleScroll);
  }, [activeSlug, currentDoc]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('codely-home-theme', nextTheme);
  };

  // Flattened items for previous / next navigation
  const allItems = useMemo(() => {
    const items = [];
    DOCS_SECTIONS.forEach((sec) => {
      sec.items.forEach((item) => items.push(item));
    });
    return items;
  }, []);

  const currentIndex = allItems.findIndex((it) => it.slug === activeSlug);
  const prevDoc = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextDoc = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  // Deep Search filter across titles, descriptions, slugs, subtitles, TOC headings & content
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allItems.filter((it) => {
      const doc = DOCS_CONTENT[it.slug];
      const matchTitle = it.title.toLowerCase().includes(q);
      const matchDesc = it.description.toLowerCase().includes(q);
      const matchSlug = it.slug.toLowerCase().includes(q);
      const matchSubtitle = doc?.subtitle?.toLowerCase().includes(q);
      const matchToc = doc?.toc?.some((t) => t.label.toLowerCase().includes(q));
      const matchContent = doc?.content?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchSlug || matchSubtitle || matchToc || matchContent;
    });
  }, [searchQuery, allItems]);

  const activeResultsList = searchQuery.trim() === '' ? allItems.slice(0, 5) : searchResults;

  // Reset selected index when query or modal state changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, isSearchOpen]);

  // Keyboard shortcut Ctrl+K / Cmd+K and Arrow keys / Enter in Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
      if (isSearchOpen && activeResultsList.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % activeResultsList.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + activeResultsList.length) % activeResultsList.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (activeResultsList[selectedIndex]) {
            handleSelectSearchResult(activeResultsList[selectedIndex].slug);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, activeResultsList, selectedIndex]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleCopyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunchRoom = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    navigate(`/${randomId}`);
  };

  const handleSelectSearchResult = (targetSlug) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSidebarOpen(false);
    navigate(`/docs/${targetSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleArticleClick = (e) => {
    const targetLink = e.target.closest('a');
    if (!targetLink) return;
    const href = targetLink.getAttribute('href');
    if (href && href.startsWith('/docs')) {
      e.preventDefault();
      navigate(href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTocClick = (e, targetId) => {
    e.preventDefault();
    setActiveHeadingId(targetId);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`docs-page ${!isBannerDismissed ? 'has-banner' : ''}`}>
      {/* Unified Solid Sticky Header (prevents scrolled text bleed-through) */}
      <div className="docs-sticky-header-wrapper">
        {/* Top Docs Navigation Bar */}
        <header className="docs-header">
          <div className="docs-header-left">
            <button
              className="docs-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined">{sidebarOpen ? 'close' : 'menu'}</span>
            </button>

            <Link to="/" className="docs-logo">
              <span className="logo-bracket">&lt;</span>
              <span className="logo-text">Codely</span>
              <span className="logo-bracket">/&gt;</span>
              <span className="docs-logo-tag">Docs</span>
            </Link>
          </div>

          {/* Global Search Bar (Center) */}
          <div className="docs-search-wrapper" onClick={() => setIsSearchOpen(true)}>
            <span className="material-symbols-outlined docs-search-icon">search</span>
            <span className="docs-search-placeholder">Search docs...</span>
            <kbd className="docs-search-kbd">{isMac ? '⌘ K' : 'Ctrl K'}</kbd>
          </div>

          {/* Top Header Right Controls */}
          <div className="docs-header-right">
            <Link to="/" className="docs-nav-link desktop-only">Home</Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-nav-link desktop-only"
            >
              GitHub
            </a>

            {/* Mobile Search Button */}
            <button
              className="nav-theme-toggle mobile-search-btn"
              onClick={() => setIsSearchOpen(true)}
              title="Search documentation"
              aria-label="Search documentation"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                search
              </span>
            </button>

            <button
              className="nav-theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button className="btn btn-primary btn-sm docs-cta-btn" onClick={handleLaunchRoom}>
              <span className="cta-btn-text-full">Launch workspace</span>
              <span className="cta-btn-text-short">Launch</span>
            </button>
          </div>
        </header>

        {/* Category Subheader Navigation (matching Google Antigravity & top developer docs) */}
        <div className="docs-subnav">
          <div className="docs-subnav-inner">
            <div className="docs-category-tabs">
              <Link
                to="/docs/overview"
                className={`docs-cat-tab ${currentDoc.category === 'Start Here' ? 'active' : ''}`}
              >
                Start Here
              </Link>
              <Link
                to="/docs/crdt-sync"
                className={`docs-cat-tab ${currentDoc.category === 'Core Features' ? 'active' : ''}`}
              >
                Features
              </Link>
              <Link
                to="/docs/shortcuts"
                className={`docs-cat-tab ${currentDoc.category === 'Reference' ? 'active' : ''}`}
              >
                Reference
              </Link>
            </div>

            <div className="docs-subnav-right">
              <span className="docs-version-badge">{FULL_VERSION_BADGE}</span>
            </div>
          </div>
        </div>

        {/* Full-width Announcement Bar (Google Antigravity Docs Style) */}
        {!isBannerDismissed && (
          <div className="docs-announcement-bar">
            <div className="docs-announcement-bar-inner">
              <span className="announcement-pill">✦ NEW</span>
              <span className="announcement-text">
                Web Preview with responsive viewports &amp; Terminal are now live in Codely.
              </span>
              <span className="announcement-sep">|</span>
              <Link to="/docs/web-preview" className="announcement-link">
                Read guide <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <button
              type="button"
              className="announcement-dismiss-btn"
              onClick={handleDismissBanner}
              aria-label="Dismiss announcement"
              title="Dismiss announcement"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Main 3-Column Layout */}
      <div className="docs-container">
        {/* Left Navigation Sidebar */}
        <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="docs-sidebar-inner">
            {DOCS_SECTIONS.map((section, idx) => (
              <div key={idx} className="docs-nav-group">
                <div className="docs-group-title">{section.category}</div>
                <ul className="docs-nav-list">
                  {section.items.map((item) => {
                    const isActive = item.slug === activeSlug;
                    return (
                      <li key={item.slug}>
                        <Link
                          to={`/docs/${item.slug}`}
                          className={`docs-nav-item ${isActive ? 'active' : ''}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="material-symbols-outlined docs-item-icon">{item.icon}</span>
                          <span className="docs-item-title">{item.title}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div className="docs-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Center Main Content Area */}
        <main className="docs-main">
          <div className="docs-main-inner">
            {/* Breadcrumbs */}
            <div className="docs-breadcrumbs">
              <Link to="/docs">Docs</Link>
              <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
              <span>{currentDoc.category}</span>
              <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
              <span className="current">{currentDoc.title}</span>
            </div>

            {/* Doc Header */}
            <div className="docs-article-header">
              <h1 className="docs-article-title">{currentDoc.title}</h1>
              {currentDoc.subtitle && (
                <p className="docs-article-subtitle">{currentDoc.subtitle}</p>
              )}
              <div className="docs-meta-row">
                <span className="docs-meta-badge">Last updated: {currentDoc.updatedAt}</span>
                <button className="docs-meta-copy" onClick={handleCopyPageLink}>
                  <span className="material-symbols-outlined">
                    {copiedLink ? 'check' : 'link'}
                  </span>
                  {copiedLink ? 'Link copied!' : 'Copy page link'}
                </button>
              </div>
            </div>

            {/* Render HTML Content with smooth internal navigation */}
            <article
              className="docs-article-content"
              dangerouslySetInnerHTML={{ __html: currentDoc.content }}
              onClick={handleArticleClick}
            />

            {/* Previous & Next Article Navigation */}
            <nav className="docs-pagination">
              {prevDoc ? (
                <Link to={`/docs/${prevDoc.slug}`} className="docs-page-card prev">
                  <span className="page-dir">← Previous</span>
                  <span className="page-title">{prevDoc.title}</span>
                </Link>
              ) : (
                <div />
              )}

              {nextDoc && (
                <Link to={`/docs/${nextDoc.slug}`} className="docs-page-card next">
                  <span className="page-dir">Next →</span>
                  <span className="page-title">{nextDoc.title}</span>
                </Link>
              )}
            </nav>
          </div>
        </main>

        {/* Right Sidebar ("On this page" TOC) */}
        <aside className="docs-toc-sidebar">
          <div className="docs-toc-inner">
            <div className="docs-toc-title">On this page</div>
            <ul className="docs-toc-list">
              {currentDoc.toc?.map((item) => {
                const isHeadingActive = activeHeadingId === item.id;
                return (
                  <li key={item.id} className="docs-toc-item">
                    <a
                      href={`#${item.id}`}
                      className={`docs-toc-link ${isHeadingActive ? 'active' : ''}`}
                      onClick={(e) => handleTocClick(e, item.id)}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="docs-toc-actions">
              <button className="docs-toc-btn" onClick={handleLaunchRoom}>
                <span className="material-symbols-outlined">rocket_launch</span>
                Start instant room
              </button>
              <button className="docs-toc-btn" onClick={handleCopyPageLink}>
                <span className="material-symbols-outlined">share</span>
                {copiedLink ? 'Link copied!' : 'Share documentation'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Global Command Palette / Search Modal */}
      {isSearchOpen && (
        <div className="docs-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="docs-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="docs-modal-search-box">
              <span className="material-symbols-outlined">search</span>
              <input
                ref={searchInputRef}
                type="text"
                className="docs-modal-input"
                placeholder="Search topics, guides, features, shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="docs-modal-esc" onClick={() => setIsSearchOpen(false)}>
                ESC
              </kbd>
            </div>

            <div className="docs-modal-results">
              {searchQuery.trim() === '' ? (
                <div className="docs-search-suggestions">
                  <div className="suggestion-label">Suggested Guides</div>
                  {activeResultsList.map((it, idx) => (
                    <div
                      key={it.slug}
                      className={`docs-search-item ${idx === selectedIndex ? 'active' : ''}`}
                      onClick={() => handleSelectSearchResult(it.slug)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span className="material-symbols-outlined">{it.icon}</span>
                      <div>
                        <div className="item-title">{it.title}</div>
                        <div className="item-desc">{it.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeResultsList.length > 0 ? (
                activeResultsList.map((it, idx) => (
                  <div
                    key={it.slug}
                    className={`docs-search-item ${idx === selectedIndex ? 'active' : ''}`}
                    onClick={() => handleSelectSearchResult(it.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="material-symbols-outlined">{it.icon}</span>
                    <div>
                      <div className="item-title">{it.title}</div>
                      <div className="item-desc">{it.description}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="docs-no-results">
                  No documentation found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Docs;
