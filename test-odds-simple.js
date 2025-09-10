require('dotenv').config({ path: '.env.local' });

async function testOddsAPISimple() {
  const apiKey = process.env.ODDS_API_KEY;
  console.log('API Key loaded:', apiKey ? 'YES' : 'NO');
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  
  if (!apiKey) {
    console.log('❌ No API key found');
    return;
  }
  
  try {
    // Test with a simple GET request
    const url = 'https://api.the-odds-api.com/v4/sports';
    console.log('\nTesting URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Found sports:', data.length);
      console.log('First few sports:', data.slice(0, 3).map(s => ({ key: s.key, title: s.title })));
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testOddsAPISimple();
