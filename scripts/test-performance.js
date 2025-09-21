#!/usr/bin/env node

/**
 * Performance Testing Script
 * Tests all optimized endpoints and measures performance improvements
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

class PerformanceTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const request = http.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          resolve({
            url,
            statusCode: response.statusCode,
            responseTime,
            dataLength: data.length,
            success: response.statusCode >= 200 && response.statusCode < 300,
            data: data
          });
        });
      });
      
      request.on('error', (error) => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        reject({
          url,
          error: error.message,
          responseTime,
          success: false
        });
      });
      
      request.setTimeout(TEST_TIMEOUT, () => {
        request.destroy();
        reject({
          url,
          error: 'Request timeout',
          responseTime: TEST_TIMEOUT,
          success: false
        });
      });
    });
  }

  async testEndpoint(name, url, expectedMaxTime = 10000) {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   URL: ${url}`);
    
    try {
      const result = await this.makeRequest(url);
      
      if (result.success) {
        const status = result.responseTime <= expectedMaxTime ? '✅ PASS' : '⚠️  SLOW';
        console.log(`   ${status} - ${result.responseTime}ms (expected: <${expectedMaxTime}ms)`);
        console.log(`   Status: ${result.statusCode}, Data Length: ${result.dataLength} bytes`);
        
        this.results.push({
          name,
          url,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          success: true,
          dataLength: result.dataLength,
          withinExpectedTime: result.responseTime <= expectedMaxTime
        });
      } else {
        console.log(`   ❌ FAIL - ${result.responseTime}ms`);
        console.log(`   Status: ${result.statusCode}`);
        
        this.errors.push({
          name,
          url,
          responseTime: result.responseTime,
          statusCode: result.statusCode,
          success: false
        });
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.responseTime || 0}ms`);
      console.log(`   Error: ${error.error || error.message}`);
      
      this.errors.push({
        name,
        url,
        responseTime: error.responseTime || 0,
        error: error.error || error.message,
        success: false
      });
    }
  }

  async runAllTests() {
    console.log('🚀 ApexBets Performance Testing');
    console.log('================================\n');
    console.log('Testing all optimized endpoints...\n');

    // Test basic health endpoint
    await this.testEndpoint('Health Check', `${BASE_URL}/api/health`, 1000);

    // Test live updates endpoint
    await this.testEndpoint('Live Updates (All Sports)', `${BASE_URL}/api/live-updates?sport=all&real=true`, 8000);
    
    // Test specific sport
    await this.testEndpoint('Live Updates (Basketball)', `${BASE_URL}/api/live-updates?sport=basketball&real=true`, 6000);

    // Test analytics
    await this.testEndpoint('Analytics Stats', `${BASE_URL}/api/analytics/stats?sport=all`, 5000);

    // Test predictions
    await this.testEndpoint('Predictions', `${BASE_URL}/api/predictions?sport=all&limit=10`, 6000);

    // Test odds
    await this.testEndpoint('Odds Data', `${BASE_URL}/api/odds?sport=all`, 8000);

    // Test sports data
    await this.testEndpoint('Sports Data', `${BASE_URL}/api/sports`, 3000);

    // Test main page
    await this.testEndpoint('Main Page', `${BASE_URL}/`, 3000);

    // Test real-time stream (quick test)
    console.log(`\n🧪 Testing Real-time Stream (Quick Test)...`);
    console.log(`   URL: ${BASE_URL}/api/live-stream?sport=basketball`);
    try {
      const streamResult = await this.makeRequest(`${BASE_URL}/api/live-stream?sport=basketball`);
      if (streamResult.success) {
        console.log(`   ✅ PASS - Stream connection established`);
        console.log(`   Status: ${streamResult.statusCode}, Data Length: ${streamResult.dataLength} bytes`);
      } else {
        console.log(`   ❌ FAIL - Stream connection failed`);
      }
    } catch (error) {
      console.log(`   ⚠️  STREAM - ${error.error || 'Connection test completed'}`);
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('==========================\n');

    const totalTests = this.results.length + this.errors.length;
    const successfulTests = this.results.length;
    const failedTests = this.errors.length;
    const averageResponseTime = this.results.length > 0 
      ? Math.round(this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length)
      : 0;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Average Response Time: ${averageResponseTime}ms\n`);

    if (this.results.length > 0) {
      console.log('✅ Successful Tests:');
      this.results.forEach(result => {
        const status = result.withinExpectedTime ? '✅' : '⚠️';
        console.log(`   ${status} ${result.name}: ${result.responseTime}ms (${result.statusCode})`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Failed Tests:');
      this.errors.forEach(error => {
        console.log(`   ❌ ${error.name}: ${error.error || `Status ${error.statusCode}`} (${error.responseTime}ms)`);
      });
    }

    // Performance analysis
    console.log('\n📈 Performance Analysis:');
    
    const slowTests = this.results.filter(r => !r.withinExpectedTime);
    if (slowTests.length > 0) {
      console.log(`   ⚠️  ${slowTests.length} tests exceeded expected response time:`);
      slowTests.forEach(test => {
        console.log(`      - ${test.name}: ${test.responseTime}ms`);
      });
    } else {
      console.log('   ✅ All tests within expected response times');
    }

    const fastTests = this.results.filter(r => r.responseTime < 2000);
    console.log(`   🚀 ${fastTests.length} tests completed in under 2 seconds`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (averageResponseTime > 5000) {
      console.log('   ⚠️  Average response time is high - consider additional optimizations');
    } else if (averageResponseTime < 3000) {
      console.log('   ✅ Excellent performance! Response times are very good');
    } else {
      console.log('   ✅ Good performance! Response times are acceptable');
    }

    if (failedTests > 0) {
      console.log('   🔧 Fix failed endpoints before deploying to production');
    }

    if (slowTests.length > 0) {
      console.log('   🔧 Optimize slow endpoints for better user experience');
    }

    console.log('\n✨ Performance testing complete!');
  }
}

// Run the tests
const tester = new PerformanceTester();
tester.runAllTests().catch(console.error);
