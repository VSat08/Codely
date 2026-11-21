import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetVersion = process.argv[2];

if (!targetVersion) {
  console.error('\x1b[31mError: Missing new version argument.\x1b[0m');
  console.log('Usage: node scripts/bump-version.mjs <new-version>');
  console.log('Example: node scripts/bump-version.mjs 2.5.0');
  process.exit(1);
}

const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
if (!semverRegex.test(targetVersion)) {
  console.error(`\x1b[31mError: "${targetVersion}" is not a valid Semantic Version (e.g. 2.5.0 or 2.5.0-beta.1)\x1b[0m`);
  process.exit(1);
}

const filesToUpdate = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'client', 'package.json'),
  path.join(rootDir, 'server', 'package.json'),
];

console.log(`\n🚀 Bumping Codely version to: \x1b[32m${targetVersion}\x1b[0m\n`);

filesToUpdate.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const oldVersion = content.version;
    content.version = targetVersion;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    const relPath = path.relative(rootDir, filePath) || 'package.json';
    console.log(`  ✓ Updated ${relPath} (${oldVersion} ➔ ${targetVersion})`);
  }
});

console.log(`  ✓ UI Version automatically synced via client/src/version.js (v${targetVersion})`);

// Check CHANGELOG.md
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  if (!changelog.includes(`[${targetVersion}]`)) {
    console.log(`\n\x1b[33m📝 Reminder: Please document this release in CHANGELOG.md:\x1b[0m`);
    console.log(`   ## [${targetVersion}] - ${new Date().toISOString().split('T')[0]}`);
  } else {
    console.log(`  ✓ Release entry already found in CHANGELOG.md`);
  }
}

console.log(`\n✨ Version bump complete!\n`);

