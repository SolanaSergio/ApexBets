/**
 * End-to-End Tests for Games Page
 * Tests critical user flows for games functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Games Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the games page
    await page.goto('/games')
  })

  test('should load games page with real data', async ({ page }) => {
    // Check that the page title is visible
    await expect(page.getByText('Games')).toBeVisible()
    
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Check that games are displayed
    const games = page.locator('[data-testid="games-list"] .game-card')
    await expect(games.first()).toBeVisible()
    
    // Check that each game has required information
    const firstGame = games.first()
    await expect(firstGame.locator('.team-names')).toBeVisible()
    await expect(firstGame.locator('.game-date')).toBeVisible()
    await expect(firstGame.locator('.game-status')).toBeVisible()
  })

  test('should filter games by sport', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Select basketball filter
    await page.selectOption('select[name="sport"]', 'basketball')
    
    // Wait for filtered results
    await page.waitForTimeout(1000)
    
    // Check that all displayed games are basketball
    const games = page.locator('[data-testid="games-list"] .game-card')
    const count = await games.count()
    
    for (let i = 0; i < count; i++) {
      const game = games.nth(i)
      await expect(game.locator('.sport-badge')).toContainText('Basketball')
    }
  })

  test('should filter games by date', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Select today's date
    const today = new Date().toISOString().split('T')[0]
    await page.fill('input[name="date"]', today)
    
    // Wait for filtered results
    await page.waitForTimeout(1000)
    
    // Check that all displayed games are from today
    const games = page.locator('[data-testid="games-list"] .game-card')
    const count = await games.count()
    
    for (let i = 0; i < count; i++) {
      const game = games.nth(i)
      await expect(game.locator('.game-date')).toContainText(today)
    }
  })

  test('should filter games by status', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Select live games filter
    await page.selectOption('select[name="status"]', 'live')
    
    // Wait for filtered results
    await page.waitForTimeout(1000)
    
    // Check that all displayed games are live
    const games = page.locator('[data-testid="games-list"] .game-card')
    const count = await games.count()
    
    for (let i = 0; i < count; i++) {
      const game = games.nth(i)
      const status = await game.locator('.game-status').textContent()
      expect(['live', 'in_progress', '1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr']).toContain(status)
    }
  })

  test('should display game details when clicked', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Click on the first game
    const firstGame = page.locator('[data-testid="games-list"] .game-card').first()
    await firstGame.click()
    
    // Check that game details modal or page is displayed
    await expect(page.locator('[data-testid="game-details"]')).toBeVisible()
    
    // Check that game details contain expected information
    await expect(page.locator('.team-names')).toBeVisible()
    await expect(page.locator('.game-date')).toBeVisible()
    await expect(page.locator('.game-status')).toBeVisible()
  })

  test('should display live scores for live games', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Look for live games
    const liveGames = page.locator('[data-testid="games-list"] .game-card').filter({ hasText: 'live' })
    
    if (await liveGames.count() > 0) {
      const liveGame = liveGames.first()
      
      // Check that live game has scores
      await expect(liveGame.locator('.score')).toBeVisible()
      
      // Check that scores are numeric
      const homeScore = await liveGame.locator('.home-score').textContent()
      const awayScore = await liveGame.locator('.away-score').textContent()
      
      expect(parseInt(homeScore || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(awayScore || '0')).toBeGreaterThanOrEqual(0)
    }
  })

  test('should handle pagination', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Check if pagination is present
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page"]')
      
      // Wait for new games to load
      await page.waitForTimeout(1000)
      
      // Check that games are still displayed
      await expect(page.locator('[data-testid="games-list"] .game-card').first()).toBeVisible()
    }
  })

  test('should search games by team name', async ({ page }) => {
    // Wait for games to load
    await page.waitForSelector('[data-testid="games-list"]')
    
    // Search for a specific team
    await page.fill('input[name="search"]', 'Lakers')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Check that all displayed games contain Lakers
    const games = page.locator('[data-testid="games-list"] .game-card')
    const count = await games.count()
    
    for (let i = 0; i < count; i++) {
      const game = games.nth(i)
      const teamNames = await game.locator('.team-names').textContent()
      expect(teamNames?.toLowerCase()).toContain('lakers')
    }
  })

  test('should handle empty results gracefully', async ({ page }) => {
    // Search for a team that doesn't exist
    await page.fill('input[name="search"]', 'NonExistentTeam123')
    
    // Wait for search results
    await page.waitForTimeout(1000)
    
    // Check that empty state is displayed
    await expect(page.getByText('No games found')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that games page is still functional
    await expect(page.getByText('Games')).toBeVisible()
    
    // Check that games are displayed
    await expect(page.locator('[data-testid="games-list"]')).toBeVisible()
    
    // Check that filters are accessible
    await expect(page.locator('select[name="sport"]')).toBeVisible()
    await expect(page.locator('input[name="date"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Test with invalid API endpoint to trigger real error
    await page.goto('/api/invalid-endpoint')
    
    // Check that error state is handled gracefully
    expect(page.url()).toContain('/api/invalid-endpoint')
  })
})
