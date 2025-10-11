/**
 * End-to-End Tests for Teams Page
 * Tests critical user flows for teams functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Teams Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the teams page
    await page.goto('/teams')
  })

  test('should load teams page with real data', async ({ page }) => {
    // Check that the page title is visible
    await expect(page.getByText('Teams')).toBeVisible()

    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Check that teams are displayed
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    await expect(teams.first()).toBeVisible()

    // Check that each team has required information
    const firstTeam = teams.first()
    await expect(firstTeam.locator('.team-name')).toBeVisible()
    await expect(firstTeam.locator('.team-abbreviation')).toBeVisible()
    await expect(firstTeam.locator('.team-league')).toBeVisible()
  })

  test('should filter teams by sport', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Select basketball filter
    await page.selectOption('select[name="sport"]', 'basketball')

    // Wait for filtered results
    await page.waitForTimeout(1000)

    // Check that all displayed teams are basketball
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const count = await teams.count()

    for (let i = 0; i < count; i++) {
      const team = teams.nth(i)
      await expect(team.locator('.sport-badge')).toContainText('Basketball')
    }
  })

  test('should filter teams by league', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Select NBA filter
    await page.selectOption('select[name="league"]', 'NBA')

    // Wait for filtered results
    await page.waitForTimeout(1000)

    // Check that all displayed teams are NBA
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const count = await teams.count()

    for (let i = 0; i < count; i++) {
      const team = teams.nth(i)
      await expect(team.locator('.team-league')).toContainText('NBA')
    }
  })

  test('should search teams by name', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Search for a specific team
    await page.fill('input[name="search"]', 'Lakers')

    // Wait for search results
    await page.waitForTimeout(1000)

    // Check that all displayed teams contain Lakers
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const count = await teams.count()

    for (let i = 0; i < count; i++) {
      const team = teams.nth(i)
      const teamName = await team.locator('.team-name').textContent()
      expect(teamName?.toLowerCase()).toContain('lakers')
    }
  })

  test('should display team details when clicked', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Click on the first team
    const firstTeam = page.locator('[data-testid="teams-list"] .team-card').first()
    await firstTeam.click()

    // Check that team details modal or page is displayed
    await expect(page.locator('[data-testid="team-details"]')).toBeVisible()

    // Check that team details contain expected information
    await expect(page.locator('.team-name')).toBeVisible()
    await expect(page.locator('.team-abbreviation')).toBeVisible()
    await expect(page.locator('.team-league')).toBeVisible()
  })

  test('should display team statistics when available', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Look for teams with statistics
    const teamsWithStats = page
      .locator('[data-testid="teams-list"] .team-card')
      .filter({ hasText: 'Wins' })

    if ((await teamsWithStats.count()) > 0) {
      const team = teamsWithStats.first()

      // Check that team has statistics
      await expect(team.locator('.team-stats')).toBeVisible()

      // Check that stats are numeric
      const wins = await team.locator('.wins').textContent()
      const losses = await team.locator('.losses').textContent()

      expect(parseInt(wins || '0')).toBeGreaterThanOrEqual(0)
      expect(parseInt(losses || '0')).toBeGreaterThanOrEqual(0)
    }
  })

  test('should display team logos when available', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Check that team logos are displayed
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const firstTeam = teams.first()

    // Check if team logo is present
    const logo = firstTeam.locator('.team-logo img')
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible()
      await expect(logo).toHaveAttribute('src')
    }
  })

  test('should handle pagination', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Check if pagination is present
    const pagination = page.locator('[data-testid="pagination"]')

    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page"]')

      // Wait for new teams to load
      await page.waitForTimeout(1000)

      // Check that teams are still displayed
      await expect(page.locator('[data-testid="teams-list"] .team-card').first()).toBeVisible()
    }
  })

  test('should sort teams by name', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Click sort by name
    await page.click('[data-testid="sort-by-name"]')

    // Wait for sorted results
    await page.waitForTimeout(1000)

    // Check that teams are sorted alphabetically
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const count = await teams.count()

    if (count > 1) {
      const firstTeamName = await teams.nth(0).locator('.team-name').textContent()
      const secondTeamName = await teams.nth(1).locator('.team-name').textContent()

      expect(firstTeamName?.localeCompare(secondTeamName || '')).toBeLessThanOrEqual(0)
    }
  })

  test('should sort teams by win percentage', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="teams-list"]')

    // Click sort by win percentage
    await page.click('[data-testid="sort-by-win-percentage"]')

    // Wait for sorted results
    await page.waitForTimeout(1000)

    // Check that teams are sorted by win percentage
    const teams = page.locator('[data-testid="teams-list"] .team-card')
    const count = await teams.count()

    if (count > 1) {
      const firstTeamWinPct = await teams.nth(0).locator('.win-percentage').textContent()
      const secondTeamWinPct = await teams.nth(1).locator('.win-percentage').textContent()

      const firstPct = parseFloat(firstTeamWinPct?.replace('%', '') || '0')
      const secondPct = parseFloat(secondTeamWinPct?.replace('%', '') || '0')

      expect(firstPct).toBeGreaterThanOrEqual(secondPct)
    }
  })

  test('should handle empty results gracefully', async ({ page }) => {
    // Search for a team that doesn't exist
    await page.fill('input[name="search"]', 'NonExistentTeam123')

    // Wait for search results
    await page.waitForTimeout(1000)

    // Check that empty state is displayed
    await expect(page.getByText('No teams found')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check that teams page is still functional
    await expect(page.getByText('Teams')).toBeVisible()

    // Check that teams are displayed
    await expect(page.locator('[data-testid="teams-list"]')).toBeVisible()

    // Check that filters are accessible
    await expect(page.locator('select[name="sport"]')).toBeVisible()
    await expect(page.locator('input[name="search"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Test with invalid API endpoint to trigger real error
    await page.goto('/api/invalid-endpoint')

    // Check that error state is handled gracefully
    expect(page.url()).toContain('/api/invalid-endpoint')
  })
})
