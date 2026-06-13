export const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'shell', label: 'Shell/Bash' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'plaintext', label: 'Plain Text' },
];

export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_IMAGES_PER_ROOM = 10;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_FILES_PER_ROOM = 10;
export const ACCEPTED_FILE_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv',
  '.txt', '.log', '.md', '.json', '.xml', '.yaml', '.yml',
  '.zip', '.tar', '.gz', '.env', '.toml', '.ini', '.cfg',
  '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.dart', '.sh',
  '.html', '.css', '.scss', '.sql', '.dockerfile',
];

export function getExtensionForLanguage(language) {
  const map = {
    javascript: 'js', typescript: 'ts', python: 'py', html: 'html',
    css: 'css', json: 'json', markdown: 'md', java: 'java', c: 'c',
    cpp: 'cpp', csharp: 'cs', go: 'go', rust: 'rs', sql: 'sql',
    ruby: 'rb', php: 'php', swift: 'swift', kotlin: 'kt',
    dart: 'dart', shell: 'sh', plaintext: 'txt', xml: 'xml', yaml: 'yaml', dockerfile: 'dockerfile'
  };
  return map[language] || 'txt';
}
