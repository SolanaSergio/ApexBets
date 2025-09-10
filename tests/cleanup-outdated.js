#!/usr/bin/env node

/**
 * ApexBets Test Cleanup Script
 * Removes outdated test files and consolidates the testing system
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Files to remove (outdated or redundant)
const filesToRemove = [
  'quick-verification.js', // Replaced by quick-verification-fixed.js
  'comprehensive-verification.js', // Replaced by quick-verification-fixed.js
  'generate-verification-report.js', // Functionality moved to verification-tracker.js
  'verification/comprehensive-verification.test.js', // Redundant
  'test-runner.js', // Replaced by test-runner-comprehensive.js
];

// Directories to clean up
const directoriesToClean = [
  'verification' // Empty after removing comprehensive-verification.test.js
];

function removeFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      log(`${colors.green}✓${colors.reset} Removed: ${filePath}`, 'green');
      return true;
    } catch (error) {
      log(`${colors.red}✗${colors.reset} Failed to remove ${filePath}: ${error.message}`, 'red');
      return false;
    }
  } else {
    log(`${colors.yellow}⚠${colors.reset} File not found: ${filePath}`, 'yellow');
    return false;
  }
}

function removeDirectory(dirPath) {
  const fullPath = path.join(__dirname, dirPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      const files = fs.readdirSync(fullPath);
      if (files.length === 0) {
        fs.rmdirSync(fullPath);
        log(`${colors.green}✓${colors.reset} Removed empty directory: ${dirPath}`, 'green');
        return true;
      } else {
        log(`${colors.yellow}⚠${colors.reset} Directory not empty: ${dirPath}`, 'yellow');
        return false;
      }
    } catch (error) {
      log(`${colors.red}✗${colors.reset} Failed to remove directory ${dirPath}: ${error.message}`, 'red');
      return false;
    }
  } else {
    log(`${colors.yellow}⚠${colors.reset} Directory not found: ${dirPath}`, 'yellow');
    return false;
  }
}

function cleanupOutdatedFiles() {
  log(`${colors.bright}${colors.cyan}🧹 ApexBets Test Cleanup${colors.reset}`);
  log(`${colors.cyan}==========================${colors.reset}\n`);

  let removedFiles = 0;
  let removedDirs = 0;

  // Remove outdated files
  log(`${colors.bright}Removing outdated files:${colors.reset}`);
  filesToRemove.forEach(file => {
    if (removeFile(file)) {
      removedFiles++;
    }
  });

  // Remove empty directories
  log(`\n${colors.bright}Removing empty directories:${colors.reset}`);
  directoriesToClean.forEach(dir => {
    if (removeDirectory(dir)) {
      removedDirs++;
    }
  });

  // Summary
  log(`\n${colors.bright}Cleanup Summary:${colors.reset}`);
  log(`${colors.green}✓ Files removed: ${removedFiles}${colors.reset}`);
  log(`${colors.green}✓ Directories removed: ${removedDirs}${colors.reset}`);

  // Show current test structure
  log(`\n${colors.bright}Current Test Structure:${colors.reset}`);
  log(`${colors.blue}📁 tests/${colors.reset}`);
  log(`${colors.blue}  ├── quick-verification-fixed.js${colors.reset} (Main verification system)`);
  log(`${colors.blue}  ├── database-monitor.js${colors.reset} (Database monitoring)`);
  log(`${colors.blue}  ├── test-runner-comprehensive.js${colors.reset} (Test runner)`);
  log(`${colors.blue}  ├── verification-tracker.js${colors.reset} (Status tracking)`);
  log(`${colors.blue}  ├── cleanup-outdated.js${colors.reset} (This script)`);
  log(`${colors.blue}  ├── integration/${colors.reset} (Integration tests)`);
  log(`${colors.blue}  ├── e2e/${colors.reset} (End-to-end tests)`);
  log(`${colors.blue}  └── unit/${colors.reset} (Unit tests)`);

  log(`\n${colors.green}✅ Cleanup completed successfully${colors.reset}`);
}

// Run cleanup
if (require.main === module) {
  cleanupOutdatedFiles();
}

module.exports = { cleanupOutdatedFiles };
