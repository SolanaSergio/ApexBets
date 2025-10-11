/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: ms => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate test data
  generateTestData: type => {
    const testData = {
      team: {
        name: 'Test Team',
        sport: 'nfl',
        league: 'NFL',
        colors: { primary: '#FF0000', secondary: '#0000FF' },
      },
      player: {
        name: 'Test Player',
        sport: 'nfl',
        team: 'Test Team',
        position: 'QB',
      },
      game: {
        home_team: 'Test Team 1',
        away_team: 'Test Team 2',
        sport: 'nfl',
        date: new Date().toISOString(),
      },
    }
    return testData[type] || {}
  },
}

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Restore console after tests
afterAll(() => {
  global.console = originalConsole
})

// Global test timeout
jest.setTimeout(60000)
