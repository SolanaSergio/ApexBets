#!/usr/bin/env node

/**
 * Test script for Supabase MCP Server
 * Verifies that the MCP server is working correctly
 */

const fetch = require('node-fetch');

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3002';

async function testMcpServer() {
  console.log('🧪 Testing Supabase MCP Server...');
  console.log('==================================\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${MCP_SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'ok') {
      console.log('✅ Health check passed\n');
    } else {
      console.log('❌ Health check failed\n');
      return;
    }
    
    // Test 2: Project info
    console.log('2️⃣ Testing project info endpoint...');
    const projectResponse = await fetch(`${MCP_SERVER_URL}/project`);
    const projectData = await projectResponse.json();
    
    if (projectResponse.ok && projectData.url) {
      console.log(`✅ Project info retrieved: ${projectData.projectId}\n`);
    } else {
      console.log('❌ Project info retrieval failed\n');
      return;
    }
    
    // Test 3: List tables
    console.log('3️⃣ Testing tables endpoint...');
    const tablesResponse = await fetch(`${MCP_SERVER_URL}/tables`);
    const tablesData = await tablesResponse.json();
    
    if (tablesResponse.ok) {
      console.log(`✅ Tables retrieved: ${tablesData.tables ? tablesData.tables.length : 0} tables found\n`);
    } else {
      console.log('❌ Tables retrieval failed\n');
      return;
    }
    
    // Test 4: List migrations
    console.log('4️⃣ Testing migrations endpoint...');
    const migrationsResponse = await fetch(`${MCP_SERVER_URL}/migrations`);
    const migrationsData = await migrationsResponse.json();
    
    if (migrationsResponse.ok) {
      console.log(`✅ Migrations retrieved: ${migrationsData.migrations ? migrationsData.migrations.length : 0} migrations found\n`);
    } else {
      console.log('❌ Migrations retrieval failed\n');
      return;
    }
    
    // Test 5: Execute SQL
    console.log('5️⃣ Testing SQL execution endpoint...');
    const sqlResponse = await fetch(`${MCP_SERVER_URL}/execute-sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: 'SELECT 1 as test'
      })
    });
    
    const sqlData = await sqlResponse.json();
    
    if (sqlResponse.ok) {
      console.log('✅ SQL execution test passed\n');
    } else {
      console.log(`❌ SQL execution test failed: ${sqlData.error}\n`);
      return;
    }
    
    console.log('🎉 All MCP server tests passed!');
    console.log('🚀 You can now use the MCP server to manage your Supabase database cleanly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testMcpServer();