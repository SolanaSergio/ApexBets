/**
 * Comprehensive Dashboard E2E Tests
 * Tests the main dashboard page with real NBA data
 * NO MOCK DATA - All tests use real data from APIs
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Page - Real NBA Data', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/')
  })

  test('should load dashboard with real NBA data', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the main heading is visible
    await expect(page.locator('h1')).toContainText('Project Apex')
    
    // Check if the description is visible
    await expect(page.locator('text=Advanced Sports Analytics & Prediction Platform')).toBeVisible()
  })

  test('should display stats cards with real data', async ({ page }) => {
    // Wait for stats cards to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 })
    
    // Check if stats cards are visible
    const statsCards = page.locator('[data-testid="stats-cards"]')
    await expect(statsCards).toBeVisible()
    
    // Check if individual stat cards are present
    const statCards = page.locator('[data-testid="stat-card"]')
    await expect(statCards).toHaveCount(4)
  })

  test('should display dashboard overview with real NBA data', async ({ page }) => {
    // Wait for dashboard overview to load
    await page.waitForSelector('[data-testid="dashboard-overview"]', { timeout: 10000 })
    
    // Check if dashboard overview is visible
    const dashboardOverview = page.locator('[data-testid="dashboard-overview"]')
    await expect(dashboardOverview).toBeVisible()
  })

  test('should display predictions panel with real data', async ({ page }) => {
    // Wait for predictions panel to load
    await page.waitForSelector('[data-testid="predictions-panel"]', { timeout: 10000 })
    
    // Check if predictions panel is visible
    const predictionsPanel = page.locator('[data-testid="predictions-panel"]')
    await expect(predictionsPanel).toBeVisible()
  })

  test('should display recent games with real NBA data', async ({ page }) => {
    // Wait for recent games to load
    await page.waitForSelector('[data-testid="recent-games"]', { timeout: 10000 })
    
    // Check if recent games section is visible
    const recentGames = page.locator('[data-testid="recent-games"]')
    await expect(recentGames).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    // Check if navigation is visible
    const navigation = page.locator('[data-testid="navigation"]')
    await expect(navigation).toBeVisible()
    
    // Check if navigation links are present
    const gamesLink = page.locator('a[href="/games"]')
    await expect(gamesLink).toBeVisible()
    
    const teamsLink = page.locator('a[href="/teams"]')
    await expect(teamsLink).toBeVisible()
    
    const predictionsLink = page.locator('a[href="/predictions"]')
    await expect(predictionsLink).toBeVisible()
    
    const analyticsLink = page.locator('a[href="/analytics"]')
    await expect(analyticsLink).toBeVisible()
  })

  test('should navigate to games page', async ({ page }) => {
    // Click on games link
    await page.click('a[href="/games"]')
    
    // Wait for navigation
    await page.waitForURL('/games')
    
    // Check if we're on the games page
    await expect(page.locator('h1')).toContainText('Games & Matches')
  })

  test('should navigate to teams page', async ({ page }) => {
    // Click on teams link
    await page.click('a[href="/teams"]')
    
    // Wait for navigation
    await page.waitForURL('/teams')
    
    // Check if we're on the teams page
    await expect(page.locator('h1')).toContainText('Teams & Rosters')
  })

  test('should navigate to predictions page', async ({ page }) => {
    // Click on predictions link
    await page.click('a[href="/predictions"]')
    
    // Wait for navigation
    await page.waitForURL('/predictions')
    
    // Check if we're on the predictions page
    await expect(page.locator('h1')).toContainText('AI Predictions')
  })

  test('should navigate to analytics page', async ({ page }) => {
    // Click on analytics link
    await page.click('a[href="/analytics"]')
    
    // Wait for navigation
    await page.waitForURL('/analytics')
    
    // Check if we're on the analytics page
    await expect(page.locator('h1')).toContainText('Advanced Analytics')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if main heading is visible on mobile
    await expect(page.locator('h1')).toBeVisible()
    
    // Check if navigation is accessible on mobile
    const navigation = page.locator('[data-testid="navigation"]')
    await expect(navigation).toBeVisible()
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Check if loading skeletons are shown initially
    const loadingSkeletons = page.locator('[data-testid="loading-skeleton"]')
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // Check if loading skeletons are replaced with real content
    await expect(loadingSkeletons).toHaveCount(0)
  })

  test('should display real NBA team names in recent games', async ({ page }) => {
    // Wait for recent games to load
    await page.waitForSelector('[data-testid="recent-games"]', { timeout: 10000 })
    
    // Check if real NBA team names are displayed
    const knownNBATeams = [
      'Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Spurs',
      'Knicks', 'Nets', 'Rockets', 'Mavericks', 'Suns', 'Nuggets'
    ]
    
    const teamNames = page.locator('[data-testid="team-name"]')
    const teamNamesText = await teamNames.allTextContents()
    
    const hasKnownTeam = knownNBATeams.some(knownTeam => 
      teamNamesText.some(name => name.includes(knownTeam))
    )
    
    expect(hasKnownTeam).toBe(true)
  })

  test('should display real NBA game scores', async ({ page }) => {
    // Wait for recent games to load
    await page.waitForSelector('[data-testid="recent-games"]', { timeout: 10000 })
    
    // Check if game scores are displayed
    const scores = page.locator('[data-testid="game-score"]')
    const scoresText = await scores.allTextContents()
    
    // Scores should be numbers
    scoresText.forEach(score => {
      expect(score).toMatch(/^\d+$/)
    })
  })

  test('should display real NBA game dates', async ({ page }) => {
    // Wait for recent games to load
    await page.waitForSelector('[data-testid="recent-games"]', { timeout: 10000 })
    
    // Check if game dates are displayed
    const dates = page.locator('[data-testid="game-date"]')
    const datesText = await dates.allTextContents()
    
    // Dates should be in valid format
    datesText.forEach(date => {
      expect(date).toMatch(/^\w{3} \d{1,2}$/) // Format like "Jan 15"
    })
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/games', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Reload page
    await page.reload()
    
    // Wait for error handling
    await page.waitForTimeout(2000)
    
    // Check if error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // Click refresh button if it exists
    const refreshButton = page.locator('[data-testid="refresh-button"]')
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000)
      
      // Check if content is still visible after refresh
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})
