#!/usr/bin/env node

/**
 * Cleanup script to remove outdated files and documentation
 * This script identifies and removes deprecated files that are no longer needed
 */

const fs = require('fs').promises;
const path = require('path');

// List of outdated files and directories to remove
const OUTDATED_PATHS = [
  // Outdated documentation files
  'docs/outdated-api-docs.md',
  'docs/legacy-setup-guide.md',
  'docs/deprecated-components.md',
  
  // Old component directories
  'components/old-dashboard/',
  'components/legacy-ui/',
  'components/deprecated/',
  
  // Outdated API routes
  'app/api/old-endpoints/',
  'app/api/deprecated-routes/',
  
  // Old test files
  'tests/outdated/',
  'tests/legacy/',
  
  // Old configuration files
  'config/old-config.json',
  'config/legacy-settings.js',
  
  // Outdated scripts
  'scripts/old-deployment.sh',
  'scripts/legacy-migration.js',
  
  // Old asset directories
  'public/assets/old/',
  'public/images/legacy/',
  
  // Outdated type definitions
  'types/old-types.ts',
  'types/deprecated/',
  
  // Old utility files
  'lib/utils/old-helpers.ts',
  'lib/utils/deprecated-utils.ts',
  
  // Outdated hooks
  'hooks/old-use-real-time-updates.ts',
  'hooks/deprecated-hooks/',
  
  // Old service files
  'lib/services/old-api-client.ts',
  'lib/services/legacy-services/',
];

// List of file patterns to remove
const OUTDATED_PATTERNS = [
  /\.old\./,
  /\.deprecated\./,
  /\.legacy\./,
  /-old\./,
  /-deprecated\./,
  /-legacy\./,
];

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function removeOutdatedPaths() {
  console.log('Starting cleanup of outdated files and directories...');
  
  let removedCount = 0;
  
  // Remove specific outdated paths
  for (const outdatedPath of OUTDATED_PATHS) {
    const fullPath = path.join(process.cwd(), outdatedPath);
    
    if (await fileExists(fullPath)) {
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
          console.log(`Removed directory: ${outdatedPath}`);
        } else {
          await fs.unlink(fullPath);
          console.log(`Removed file: ${outdatedPath}`);
        }
        removedCount++;
      } catch (error) {
        console.error(`Failed to remove ${outdatedPath}:`, error);
      }
    }
  }
  
  // Search for and remove files matching patterns
  async function searchAndRemove(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other large directories
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') {
            continue;
          }
          await searchAndRemove(fullPath);
        } else {
          // Check if file matches any outdated pattern
          for (const pattern of OUTDATED_PATTERNS) {
            if (pattern.test(entry.name)) {
              try {
                await fs.unlink(fullPath);
                console.log(`Removed outdated file: ${path.relative(process.cwd(), fullPath)}`);
                removedCount++;
                break; // Move to next file after removing
              } catch (error) {
                console.error(`Failed to remove ${fullPath}:`, error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching directory ${dir}:`, error);
    }
  }
  
  // Search for pattern-matching files
  await searchAndRemove(process.cwd());
  
  console.log(`\nCleanup complete. Removed ${removedCount} outdated files/directories.`);
}

// Run the cleanup
removeOutdatedPaths().catch(error => {
  console.error('Cleanup script failed:', error);
  process.exit(1);
});