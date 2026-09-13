#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively removes all node_modules directories from the specified directory
 * @param {string} dir - Directory to search in
 * @param {string[]} removedDirs - Array to track removed directories
 */
function listNodeModules(dir) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      console.log({
        fullPath,
        item,
      });

      if (stat.isDirectory()) {
        console.log(`Directory: ${fullPath}`);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not process directory ${dir}:`, error.message);
  }
}

if (require.main === module) {
  listNodeModules(path.resolve(__dirname, '..'));
}

module.exports = { listNodeModules };
