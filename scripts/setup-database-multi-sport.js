#!/usr/bin/env node

/**
 * Multi-Sport Database Setup Script
 * This script will help you set up the database with the multi-sport schema
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  ApexBets Multi-Sport Database Setup');
console.log('==========================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the ApexBets project root directory');
  process.exit(1);
}

// Check for environment variables
require('dotenv').config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.log('Please make sure your .env.local file contains:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read the multi-sport schema file
const schemaFile = path.join(__dirname, '006_multi_sport_schema.sql');
if (!fs.existsSync(schemaFile)) {
  console.error('❌ Error: Multi-sport schema file not found:', schemaFile);
  process.exit(1);
}

const schema = fs.readFileSync(schemaFile, 'utf8');

console.log('📋 Database Setup Instructions:');
console.log('================================\n');

console.log('1. Go to your Supabase project dashboard:');
console.log('   https://supabase.com/dashboard/projects\n');

console.log('2. Click on "SQL Editor" in the left sidebar\n');

console.log('3. Copy the following SQL and paste it into the SQL editor:\n');
console.log('   (The SQL is quite long, so it will be displayed below)\n');

console.log('4. Click "Run" to execute the SQL\n');

console.log('5. Wait for the execution to complete\n');

console.log('6. Verify the tables were created by checking the "Table Editor"\n');

console.log('📝 SQL Schema to Execute:');
console.log('==========================\n');
console.log(schema);
console.log('\n==========================');
console.log('End of SQL Schema');
console.log('==========================\n');

console.log('✅ After running the SQL, your database will have:');
console.log('   - Multi-sport support for 7 sports');
console.log('   - Sport-specific statistics tables');
console.log('   - Enhanced teams and games tables');
console.log('   - Value betting opportunities table');
console.log('   - League standings table');
console.log('   - Player profiles table');
console.log('   - Sports news table');
console.log('   - Optimized indexes for performance\n');

console.log('🎉 Database setup complete! You can now run the application.');
