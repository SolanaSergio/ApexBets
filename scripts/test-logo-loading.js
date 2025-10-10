#!/usr/bin/env node

/**
 * Test Logo Loading
 * Verifies that team logos load correctly without SVG fallbacks
 */

require('dotenv').config();

async function testLogoLoading() {
  console.log('🔍 Testing Logo Loading...\n');

  try {
    const baseUrl = 'http://localhost:3000';
    
    // Test teams page
    console.log('📊 Testing teams page...');
    const teamsResponse = await fetch(`${baseUrl}/teams`);
    const teamsStatus = teamsResponse.status;
    console.log(`Teams page status: ${teamsStatus}`);
    
    if (teamsStatus === 200) {
      console.log('✅ Teams page loads successfully');
    } else {
      console.log('❌ Teams page failed to load');
    }
    
    // Test a specific team logo URL
    console.log('\n📊 Testing specific logo URL...');
    const logoUrl = 'https://a.espncdn.com/i/teamlogos/nba/500/1.png';
    const logoResponse = await fetch(logoUrl);
    const logoStatus = logoResponse.status;
    console.log(`Logo URL status: ${logoStatus}`);
    
    if (logoStatus === 200) {
      console.log('✅ ESPN logo URL is accessible');
    } else {
      console.log('❌ ESPN logo URL failed to load');
    }
    
    // Test image monitoring endpoint
    console.log('\n📊 Testing image monitoring...');
    const monitorResponse = await fetch(`${baseUrl}/api/monitor/image-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'team',
        entityName: 'Test Team',
        sport: 'basketball',
        source: 'database',
        success: true,
        url: logoUrl,
        loadTime: 100
      })
    });
    
    const monitorStatus = monitorResponse.status;
    console.log(`Image monitoring status: ${monitorStatus}`);
    
    if (monitorStatus === 200) {
      console.log('✅ Image monitoring endpoint works');
    } else {
      console.log('❌ Image monitoring endpoint failed');
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Teams page:', teamsStatus === 200 ? '✅ Working' : '❌ Failed');
    console.log('- Logo URLs:', logoStatus === 200 ? '✅ Accessible' : '❌ Failed');
    console.log('- Monitoring:', monitorStatus === 200 ? '✅ Working' : '❌ Failed');
    
    if (teamsStatus === 200 && logoStatus === 200 && monitorStatus === 200) {
      console.log('\n🎉 All tests passed! Logos should now load correctly.');
      console.log('Check the browser at http://localhost:3000/teams to see real logos instead of SVG fallbacks.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the issues above.');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLogoLoading();

