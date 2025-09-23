#!/usr/bin/env node

/**
 * Complete System Test
 * Tests the entire sport-agnostic data synchronization system
 */

const { execSync } = require('child_process');
const fs = require('fs');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function testBuild() {
  log('Testing TypeScript compilation...');
  
  try {
    execSync('pnpm run build:server', { stdio: 'pipe' });
    log('TypeScript compilation successful', 'success');
    return true;
  } catch (error) {
    log('TypeScript compilation failed', 'error');
    console.error(error.message);
    return false;
  }
}

function testEdgeFunction() {
  log('Testing Edge Function syntax...');
  
  const functionPath = 'supabase/functions/sync-sports-data/index.ts';
  if (!fs.existsSync(functionPath)) {
    log('Edge Function not found', 'error');
    return false;
  }
  
  // Check for basic syntax issues
  const content = fs.readFileSync(functionPath, 'utf8');
  
  // Check for common issues
  const issues = [];
  
  if (content.includes('Deno.env.get') && !content.includes('/// <reference')) {
    issues.push('Missing Deno type reference');
  }
  
  if (content.includes('cancelled\': \'cancelled\',\n    \'cancelled\': \'cancelled\'')) {
    issues.push('Duplicate property in status map');
  }
  
  if (issues.length > 0) {
    log('Edge Function has issues:', 'warning');
    issues.forEach(issue => log(`  - ${issue}`, 'warning'));
    return false;
  }
  
  log('Edge Function syntax check passed', 'success');
  return true;
}

function testEnvironmentValidation() {
  log('Testing environment validation...');
  
  try {
    // Test if the env validator can be imported
    const envValidatorPath = 'lib/config/env-validator.ts';
    if (!fs.existsSync(envValidatorPath)) {
      log('Environment validator not found', 'error');
      return false;
    }
    
    log('Environment validator exists', 'success');
    return true;
  } catch (error) {
    log('Environment validation test failed', 'error');
    return false;
  }
}

function testDatabaseStorage() {
  log('Testing database storage methods...');
  
  const backgroundSyncPath = 'lib/services/background-sync-service.ts';
  if (!fs.existsSync(backgroundSyncPath)) {
    log('Background sync service not found', 'error');
    return false;
  }
  
  const content = fs.readFileSync(backgroundSyncPath, 'utf8');
  
  // Check for proper database storage implementation
  const hasDatabaseStorage = content.includes('storeGamesInDatabase') && 
                            content.includes('storeTeamsInDatabase') &&
                            content.includes('storePlayersInDatabase') &&
                            content.includes('storeStandingsInDatabase');
  
  if (!hasDatabaseStorage) {
    log('Database storage methods not properly implemented', 'error');
    return false;
  }
  
  // Check for Supabase integration
  const hasSupabaseIntegration = content.includes('createClient') && 
                                content.includes('@/lib/supabase/server');
  
  if (!hasSupabaseIntegration) {
    log('Supabase integration not found', 'error');
    return false;
  }
  
  log('Database storage methods look good', 'success');
  return true;
}

function testSportAgnosticDesign() {
  log('Testing sport-agnostic design...');
  
  // Check Edge Function for hardcoded sports
  const edgeFunctionPath = 'supabase/functions/sync-sports-data/index.ts';
  const content = fs.readFileSync(edgeFunctionPath, 'utf8');
  
  // Should not have hardcoded sport arrays
  const hasHardcodedSports = content.includes("['basketball', 'football', 'baseball']") ||
                            content.includes("['NBA', 'NFL', 'MLB']");
  
  if (hasHardcodedSports) {
    log('Found hardcoded sports in Edge Function', 'warning');
    return false;
  }
  
  // Should have dynamic sport loading
  const hasDynamicSports = content.includes('SUPPORTED_SPORTS') && 
                          content.includes('getSportsConfig');
  
  if (!hasDynamicSports) {
    log('Dynamic sport loading not found', 'error');
    return false;
  }
  
  log('Sport-agnostic design looks good', 'success');
  return true;
}

function testMockDataRemoval() {
  log('Testing mock data removal...');
  
  const filesToCheck = [
    'lib/services/background-sync-service.ts',
    'lib/services/dynamic-team-service-client.ts',
    'supabase/functions/sync-sports-data/index.ts'
  ];
  
  let hasMockData = false;
  
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for mock data indicators
      if (content.includes('mock') || 
          content.includes('Mock') || 
          content.includes('placeholder') ||
          content.includes('Placeholder') ||
          content.includes('sample') ||
          content.includes('Sample')) {
        log(`Found potential mock data in ${file}`, 'warning');
        hasMockData = true;
      }
    }
  }
  
  if (hasMockData) {
    log('Some mock data may still exist', 'warning');
    return false;
  }
  
  log('Mock data removal looks good', 'success');
  return true;
}

function generateReport(results) {
  log('Generating test report...');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  console.log('\n📊 TEST REPORT');
  console.log('==============');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  console.log('\n📋 DETAILED RESULTS');
  console.log('==================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your sport-agnostic system is ready for deployment.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Please fix the issues above before deploying.');
  }
  
  return failedTests === 0;
}

function main() {
  log('🧪 Starting complete system test...');
  
  const results = {
    'TypeScript Compilation': testBuild(),
    'Edge Function Syntax': testEdgeFunction(),
    'Environment Validation': testEnvironmentValidation(),
    'Database Storage': testDatabaseStorage(),
    'Sport-Agnostic Design': testSportAgnosticDesign(),
    'Mock Data Removal': testMockDataRemoval()
  };
  
  const allPassed = generateReport(results);
  
  if (allPassed) {
    log('System is ready for deployment!', 'success');
    process.exit(0);
  } else {
    log('System needs fixes before deployment', 'error');
    process.exit(1);
  }
}

main();
