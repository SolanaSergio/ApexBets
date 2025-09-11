/**
 * Test services without server
 */

async function testServices() {
  try {
    console.log('Testing service imports...')
    
    // Test service factory
    const { serviceFactory } = await import('./lib/services/core/service-factory.js')
    console.log('✅ Service factory imported successfully')
    
    // Test basketball service
    const basketballService = serviceFactory.getService('basketball')
    console.log('✅ Basketball service created successfully')
    
    // Test tennis service
    const tennisService = serviceFactory.getService('tennis')
    console.log('✅ Tennis service created successfully')
    
    // Test golf service
    const golfService = serviceFactory.getService('golf')
    console.log('✅ Golf service created successfully')
    
    console.log('All services created successfully!')
    
  } catch (error) {
    console.error('❌ Service test failed:', error)
    console.error('Stack:', error.stack)
  }
}

testServices()
