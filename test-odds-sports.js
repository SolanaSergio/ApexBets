require('dotenv').config({ path: '.env.local' });

async function testOddsSports() {
  const apiKey = process.env.ODDS_API_KEY;
  
  try {
    // First get available sports
    const sportsResponse = await fetch('https://api.the-odds-api.com/v4/sports', {
      headers: { 'X-API-Key': apiKey }
    });
    
    if (sportsResponse.ok) {
      const sports = await sportsResponse.json();
      console.log('✅ Sports endpoint working!');
      console.log('Available sports:');
      sports.forEach(sport => {
        console.log(`- ${sport.key}: ${sport.title}`);
      });
      
      // Test odds with a valid sport
      if (sports.length > 0) {
        const testSport = sports[0].key;
        console.log(`\nTesting odds with sport: ${testSport}`);
        
        const oddsResponse = await fetch(`https://api.the-odds-api.com/v4/odds?sport=${testSport}&regions=us&markets=h2h&oddsFormat=american`, {
          headers: { 'X-API-Key': apiKey }
        });
        
        if (oddsResponse.ok) {
          const odds = await oddsResponse.json();
          console.log('✅ Odds endpoint working!');
          console.log('Found odds:', odds.length);
          if (odds.length > 0) {
            console.log('Sample odds:', JSON.stringify(odds[0], null, 2));
          }
        } else {
          console.log('❌ Odds endpoint failed:', oddsResponse.status);
          const errorText = await oddsResponse.text();
          console.log('Error:', errorText);
        }
      }
    } else {
      console.log('❌ Sports endpoint failed:', sportsResponse.status);
      const errorText = await sportsResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testOddsSports();
