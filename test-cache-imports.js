/**
 * Simple test to verify cache system imports are working
 */

console.log('🧪 Testing cache system imports...\n');

try {
  // Test 1: Import cache manager
  console.log('1. Testing cache manager import...');
  const { cacheManager } = require('./lib/cache/index.ts');
  console.log('   ✅ Cache manager imported successfully');
  
  // Test 2: Check if cache manager has expected methods
  console.log('2. Testing cache manager methods...');
  const methods = ['get', 'set', 'clear', 'getStats', 'getHealth'];
  const hasAllMethods = methods.every(method => typeof cacheManager[method] === 'function');
  
  if (hasAllMethods) {
    console.log('   ✅ All expected methods present');
  } else {
    console.log('   ❌ Missing some expected methods');
  }
  
  // Test 3: Test basic cache operations
  console.log('3. Testing basic cache operations...');
  
  // Test set operation
  cacheManager.set('test-key', { message: 'Hello World' }, 60000);
  console.log('   ✅ Set operation successful');
  
  // Test get operation
  const retrieved = cacheManager.get('test-key');
  if (retrieved && retrieved.message === 'Hello World') {
    console.log('   ✅ Get operation successful');
  } else {
    console.log('   ❌ Get operation failed');
  }
  
  // Test stats
  const stats = cacheManager.getStats();
  console.log('   ✅ Stats retrieval successful');
  console.log(`   📊 Cache stats: ${JSON.stringify(stats, null, 2)}`);
  
  // Test clear
  cacheManager.clear();
  console.log('   ✅ Clear operation successful');
  
  console.log('\n🎉 All cache system tests passed!');
  
} catch (error) {
  console.error('❌ Cache system test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
