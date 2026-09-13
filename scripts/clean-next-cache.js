#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively removes all .next directories from the specified directory,
 * skipping node_modules to avoid descending into installed packages.
 * @param {string} dir - Directory to search in
 * @param {string[]} removedDirs - Array to track removed directories
 */
function removeNextCache(dir, removedDirs = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      if (item === 'node_modules') continue;

      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item === '.next') {
          console.log(`Removing: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          removedDirs.push(fullPath);
        } else {
          removeNextCache(fullPath, removedDirs);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not process directory ${dir}:`, error.message);
  }

  return removedDirs;
}

function cleanNextCache() {
  const rootDir = path.resolve(__dirname, '..');
  const appsDir = path.join(rootDir, 'apps');

  console.log('🧹 Clearing .next cache...\n');

  const removed = fs.existsSync(appsDir) ? removeNextCache(appsDir) : [];

  console.log(
    removed.length > 0
      ? `\n✅ Removed ${removed.length} .next director${removed.length > 1 ? 'ies' : 'y'}.`
      : '\n✅ Nothing to remove.',
  );
}

if (require.main === module) {
  cleanNextCache();
}

module.exports = { cleanNextCache, removeNextCache };
