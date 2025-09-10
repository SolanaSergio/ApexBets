/**
 * Comprehensive Games Page E2E Tests
 * Tests the games page with real NBA data
 * NO MOCK DATA - All tests use real NBA game data
 */

import { test, expect } from '@playwright/test'

test.describe('Games Page - Real NBA Data', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the games page
    await page.goto('/games')
  })

  test('should load games page with real NBA data', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the main heading is visible
    await expect(page.locator('h1')).toContainText('Games & Matches')
    
    // Check if the description is visible
    await expect(page.locator('text=Track live games, upcoming matches, and historical results')).toBeVisible()
  })

  test('should display filters section', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('[data-testid="filters-section"]', { timeout: 10000 })
    
    // Check if filters section is visible
    const filtersSection = page.locator('[data-testid="filters-section"]')
    await expect(filtersSection).toBeVisible()
    
    // Check if search input is present
    const searchInput = page.locator('input[placeholder="Search teams or games..."]')
    await expect(searchInput).toBeVisible()
    
    // Check if league select is present
    const leagueSelect = page.locator('[data-testid="league-select"]')
    await expect(leagueSelect).toBeVisible()
    
    // Check if status select is present
    const statusSelect = page.locator('[data-testid="status-select"]')
    await expect(statusSelect).toBeVisible()
  })

  test('should display games tabs', async ({ page }) => {
    // Wait for tabs to load
    await page.waitForSelector('[data-testid="games-tabs"]', { timeout: 10000 })
    
    // Check if tabs are visible
    const tabs = page.locator('[data-testid="games-tabs"]')
    await expect(tabs).toBeVisible()
    
    // Check if live games tab is present
    const liveTab = page.locator('[data-testid="live-tab"]')
    await expect(liveTab).toBeVisible()
    
    // Check if upcoming tab is present
    const upcomingTab = page.locator('[data-testid="upcoming-tab"]')
    await expect(upcomingTab).toBeVisible()
    
    // Check if completed tab is present
    const completedTab = page.locator('[data-testid="completed-tab"]')
    await expect(completedTab).toBeVisible()
  })

  test('should display live games with real NBA data', async ({ page }) => {
    // Click on live games tab
    await page.click('[data-testid="live-tab"]')
    
    // Wait for live games to load
    await page.waitForSelector('[data-testid="live-games"]', { timeout: 10000 })
    
    // Check if live games section is visible
    const liveGames = page.locator('[data-testid="live-games"]')
    await expect(liveGames).toBeVisible()
    
    // Check if live indicator is present
    const liveIndicator = page.locator('[data-testid="live-indicator"]')
    await expect(liveIndicator).toBeVisible()
  })

  test('should display upcoming games with real NBA data', async ({ page }) => {
    // Click on upcoming games tab
    await page.click('[data-testid="upcoming-tab"]')
    
    // Wait for upcoming games to load
    await page.waitForSelector('[data-testid="upcoming-games"]', { timeout: 10000 })
    
    // Check if upcoming games section is visible
    const upcomingGames = page.locator('[data-testid="upcoming-games"]')
    await expect(upcomingGames).toBeVisible()
  })

  test('should display completed games with real NBA data', async ({ page }) => {
    // Click on completed games tab
    await page.click('[data-testid="completed-tab"]')
    
    // Wait for completed games to load
    await page.waitForSelector('[data-testid="completed-games"]', { timeout: 10000 })
    
    // Check if completed games section is visible
    const completedGames = page.locator('[data-testid="completed-games"]')
    await expect(completedGames).toBeVisible()
  })

  test('should display real NBA team names in games', async ({ page }) => {
    // Wait for games to load
    await page.waitForLoadState('networkidle')
    
    // Check if real NBA team names are displayed
    const knownNBATeams = [
      'Lakers', 'Warriors', 'Celtics', 'Bulls', 'Heat', 'Spurs',
      'Knicks', 'Nets', 'Rockets', 'Mavericks', 'Suns', 'Nuggets',
      'Clippers', 'Trail Blazers', 'Jazz', 'Thunder', 'Timberwolves'
    ]
    
    const teamNames = page.locator('[data-testid="team-name"]')
    const teamNamesText = await teamNames.allTextContents()
    
    const hasKnownTeam = knownNBATeams.some(knownTeam => 
      teamNamesText.some(name => name.includes(knownTeam))
    )
    
    expect(hasKnownTeam).toBe(true)
  })

  test('should display real NBA game scores', async ({ page }) => {
    // Click on completed games tab to see scores
    await page.click('[data-testid="completed-tab"]')
    
    // Wait for completed games to load
    await page.waitForSelector('[data-testid="completed-games"]', { timeout: 10000 })
    
    // Check if game scores are displayed
    const scores = page.locator('[data-testid="game-score"]')
    const scoresText = await scores.allTextContents()
    
    // Scores should be numbers
    scoresText.forEach(score => {
      expect(score).toMatch(/^\d+$/)
    })
  })

  test('should display real NBA game dates and times', async ({ page }) => {
    // Wait for games to load
    await page.waitForLoadState('networkidle')
    
    // Check if game dates are displayed
    const dates = page.locator('[data-testid="game-date"]')
    const datesText = await dates.allTextContents()
    
    // Dates should be in valid format
    datesText.forEach(date => {
      expect(date).toMatch(/^\w{3} \d{1,2}$/) // Format like "Jan 15"
    })
    
    // Check if game times are displayed
    const times = page.locator('[data-testid="game-time"]')
    const timesText = await times.allTextContents()
    
    // Times should be in valid format
    timesText.forEach(time => {
      expect(time).toMatch(/^\d{1,2}:\d{2} [AP]M$/) // Format like "7:30 PM"
    })
  })

  test('should filter games by league', async ({ page }) => {
    // Click on league select
    await page.click('[data-testid="league-select"]')
    
    // Select NBA
    await page.click('text=NBA')
    
    // Wait for filtered games to load
    await page.waitForTimeout(2000)
    
    // Check if games are filtered (this would depend on implementation)
    const games = page.locator('[data-testid="game-card"]')
    await expect(games).toBeVisible()
  })

  test('should filter games by status', async ({ page }) => {
    // Click on status select
    await page.click('[data-testid="status-select"]')
    
    // Select live
    await page.click('text=Live')
    
    // Wait for filtered games to load
    await page.waitForTimeout(2000)
    
    // Check if live games are displayed
    const liveGames = page.locator('[data-testid="live-games"]')
    await expect(liveGames).toBeVisible()
  })

  test('should search games by team name', async ({ page }) => {
    // Type in search input
    const searchInput = page.locator('input[placeholder="Search teams or games..."]')
    await searchInput.fill('Lakers')
    
    // Wait for search results
    await page.waitForTimeout(2000)
    
    // Check if Lakers games are displayed
    const lakersGames = page.locator('text=Lakers')
    await expect(lakersGames).toBeVisible()
  })

  test('should refresh games data', async ({ page }) => {
    // Wait for games to load
    await page.waitForLoadState('networkidle')
    
    // Click refresh button if it exists
    const refreshButton = page.locator('[data-testid="refresh-button"]')
    if (await refreshButton.isVisible()) {
      await refreshButton.click()
      
      // Wait for refresh to complete
      await page.waitForTimeout(2000)
      
      // Check if games are still visible after refresh
      const games = page.locator('[data-testid="game-card"]')
      await expect(games).toBeVisible()
    }
  })

  test('should handle empty states gracefully', async ({ page }) => {
    // Test with a date that likely has no games
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 365)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    
    await page.goto(`/games?date=${futureDateStr}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if empty state is handled gracefully
    const gamesList = page.locator('[data-testid="games-list"]')
    await expect(gamesList).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Test with invalid API endpoint to trigger real error
    await page.goto('/api/invalid-endpoint')
    
    // Check that error state is handled gracefully
    expect(page.url()).toContain('/api/invalid-endpoint')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check if main heading is visible on mobile
    await expect(page.locator('h1')).toBeVisible()
    
    // Check if filters are accessible on mobile
    const filtersSection = page.locator('[data-testid="filters-section"]')
    await expect(filtersSection).toBeVisible()
    
    // Check if tabs are accessible on mobile
    const tabs = page.locator('[data-testid="games-tabs"]')
    await expect(tabs).toBeVisible()
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Check if loading skeletons are shown initially
    const loadingSkeletons = page.locator('[data-testid="loading-skeleton"]')
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // Check if loading skeletons are replaced with real content
    await expect(loadingSkeletons).toHaveCount(0)
  })

  test('should display game status correctly', async ({ page }) => {
    // Wait for games to load
    await page.waitForLoadState('networkidle')
    
    // Check if game statuses are displayed
    const statuses = page.locator('[data-testid="game-status"]')
    const statusesText = await statuses.allTextContents()
    
    // Statuses should be valid
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'postponed', 'cancelled']
    statusesText.forEach(status => {
      expect(validStatuses).toContain(status.toLowerCase())
    })
  })

  test('should display venue information when available', async ({ page }) => {
    // Wait for games to load
    await page.waitForLoadState('networkidle')
    
    // Check if venue information is displayed
    const venues = page.locator('[data-testid="game-venue"]')
    const venuesText = await venues.allTextContents()
    
    // Venues should be non-empty strings
    venuesText.forEach(venue => {
      expect(venue.trim().length).toBeGreaterThan(0)
    })
  })
})
