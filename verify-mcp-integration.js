/**
 * Simple verification script for MCP integration
 * This script verifies that the MCP client can communicate with the server
 */

const { exec } = require('child_process');

console.log('🔍 Verifying MCP Integration...');
console.log('==============================\n');

// Test 1: Check if MCP server is running
console.log('1️⃣ Checking if MCP server is running...');
exec('curl -s http://localhost:3002/health', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Failed to connect to MCP server');
    console.log('   Please ensure the MCP server is running with: npm run mcp:start');
    return;
  }
  
  try {
    const health = JSON.parse(stdout);
    if (health.status === 'ok') {
      console.log('✅ MCP server is running and healthy\n');
      
      // Test 2: Check project info
      console.log('2️⃣ Checking project information...');
      exec('curl -s http://localhost:3002/project', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Failed to get project info');
          return;
        }
        
        try {
          const project = JSON.parse(stdout);
          console.log(`✅ Project info retrieved successfully`);
          console.log(`   Project ID: ${project.projectId}`);
          console.log(`   URL: ${project.url}\n`);
          
          // Test 3: List tables
          console.log('3️⃣ Checking database tables...');
          exec('curl -s http://localhost:3002/tables', (error, stdout, stderr) => {
            if (error) {
              console.log('❌ Failed to list tables');
              return;
            }
            
            try {
              const tables = JSON.parse(stdout);
              console.log(`✅ Successfully retrieved table information`);
              console.log(`   Tables found: ${tables.tables ? tables.tables.length : 0}\n`);
              
              console.log('🎉 All MCP integration checks passed!');
              console.log('🚀 Your MCP integration is working correctly!');
              console.log('\n📝 Next steps:');
              console.log('   - Use the MCP client functions in your application');
              console.log('   - Check out the API endpoint at /api/mcp-test');
              console.log('   - Refer to MCP_INTEGRATION_GUIDE.md for detailed usage');
            } catch (parseError) {
              console.log('❌ Failed to parse tables response');
            }
          });
        } catch (parseError) {
          console.log('❌ Failed to parse project info response');
        }
      });
    } else {
      console.log('❌ MCP server is not healthy');
    }
  } catch (parseError) {
    console.log('❌ Failed to parse health check response');
  }
});