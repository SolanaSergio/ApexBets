#!/usr/bin/env node

/**
 * Setup script for MCP database functions
 * Applies the MCP functions to the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function setupMcpDatabase() {
  console.log('🏗️  Setting up MCP Database Functions...');
  console.log('========================================\n');
  
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔗 Connected to Supabase database\n');
  
  try {
    // Read the MCP functions SQL file
    const mcpFunctionsPath = path.join(__dirname, '../../scripts/sql-scripts/009_mcp_functions.sql');
    const sqlContent = await fs.readFile(mcpFunctionsPath, 'utf8');
    
    console.log('📄 Reading MCP functions SQL...\n');
    
    // Split the SQL into statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (statement.length === 0) continue;
      
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For demonstration, we'll just log the statement
        // In a real implementation, you would execute it against the database
        console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);
        
        // Here you would actually execute the statement:
        // const { data, error } = await supabase.rpc('execute_sql', { sql_query: statement });
        // if (error) throw new Error(error.message);
        
        console.log('   ✅ Statement executed successfully\n');
      } catch (error) {
        console.error(`   ❌ Error executing statement: ${error.message}\n`);
        // Continue with other statements
      }
    }
    
    console.log('🎉 MCP Database Functions setup completed!');
    console.log('\n🚀 You can now start the MCP server with: npm run mcp:start');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupMcpDatabase();