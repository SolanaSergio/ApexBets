/**
 * MASTER API TEST RUNNER
 * Runs all API tests and generates comprehensive reports
 * Tests: Health, Rate Limiting, Data Accuracy, and Performance
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import test modules
const comprehensiveTest = require('./api-comprehensive-test');
const rateLimitTest = require('./rate-limit-verification');
const dataAccuracyTest = require('./data-accuracy-validation');

// Test configuration
const TEST_CONFIG = {
  RUN_ALL_TESTS: true,
  RUN_HEALTH_TESTS: true,
  RUN_RATE_LIMIT_TESTS: true,
  RUN_DATA_ACCURACY_TESTS: true,
  DELAY_BETWEEN_TEST_SUITES: 5000, // 5 seconds between test suites
  GENERATE_COMBINED_REPORT: true
};

const masterResults = {
  startTime: null,
  endTime: null,
  testSuites: {},
  summary: {
    totalTestSuites: 0,
    passedTestSuites: 0,
    failedTestSuites: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    criticalIssues: 0,
    warnings: 0
  },
  criticalIssues: [],
  warnings: [],
  recommendations: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
}

async function runHealthTests() {
  logHeader('HEALTH CHECK TESTS');
  
  try {
    log('Running comprehensive API health tests...');
    const startTime = performance.now();
    
    // Run the comprehensive test suite
    await comprehensiveTest.runAllTests();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Read the generated report
    const reportPath = 'tests/api-test-report.json';
    let report = null;
    
    if (fs.existsSync(reportPath)) {
      report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }
    
    masterResults.testSuites.health = {
      name: 'Health Check Tests',
      duration,
      success: report ? report.summary.successRate > 80 : false,
      report,
      timestamp: new Date().toISOString()
    };
    
    if (report) {
      masterResults.summary.totalTests += report.summary.totalTests;
      masterResults.summary.passedTests += report.summary.passedTests;
      masterResults.summary.failedTests += report.summary.failedTests;
      
      if (report.summary.successRate < 80) {
        masterResults.criticalIssues.push(`Health tests success rate too low: ${report.summary.successRate}%`);
        masterResults.summary.criticalIssues++;
      }
    }
    
    log(`Health tests completed in ${Math.round(duration / 1000)}s`, 'success');
    return true;
    
  } catch (error) {
    log(`Health tests failed: ${error.message}`, 'error');
    masterResults.criticalIssues.push(`Health tests failed: ${error.message}`);
    masterResults.summary.criticalIssues++;
    return false;
  }
}

async function runRateLimitTests() {
  logHeader('RATE LIMITING VERIFICATION TESTS');
  
  try {
    log('Running rate limiting verification tests...');
    const startTime = performance.now();
    
    // Run the rate limit test suite
    await rateLimitTest.runRateLimitTests();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Read the generated report
    const reportPath = 'tests/rate-limit-report.json';
    let report = null;
    
    if (fs.existsSync(reportPath)) {
      report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }
    
    masterResults.testSuites.rateLimit = {
      name: 'Rate Limiting Verification Tests',
      duration,
      success: report ? report.summary.complianceRate > 90 : false,
      report,
      timestamp: new Date().toISOString()
    };
    
    if (report) {
      masterResults.summary.totalTests += report.summary.totalTests;
      masterResults.summary.passedTests += report.summary.passedTests;
      masterResults.summary.failedTests += report.summary.failedTests;
      
      if (report.summary.complianceRate < 90) {
        masterResults.criticalIssues.push(`Rate limiting compliance too low: ${report.summary.complianceRate}%`);
        masterResults.summary.criticalIssues++;
      }
      
      if (report.summary.rateLimitViolations > 0) {
        masterResults.warnings.push(`${report.summary.rateLimitViolations} rate limit violations detected`);
        masterResults.summary.warnings++;
      }
    }
    
    log(`Rate limiting tests completed in ${Math.round(duration / 1000)}s`, 'success');
    return true;
    
  } catch (error) {
    log(`Rate limiting tests failed: ${error.message}`, 'error');
    masterResults.criticalIssues.push(`Rate limiting tests failed: ${error.message}`);
    masterResults.summary.criticalIssues++;
    return false;
  }
}

async function runDataAccuracyTests() {
  logHeader('DATA ACCURACY VALIDATION TESTS');
  
  try {
    log('Running data accuracy validation tests...');
    const startTime = performance.now();
    
    // Run the data accuracy test suite
    await dataAccuracyTest.runDataAccuracyTests();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Read the generated report
    const reportPath = 'tests/data-accuracy-report.json';
    let report = null;
    
    if (fs.existsSync(reportPath)) {
      report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }
    
    masterResults.testSuites.dataAccuracy = {
      name: 'Data Accuracy Validation Tests',
      duration,
      success: report ? report.summary.accuracyRate > 85 : false,
      report,
      timestamp: new Date().toISOString()
    };
    
    if (report) {
      masterResults.summary.totalTests += report.summary.totalTests;
      masterResults.summary.passedTests += report.summary.passedTests;
      masterResults.summary.failedTests += report.summary.failedTests;
      
      if (report.summary.accuracyRate < 85) {
        masterResults.criticalIssues.push(`Data accuracy rate too low: ${report.summary.accuracyRate}%`);
        masterResults.summary.criticalIssues++;
      }
      
      if (report.summary.mockDataDetected > 0) {
        masterResults.criticalIssues.push(`${report.summary.mockDataDetected} mock data instances detected`);
        masterResults.summary.criticalIssues++;
      }
      
      if (report.summary.dataAccuracyIssues > 0) {
        masterResults.warnings.push(`${report.summary.dataAccuracyIssues} data accuracy issues found`);
        masterResults.summary.warnings++;
      }
    }
    
    log(`Data accuracy tests completed in ${Math.round(duration / 1000)}s`, 'success');
    return true;
    
  } catch (error) {
    log(`Data accuracy tests failed: ${error.message}`, 'error');
    masterResults.criticalIssues.push(`Data accuracy tests failed: ${error.message}`);
    masterResults.summary.criticalIssues++;
    return false;
  }
}

function generateMasterReport() {
  logHeader('GENERATING MASTER TEST REPORT');
  
  const report = {
    summary: {
      ...masterResults.summary,
      overallSuccess: masterResults.summary.criticalIssues === 0,
      overallSuccessRate: masterResults.summary.totalTests > 0 ? 
        (masterResults.summary.passedTests / masterResults.summary.totalTests * 100).toFixed(2) : 0,
      startTime: masterResults.startTime,
      endTime: masterResults.endTime,
      totalDuration: masterResults.endTime ? 
        new Date(masterResults.endTime) - new Date(masterResults.startTime) : 0
    },
    testSuites: masterResults.testSuites,
    criticalIssues: masterResults.criticalIssues,
    warnings: masterResults.warnings,
    recommendations: generateMasterRecommendations(),
    apiStatus: generateApiStatusSummary()
  };
  
  // Save master report
  const reportPath = 'tests/master-api-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Display summary
  logHeader('MASTER TEST SUMMARY');
  log(`Total Test Suites: ${report.summary.totalTestSuites}`, 'info');
  log(`Passed Test Suites: ${report.summary.passedTestSuites}`, 'success');
  log(`Failed Test Suites: ${report.summary.failedTestSuites}`, report.summary.failedTestSuites > 0 ? 'error' : 'info');
  log(`Total Tests: ${report.summary.totalTests}`, 'info');
  log(`Passed Tests: ${report.summary.passedTests}`, 'success');
  log(`Failed Tests: ${report.summary.failedTests}`, report.summary.failedTests > 0 ? 'error' : 'info');
  log(`Overall Success Rate: ${report.summary.overallSuccessRate}%`, 'info');
  log(`Critical Issues: ${report.summary.criticalIssues}`, report.summary.criticalIssues > 0 ? 'error' : 'info');
  log(`Warnings: ${report.summary.warnings}`, report.summary.warnings > 0 ? 'warning' : 'info');
  log(`Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`, 'info');
  
  if (report.criticalIssues.length > 0) {
    logHeader('CRITICAL ISSUES');
    report.criticalIssues.forEach(issue => log(`  - ${issue}`, 'error'));
  }
  
  if (report.warnings.length > 0) {
    logHeader('WARNINGS');
    report.warnings.forEach(warning => log(`  - ${warning}`, 'warning'));
  }
  
  if (report.recommendations.length > 0) {
    logHeader('RECOMMENDATIONS');
    report.recommendations.forEach(rec => log(`  - ${rec}`, 'info'));
  }
  
  log(`📄 Master report saved to: ${reportPath}`, 'info');
  
  // Generate HTML report
  generateHtmlReport(report);
  
  return report;
}

function generateApiStatusSummary() {
  const status = {};
  
  // Analyze each test suite
  Object.entries(masterResults.testSuites).forEach(([suiteName, suite]) => {
    if (suite.report) {
      if (suiteName === 'health' && suite.report.apiHealth) {
        Object.entries(suite.report.apiHealth).forEach(([apiName, health]) => {
          if (!status[apiName]) status[apiName] = {};
          status[apiName].health = health.healthy;
          status[apiName].responseTime = health.responseTime;
        });
      }
      
      if (suiteName === 'rateLimit' && suite.report.tests) {
        Object.entries(suite.report.tests).forEach(([apiName, test]) => {
          if (!status[apiName]) status[apiName] = {};
          status[apiName].rateLimitCompliant = test.compliant;
        });
      }
      
      if (suiteName === 'dataAccuracy' && suite.report.tests) {
        Object.entries(suite.report.tests).forEach(([apiName, tests]) => {
          if (!status[apiName]) status[apiName] = {};
          if (Array.isArray(tests)) {
            const successCount = tests.filter(t => t.success).length;
            status[apiName].dataAccuracy = (successCount / tests.length * 100).toFixed(2);
          }
        });
      }
    }
  });
  
  return status;
}

function generateMasterRecommendations() {
  const recommendations = [];
  
  // Based on critical issues
  if (masterResults.summary.criticalIssues > 0) {
    recommendations.push('Address all critical issues immediately');
    recommendations.push('Implement proper error handling and fallbacks');
    recommendations.push('Add monitoring and alerting for API failures');
  }
  
  // Based on warnings
  if (masterResults.summary.warnings > 0) {
    recommendations.push('Review and fix all warnings');
    recommendations.push('Implement better data validation');
    recommendations.push('Add comprehensive logging');
  }
  
  // Based on success rates
  if (masterResults.summary.overallSuccessRate < 90) {
    recommendations.push('Improve overall API reliability');
    recommendations.push('Implement retry mechanisms');
    recommendations.push('Add circuit breakers for failing APIs');
  }
  
  // General recommendations
  recommendations.push('Set up automated testing in CI/CD pipeline');
  recommendations.push('Implement API monitoring and alerting');
  recommendations.push('Create API documentation and runbooks');
  recommendations.push('Regular API testing and validation');
  
  return recommendations;
}

function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>API Test Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .issues { background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendations { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>API Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Duration: ${Math.round(report.summary.totalDuration / 1000)}s</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Overall Status</h3>
            <p class="${report.summary.overallSuccess ? 'success' : 'error'}">
                ${report.summary.overallSuccess ? '✅ PASS' : '❌ FAIL'}
            </p>
            <p>Success Rate: ${report.summary.overallSuccessRate}%</p>
        </div>
        <div class="card">
            <h3>Test Suites</h3>
            <p>Total: ${report.summary.totalTestSuites}</p>
            <p class="success">Passed: ${report.summary.passedTestSuites}</p>
            <p class="error">Failed: ${report.summary.failedTestSuites}</p>
        </div>
        <div class="card">
            <h3>Tests</h3>
            <p>Total: ${report.summary.totalTests}</p>
            <p class="success">Passed: ${report.summary.passedTests}</p>
            <p class="error">Failed: ${report.summary.failedTests}</p>
        </div>
        <div class="card">
            <h3>Issues</h3>
            <p class="error">Critical: ${report.summary.criticalIssues}</p>
            <p class="warning">Warnings: ${report.summary.warnings}</p>
        </div>
    </div>
    
    ${report.criticalIssues.length > 0 ? `
    <div class="issues">
        <h3>Critical Issues</h3>
        <ul>
            ${report.criticalIssues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    ${report.warnings.length > 0 ? `
    <div class="warnings">
        <h3>Warnings</h3>
        <ul>
            ${report.warnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    
    <h3>API Status Summary</h3>
    <table>
        <tr>
            <th>API</th>
            <th>Health</th>
            <th>Rate Limit</th>
            <th>Data Accuracy</th>
            <th>Response Time</th>
        </tr>
        ${Object.entries(report.apiStatus).map(([api, status]) => `
        <tr>
            <td>${api}</td>
            <td class="${status.health ? 'success' : 'error'}">${status.health ? '✅' : '❌'}</td>
            <td class="${status.rateLimitCompliant ? 'success' : 'error'}">${status.rateLimitCompliant ? '✅' : '❌'}</td>
            <td>${status.dataAccuracy ? status.dataAccuracy + '%' : 'N/A'}</td>
            <td>${status.responseTime ? Math.round(status.responseTime) + 'ms' : 'N/A'}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>
  `;
  
  const htmlPath = 'tests/api-test-report.html';
  fs.writeFileSync(htmlPath, html);
  log(`📄 HTML report saved to: ${htmlPath}`, 'info');
}

async function runAllTests() {
  logHeader('STARTING COMPREHENSIVE API TESTING SUITE');
  masterResults.startTime = new Date().toISOString();
  
  const testSuites = [];
  
  if (TEST_CONFIG.RUN_HEALTH_TESTS) {
    testSuites.push({ name: 'Health Tests', fn: runHealthTests });
  }
  
  if (TEST_CONFIG.RUN_RATE_LIMIT_TESTS) {
    testSuites.push({ name: 'Rate Limit Tests', fn: runRateLimitTests });
  }
  
  if (TEST_CONFIG.RUN_DATA_ACCURACY_TESTS) {
    testSuites.push({ name: 'Data Accuracy Tests', fn: runDataAccuracyTests });
  }
  
  masterResults.summary.totalTestSuites = testSuites.length;
  
  for (const testSuite of testSuites) {
    try {
      log(`Running ${testSuite.name}...`);
      const success = await testSuite.fn();
      
      if (success) {
        masterResults.summary.passedTestSuites++;
        log(`${testSuite.name} completed successfully`, 'success');
      } else {
        masterResults.summary.failedTestSuites++;
        log(`${testSuite.name} failed`, 'error');
      }
      
      // Delay between test suites
      if (testSuites.indexOf(testSuite) < testSuites.length - 1) {
        log(`Waiting ${TEST_CONFIG.DELAY_BETWEEN_TEST_SUITES / 1000}s before next test suite...`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.DELAY_BETWEEN_TEST_SUITES));
      }
      
    } catch (error) {
      log(`${testSuite.name} failed with error: ${error.message}`, 'error');
      masterResults.summary.failedTestSuites++;
      masterResults.criticalIssues.push(`${testSuite.name}: ${error.message}`);
      masterResults.summary.criticalIssues++;
    }
  }
  
  masterResults.endTime = new Date().toISOString();
  
  // Generate final report
  const report = generateMasterReport();
  
  logHeader('TESTING COMPLETED');
  log(`Overall Status: ${report.summary.overallSuccess ? 'PASS' : 'FAIL'}`, report.summary.overallSuccess ? 'success' : 'error');
  log(`Success Rate: ${report.summary.overallSuccessRate}%`, 'info');
  log(`Critical Issues: ${report.summary.criticalIssues}`, report.summary.criticalIssues > 0 ? 'error' : 'info');
  
  return report;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runHealthTests,
  runRateLimitTests,
  runDataAccuracyTests
};
