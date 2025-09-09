#!/usr/bin/env node
/**
 * Test database connection to Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Testing ProjectApex Database Connection');
console.log('='.repeat(50));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('\n📋 Current environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('teams')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Connection test result:', error.message);
      
      if (error.message.includes('relation "teams" does not exist')) {
        console.log('\n📋 Database tables not found. Please run the SQL setup scripts first:');
        console.log('   1. Go to your Supabase Dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Run the scripts from: scripts/run-sql-scripts.md');
        return false;
      }
      
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📊 Connection test data:', data);
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testTables() {
  try {
    console.log('\n🔍 Checking database tables...');
    
    const tables = ['teams', 'games', 'odds', 'player_stats', 'predictions', 'scrape_logs', 'profiles', 'user_alerts'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results[table] = { exists: false, error: error.message };
        } else {
          results[table] = { exists: true, count: count || 0 };
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message };
      }
    }
    
    console.log('\n📋 Table Status:');
    Object.entries(results).forEach(([table, result]) => {
      if (result.exists) {
        console.log(`   ✅ ${table} - ${result.count} records`);
      } else {
        console.log(`   ❌ ${table} - ${result.error}`);
      }
    });
    
    const existingTables = Object.values(results).filter(r => r.exists).length;
    console.log(`\n📊 Summary: ${existingTables}/${tables.length} tables exist`);
    
    return existingTables === tables.length;
    
  } catch (error) {
    console.log('❌ Table check failed:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await testTables();
  }
  
  console.log('\n🎯 Next Steps:');
  if (!connected) {
    console.log('1. Run the SQL setup scripts in your Supabase dashboard');
    console.log('2. Re-run this test: node scripts/test-connection.js');
  } else {
    console.log('1. Your database is ready!');
    console.log('2. Start your Next.js app: pnpm dev');
    console.log('3. Visit: http://localhost:3000');
  }
}

main().catch(console.error);
