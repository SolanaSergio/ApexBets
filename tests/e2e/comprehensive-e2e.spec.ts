/**
 * End-to-End Tests for ApexBets Platform
 * Tests complete user workflows
 */

import { test, expect } from '@playwright/test'

test.describe('ApexBets E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route
      await page.goto('http://localhost:3000/dashboard')
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*login/)
    })

    test('should display login form', async ({ page }) => {
      await page.goto('http://localhost:3000/login')
      
      // Check for login form elements
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should handle login form validation', async ({ page }) => {
      await page.goto('http://localhost:3000/login')
      
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Should show validation errors
      await expect(page.locator('text=Email is required')).toBeVisible()
      await expect(page.locator('text=Password is required')).toBeVisible()
    })
  })

  test.describe('Dashboard Navigation', () => {
    test('should display main navigation', async ({ page }) => {
      // Mock authentication for this test
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      await page.goto('http://localhost:3000')
      
      // Check for navigation elements
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('text=Dashboard')).toBeVisible()
      await expect(page.locator('text=Games')).toBeVisible()
      await expect(page.locator('text=Teams')).toBeVisible()
      await expect(page.locator('text=Players')).toBeVisible()
      await expect(page.locator('text=Predictions')).toBeVisible()
    })

    test('should navigate between pages', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      await page.goto('http://localhost:3000')
      
      // Navigate to Games page
      await page.click('text=Games')
      await expect(page).toHaveURL(/.*games/)
      
      // Navigate to Teams page
      await page.click('text=Teams')
      await expect(page).toHaveURL(/.*teams/)
      
      // Navigate to Players page
      await page.click('text=Players')
      await expect(page).toHaveURL(/.*players/)
    })
  })

  test.describe('Sports Data Display', () => {
    test('should display games data', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/database-first/games*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                home_team_name: 'Lakers',
                away_team_name: 'Warriors',
                game_date: '2024-01-01T20:00:00Z',
                status: 'scheduled',
                home_score: null,
                away_score: null
              }
            ],
            meta: {
              timestamp: new Date().toISOString(),
              count: 1
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/games')
      
      // Check for games data
      await expect(page.locator('text=Lakers')).toBeVisible()
      await expect(page.locator('text=Warriors')).toBeVisible()
    })

    test('should display teams data', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/database-first/teams*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                name: 'Los Angeles Lakers',
                abbreviation: 'LAL',
                sport: 'basketball',
                league_name: 'NBA'
              }
            ],
            meta: {
              timestamp: new Date().toISOString(),
              count: 1
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/teams')
      
      // Check for teams data
      await expect(page.locator('text=Los Angeles Lakers')).toBeVisible()
      await expect(page.locator('text=LAL')).toBeVisible()
    })

    test('should display players data', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/players*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                name: 'LeBron James',
                position: 'SF',
                team_name: 'Los Angeles Lakers',
                sport: 'basketball'
              }
            ],
            meta: {
              timestamp: new Date().toISOString(),
              count: 1
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/players')
      
      // Check for players data
      await expect(page.locator('text=LeBron James')).toBeVisible()
      await expect(page.locator('text=SF')).toBeVisible()
    })
  })

  test.describe('Predictions and Analytics', () => {
    test('should display predictions data', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/predictions/upcoming*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                game_id: '1',
                prediction_type: 'winner',
                predicted_value: 'home',
                confidence: 0.75,
                model_version: 'v1.0'
              }
            ],
            meta: {
              timestamp: new Date().toISOString(),
              count: 1
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/predictions')
      
      // Check for predictions data
      await expect(page.locator('text=Predictions')).toBeVisible()
    })

    test('should display analytics dashboard', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/analytics*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalGames: 100,
              totalTeams: 30,
              totalPlayers: 500,
              predictionAccuracy: 0.65
            },
            meta: {
              timestamp: new Date().toISOString()
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/analytics')
      
      // Check for analytics data
      await expect(page.locator('text=Analytics')).toBeVisible()
    })
  })

  test.describe('Value Betting', () => {
    test('should display value bets', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/value-bets*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: '1',
                game_id: '1',
                bet_type: 'h2h',
                recommended_bet: 'home',
                odds: 2.5,
                value: 0.15,
                confidence: 'high'
              }
            ],
            meta: {
              timestamp: new Date().toISOString(),
              count: 1
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000/trends')
      
      // Check for value bets section
      await expect(page.locator('text=Value Bets')).toBeVisible()
    })
  })

  test.describe('Real-time Updates', () => {
    test('should display live updates', async ({ page }) => {
      // Mock authentication and API data
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API responses
      await page.route('**/api/live-updates*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            live: [
              {
                id: '1',
                home_team_name: 'Lakers',
                away_team_name: 'Warriors',
                home_score: 45,
                away_score: 42,
                status: 'live'
              }
            ],
            recent: [],
            upcoming: [],
            summary: {
              totalLive: 1,
              totalRecent: 0,
              totalUpcoming: 0
            }
          })
        })
      })
      
      await page.goto('http://localhost:3000')
      
      // Check for live updates
      await expect(page.locator('text=Live Updates')).toBeVisible()
    })
  })

  test.describe('Sport Selection', () => {
    test('should allow sport selection', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      await page.goto('http://localhost:3000')
      
      // Look for sport selector
      const sportSelector = page.locator('[data-testid="sport-selector"]')
      if (await sportSelector.isVisible()) {
        await sportSelector.click()
        
        // Check for sport options
        await expect(page.locator('text=Basketball')).toBeVisible()
        await expect(page.locator('text=Football')).toBeVisible()
        await expect(page.locator('text=Soccer')).toBeVisible()
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock API error
      await page.route('**/api/teams*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        })
      })
      
      await page.goto('http://localhost:3000/teams')
      
      // Should show error message or fallback content
      await expect(page.locator('text=Error') || page.locator('text=Loading')).toBeVisible()
    })

    test('should handle network errors', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Block all network requests
      await page.route('**/*', route => route.abort())
      
      await page.goto('http://localhost:3000')
      
      // Should handle gracefully without crashing
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('http://localhost:3000')
      
      // Check that navigation is accessible on mobile
      await expect(page.locator('nav')).toBeVisible()
      
      // Check for mobile-specific elements or responsive behavior
      const mobileMenu = page.locator('[data-testid="mobile-menu"]')
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click()
        await expect(page.locator('text=Dashboard')).toBeVisible()
      }
    })

    test('should work on tablet devices', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('http://localhost:3000')
      
      // Check that layout adapts to tablet size
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3000')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })

    test('should handle large datasets', async ({ page }) => {
      // Mock authentication
      await page.addInitScript(() => {
        window.localStorage.setItem('supabase.auth.token', 'mock-token')
      })
      
      // Mock large dataset
      await page.route('**/api/teams*', async route => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          id: i.toString(),
          name: `Team ${i}`,
          sport: 'basketball'
        }))
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: largeDataset,
            meta: { count: 1000 }
          })
        })
      })
      
      await page.goto('http://localhost:3000/teams')
      
      // Should handle large dataset without crashing
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
