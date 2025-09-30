#!/usr/bin/env node

/**
 * Deploy Supabase Edge Function
 * Handles deployment with proper error checking and validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Supabase CLI is installed
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    log('Supabase CLI is installed', 'success');
  } catch (error) {
    log('Supabase CLI is not installed. Please install it first:', 'error');
    log('npm install -g supabase', 'info');
    process.exit(1);
  }
  
  // Check if we're in a Supabase project
  if (!fs.existsSync('supabase/config.toml')) {
    log('Not in a Supabase project directory. Please run this from your project root.', 'error');
    process.exit(1);
  }
  
  // Check if Edge Function exists
  const edgeFunctionPath = 'supabase/functions/sync-sports-data';
  if (!fs.existsSync(edgeFunctionPath)) {
    log('Edge Function not found. Please ensure the function exists at:', 'error');
    log(edgeFunctionPath, 'info');
    process.exit(1);
  }
  
  log('All prerequisites met', 'success');
}

function validateEdgeFunction() {
  log('Validating Edge Function...');
  
  const functionPath = 'supabase/functions/sync-sports-data/index.ts';
  if (!fs.existsSync(functionPath)) {
    log('Edge Function index.ts not found', 'error');
    process.exit(1);
  }
  
  // Check for required files
  const requiredFiles = [
    'supabase/functions/sync-sports-data/index.ts',
    'supabase/functions/sync-sports-data/deno.json'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`Required file missing: ${file}`, 'error');
      process.exit(1);
    }
  }
  
  log('Edge Function validation passed', 'success');
}

function deployEdgeFunction() {
  log('Deploying Edge Function...');
  
  try {
    // Deploy the Edge Function
    const output = execSync('supabase functions deploy sync-sports-data', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    log('Edge Function deployed successfully', 'success');
    log('Deployment output:', 'info');
    console.log(output);
    
  } catch (error) {
    log('Failed to deploy Edge Function', 'error');
    log('Error details:', 'error');
    console.error(error.message);
    process.exit(1);
  }
}

function testEdgeFunction() {
  log('Testing Edge Function...');
  
  // Get Supabase project URL
  let supabaseUrl;
  try {
    const config = fs.readFileSync('supabase/config.toml', 'utf8');
    const urlMatch = config.match(/project_id = "([^"]+)"/);
    if (urlMatch) {
      supabaseUrl = `https://${urlMatch[1]}.supabase.co`;
    }
  } catch (error) {
    log('Could not determine Supabase URL from config', 'warning');
  }
  
  if (supabaseUrl) {
    const testUrl = `${supabaseUrl}/functions/v1/sync-sports-data`;
    log(`Test URL: ${testUrl}`, 'info');
    log('You can test the function with:', 'info');
    log(`curl -X POST "${testUrl}" \\`, 'info');
    log('  -H "Authorization: Bearer YOUR_ANON_KEY" \\', 'info');
    log('  -H "Content-Type: application/json" \\', 'info');
    log('  -d \'{"dataTypes": ["games", "teams"]}\'', 'info');
  }
}

function main() {
  log('🚀 Starting Edge Function deployment...');
  
  try {
    checkPrerequisites();
    validateEdgeFunction();
    deployEdgeFunction();
    testEdgeFunction();
    
    log('🎉 Deployment completed successfully!', 'success');
    log('Next steps:', 'info');
    log('1. Set up environment variables in Supabase Dashboard', 'info');
    log('2. Use Supabase Scheduler or invoke the Edge Function directly; external cron is not required', 'info');
    log('3. Test the function manually', 'info');
    
  } catch (error) {
    log('Deployment failed', 'error');
    console.error(error);
    process.exit(1);
  }
}

main();
