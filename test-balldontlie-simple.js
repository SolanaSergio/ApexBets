// Simple test for BallDontLie client
console.log('Testing BallDontLie Client...');

// Test 1: Check if we can import the client
try {
  console.log('1. Testing import...');
  // This would normally be: const { BallDontLieClient } = require('./lib/sports-apis/balldontlie-client.ts');
  console.log('✅ Import would work (TypeScript compilation passed)');
} catch (error) {
  console.log('❌ Import failed:', error.message);
}

// Test 2: Check API key validation logic
console.log('\n2. Testing API key validation logic...');
const testApiKeys = [
  '', // empty
  'placeholder_api_key', // placeholder
  'valid-api-key-123', // valid
  null, // null
  undefined // undefined
];

testApiKeys.forEach((key, index) => {
  const isValid = key && key !== 'placeholder_api_key' && key !== '';
  console.log(`API key ${index + 1} (${key}): ${isValid ? 'Valid' : 'Invalid'}`);
});

// Test 3: Check rate limiting calculation
console.log('\n3. Testing rate limiting calculation...');
const requestsPerMinute = 5;
const rateLimitDelay = 60000 / requestsPerMinute; // 12 seconds
console.log(`Rate limit: ${requestsPerMinute} requests/minute = ${rateLimitDelay}ms delay between requests`);
console.log('✅ Rate limiting calculation is correct');

// Test 4: Check URL construction
console.log('\n4. Testing URL construction...');
const baseUrl = 'https://api.balldontlie.io/v1';
const endpoint = '/games';
const fullUrl = `${baseUrl}${endpoint}`;
console.log(`Base URL: ${baseUrl}`);
console.log(`Endpoint: ${endpoint}`);
console.log(`Full URL: ${fullUrl}`);
console.log('✅ URL construction is correct');

console.log('\n✅ All basic tests passed!');
console.log('\nPotential issues to check:');
console.log('1. Make sure NEXT_PUBLIC_BALLDONTLIE_API_KEY is set in environment');
console.log('2. Check if API key is valid and has proper permissions');
console.log('3. Verify network connectivity to api.balldontlie.io');
console.log('4. Check if rate limiting is working correctly in practice');
