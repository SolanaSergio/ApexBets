
const { productionSupabaseClient } = require('./lib/supabase/production-client');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const status = productionSupabaseClient.isConnected();
    console.log('Connection Status:', status);
    
    // Test SQL execution
    const result = await productionSupabaseClient.executeSQL('SELECT 1 as test');
    console.log('SQL Test Result:', result);
    
    // Test table listing
    const tables = await productionSupabaseClient.getAllTables();
    console.log('Available Tables:', tables);
    
    console.log('✅ Database connection test completed successfully');
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testConnection();
