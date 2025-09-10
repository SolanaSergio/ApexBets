require('dotenv').config({ path: '.env.local' });
const https = require('https');

function testOddsAPIWithQuery() {
  const apiKey = process.env.ODDS_API_KEY;
  console.log('Testing with API key as query parameter:', apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET');
  
  const options = {
    hostname: 'api.the-odds-api.com',
    port: 443,
    path: `/v4/sports?apiKey=${apiKey}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      
      if (res.statusCode === 200) {
        try {
          const sports = JSON.parse(data);
          console.log('✅ Success! Found sports:', sports.length);
          console.log('First few sports:', sports.slice(0, 3).map(s => s.key));
        } catch (e) {
          console.log('❌ JSON parse error:', e.message);
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
  });
  
  req.end();
}

testOddsAPIWithQuery();
