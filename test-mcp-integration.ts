/**
 * Test script to verify MCP client integration
 * This script tests the MCP client functions
 */

import { 
  executeSql, 
  listTables, 
  getTableSchema, 
  getProjectInfo,
  listMigrations
} from './lib/supabase/mcp-client';

async function testMcpIntegration() {
  console.log('🧪 Testing MCP Client Integration...');
  console.log('====================================\n');
  
  try {
    // Test 1: Get project info
    console.log('1️⃣ Testing project info retrieval...');
    const projectInfo = await getProjectInfo();
    console.log('✅ Project info retrieved:', projectInfo);
    console.log('');
    
    // Test 2: List tables
    console.log('2️⃣ Testing table listing...');
    const tables = await listTables();
    console.log(`✅ Found ${tables.tables?.length || 0} tables`);
    if (tables.tables && tables.tables.length > 0) {
      console.log('   First few tables:', tables.tables.slice(0, 3).map((t: any) => t.table_name));
    }
    console.log('');
    
    // Test 3: Get schema for a specific table (if any exist)
    if (tables.tables && tables.tables.length > 0) {
      const firstTable = tables.tables[0].table_name;
      console.log(`3️⃣ Testing schema retrieval for table: ${firstTable}...`);
      const schema = await getTableSchema(firstTable);
      console.log(`✅ Schema retrieved for ${firstTable}`);
      console.log(`   Columns: ${schema.columns?.length || 0}`);
      console.log('');
    }
    
    // Test 4: List migrations
    console.log('4️⃣ Testing migration listing...');
    const migrations = await listMigrations();
    console.log(`✅ Found ${migrations.migrations?.length || 0} migrations`);
    if (migrations.migrations && migrations.migrations.length > 0) {
      console.log('   First few migrations:', migrations.migrations.slice(0, 3).map((m: any) => m.name));
    }
    console.log('');
    
    // Test 5: Execute a simple SQL query
    console.log('5️⃣ Testing SQL execution...');
    const result = await executeSql('SELECT 1 as test_value');
    console.log('✅ SQL executed successfully');
    console.log('   Result:', result);
    console.log('');
    
    console.log('🎉 All MCP integration tests passed!');
    console.log('🚀 The MCP client is properly integrated and working!');
    
  } catch (error) {
    console.error('❌ MCP integration test failed:', error);
  }
}

// Run the test
testMcpIntegration();