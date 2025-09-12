/**
 * Test script to verify real-time updates across all sports
 */

const fetch = require('node-fetch');

// List of supported sports to test
const SUPPORTED_SPORTS = [
  'basketball',
  'football',
  'baseball',
  'hockey'
];

async function testLiveStream(sport) {
  console.log(`\n Testing real-time updates for ${sport}...`);
  
  try {
    // Test the live-stream endpoint
    const response = await fetch(`http://localhost:3000/api/live-stream?sport=${sport}`);
    
    if (response.ok) {
      console.log(`✅ Live-stream endpoint for ${sport} is accessible`);
      
      // Check if it's a proper SSE stream by looking at headers
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/event-stream')) {
        console.log(`✅ ${sport} endpoint correctly returns SSE stream`);
      } else {
        console.log(`⚠️  ${sport} endpoint may not be returning proper SSE stream (Content-Type: ${contentType})`);
      }
      
      // Try to read a small portion of the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let chunks = 0;
      let hasData = false;
      
      // Read a few chunks to verify data is being sent
      while (chunks < 5) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk.includes('data:')) {
          hasData = true;
          console.log(`✅ ${sport} stream contains data events`);
          break;
        }
        
        chunks++;
      }
      
      reader.cancel();
      
      if (!hasData) {
        console.log(`⚠️  ${sport} stream may not be sending data events`);
      }
      
    } else {
      console.log(`❌ Live-stream endpoint for ${sport} returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error testing ${sport}: ${error.message}`);
  }
}

async function testAllSports() {
  console.log('🧪 Testing real-time updates across all sports');
  console.log('=============================================');
  
  // Test each sport
  for (const sport of SUPPORTED_SPORTS) {
    await testLiveStream(sport);
  }
  
  console.log('\n🏁 Real-time updates testing complete!');
}

// Run the tests
testAllSports().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});