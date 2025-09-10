#!/usr/bin/env node

/**
 * Background Service Runner
 * Runs the ApexBets Data Manager in the background
 * Automatically restarts on errors
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ApexBets Background Service...');
console.log('==========================================\n');

class BackgroundService {
  constructor() {
    this.dataManager = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 5000; // 5 seconds
  }

  start() {
    console.log('🔄 Starting data manager...');
    
    this.dataManager = spawn('node', ['data-services/apex-data-manager.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });

    this.dataManager.on('close', (code) => {
      console.log(`\n🛑 Data manager exited with code ${code}`);
      
      if (this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`🔄 Restarting data manager (${this.restartCount}/${this.maxRestarts}) in ${this.restartDelay/1000} seconds...`);
        
        setTimeout(() => {
          this.start();
        }, this.restartDelay);
      } else {
        console.log('❌ Maximum restart attempts reached. Service stopped.');
        process.exit(1);
      }
    });

    this.dataManager.on('error', (error) => {
      console.error('❌ Error starting data manager:', error.message);
    });
  }

  stop() {
    if (this.dataManager) {
      console.log('🛑 Stopping data manager...');
      this.dataManager.kill('SIGTERM');
    }
  }
}

// Create and start the service
const service = new BackgroundService();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down background service...');
  service.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down background service...');
  service.stop();
  process.exit(0);
});

// Start the service
service.start();

console.log('✅ Background service started successfully');
console.log('   - Data manager will restart automatically on errors');
console.log('   - Press Ctrl+C to stop the service');
console.log('   - Check logs for data updates\n');
