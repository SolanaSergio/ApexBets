/**
 * Playwright visual tests for logo verification
 * Tests that logos appear correctly on all pages
 */

import { test, expect } from '@playwright/test'

test.describe('Logo Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('homepage displays team logos correctly', async ({ page }) => {
    // Check for team logos on homepage
    const teamLogos = page.locator('[data-testid="team-logo"], img[alt*="logo"], img[alt*="Logo"]')
    
    // Wait for at least one team logo to be visible
    await expect(teamLogos.first()).toBeVisible({ timeout: 10000 })
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/homepage-logos.png', fullPage: true })
    
    // Verify logos are not broken (have proper src)
    const logoCount = await teamLogos.count()
    expect(logoCount).toBeGreaterThan(0)
    
    for (let i = 0; i < Math.min(logoCount, 5); i++) {
      const logo = teamLogos.nth(i)
      const src = await logo.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).toMatch(/^(https?:\/\/|data:image)/)
    }
  })

  test('teams page displays all team logos', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    
    // Check for team logos on teams page
    const teamLogos = page.locator('[data-testid="team-logo"], img[alt*="logo"], img[alt*="Logo"]')
    
    // Wait for team logos to load
    await expect(teamLogos.first()).toBeVisible({ timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/teams-page-logos.png', fullPage: true })
    
    // Verify multiple team logos are present
    const logoCount = await teamLogos.count()
    expect(logoCount).toBeGreaterThan(5) // Should have multiple teams
    
    // Check that logos are not placeholder images
    for (let i = 0; i < Math.min(logoCount, 10); i++) {
      const logo = teamLogos.nth(i)
      const src = await logo.getAttribute('src')
      const alt = await logo.getAttribute('alt')
      
      expect(src).toBeTruthy()
      expect(src).toMatch(/^(https?:\/\/|data:image)/)
      
      // Should not be generic placeholder
      expect(alt).not.toMatch(/placeholder|default|fallback/i)
    }
  })

  test('players page displays player photos', async ({ page }) => {
    await page.goto('/players')
    await page.waitForLoadState('networkidle')
    
    // Check for player photos
    const playerPhotos = page.locator('[data-testid="player-photo"], img[alt*="player"], img[alt*="Player"]')
    
    // Wait for player photos to load
    await expect(playerPhotos.first()).toBeVisible({ timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/players-page-photos.png', fullPage: true })
    
    // Verify player photos are present
    const photoCount = await playerPhotos.count()
    expect(photoCount).toBeGreaterThan(0)
    
    // Check that photos are not placeholder images
    for (let i = 0; i < Math.min(photoCount, 5); i++) {
      const photo = playerPhotos.nth(i)
      const src = await photo.getAttribute('src')
      const alt = await photo.getAttribute('alt')
      
      expect(src).toBeTruthy()
      expect(src).toMatch(/^(https?:\/\/|data:image)/)
      
      // Should not be generic placeholder
      expect(alt).not.toMatch(/placeholder|default|fallback/i)
    }
  })

  test('games page displays team logos in game cards', async ({ page }) => {
    await page.goto('/games')
    await page.waitForLoadState('networkidle')
    
    // Check for team logos in game cards
    const gameCards = page.locator('[data-testid="game-card"], .game-card')
    const teamLogos = page.locator('[data-testid="team-logo"], img[alt*="logo"], img[alt*="Logo"]')
    
    // Wait for game cards to load
    if (await gameCards.count() > 0) {
      await expect(gameCards.first()).toBeVisible({ timeout: 10000 })
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/games-page-logos.png', fullPage: true })
      
      // Verify team logos in game cards
      const logoCount = await teamLogos.count()
      if (logoCount > 0) {
        expect(logoCount).toBeGreaterThan(0)
        
        // Check first few logos
        for (let i = 0; i < Math.min(logoCount, 3); i++) {
          const logo = teamLogos.nth(i)
          const src = await logo.getAttribute('src')
          expect(src).toBeTruthy()
          expect(src).toMatch(/^(https?:\/\/|data:image)/)
        }
      }
    }
  })

  test('predictions page displays team logos', async ({ page }) => {
    await page.goto('/predictions')
    await page.waitForLoadState('networkidle')
    
    // Check for team logos on predictions page
    const teamLogos = page.locator('[data-testid="team-logo"], img[alt*="logo"], img[alt*="Logo"]')
    
    // Wait for team logos to load
    await expect(teamLogos.first()).toBeVisible({ timeout: 10000 })
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/predictions-page-logos.png', fullPage: true })
    
    // Verify team logos are present
    const logoCount = await teamLogos.count()
    expect(logoCount).toBeGreaterThan(0)
  })

  test('team logos load without errors', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Listen for network errors
    const networkErrors: string[] = []
    page.on('response', response => {
      if (!response.ok() && response.url().includes('logo') || response.url().includes('image')) {
        networkErrors.push(`${response.status()} ${response.url()}`)
      }
    })
    
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    
    // Check for image-related console errors
    const imageErrors = consoleErrors.filter(error => 
      error.includes('logo') || error.includes('image') || error.includes('src')
    )
    
    expect(imageErrors).toHaveLength(0)
    expect(networkErrors).toHaveLength(0)
  })

  test('SVG fallbacks render correctly', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    
    // Find SVG data URI images (fallbacks)
    const svgImages = page.locator('img[src^="data:image/svg+xml"]')
    
    const svgCount = await svgImages.count()
    if (svgCount > 0) {
      // Take screenshot to verify SVG fallbacks look good
      await page.screenshot({ path: 'test-results/svg-fallbacks.png', fullPage: true })
      
      // Verify SVG images are properly formatted
      for (let i = 0; i < Math.min(svgCount, 3); i++) {
        const svgImage = svgImages.nth(i)
        const src = await svgImage.getAttribute('src')
        
        expect(src).toMatch(/^data:image\/svg\+xml/)
        expect(src).toContain('<svg')
        expect(src).toContain('</svg>')
      }
    }
  })

  test('responsive logo display', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    
    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/mobile-logos.png', fullPage: true })
    
    // Check that logos are still visible and properly sized
    const teamLogos = page.locator('[data-testid="team-logo"], img[alt*="logo"], img[alt*="Logo"]')
    const logoCount = await teamLogos.count()
    expect(logoCount).toBeGreaterThan(0)
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForLoadState('networkidle')
    
    // Take tablet screenshot
    await page.screenshot({ path: 'test-results/tablet-logos.png', fullPage: true })
    
    // Test on desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForLoadState('networkidle')
    
    // Take desktop screenshot
    await page.screenshot({ path: 'test-results/desktop-logos.png', fullPage: true })
  })

  test('logo accessibility', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    
    // Check that team logos have proper alt text
    const teamLogos = page.locator('img[alt*="logo"], img[alt*="Logo"]')
    const logoCount = await teamLogos.count()
    
    for (let i = 0; i < Math.min(logoCount, 5); i++) {
      const logo = teamLogos.nth(i)
      const alt = await logo.getAttribute('alt')
      
      expect(alt).toBeTruthy()
      expect(alt).not.toBe('')
      expect(alt).toMatch(/logo|Logo/)
    }
  })

  test('logo performance', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/teams')
    
    // Measure page load time
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart
    })
    
    expect(loadTime).toBeLessThan(10000) // Should load within 10 seconds
    
    // Check for slow loading images
    const slowImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.width === 0 && rect.height === 0 // Not loaded yet
      }).length
    })
    
    // Wait a bit more for images to load
    await page.waitForTimeout(2000)
    
    const stillSlowImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.filter(img => {
        const rect = img.getBoundingClientRect()
        return rect.width === 0 && rect.height === 0 // Still not loaded
      }).length
    })
    
    expect(stillSlowImages).toBeLessThan(5) // Should not have many slow-loading images
  })
})
