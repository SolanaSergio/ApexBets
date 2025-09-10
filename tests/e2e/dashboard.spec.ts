/**
 * End-to-End Tests for Dashboard
 * Tests critical user flows with real browser interactions
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/')
  })

  test('should load dashboard with all main components', async ({ page }) => {
    // Check that the main title is visible
    await expect(page.getByText('Project Apex')).toBeVisible()
    await expect(page.getByText('Advanced Sports Analytics & Prediction Platform')).toBeVisible()

    // Check that navigation is present
    await expect(page.getByRole('navigation')).toBeVisible()

    // Check that main dashboard components are present
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-overview"]')).toBeVisible()
    await expect(page.locator('[data-testid="predictions-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-games"]')).toBeVisible()
  })

  test('should display stats cards with real data', async ({ page }) => {
    // Wait for stats cards to load
    await page.waitForSelector('[data-testid="stats-cards"]')
    
    // Check that stats cards are populated with data
    const statsCards = page.locator('[data-testid="stats-cards"] .card')
    await expect(statsCards).toHaveCount(4)
    
    // Check that each card has content
    for (let i = 0; i < 4; i++) {
      const card = statsCards.nth(i)
      await expect(card).toBeVisible()
      await expect(card.locator('h3')).toBeVisible()
      await expect(card.locator('.text-2xl')).toBeVisible()
    }
  })

  test('should display recent games with real data', async ({ page }) => {
    // Wait for recent games to load
    await page.waitForSelector('[data-testid="recent-games"]')
    
    // Check that recent games section is visible
    await expect(page.getByText('Recent Games')).toBeVisible()
    
    // Check that games are displayed
    const games = page.locator('[data-testid="recent-games"] .game-item')
    await expect(games.first()).toBeVisible()
    
    // Check that each game has team names
    const firstGame = games.first()
    await expect(firstGame.locator('.team-name')).toHaveCount(2)
  })

  test('should display predictions panel with real data', async ({ page }) => {
    // Wait for predictions panel to load
    await page.waitForSelector('[data-testid="predictions-panel"]')
    
    // Check that predictions panel is visible
    await expect(page.getByText('Predictions')).toBeVisible()
    
    // Check that predictions are displayed
    const predictions = page.locator('[data-testid="predictions-panel"] .prediction-item')
    await expect(predictions.first()).toBeVisible()
  })

  test('should navigate to different pages', async ({ page }) => {
    // Test navigation to games page
    await page.click('a[href="/games"]')
    await expect(page).toHaveURL('/games')
    await expect(page.getByText('Games')).toBeVisible()

    // Test navigation to teams page
    await page.click('a[href="/teams"]')
    await expect(page).toHaveURL('/teams')
    await expect(page.getByText('Teams')).toBeVisible()

    // Test navigation to predictions page
    await page.click('a[href="/predictions"]')
    await expect(page).toHaveURL('/predictions')
    await expect(page.getByText('Predictions')).toBeVisible()

    // Test navigation to analytics page
    await page.click('a[href="/analytics"]')
    await expect(page).toHaveURL('/analytics')
    await expect(page.getByText('Analytics')).toBeVisible()

    // Test navigation back to dashboard
    await page.click('a[href="/"]')
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Project Apex')).toBeVisible()
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Check that loading skeletons are displayed initially
    await expect(page.locator('.skeleton')).toBeVisible()
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="stats-cards"]', { timeout: 10000 })
    
    // Check that loading skeletons are no longer visible
    await expect(page.locator('.skeleton')).not.toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that dashboard is still functional
    await expect(page.getByText('Project Apex')).toBeVisible()
    
    // Check that navigation is accessible
    await expect(page.getByRole('navigation')).toBeVisible()
    
    // Check that main content is visible
    await expect(page.locator('[data-testid="stats-cards"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API errors
    await page.route('**/api/games', route => route.fulfill({ status: 500 }))
    await page.route('**/api/teams', route => route.fulfill({ status: 500 }))
    
    // Reload the page
    await page.reload()
    
    // Check that error states are handled gracefully
    await expect(page.getByText('Project Apex')).toBeVisible()
    
    // Check that error messages are displayed
    await expect(page.getByText('Error loading data')).toBeVisible()
  })
})
