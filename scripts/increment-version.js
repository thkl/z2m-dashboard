#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const versionFile = path.resolve(__dirname, '../version.json');
const publicVersionFile = path.resolve(__dirname, '../public/version.json');

// Validate that resolved paths are within the project directory
const projectRoot = path.resolve(__dirname, '..');
const versionFileResolved = path.resolve(versionFile);
const publicVersionFileResolved = path.resolve(publicVersionFile);

if (!versionFileResolved.startsWith(projectRoot) || !publicVersionFileResolved.startsWith(projectRoot)) {
  throw new Error('Invalid file paths: paths must be within project directory');
}

try {
  // Read current version
  const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  const [major, minor, patch] = versionData.version.split('.').map(Number);

  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;
  const newVersionData = { version: newVersion };

  // Write back to root version file
  fs.writeFileSync(versionFile, JSON.stringify(newVersionData, null, 2) + '\n');

  // Also update public version file
  fs.writeFileSync(publicVersionFile, JSON.stringify(newVersionData, null, 2) + '\n');

  console.log(`✓ Version incremented: ${versionData.version} → ${newVersion}`);
} catch (error) {
  console.error('Error incrementing version:', error.message);
  process.exit(1);
}
