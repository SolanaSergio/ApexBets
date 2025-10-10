/**
 * Logo Population Test Script
 * Tests the logo population system for all sports
 */

import { logoPopulationService } from '../lib/services/logo-population-service'

async function testLogoPopulation() {
  console.log('🚀 Starting Logo Population Test...\n')

  try {
    // Test 1: Get current logo statistics
    console.log('📊 Current Logo Statistics:')
    const stats = await logoPopulationService.getLogoStats()
    console.log(`Total Teams: ${stats.totalTeams}`)
    console.log(`Teams with Logos: ${stats.teamsWithLogos}`)
    console.log(`Teams without Logos: ${stats.teamsWithoutLogos}`)
    console.log('\nCoverage by Sport:')
    Object.entries(stats.coverageBySport).forEach(([sport, data]) => {
      console.log(`  ${sport}: ${data.withLogos}/${data.total} (${data.percentage}%)`)
    })
    console.log('\n')

    // Test 2: Populate logos for basketball teams (should have some success)
    console.log('🏀 Testing Basketball Logo Population:')
    const basketballResult = await logoPopulationService.populateAllLogos()
    console.log(`Processed: ${basketballResult.totalProcessed}`)
    console.log(`Successful: ${basketballResult.successful}`)
    console.log(`Failed: ${basketballResult.failed}`)
    console.log(`Success Rate: ${((basketballResult.successful / basketballResult.totalProcessed) * 100).toFixed(1)}%`)
    
    // Show some successful results
    const successfulResults = basketballResult.results.filter(r => r.success)
    if (successfulResults.length > 0) {
      console.log('\n✅ Successful Logo Updates:')
      successfulResults.slice(0, 5).forEach(result => {
        console.log(`  ${result.teamName} (${result.sport}): ${result.source} - ${result.logoUrl?.substring(0, 50)}...`)
      })
    }

    // Show some failed results
    const failedResults = basketballResult.results.filter(r => !r.success)
    if (failedResults.length > 0) {
      console.log('\n❌ Failed Logo Updates:')
      failedResults.slice(0, 5).forEach(result => {
        console.log(`  ${result.teamName} (${result.sport}): ${result.error}`)
      })
    }

    console.log('\n')

    // Test 3: Get updated statistics
    console.log('📊 Updated Logo Statistics:')
    const updatedStats = await logoPopulationService.getLogoStats()
    console.log(`Total Teams: ${updatedStats.totalTeams}`)
    console.log(`Teams with Logos: ${updatedStats.teamsWithLogos}`)
    console.log(`Teams without Logos: ${updatedStats.teamsWithoutLogos}`)
    console.log('\nCoverage by Sport:')
    Object.entries(updatedStats.coverageBySport).forEach(([sport, data]) => {
      console.log(`  ${sport}: ${data.withLogos}/${data.total} (${data.percentage}%)`)
    })

    console.log('\n🎉 Logo Population Test Completed!')

  } catch (error) {
    console.error('❌ Logo Population Test Failed:', error)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLogoPopulation()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testLogoPopulation }
