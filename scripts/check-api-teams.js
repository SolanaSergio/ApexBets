#!/usr/bin/env node

/**
 * Check Teams API Response
 * Tests what the teams API is actually returning
 */

async function checkTeamsAPI() {
  console.log('🔍 Checking Teams API Response...\n')

  try {
    const baseUrl = 'http://localhost:3000'

    // Check basketball teams
    console.log('📊 Fetching basketball teams from API...')
    const response = await fetch(`${baseUrl}/api/database-first/teams?sport=basketball`)
    const data = await response.json()

    console.log('API Response Status:', response.status)
    console.log('API Response Keys:', Object.keys(data))
    console.log('Success:', data.success)
    console.log('Data length:', data.data ? data.data.length : 0)
    console.log('Meta:', JSON.stringify(data.meta, null, 2))

    if (data.data && data.data.length > 0) {
      console.log('\n📋 First 3 teams:')
      data.data.slice(0, 3).forEach((team, idx) => {
        console.log(`\n${idx + 1}. ${team.name || team.team_name || 'Unknown'}`)
        console.log(`   Sport: ${team.sport}`)
        console.log(`   Logo URL: ${team.logo_url || 'MISSING'}`)
        console.log(`   Columns: ${Object.keys(team).join(', ')}`)
      })
    }

    // Check all sports
    console.log('\n\n📊 Checking all sports...')
    const allResponse = await fetch(`${baseUrl}/api/database-first/teams?sport=all`)
    const allData = await allResponse.json()

    console.log('All Sports - Total teams:', allData.data ? allData.data.length : 0)

    if (allData.data && allData.data.length > 0) {
      const bySport = {}
      allData.data.forEach(team => {
        const sport = team.sport || 'unknown'
        if (!bySport[sport]) bySport[sport] = []
        bySport[sport].push(team)
      })

      console.log('\n📊 Teams by Sport:')
      for (const [sport, teams] of Object.entries(bySport)) {
        const withLogos = teams.filter(t => t.logo_url).length
        console.log(`  ${sport}: ${teams.length} teams (${withLogos} with logos)`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkTeamsAPI()
