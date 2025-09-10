#!/usr/bin/env node

/**
 * Complete ApexBets Setup Script
 * This script will guide you through the entire setup process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ApexBets Complete Setup Script');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the ApexBets project root directory');
  process.exit(1);
}

// Step 1: Check Node.js version
console.log('📋 Step 1: Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Error: Node.js 18+ is required. Current version:', nodeVersion);
  console.log('Please update Node.js from https://nodejs.org/');
  process.exit(1);
}
console.log('✅ Node.js version:', nodeVersion);

// Step 2: Check for .env.local file
console.log('\n📋 Step 2: Checking environment configuration...');
if (!fs.existsSync('.env.local')) {
  if (fs.existsSync('env.example')) {
    console.log('📝 Creating .env.local from env.example...');
    fs.copyFileSync('env.example', '.env.local');
    console.log('✅ Created .env.local file');
    console.log('⚠️  Please edit .env.local with your actual API keys');
  } else {
    console.error('❌ Error: env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env.local file exists');
}

// Step 3: Install dependencies
console.log('\n📋 Step 3: Installing dependencies...');
try {
  console.log('Installing npm packages...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  process.exit(1);
}

// Step 4: Check environment variables
console.log('\n📋 Step 4: Checking environment variables...');
require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_'));

if (missingVars.length > 0) {
  console.log('⚠️  Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please update your .env.local file with actual values:');
  console.log('   1. Go to https://supabase.com');
  console.log('   2. Create a new project');
  console.log('   3. Go to Settings > API');
  console.log('   4. Copy your project URL and keys');
  console.log('   5. Update .env.local with the actual values');
  console.log('\nPress Enter when you have updated the environment variables...');
  
  // Wait for user input
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise(resolve => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

// Step 5: Test database connection
console.log('\n📋 Step 5: Testing database connection...');
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Test connection
  const { data, error } = await supabase.from('teams').select('count').limit(1);
  if (error) {
    console.log('⚠️  Database connection test failed:', error.message);
    console.log('This is normal if the database schema hasn\'t been set up yet.');
  } else {
    console.log('✅ Database connection successful');
  }
} catch (error) {
  console.log('⚠️  Database connection test failed:', error.message);
  console.log('This is normal if the database schema hasn\'t been set up yet.');
}

// Step 6: Run database setup
console.log('\n📋 Step 6: Setting up database schema...');
console.log('📝 Please run the following SQL in your Supabase SQL editor:');
console.log('   1. Go to your Supabase project dashboard');
console.log('   2. Click on "SQL Editor" in the left sidebar');
console.log('   3. Copy and paste the contents of scripts/006_multi_sport_schema.sql');
console.log('   4. Click "Run" to execute the SQL');
console.log('\nPress Enter when you have set up the database schema...');

await new Promise(resolve => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', () => {
    rl.close();
    resolve();
  });
});

// Step 7: Test the application
console.log('\n📋 Step 7: Testing the application...');
console.log('🚀 Starting development server...');
console.log('   The server will start on http://localhost:3000');
console.log('   Press Ctrl+C to stop the server');
console.log('\n📝 Test these URLs in your browser:');
console.log('   - http://localhost:3000 (main website)');
console.log('   - http://localhost:3000/api/health (health check)');
console.log('   - http://localhost:3000/api/debug/external-apis (API test)');
console.log('   - http://localhost:3000/api/games (games data)');
console.log('   - http://localhost:3000/api/teams (teams data)');
console.log('\n🎉 Setup complete! Your ApexBets website is ready to use!');

// Start the development server
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Error starting development server:', error.message);
  console.log('\nYou can start the server manually with: npm run dev');
}
