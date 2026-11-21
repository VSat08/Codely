import React from 'react';

/**
 * Normalizes and extracts file extension from a file name.
 * Handles special files like Dockerfile or Makefile.
 */
export function getFileExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') return '';
  const trimmed = fileName.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === 'makefile') return 'makefile';
  const parts = trimmed.split('.');
  if (parts.length > 1) {
    return parts.pop().toLowerCase();
  }
  return '';
}

/**
 * Mapping from file extension to icon key.
 */
const EXTENSION_TO_LANG = {
  html: 'html',
  htm: 'html',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  py: 'python',
  pyw: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  dart: 'dart',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  md: 'markdown',
  markdown: 'markdown',
  json: 'json',
  sql: 'sql',
  xml: 'xml',
  svg: 'svg',
  yaml: 'yaml',
  yml: 'yaml',
  dockerfile: 'dockerfile',
  txt: 'plaintext',
  log: 'plaintext',
};

/**
 * Returns the appropriate JSX icon for a tab based on fileName and fallbackLanguage.
 * Uses crisp, zero-latency SVGs and VS Code Seti style glyphs for standard IDE fidelity.
 */
export function getTabFileIcon(fileName = '', fallbackLanguage = '') {
  const ext = getFileExtension(fileName);
  const langKey = EXTENSION_TO_LANG[ext] || (fallbackLanguage ? fallbackLanguage.toLowerCase() : 'plaintext');

  switch (langKey) {
    case 'html':
      // Matches VS Code Seti theme: orange </> tag
      return (
        <span className="tab-icon-seti tab-icon-html" title="HTML" aria-hidden="true">
          &lt;/&gt;
        </span>
      );

    case 'javascript':
      // Yellow JS badge
      return (
        <svg width="14" height="14" viewBox="0 0 100 100" className="tab-icon-svg" aria-hidden="true" title="JavaScript">
          <rect width="100" height="100" rx="16" fill="#F7DF1E"/>
          <text x="50" y="70" textAnchor="middle" fill="#000000" fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="50" letterSpacing="-1">JS</text>
        </svg>
      );

    case 'jsx':
    case 'tsx':
      // Cyan React atom
      return (
        <svg width="14" height="14" viewBox="-11.5 -10.23 23 20.46" className="tab-icon-svg" aria-hidden="true" title="React">
          <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
          <g stroke="#61dafb" strokeWidth="1.1" fill="none">
            <ellipse rx="11" ry="4.2"/>
            <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
            <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
          </g>
        </svg>
      );

    case 'typescript':
      // Blue TS badge
      return (
        <svg width="14" height="14" viewBox="0 0 100 100" className="tab-icon-svg" aria-hidden="true" title="TypeScript">
          <rect width="100" height="100" rx="16" fill="#3178C6"/>
          <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="50" letterSpacing="-1">TS</text>
        </svg>
      );

    case 'css':
      // Blue # symbol (matches VS Code Seti theme)
      return (
        <span className="tab-icon-seti tab-icon-css" title="CSS" aria-hidden="true">
          #
        </span>
      );

    case 'python':
      // Python blue & yellow logo
      return (
        <svg width="14" height="14" viewBox="0 0 110 110" className="tab-icon-svg" aria-hidden="true" title="Python">
          <path fill="#387eb8" d="M54.5 0C25.4 0 27.2 12.6 27.2 12.6l.03 13.1h27.8v3.9H16.2S0 27.8 0 57.1c0 29.2 14.1 28.2 14.1 28.2h8.4V73.4s-.5-14.1 13.9-14.1h27.3s13.4.2 13.4-13.2V13.2S74.4 0 54.5 0zm-15 8.7c2.9 0 5.2 2.3 5.2 5.2 0 2.9-2.3 5.2-5.2 5.2s-5.2-2.3-5.2-5.2c0-2.9 2.3-5.2 5.2-5.2z"/>
          <path fill="#ffe052" d="M55.5 110c29.1 0 27.2-12.6 27.2-12.6l-.03-13.1H54.9v-3.9h38.8s16.2 1.8 16.2-27.5c0-29.2-14.1-28.2-14.1-28.2h-8.4v11.9s.5 14.1-13.9 14.1H66.2s-13.4-.2-13.4 13.2v32.9s-1.8 13.2 2.7 13.2zm15-8.7c-2.9 0-5.2-2.3-5.2-5.2 0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2c0 2.9-2.3 5.2-5.2 5.2z"/>
        </svg>
      );

    case 'json':
      // Yellow { } (matches VS Code Seti theme)
      return (
        <span className="tab-icon-seti tab-icon-json" title="JSON" aria-hidden="true">
          &#123;&nbsp;&#125;
        </span>
      );

    case 'markdown':
      return (
        <span className="tab-icon-seti tab-icon-md" title="Markdown" aria-hidden="true">
          M↓
        </span>
      );

    case 'go':
      return (
        <span className="tab-icon-seti tab-icon-go" title="Go" aria-hidden="true">
          Go
        </span>
      );

    case 'rust':
      return (
        <span className="tab-icon-seti tab-icon-rust" title="Rust" aria-hidden="true">
          Rs
        </span>
      );

    case 'shell':
      return (
        <span className="tab-icon-seti tab-icon-bash" title="Shell/Bash" aria-hidden="true">
          &gt;_
        </span>
      );

    case 'java':
      return <i className="devicon-java-plain colored tab-icon-glyph" title="Java" />;

    case 'c':
      return <i className="devicon-c-plain colored tab-icon-glyph" title="C" />;

    case 'cpp':
      return <i className="devicon-cplusplus-plain colored tab-icon-glyph" title="C++" />;

    case 'csharp':
      return <i className="devicon-csharp-plain colored tab-icon-glyph" title="C#" />;

    case 'ruby':
      return <i className="devicon-ruby-plain colored tab-icon-glyph" title="Ruby" />;

    case 'php':
      return <i className="devicon-php-plain colored tab-icon-glyph" title="PHP" />;

    case 'swift':
      return <i className="devicon-swift-plain colored tab-icon-glyph" title="Swift" />;

    case 'kotlin':
      return <i className="devicon-kotlin-plain colored tab-icon-glyph" title="Kotlin" />;

    case 'dart':
      return <i className="devicon-dart-plain colored tab-icon-glyph" title="Dart" />;

    case 'dockerfile':
      return <i className="devicon-docker-plain colored tab-icon-glyph" title="Dockerfile" />;

    case 'sql':
      return (
        <span className="material-symbols-outlined tab-icon-material tab-icon-sql" title="SQL" aria-hidden="true">
          database
        </span>
      );

    case 'xml':
    case 'svg':
      return (
        <span className="material-symbols-outlined tab-icon-material tab-icon-xml" title="XML/SVG" aria-hidden="true">
          code
        </span>
      );

    case 'yaml':
      return (
        <span className="material-symbols-outlined tab-icon-material tab-icon-yaml" title="YAML" aria-hidden="true">
          settings
        </span>
      );

    case 'plaintext':
    default:
      return (
        <span className="material-symbols-outlined tab-icon-material tab-icon-txt" title="Text" aria-hidden="true">
          description
        </span>
      );
  }
}
