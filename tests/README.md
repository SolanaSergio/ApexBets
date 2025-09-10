# ApexBets Centralized Testing System

This directory contains the complete testing infrastructure for ApexBets. All tests use **REAL DATA ONLY** - no mock data or placeholders.

## 🚀 Quick Start

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:performance
pnpm test:security

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests with UI
pnpm test:e2e:ui
```

## 📁 Directory Structure

```
tests/
├── jest.config.js          # Centralized Jest configuration
├── jest.setup.js           # Setup for component tests
├── jest.setup.api.js       # Setup for API tests (real data only)
├── test-runner.js          # Centralized test runner
├── README.md               # This file
├── unit/                   # Unit tests
│   └── api/
├── integration/            # Integration tests
│   ├── api/
│   ├── performance/
│   └── security/
├── e2e/                    # End-to-end tests
└── test-report.json        # Generated test reports
```

## 🧪 Test Types

### Unit Tests (`unit/`)
- Test individual components and functions
- Use real API calls (no mocking)
- Fast execution
- Located in `tests/unit/`

### Integration Tests (`integration/`)
- Test API endpoints with real data
- Test service integrations
- Performance and security tests
- Located in `tests/integration/`

### End-to-End Tests (`e2e/`)
- Test complete user workflows
- Use Playwright for browser automation
- Test with real data
- Located in `tests/e2e/`

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Centralized configuration for all test types
- Uses projects to separate unit, integration, and e2e tests
- Real data only - no mocking of external APIs
- Coverage thresholds: 70% for all metrics

### Test Setup Files
- `jest.setup.js`: Component test setup with minimal mocking
- `jest.setup.api.js`: API test setup with real fetch only

## 📊 Test Runner

The centralized test runner (`test-runner.js`) provides:

- **Real Data Only**: All tests use actual external APIs
- **No Mocking**: No placeholder or mock data
- **Comprehensive Reporting**: Detailed test reports with categories
- **Prerequisites Checking**: Validates environment before running
- **Color-coded Output**: Easy to read test results

### Usage

```bash
# Run all tests
node tests/test-runner.js

# Run specific test type
node tests/test-runner.js unit
node tests/test-runner.js integration
node tests/test-runner.js e2e
node tests/test-runner.js performance
node tests/test-runner.js security
```

## 🎯 Testing Philosophy

### Real Data Only
- All tests use actual external APIs
- No mock data or placeholders
- Tests reflect real-world conditions
- Validates actual data quality and API responses

### No Mocking Strategy
- External API calls are real
- Database connections are real
- Only browser APIs are mocked (for component tests)
- Tests fail if external services are down (by design)

### Comprehensive Coverage
- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for user workflows
- Performance tests for response times
- Security tests for vulnerabilities

## 📈 Test Reports

After running tests, a detailed report is generated in `test-report.json`:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "summary": {
    "total": 5,
    "passed": 5,
    "failed": 0
  },
  "results": [...],
  "testCategories": {
    "unit": 1,
    "integration": 1,
    "e2e": 1,
    "performance": 1,
    "security": 1
  }
}
```

## 🚨 Prerequisites

Before running tests, ensure:

1. **Node.js** is installed
2. **pnpm** is installed
3. **Dependencies** are installed (`pnpm install`)
4. **Dev server** is running (`pnpm dev`) for integration tests
5. **External APIs** are accessible

## 🔍 Debugging Tests

### Common Issues

1. **External API failures**: Tests will fail if external services are down
2. **Network timeouts**: Increase timeout in Jest config if needed
3. **Missing environment variables**: Ensure all required env vars are set

### Debug Commands

```bash
# Run with verbose output
jest --config tests/jest.config.js --verbose

# Run specific test file
jest --config tests/jest.config.js tests/unit/api/health.test.ts

# Run with debug logging
DEBUG=* pnpm test
```

## 📝 Writing Tests

### Unit Tests
```typescript
// tests/unit/api/health.test.ts
describe('Health API', () => {
  it('should return health status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
  });
});
```

### Integration Tests
```typescript
// tests/integration/api/games.test.ts
describe('Games API Integration', () => {
  it('should return real NBA games data', async () => {
    const response = await fetch('http://localhost:3000/api/games');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Validate real data structure
    const game = data[0];
    expect(game).toHaveProperty('id');
    expect(game).toHaveProperty('homeTeam');
    expect(game).toHaveProperty('awayTeam');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test('dashboard loads with real data', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for real data to load
  await expect(page.locator('[data-testid="games-list"]')).toBeVisible();
  
  // Verify real data is displayed
  const games = await page.locator('[data-testid="game-item"]').count();
  expect(games).toBeGreaterThan(0);
});
```

## 🎉 Benefits

- **Centralized**: All testing infrastructure in one place
- **Real Data**: Tests validate actual functionality
- **Comprehensive**: Multiple test types for complete coverage
- **Maintainable**: Single configuration and runner
- **Reliable**: Tests fail when external services have issues
- **Fast**: Optimized for quick feedback during development

## 🔄 Continuous Integration

The testing system is designed to work with CI/CD:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    pnpm install
    pnpm dev &
    sleep 10
    pnpm test
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library Documentation](https://testing-library.com/docs/)