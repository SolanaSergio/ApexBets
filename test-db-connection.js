
const { supabaseMCPClient } = require('./lib/supabase/mcp-client');

async function testConnection() {
  try {
    console.log('Testing MCP database connection...');
    
    // Test basic connection
    const status = supabaseMCPClient.getConnectionStatus();
    console.log('Connection Status:', status);
    
    // Test SQL execution
    const result = await supabaseMCPClient.executeSQL('SELECT 1 as test');
    console.log('SQL Test Result:', result);
    
    // Test table listing
    const tables = await supabaseMCPClient.listTables(['public']);
    console.log('Available Tables:', tables);
    
    console.log('✅ Database connection test completed successfully');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testConnection();
