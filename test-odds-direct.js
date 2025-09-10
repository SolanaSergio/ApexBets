require('dotenv').config({ path: '.env.local' });

async function testOddsDirect() {
  const apiKey = process.env.ODDS_API_KEY;
  
  try {
    // Test NBA odds
    console.log('Testing NBA odds...');
    const nbaResponse = await fetch(`https://api.the-odds-api.com/v4/odds?sport=basketball_nba&regions=us&markets=h2h&oddsFormat=american&apiKey=${apiKey}`);
    
    console.log('NBA Status:', nbaResponse.status);
    if (nbaResponse.ok) {
      const nbaData = await nbaResponse.json();
      console.log('NBA Odds found:', nbaData.length);
      if (nbaData.length > 0) {
        console.log('Sample NBA odds:', JSON.stringify(nbaData[0], null, 2));
      }
    } else {
      const errorText = await nbaResponse.text();
      console.log('NBA Error:', errorText);
    }
    
    // Test NFL odds
    console.log('\nTesting NFL odds...');
    const nflResponse = await fetch(`https://api.the-odds-api.com/v4/odds?sport=americanfootball_nfl&regions=us&markets=h2h&oddsFormat=american&apiKey=${apiKey}`);
    
    console.log('NFL Status:', nflResponse.status);
    if (nflResponse.ok) {
      const nflData = await nflResponse.json();
      console.log('NFL Odds found:', nflData.length);
      if (nflData.length > 0) {
        console.log('Sample NFL odds:', JSON.stringify(nflData[0], null, 2));
      }
    } else {
      const errorText = await nflResponse.text();
      console.log('NFL Error:', errorText);
    }
    
    // Test MLB odds
    console.log('\nTesting MLB odds...');
    const mlbResponse = await fetch(`https://api.the-odds-api.com/v4/odds?sport=baseball_mlb&regions=us&markets=h2h&oddsFormat=american&apiKey=${apiKey}`);
    
    console.log('MLB Status:', mlbResponse.status);
    if (mlbResponse.ok) {
      const mlbData = await mlbResponse.json();
      console.log('MLB Odds found:', mlbData.length);
      if (mlbData.length > 0) {
        console.log('Sample MLB odds:', JSON.stringify(mlbData[0], null, 2));
      }
    } else {
      const errorText = await mlbResponse.text();
      console.log('MLB Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testOddsDirect();
