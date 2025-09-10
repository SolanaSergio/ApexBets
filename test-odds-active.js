require('dotenv').config({ path: '.env.local' });

async function testActiveOdds() {
  const apiKey = process.env.ODDS_API_KEY;
  
  try {
    // Get all sports first
    const sportsResponse = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`);
    const sports = await sportsResponse.json();
    
    console.log('Testing odds for all active sports...\n');
    
    // Test a few different sports to see which ones have active odds
    const testSports = [
      'basketball_nba',
      'americanfootball_nfl', 
      'baseball_mlb',
      'icehockey_nhl',
      'soccer_epl',
      'soccer_mls'
    ];
    
    for (const sport of testSports) {
      try {
        console.log(`Testing ${sport}...`);
        const response = await fetch(`https://api.the-odds-api.com/v4/odds?sport=${sport}&regions=us&markets=h2h&oddsFormat=american&apiKey=${apiKey}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${sport}: ${data.length} odds found`);
          if (data.length > 0) {
            console.log(`   Sample: ${data[0].home_team} vs ${data[0].away_team}`);
          }
        } else {
          console.log(`❌ ${sport}: ${response.status} - No active games`);
        }
      } catch (error) {
        console.log(`❌ ${sport}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testActiveOdds();
