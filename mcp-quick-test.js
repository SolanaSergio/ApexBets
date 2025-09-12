/**
 * Quick test for MCP server implementation
 * Verifies that all files are correctly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Quick MCP Server Implementation Test');
console.log('======================================\n');

// List of files that should exist
const requiredFiles = [
  'supabase-mcp-server.js',
  'lib/supabase/mcp-client.ts',
  'scripts/sql-scripts/009_mcp_functions.sql',
  'scripts/setup/setup-mcp-database.js',
  'SUPABASE_MCP_README.md',
  'SETUP_MCP_SERVER.md'
];

let allFilesExist = true;

console.log('🔍 Checking required files...\n');

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n');

// Check package.json scripts
const packageJson = require('./package.json');
const requiredScripts = ['mcp:start', 'mcp:dev', 'mcp:test', 'mcp:setup'];

console.log('🔍 Checking package.json scripts...\n');

requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ ${script} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n');

if (allFilesExist) {
  console.log('🎉 All MCP server files and configurations are in place!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Run "npm run mcp:setup" to set up database functions');
  console.log('   2. Run "npm run mcp:dev" to start the MCP server');
  console.log('   3. Run "npm run mcp:test" to test the server');
} else {
  console.log('❌ Some files or configurations are missing.');
  console.log('Please check the setup and ensure all files are created correctly.');
}

console.log('\n📝 Refer to SETUP_MCP_SERVER.md for detailed instructions.');