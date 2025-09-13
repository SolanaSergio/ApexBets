/**
 * Simple test to verify Supabase query caching works
 */

const { cachedSupabaseQuery } = require('../utils/supabase-query-cache.ts');

async function testCache() {
  console.log('Testing Supabase query cache...');
  
  // First call - should execute the query function
  console.log('First call...');
  const result1 = await cachedSupabaseQuery(
    'test_table',
    'select',
    { id: 1 },
    async () => {
      console.log('Executing query function...');
      return { id: 1, name: 'Test' };
    }
  );
  console.log('Result 1:', result1);
  
  // Second call with same parameters - should return cached result
  console.log('Second call (same params)...');
  const result2 = await cachedSupabaseQuery(
    'test_table',
    'select',
    { id: 1 },
    async () => {
      console.log('Executing query function...');
      return { id: 1, name: 'Test Updated' };
    }
  );
  console.log('Result 2:', result2);
  
  // Third call with different parameters - should execute the query function
  console.log('Third call (different params)...');
  const result3 = await cachedSupabaseQuery(
    'test_table',
    'select',
    { id: 2 },
    async () => {
      console.log('Executing query function...');
      return { id: 2, name: 'Test 2' };
    }
  );
  console.log('Result 3:', result3);
  
  console.log('Test completed!');
}

// Run the test
testCache().catch(console.error);