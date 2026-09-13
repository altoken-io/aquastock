#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively removes all node_modules directories from the specified directory
 * @param {string} dir - Directory to search in
 * @param {string[]} removedDirs - Array to track removed directories
 */
function removeNodeModules(dir, removedDirs = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // If this is a node_modules directory, remove it
        if (item === 'node_modules') {
          console.log(`Removing: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          removedDirs.push(fullPath);
        } else if (item === '.pnpm-cache') {
          console.log(`Removing: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          removedDirs.push(fullPath);
        } else if (item === '.turbo') {
          console.log(`Removing: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          removedDirs.push(fullPath);
        } else if (item === '.next') {
          console.log(`Removing: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          removedDirs.push(fullPath);
        } else {
          // Recursively search subdirectories
          removeNodeModules(fullPath, removedDirs);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not process directory ${dir}:`, error.message);
  }

  return removedDirs;
}

/**
 * Main function to clean all node_modules directories
 * @param {{ withLockfile?: boolean }} [options] - Pass withLockfile to also remove pnpm-lock.yaml
 */
function cleanAllNodeModules(options = {}) {
  const rootDir = path.resolve(__dirname, '..');
  const appsDir = path.join(rootDir, 'apps');
  const packagesDir = path.join(rootDir, 'packages');

  console.log('🧹 Starting cleanup of node_modules directories...\n');

  let allRemovedDirs = [];

  // Remove root node_modules
  const rootNodeModules = path.join(rootDir, 'node_modules');
  if (fs.existsSync(rootNodeModules)) {
    console.log(`Removing root node_modules: ${rootNodeModules}`);
    fs.rmSync(rootNodeModules, { recursive: true, force: true });
    allRemovedDirs.push(rootNodeModules);
  }

  // Remove node_modules from apps directory
  if (fs.existsSync(appsDir)) {
    console.log('\n📱 Cleaning apps directory...');
    const appsRemoved = removeNodeModules(appsDir);
    allRemovedDirs.push(...appsRemoved);
  }

  // Remove node_modules from packages directory
  if (fs.existsSync(packagesDir)) {
    console.log('\n📦 Cleaning packages directory...');
    const packagesRemoved = removeNodeModules(packagesDir);
    allRemovedDirs.push(...packagesRemoved);
  }

  if (options.withLockfile) {
    const lockfile = path.join(rootDir, 'pnpm-lock.yaml');
    if (fs.existsSync(lockfile)) {
      console.log(`\n🔒 Removing lockfile: ${lockfile}`);
      fs.rmSync(lockfile, { force: true });
      allRemovedDirs.push(lockfile);
    }
  }

  console.log(
    `\n✅ Cleanup complete! Removed ${allRemovedDirs.length} item(s).`,
  );
  console.log('\n💡 Next steps:');
  console.log('   Run "pnpm install" to reinstall dependencies');
}

if (require.main === module) {
  const withLockfile = process.argv.includes('--with-lockfile');
  cleanAllNodeModules({ withLockfile });
}

module.exports = { cleanAllNodeModules, removeNodeModules };
