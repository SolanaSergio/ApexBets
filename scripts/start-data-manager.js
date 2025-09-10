#!/usr/bin/env node

/**
 * ApexBets Data Manager Startup Script
 * Simple script to start the automated data management system
 */

const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 Starting ApexBets Data Manager...');
console.log('====================================\n');

// Path to the data manager
const dataManagerPath = path.join(__dirname, 'data-services', 'apex-data-manager.js');

// Start the data manager
const dataManager = spawn('node', [dataManagerPath], {
  stdio: 'inherit',
  cwd: __dirname
});

// Handle process events
dataManager.on('close', (code) => {
  console.log(`\n🛑 Data manager exited with code ${code}`);
});

dataManager.on('error', (error) => {
  console.error('❌ Error starting data manager:', error.message);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down data manager...');
  dataManager.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down data manager...');
  dataManager.kill('SIGTERM');
  process.exit(0);
});

console.log('✅ Data manager started successfully');
console.log('   - Press Ctrl+C to stop');
console.log('   - Check logs for data updates\n');
