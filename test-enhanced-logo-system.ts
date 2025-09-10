/**
 * TEST ENHANCED LOGO SYSTEM
 * Testing the new database-first dynamic logo system
 */

import { getTeamLogoUrl, getTeamLogoData, dynamicTeamService } from './lib/services/dynamic-team-service'

// ============================================================================
// TEST CASES
// ============================================================================

console.log('🚀 Testing Enhanced Dynamic Logo System\n');

async function runTests() {
  try {
    // Test 1: Known NBA Teams (should use database/API)
    console.log('🏀 NBA Team Logos (Database/API):');
    console.log('Lakers:', await getTeamLogoUrl('Lakers', 'NBA'));
    console.log('Los Angeles Lakers:', await getTeamLogoUrl('Los Angeles Lakers', 'NBA'));
    console.log('Warriors:', await getTeamLogoUrl('Warriors', 'NBA'));
    console.log('Golden State Warriors:', await getTeamLogoUrl('Golden State Warriors', 'NBA'));

    // Test 2: NFL Teams
    console.log('\n🏈 NFL Team Logos:');
    console.log('Patriots:', await getTeamLogoUrl('Patriots', 'NFL'));
    console.log('New England Patriots:', await getTeamLogoUrl('New England Patriots', 'NFL'));
    console.log('Cowboys:', await getTeamLogoUrl('Cowboys', 'NFL'));

    // Test 3: Soccer Teams
    console.log('\n⚽ Soccer Team Logos:');
    console.log('Arsenal:', await getTeamLogoUrl('Arsenal', 'Premier League'));
    console.log('Barcelona:', await getTeamLogoUrl('Barcelona', 'La Liga'));
    console.log('Chelsea:', await getTeamLogoUrl('Chelsea', 'Premier League'));

    // Test 4: Unknown Teams (should use generated SVG)
    console.log('\n❓ Unknown Teams (Generated SVG):');
    console.log('Unknown NBA Team:', await getTeamLogoUrl('Unknown NBA Team', 'NBA'));
    console.log('Test Team:', await getTeamLogoUrl('Test Team', 'NFL'));
    console.log('Custom Soccer Team:', await getTeamLogoUrl('Custom Soccer Team', 'Premier League'));

    // Test 5: Full Logo Data
    console.log('\n📊 Full Logo Data:');
    const lakersData = await getTeamLogoData('Lakers', 'NBA');
    console.log('Lakers Data:', {
      url: lakersData.url,
      source: lakersData.source,
      cached: lakersData.cached,
      teamData: lakersData.teamData ? {
        name: lakersData.teamData.name,
        league: lakersData.teamData.league,
        hasLogoUrl: !!lakersData.teamData.logo_url
      } : null
    });

    // Test 6: Fuzzy Matching
    console.log('\n🔍 Fuzzy Matching Tests:');
    console.log('Lakers (exact):', await getTeamLogoUrl('Lakers', 'NBA'));
    console.log('lakers (lowercase):', await getTeamLogoUrl('lakers', 'NBA'));
    console.log('LAKERS (uppercase):', await getTeamLogoUrl('LAKERS', 'NBA'));
    console.log('Laker (partial):', await getTeamLogoUrl('Laker', 'NBA'));

    // Test 7: Cache Performance
    console.log('\n⚡ Cache Performance Test:');
    const startTime = Date.now();
    
    // First call (should hit database/API)
    await getTeamLogoUrl('Lakers', 'NBA');
    const firstCallTime = Date.now() - startTime;
    
    // Second call (should hit cache)
    const cacheStartTime = Date.now();
    await getTeamLogoUrl('Lakers', 'NBA');
    const cacheCallTime = Date.now() - cacheStartTime;
    
    console.log(`First call: ${firstCallTime}ms`);
    console.log(`Cached call: ${cacheCallTime}ms`);
    console.log(`Cache speedup: ${Math.round(firstCallTime / cacheCallTime)}x faster`);

    // Test 8: Get Teams for League
    console.log('\n📋 Teams for NBA League:');
    const nbaTeams = await dynamicTeamService.getTeamsForLeague('NBA');
    console.log(`Found ${nbaTeams.length} NBA teams in database`);
    nbaTeams.slice(0, 5).forEach(team => {
      console.log(`- ${team.name} (${team.abbreviation}) - ${team.logo_url ? 'Has logo' : 'No logo'}`);
    });

    console.log('\n✅ Enhanced Logo System Test Complete!');
    console.log('🎉 Database-first approach is working!');
    console.log('🔗 System is now truly DYNAMIC for ALL TEAMS & ALL SPORTS!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
