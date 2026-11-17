/**
 * Language execution classification & helper utilities for Codely.
 */

export const TERMINAL_LANGUAGES = new Set([
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'shell',
  'sql',
]);

export const PREVIEW_LANGUAGES = new Set(['html', 'markdown']);

/**
 * Returns the execution mode for a given language.
 * @param {string} language
 * @returns {'terminal' | 'preview' | 'unsupported'}
 */
export function getRunMode(language) {
  if (!language) return 'unsupported';
  const lang = language.toLowerCase().trim();
  if (TERMINAL_LANGUAGES.has(lang)) return 'terminal';
  if (PREVIEW_LANGUAGES.has(lang)) return 'preview';
  return 'unsupported';
}

/**
 * Check if a language is executable or previewable.
 * @param {string} language
 * @returns {boolean}
 */
export function isLanguageRunnable(language) {
  return getRunMode(language) !== 'unsupported';
}

/**
 * Returns user-facing label for the run action button.
 * @param {string} language
 * @returns {string}
 */
export function getRunButtonLabel(language) {
  const mode = getRunMode(language);
  if (mode === 'terminal') return 'Run';
  if (mode === 'preview') return 'Preview';
  return 'Run';
}

/**
 * Returns Google Material Symbols icon name for the run action.
 * Uses unified 'play_arrow' across all execution and preview types (VS Code / Antigravity standard).
 * @param {string} language
 * @returns {string}
 */
export function getRunButtonIcon(language) {
  return 'play_arrow';
}

/**
 * Explanatory helper message for non-runnable files or tooltips.
 * @param {string} language
 * @param {string} fileName
 * @returns {string}
 */
export function getRunTooltip(language, fileName = '') {
  const mode = getRunMode(language);
  if (mode === 'terminal') return `Run ${language} code (Alt+Enter)`;
  if (mode === 'preview') return `Run Web Preview (Alt+Enter)`;

  if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
    return 'React JSX requires a build step/bundler to execute.';
  }
  if (language === 'css') {
    return 'CSS is automatically styled when previewing an HTML tab.';
  }
  return `${language || 'This file'} is a static data/config file and cannot be executed directly.`;
}

