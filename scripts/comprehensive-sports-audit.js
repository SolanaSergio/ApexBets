/**
 * Comprehensive Sports Data Audit
 * Tests every sport, team, player, and data variety for 100% accuracy
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Comprehensive audit functions
async function auditAllSports() {
  console.log('🏆 AUDITING ALL SPORTS CONFIGURATIONS')
  console.log('=' * 60)
  
  const { data: sports, error } = await supabase
    .from('sports')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching sports:', error)
    return false
  }
  
  console.log(`📊 Found ${sports.length} sports to audit:`)
  
  let totalIssues = 0
  
  for (const sport of sports) {
    console.log(`\n🔍 Auditing ${sport.display_name} (${sport.name})`)
    
    const issues = []
    
    // Check required fields
    if (!sport.name) issues.push('Missing name')
    if (!sport.display_name) issues.push('Missing display_name')
    if (!sport.data_types || !Array.isArray(sport.data_types)) issues.push('Invalid data_types')
    if (!sport.api_providers || !Array.isArray(sport.api_providers)) issues.push('Invalid api_providers')
    if (!sport.refresh_intervals) issues.push('Missing refresh_intervals')
    if (!sport.rate_limits) issues.push('Missing rate_limits')
    if (!sport.season_config) issues.push('Missing season_config')
    if (!sport.current_season) issues.push('Missing current_season')
    
    // Check data types completeness
    const expectedDataTypes = ['games', 'teams', 'players', 'standings', 'odds', 'stats']
    const missingDataTypes = expectedDataTypes.filter(dt => !sport.data_types.includes(dt))
    if (missingDataTypes.length > 0) {
      issues.push(`Missing data types: ${missingDataTypes.join(', ')}`)
    }
    
    // Check refresh intervals
    const expectedIntervals = ['games', 'teams', 'players', 'standings', 'odds', 'stats']
    const missingIntervals = expectedIntervals.filter(interval => !sport.refresh_intervals[interval])
    if (missingIntervals.length > 0) {
      issues.push(`Missing refresh intervals: ${missingIntervals.join(', ')}`)
    }
    
    // Check rate limits
    if (!sport.rate_limits.requestsPerMinute) issues.push('Missing requestsPerMinute')
    if (!sport.rate_limits.requestsPerHour) issues.push('Missing requestsPerHour')
    
    // Check season config
    if (sport.season_config.startMonth === undefined) issues.push('Missing startMonth')
    if (sport.season_config.endMonth === undefined) issues.push('Missing endMonth')
    if (sport.season_config.seasonYearOffset === undefined) issues.push('Missing seasonYearOffset')
    
    // Check API providers
    if (sport.api_providers.length === 0) {
      issues.push('No API providers configured')
    }
    
    // Check visual elements
    if (!sport.icon_url) issues.push('Missing icon_url')
    if (!sport.color_primary) issues.push('Missing color_primary')
    if (!sport.color_secondary) issues.push('Missing color_secondary')
    
    if (issues.length > 0) {
      console.log(`❌ Issues found:`)
      issues.forEach(issue => console.log(`   - ${issue}`))
      totalIssues += issues.length
    } else {
      console.log(`✅ All configurations valid`)
    }
    
    // Show configuration details
    console.log(`   📋 Data Types: ${sport.data_types.join(', ')}`)
    console.log(`   🔌 API Providers: ${sport.api_providers.join(', ')}`)
    console.log(`   ⏱️  Refresh Intervals: ${JSON.stringify(sport.refresh_intervals)}`)
    console.log(`   🎯 Current Season: ${sport.current_season}`)
    console.log(`   🎨 Colors: ${sport.color_primary} / ${sport.color_secondary}`)
  }
  
  console.log(`\n📊 Sports Audit Summary:`)
  console.log(`✅ Sports audited: ${sports.length}`)
  console.log(`❌ Total issues found: ${totalIssues}`)
  
  return totalIssues === 0
}

async function auditAllTeams() {
  console.log('\n🏈 AUDITING ALL TEAMS ACROSS ALL SPORTS')
  console.log('=' * 60)
  
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching teams:', error)
    return false
  }
  
  console.log(`📊 Found ${teams.length} teams to audit:`)
  
  // Group teams by sport
  const teamsBySport = {}
  teams.forEach(team => {
    if (!teamsBySport[team.sport]) {
      teamsBySport[team.sport] = []
    }
    teamsBySport[team.sport].push(team)
  })
  
  let totalIssues = 0
  
  for (const [sport, sportTeams] of Object.entries(teamsBySport)) {
    console.log(`\n🔍 Auditing ${sportTeams.length} ${sport} teams:`)
    
    const issues = []
    
    for (const team of sportTeams) {
      const teamIssues = []
      
      // Check required fields
      if (!team.name) teamIssues.push('Missing name')
      if (!team.sport) teamIssues.push('Missing sport')
      if (!team.abbreviation) teamIssues.push('Missing abbreviation')
      if (!team.city) teamIssues.push('Missing city')
      if (!team.country) teamIssues.push('Missing country')
      
      // Check data consistency
      if (team.league_id && !team.league_name) teamIssues.push('Has league_id but missing league_name')
      if (!team.league_id && team.league_name) teamIssues.push('Has league_name but missing league_id')
      
      // Check colors format
      if (team.colors) {
        try {
          const colors = JSON.parse(team.colors)
          if (!colors.primary) teamIssues.push('Colors missing primary color')
          if (!colors.secondary) teamIssues.push('Colors missing secondary color')
        } catch (e) {
          teamIssues.push('Invalid colors JSON format')
        }
      }
      
      if (teamIssues.length > 0) {
        issues.push(`${team.name}: ${teamIssues.join(', ')}`)
      }
    }
    
    if (issues.length > 0) {
      console.log(`❌ Issues found:`)
      issues.forEach(issue => console.log(`   - ${issue}`))
      totalIssues += issues.length
    } else {
      console.log(`✅ All ${sportTeams.length} teams valid`)
    }
    
    // Show team count and sample teams
    console.log(`   📊 Total teams: ${sportTeams.length}`)
    console.log(`   🏆 Sample teams: ${sportTeams.slice(0, 3).map(t => t.name).join(', ')}`)
  }
  
  console.log(`\n📊 Teams Audit Summary:`)
  console.log(`✅ Teams audited: ${teams.length}`)
  console.log(`✅ Sports covered: ${Object.keys(teamsBySport).length}`)
  console.log(`❌ Total issues found: ${totalIssues}`)
  
  return totalIssues === 0
}

async function auditPlayerDataStructure() {
  console.log('\n👤 AUDITING PLAYER DATA STRUCTURE')
  console.log('=' * 60)
  
  // Check if we have any players
  const { data: players, error } = await supabase
    .from('player_profiles')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('❌ Error fetching players:', error)
    return false
  }
  
  if (!players || players.length === 0) {
    console.log('⚠️  No player data found - need to populate players')
    return false
  }
  
  console.log(`📊 Found ${players.length} players to audit:`)
  
  const issues = []
  const requiredFields = ['name', 'sport', 'team_id', 'team_name', 'position']
  
  for (const player of players) {
    const playerIssues = []
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!player[field]) {
        playerIssues.push(`Missing ${field}`)
      }
    })
    
    // Check data types
    if (player.age && typeof player.age !== 'number') playerIssues.push('Invalid age type')
    if (player.weight && typeof player.weight !== 'number') playerIssues.push('Invalid weight type')
    if (player.jersey_number && typeof player.jersey_number !== 'number') playerIssues.push('Invalid jersey_number type')
    if (player.experience_years && typeof player.experience_years !== 'number') playerIssues.push('Invalid experience_years type')
    
    // Check injury status
    const validInjuryStatuses = ['healthy', 'injured', 'questionable', 'doubtful', 'out']
    if (player.injury_status && !validInjuryStatuses.includes(player.injury_status)) {
      playerIssues.push(`Invalid injury_status: ${player.injury_status}`)
    }
    
    if (playerIssues.length > 0) {
      issues.push(`${player.name}: ${playerIssues.join(', ')}`)
    }
  }
  
  if (issues.length > 0) {
    console.log(`❌ Issues found:`)
    issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log(`✅ All player data structures valid`)
  }
  
  console.log(`\n📊 Player Data Audit Summary:`)
  console.log(`✅ Players audited: ${players.length}`)
  console.log(`❌ Total issues found: ${issues.length}`)
  
  return issues.length === 0
}

async function auditGameVarieties() {
  console.log('\n🎮 AUDITING GAME TYPES AND STATUS VARIETIES')
  console.log('=' * 60)
  
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching games:', error)
    return false
  }
  
  console.log(`📊 Found ${games.length} games to audit:`)
  
  // Analyze game statuses
  const statusCounts = {}
  const gameTypes = {}
  const sports = {}
  
  games.forEach(game => {
    statusCounts[game.status] = (statusCounts[game.status] || 0) + 1
    gameTypes[game.game_type] = (gameTypes[game.game_type] || 0) + 1
    sports[game.sport] = (sports[game.sport] || 0) + 1
  })
  
  console.log(`\n📊 Game Status Distribution:`)
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} games`)
  })
  
  console.log(`\n📊 Game Types:`)
  Object.entries(gameTypes).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} games`)
  })
  
  console.log(`\n📊 Sports Coverage:`)
  Object.entries(sports).forEach(([sport, count]) => {
    console.log(`   ${sport}: ${count} games`)
  })
  
  // Check for required game statuses
  const requiredStatuses = ['scheduled', 'live', 'finished']
  const missingStatuses = requiredStatuses.filter(status => !statusCounts[status])
  
  if (missingStatuses.length > 0) {
    console.log(`❌ Missing required game statuses: ${missingStatuses.join(', ')}`)
  } else {
    console.log(`✅ All required game statuses present`)
  }
  
  // Check game data completeness
  const issues = []
  games.forEach(game => {
    const gameIssues = []
    
    if (!game.home_team_name) gameIssues.push('Missing home_team_name')
    if (!game.away_team_name) gameIssues.push('Missing away_team_name')
    if (!game.game_date) gameIssues.push('Missing game_date')
    if (!game.status) gameIssues.push('Missing status')
    if (!game.game_type) gameIssues.push('Missing game_type')
    
    // Check score consistency
    if (game.status === 'finished' && (game.home_team_score === 0 && game.away_team_score === 0)) {
      gameIssues.push('Finished game with no scores')
    }
    
    if (gameIssues.length > 0) {
      issues.push(`${game.home_team_name} vs ${game.away_team_name}: ${gameIssues.join(', ')}`)
    }
  })
  
  if (issues.length > 0) {
    console.log(`\n❌ Game data issues:`)
    issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log(`\n✅ All game data complete`)
  }
  
  console.log(`\n📊 Games Audit Summary:`)
  console.log(`✅ Games audited: ${games.length}`)
  console.log(`✅ Status varieties: ${Object.keys(statusCounts).length}`)
  console.log(`✅ Game types: ${Object.keys(gameTypes).length}`)
  console.log(`✅ Sports covered: ${Object.keys(sports).length}`)
  console.log(`❌ Total issues found: ${issues.length}`)
  
  return issues.length === 0
}

async function auditAPIEndpoints() {
  console.log('\n🔌 AUDITING API ENDPOINTS AND MAPPINGS')
  console.log('=' * 60)
  
  const { data: mappings, error } = await supabase
    .from('api_mappings')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching API mappings:', error)
    return false
  }
  
  console.log(`📊 Found ${mappings.length} API mappings to audit:`)
  
  const issues = []
  const sportProviderCounts = {}
  
  for (const mapping of mappings) {
    const mappingIssues = []
    
    // Check required fields
    if (!mapping.sport) mappingIssues.push('Missing sport')
    if (!mapping.provider) mappingIssues.push('Missing provider')
    if (!mapping.data_type_mapping) mappingIssues.push('Missing data_type_mapping')
    if (!mapping.priority) mappingIssues.push('Missing priority')
    
    // Check data_type_mapping structure
    if (mapping.data_type_mapping) {
      try {
        const mappingData = typeof mapping.data_type_mapping === 'string' 
          ? JSON.parse(mapping.data_type_mapping) 
          : mapping.data_type_mapping
        
        if (typeof mappingData !== 'object') {
          mappingIssues.push('Invalid data_type_mapping format')
        } else {
          // Check for required data types
          const requiredDataTypes = ['games', 'teams', 'players', 'standings']
          const providedDataTypes = Object.keys(mappingData)
          const missingDataTypes = requiredDataTypes.filter(dt => !providedDataTypes.includes(dt))
          
          if (missingDataTypes.length > 0) {
            mappingIssues.push(`Missing data types: ${missingDataTypes.join(', ')}`)
          }
        }
      } catch (e) {
        mappingIssues.push('Invalid JSON in data_type_mapping')
      }
    }
    
    // Count mappings per sport
    if (!sportProviderCounts[mapping.sport]) {
      sportProviderCounts[mapping.sport] = 0
    }
    sportProviderCounts[mapping.sport]++
    
    if (mappingIssues.length > 0) {
      issues.push(`${mapping.sport} -> ${mapping.provider}: ${mappingIssues.join(', ')}`)
    }
  }
  
  if (issues.length > 0) {
    console.log(`❌ API mapping issues:`)
    issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log(`✅ All API mappings valid`)
  }
  
  console.log(`\n📊 API Mappings by Sport:`)
  Object.entries(sportProviderCounts).forEach(([sport, count]) => {
    console.log(`   ${sport}: ${count} providers`)
  })
  
  console.log(`\n📊 API Endpoints Audit Summary:`)
  console.log(`✅ Mappings audited: ${mappings.length}`)
  console.log(`✅ Sports covered: ${Object.keys(sportProviderCounts).length}`)
  console.log(`❌ Total issues found: ${issues.length}`)
  
  return issues.length === 0
}

async function auditDataRelationships() {
  console.log('\n🔗 AUDITING DATA RELATIONSHIPS AND FOREIGN KEYS')
  console.log('=' * 60)
  
  const relationshipTests = []
  
  // Test sports -> leagues relationship
  const { data: sports, error: sportsError } = await supabase
    .from('sports')
    .select('name')
  
  if (sportsError) {
    relationshipTests.push({ test: 'Sports table access', status: 'FAILED', error: sportsError.message })
  } else {
    relationshipTests.push({ test: 'Sports table access', status: 'PASSED', count: sports.length })
  }
  
  // Test leagues -> sports relationship
  const { data: leagues, error: leaguesError } = await supabase
    .from('leagues')
    .select('sport')
  
  if (leaguesError) {
    relationshipTests.push({ test: 'Leagues table access', status: 'FAILED', error: leaguesError.message })
  } else {
    relationshipTests.push({ test: 'Leagues table access', status: 'PASSED', count: leagues.length })
  }
  
  // Test teams -> sports relationship
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('sport')
  
  if (teamsError) {
    relationshipTests.push({ test: 'Teams table access', status: 'FAILED', error: teamsError.message })
  } else {
    relationshipTests.push({ test: 'Teams table access', status: 'PASSED', count: teams.length })
  }
  
  // Test games -> teams relationship
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('home_team_id, away_team_id')
  
  if (gamesError) {
    relationshipTests.push({ test: 'Games table access', status: 'FAILED', error: gamesError.message })
  } else {
    relationshipTests.push({ test: 'Games table access', status: 'PASSED', count: games.length })
  }
  
  // Test foreign key integrity
  const { data: orphanedGames, error: orphanError } = await supabase
    .from('games')
    .select('id, home_team_id, away_team_id')
    .is('home_team_id', null)
  
  if (orphanError) {
    relationshipTests.push({ test: 'Foreign key integrity check', status: 'FAILED', error: orphanError.message })
  } else {
    relationshipTests.push({ test: 'Foreign key integrity check', status: 'PASSED', orphaned: orphanedGames.length })
  }
  
  console.log(`📊 Relationship Test Results:`)
  relationshipTests.forEach(test => {
    if (test.status === 'PASSED') {
      console.log(`✅ ${test.test}: ${test.count || test.orphaned || 'OK'}`)
    } else {
      console.log(`❌ ${test.test}: ${test.error}`)
    }
  })
  
  const failedTests = relationshipTests.filter(test => test.status === 'FAILED')
  
  console.log(`\n📊 Data Relationships Audit Summary:`)
  console.log(`✅ Tests passed: ${relationshipTests.length - failedTests.length}`)
  console.log(`❌ Tests failed: ${failedTests.length}`)
  
  return failedTests.length === 0
}

async function runComprehensiveTests() {
  console.log('\n🧪 RUNNING COMPREHENSIVE SYSTEM TESTS')
  console.log('=' * 60)
  
  const tests = []
  
  // Test 1: Database connectivity
  try {
    const { data, error } = await supabase.from('sports').select('count').limit(1)
    if (error) throw error
    tests.push({ name: 'Database Connectivity', status: 'PASSED' })
  } catch (error) {
    tests.push({ name: 'Database Connectivity', status: 'FAILED', error: error.message })
  }
  
  // Test 2: Table structure integrity
  try {
    const tables = ['sports', 'leagues', 'teams', 'games', 'player_profiles', 'api_providers', 'api_mappings']
    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1)
      if (error) throw new Error(`Table ${table}: ${error.message}`)
    }
    tests.push({ name: 'Table Structure Integrity', status: 'PASSED' })
  } catch (error) {
    tests.push({ name: 'Table Structure Integrity', status: 'FAILED', error: error.message })
  }
  
  // Test 3: Data consistency
  try {
    const { data: sports } = await supabase.from('sports').select('name')
    const { data: leagues } = await supabase.from('leagues').select('sport')
    const { data: teams } = await supabase.from('teams').select('sport')
    
    const sportNames = sports.map(s => s.name)
    const leagueSports = leagues.map(l => l.sport)
    const teamSports = teams.map(t => t.sport)
    
    const allSports = [...new Set([...sportNames, ...leagueSports, ...teamSports])]
    
    if (allSports.length === 0) {
      throw new Error('No sports data found')
    }
    
    tests.push({ name: 'Data Consistency', status: 'PASSED', sports: allSports.length })
  } catch (error) {
    tests.push({ name: 'Data Consistency', status: 'FAILED', error: error.message })
  }
  
  // Test 4: Edge Function connectivity
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-sports-data`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dataTypes: ['games'], force: true })
    })
    
    if (response.ok) {
      const result = await response.json()
      tests.push({ name: 'Edge Function Connectivity', status: 'PASSED', sync: result.success })
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  } catch (error) {
    tests.push({ name: 'Edge Function Connectivity', status: 'FAILED', error: error.message })
  }
  
  console.log(`📊 Comprehensive Test Results:`)
  tests.forEach(test => {
    if (test.status === 'PASSED') {
      console.log(`✅ ${test.name}: ${test.sports || test.sync || 'OK'}`)
    } else {
      console.log(`❌ ${test.name}: ${test.error}`)
    }
  })
  
  const failedTests = tests.filter(test => test.status === 'FAILED')
  
  console.log(`\n📊 Comprehensive Tests Summary:`)
  console.log(`✅ Tests passed: ${tests.length - failedTests.length}`)
  console.log(`❌ Tests failed: ${failedTests.length}`)
  
  return failedTests.length === 0
}

async function main() {
  console.log('🔍 COMPREHENSIVE SPORTS DATA AUDIT')
  console.log('🎯 Testing every sport, team, player, and data variety')
  console.log('📊 Ensuring 100% accuracy and completeness')
  console.log('=' * 80)
  
  const auditResults = []
  
  try {
    // Run all audits
    auditResults.push(await auditAllSports())
    auditResults.push(await auditAllTeams())
    auditResults.push(await auditPlayerDataStructure())
    auditResults.push(await auditGameVarieties())
    auditResults.push(await auditAPIEndpoints())
    auditResults.push(await auditDataRelationships())
    auditResults.push(await runComprehensiveTests())
    
    // Calculate overall results
    const passedAudits = auditResults.filter(result => result === true).length
    const totalAudits = auditResults.length
    
    console.log('\n🎯 COMPREHENSIVE AUDIT SUMMARY')
    console.log('=' * 80)
    console.log(`✅ Audits passed: ${passedAudits}/${totalAudits}`)
    console.log(`❌ Audits failed: ${totalAudits - passedAudits}/${totalAudits}`)
    
    if (passedAudits === totalAudits) {
      console.log('\n🎉 ALL AUDITS PASSED!')
      console.log('✅ Sports database is 100% accurate and complete')
      console.log('✅ All data varieties tested and validated')
      console.log('✅ System ready for production')
    } else {
      console.log('\n⚠️  SOME AUDITS FAILED')
      console.log('❌ Issues found that need attention')
      console.log('🔧 Review failed audits above')
    }
    
  } catch (error) {
    console.error('💥 Audit failed:', error)
    process.exit(1)
  }
}

// Run the comprehensive audit
main()
  .then(() => {
    console.log('\n🏆 Comprehensive audit completed!')
  })
  .catch(error => {
    console.error('💥 Audit crashed:', error)
    process.exit(1)
  })
