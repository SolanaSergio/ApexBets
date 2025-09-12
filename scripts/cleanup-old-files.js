#!/usr/bin/env node

/**
 * Cleanup script to remove old and outdated files from the project
 */

const fs = require('fs').promises;
const path = require('path');

// List of files to remove
const filesToRemove = [
  // Old API analysis reports that are no longer relevant
  'API_ANALYSIS_REPORT.md',
  'API_DIAGNOSIS_REPORT.md',
  'API_BEST_PRACTICES_ASSESSMENT.md',
  'API_AUDIT_COMPLETE_REPORT.md',
  'BALLDONTLIE_API_FIX_SUMMARY.md',
  'COMPLIANCE_COMPLETION_SUMMARY.md',
  'DYNAMIC_IMPLEMENTATION_SUMMARY.md',
  'FINAL_COMPLIANCE_AUDIT_REPORT.md',
  'FINAL_NBA_API_COMPLIANCE_REPORT.md',
  'HARDCODED_DATA_ELIMINATION_REPORT.md',
  'IMPROVEMENTS_SUMMARY.md',
  'MCP_INTEGRATION_GUIDE.md',
  'MCP_SERVER_SUMMARY.md',
  'RATE_LIMITING_OPTIMIZATION_REPORT.md',
  'SPORTS_API_COMPLIANCE_REPORT.md',
  'SUPABASE_MCP_README.md',
  'SETUP_MCP_SERVER.md',
  
  // Old test files
  'test-cache-direct.js',
  'test-cache-imports.js',
  'test-cache-integration.js',
  'test-cache-ts.js',
  'test-comprehensive-api-compliance.js',
  'test-mcp-integration.ts',
  'test-mcp-server.js',
  'test-nba-api.js',
  'verify-mcp-integration.js',
  
  // Old config files
  'fix_json.js',
  'temp_fixed.json',
  
  // Duplicate environment file
  'env.example'
];

// List of directories to remove
const directoriesToRemove = [
  'docs',
  'examples'
];

async function removeFile(filePath) {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`✅ Removed file: ${filePath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  Could not remove file ${filePath}: ${error.message}`);
    }
  }
}

async function removeDirectory(dirPath) {
  try {
    await fs.access(dirPath);
    await fs.rm(dirPath, { recursive: true, force: true });
    console.log(`✅ Removed directory: ${dirPath}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  Could not remove directory ${dirPath}: ${error.message}`);
    }
  }
}

async function cleanupOldFiles() {
  console.log('🧹 Cleaning up old and outdated files...\n');
  
  // Remove files
  for (const file of filesToRemove) {
    const filePath = path.join(__dirname, '..', file);
    await removeFile(filePath);
  }
  
  // Remove directories
  for (const dir of directoriesToRemove) {
    const dirPath = path.join(__dirname, '..', dir);
    await removeDirectory(dirPath);
  }
  
  console.log('\n✅ Cleanup completed!');
  console.log('Removed outdated documentation, test files, and duplicate configurations.');
}

// Run the cleanup
cleanupOldFiles().catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});