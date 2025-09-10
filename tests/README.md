# Comprehensive Testing Suite for ApexBets

This directory contains a comprehensive testing suite that covers all areas of functionality in the ApexBets sports analytics platform. All tests use **real NBA data** and **actual API calls** - **NO MOCK DATA**.

## 🧪 Test Structure

```
tests/
├── unit/                           # Unit tests for individual components
│   └── api/                       # API route unit tests
├── integration/                   # Integration tests for services and APIs
│   ├── api/                      # API integration tests
│   │   ├── comprehensive-*.test.ts # Comprehensive API tests
│   │   ├── games.test.ts         # Games API tests
│   │   ├── teams.test.ts         # Teams API tests
│   │   └── predictions.test.ts   # Predictions API tests
│   ├── services/                 # Service integration tests
│   ├── performance/              # Performance tests
│   └── security/                 # Security tests
├── e2e/                          # End-to-end tests
│   ├── comprehensive-*.spec.ts   # Comprehensive E2E tests
│   ├── dashboard.spec.ts         # Dashboard E2E tests
│   ├── games.spec.ts             # Games page E2E tests
│   └── teams.spec.ts             # Teams page E2E tests
├── run-comprehensive-tests.js    # Comprehensive test runner
├── TESTING_STRATEGY.md           # Testing strategy documentation
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Dev server running (`npm run dev`)
- All dependencies installed (`npm install`)

### Run All Tests
```bash
# Run the comprehensive test suite with real NBA data
node tests/run-comprehensive-tests.js

# Or run individual test types
npm run test              # Unit tests
npm run test:watch        # Unit tests in watch mode
npm run test:coverage     # Unit tests with coverage
npm run test:e2e          # End-to-end tests
npm run test:e2e:ui       # E2E tests with UI
npm run test:all          # All tests

# Run specific comprehensive tests
npm run test -- --testPathPattern=comprehensive  # Comprehensive API tests
npm run test -- --testPathPattern=integration    # Integration tests
npm run test -- --testPathPattern=e2e            # E2E tests
```

## 📋 Test Categories

### 1. Unit Tests (`tests/unit/`)
- **API Routes**: Individual endpoint testing
- **Components**: React component testing
- **Utilities**: Helper function testing

### 2. Integration Tests (`tests/integration/`)
- **API Integration**: Full API workflow testing
- **Service Integration**: Service layer testing
- **Performance**: Response time and load testing
- **Security**: Security vulnerability testing

### 3. End-to-End Tests (`tests/e2e/`)
- **User Flows**: Complete user journey testing
- **Cross-browser**: Multi-browser compatibility
- **Mobile**: Responsive design testing

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- TypeScript support
- Coverage reporting
- Module mapping

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing
- Mobile device testing
- Screenshot capture
- Video recording

## 📊 Test Coverage

The comprehensive test suite covers:

### API Endpoints (Real NBA Data)
- ✅ Health checks (`/api/health`) - System status and diagnostics
- ✅ Games data (`/api/games`) - Live, upcoming, and completed NBA games
- ✅ Teams data (`/api/teams`) - NBA teams, rosters, and statistics
- ✅ Standings data (`/api/standings`) - NBA conference and division standings
- ✅ Predictions (`/api/predictions`) - AI-generated NBA game predictions
- ✅ Analytics (`/api/analytics/stats`) - Performance analytics and metrics
- ✅ Live scores (`/api/live-scores`) - Real-time NBA scores
- ✅ Odds data (`/api/odds`) - Betting odds (if available)

### Frontend Pages (Real NBA Data)
- ✅ Dashboard (`/`) - Main overview with live NBA data
- ✅ Games (`/games`) - NBA games browser with live data
- ✅ Teams (`/teams`) - NBA teams and statistics
- ✅ Predictions (`/predictions`) - AI predictions interface
- ✅ Analytics (`/analytics`) - Performance analytics dashboard

### Services (Real API Integration)
- ✅ Sports Data Service - External NBA API integration
- ✅ Cache Service - Data caching with real NBA data
- ✅ Rate Limiter Service - API rate limiting
- ✅ Error Handling Service - Comprehensive error handling
- ✅ API Client - Centralized API communication

### Data Validation (Real NBA Data)
- ✅ NBA Team Names - Lakers, Warriors, Celtics, etc.
- ✅ Live Game Data - Current NBA season games
- ✅ Historical Data - Past NBA seasons and games
- ✅ Statistics Accuracy - Real NBA statistics and metrics
- ✅ Prediction Quality - AI model accuracy with real outcomes

### Performance (Real Data Testing)
- ✅ Response time testing with real NBA APIs
- ✅ Concurrent request handling
- ✅ Caching performance with real data
- ✅ Memory usage monitoring
- ✅ Data size validation

### Security (Real Environment)
- ✅ Rate limiting with real API calls
- ✅ Input validation with real NBA data
- ✅ SQL injection protection
- ✅ XSS prevention
- ✅ CORS configuration
- ✅ Error handling security

## 🎯 Key Features

### Real NBA Data Testing
- All tests use actual NBA API calls
- No mock data or stubbed responses
- Tests real external NBA API integrations
- Validates actual NBA data structures
- Real-time NBA game data validation
- Historical NBA season data testing

### Comprehensive NBA Coverage
- Unit tests for individual NBA API functions
- Integration tests for NBA service interactions
- E2E tests for complete NBA user flows
- Performance tests with real NBA data
- Security tests for NBA data vulnerability assessment

### NBA Data Validation
- Real NBA team names (Lakers, Warriors, Celtics, etc.)
- Live NBA game scores and statistics
- NBA standings and conference data
- NBA prediction accuracy validation
- NBA analytics performance metrics

### Automated Reporting
- Detailed test reports with NBA data validation
- Coverage metrics for NBA functionality
- Performance benchmarks with real NBA APIs
- Security audit results for NBA data

## 🔍 Running Specific Tests

### API Tests
```bash
# Test specific API endpoint
npm run test -- --testNamePattern="Health API"

# Test all API endpoints
npm run test -- --testPathPattern="api"
```

### Service Tests
```bash
# Test specific service
npm run test -- --testNamePattern="Cache Service"

# Test all services
npm run test -- --testPathPattern="services"
```

### Performance Tests
```bash
# Run performance tests
npm run test -- --testPathPattern="performance"
```

### Security Tests
```bash
# Run security tests
npm run test -- --testPathPattern="security"
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- --grep "Dashboard"
```

## 📈 Test Reports

### Coverage Report
```bash
npm run test:coverage
```
Generates detailed coverage report in `coverage/` directory.

### E2E Report
```bash
npm run test:e2e
```
Generates HTML report in `playwright-report/` directory.

### Performance Report
```bash
npm run test -- --testPathPattern="performance"
```
Outputs performance metrics to console.

## 🛠️ Troubleshooting

### Common Issues

1. **Dev Server Not Running**
   ```bash
   npm run dev
   ```

2. **Dependencies Not Installed**
   ```bash
   npm install
   ```

3. **Port Conflicts**
   - Ensure port 3000 is available
   - Check for other running processes

4. **API Rate Limits**
   - Tests may be rate limited by external APIs
   - Consider running tests with delays

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test

# Run E2E tests with debug mode
DEBUG=pw:api npm run test:e2e
```

## 🔄 Continuous Integration

### GitHub Actions
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run test"
```

## 📝 Adding New Tests

### API Test Template
```typescript
describe('New API Endpoint', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

  it('should return expected data', async () => {
    const response = await fetch(`${baseUrl}/new-endpoint`)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      // Expected structure
    })
  })
})
```

### Service Test Template
```typescript
describe('New Service', () => {
  it('should perform expected operation', async () => {
    const service = new NewService()
    const result = await service.performOperation()
    
    expect(result).toBeDefined()
    // Additional assertions
  })
})
```

### E2E Test Template
```typescript
test('should perform user action', async ({ page }) => {
  await page.goto('/new-page')
  await page.click('[data-testid="action-button"]')
  
  await expect(page.locator('[data-testid="result"]')).toBeVisible()
})
```

## 🎉 Best Practices

1. **Use Real Data**: Always test with actual API responses
2. **Test Edge Cases**: Include error conditions and boundary values
3. **Performance Awareness**: Monitor response times and resource usage
4. **Security First**: Always include security considerations
5. **Clear Naming**: Use descriptive test names and descriptions
6. **Independent Tests**: Each test should be able to run independently
7. **Cleanup**: Clean up after tests to avoid side effects

## 📞 Support

For questions or issues with the test suite:
1. Check the troubleshooting section above
2. Review test logs for specific error messages
3. Ensure all prerequisites are met
4. Verify the dev server is running

---

**Happy Testing! 🚀**
