/**
 * Global Setup for E2E Tests
 * Runs before all tests
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E Test Global Setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Check if the application is running
    const title = await page.title()
    console.log(`📱 Application title: ${title}`)

    // Verify API endpoints are accessible
    console.log('🔍 Verifying API endpoints...')
    const healthResponse = await page.request.get('http://localhost:3000/api/health')
    if (healthResponse.ok()) {
      console.log('✅ Health endpoint is accessible')
    } else {
      console.log('❌ Health endpoint is not accessible')
    }

    // Set up test data if needed
    console.log('📊 Setting up test data...')
    // Add any test data setup here

    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
