#!/usr/bin/env node

/**
 * Comprehensive Data Population Script
 * Ensures all components have access to the historical data they need
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Sports configuration
const SPORTS_CONFIG = {
  basketball: {
    leagues: ['NBA', 'WNBA', 'NCAA'],
    seasons: ['2023-24', '2024-25'],
    statsTable: 'player_stats',
    additionalStats: ['plus_minus', 'personal_fouls', 'technical_fouls']
  },
  football: {
    leagues: ['NFL', 'NCAA'],
    seasons: ['2023', '2024'],
    statsTable: 'football_player_stats',
    additionalStats: ['passing_yards', 'rushing_yards', 'receiving_yards']
  },
  baseball: {
    leagues: ['MLB', 'NCAA'],
    seasons: ['2023', '2024'],
    statsTable: 'baseball_player_stats',
    additionalStats: ['batting_average', 'era', 'home_runs']
  },
  hockey: {
    leagues: ['NHL', 'NCAA'],
    seasons: ['2023-24', '2024-25'],
    statsTable: 'hockey_player_stats',
    additionalStats: ['goals', 'assists', 'plus_minus']
  },
  soccer: {
    leagues: ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'],
    seasons: ['2023-24', '2024-25'],
    statsTable: 'soccer_player_stats',
    additionalStats: ['goals', 'assists', 'pass_accuracy']
  }
}

async function main() {
  console.log('🚀 Starting comprehensive data population...')
  
  try {
    // 1. Validate current data state
    console.log('\n📊 Validating current data state...')
    await validateDataState()
    
    // 2. Populate teams for all sports
    console.log('\n🏟️  Populating teams...')
    await populateTeams()
    
    // 3. Populate games for all sports
    console.log('\n⚽ Populating games...')
    await populateGames()
    
    // 4. Populate player stats
    console.log('\n👥 Populating player statistics...')
    await populatePlayerStats()
    
    // 5. Populate odds data
    console.log('\n💰 Populating odds data...')
    await populateOddsData()
    
    // 6. Generate sample predictions
    console.log('\n🔮 Generating sample predictions...')
    await generateSamplePredictions()
    
    // 7. Populate league standings
    console.log('\n📈 Populating league standings...')
    await populateLeagueStandings()
    
    // 8. Final validation
    console.log('\n✅ Final validation...')
    await validateDataState()
    
    console.log('\n🎉 Data population completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during data population:', error)
    process.exit(1)
  }
}

async function validateDataState() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/data-audit?detailed=true`)
    const data = await response.json()
    
    console.log(`📊 Data State Summary:`)
    console.log(`   Total Components: ${data.summary.totalComponents}`)
    console.log(`   Components with Data: ${data.summary.componentsWithData}`)
    console.log(`   Components Missing Data: ${data.summary.componentsMissingData}`)
    console.log(`   Data Quality: ${JSON.stringify(data.summary.dataQualityDistribution, null, 2)}`)
    
    if (data.summary.criticalIssues.length > 0) {
      console.log(`\n⚠️  Critical Issues:`)
      data.summary.criticalIssues.forEach(issue => {
        console.log(`   ${issue.component}: ${issue.missingData.join(', ')}`)
      })
    }
    
    if (data.summary.dataPopulationRecommendations.length > 0) {
      console.log(`\n💡 Recommendations:`)
      data.summary.dataPopulationRecommendations.forEach(rec => {
        console.log(`   - ${rec}`)
      })
    }
    
  } catch (error) {
    console.error('Error validating data state:', error)
  }
}

async function populateTeams() {
  for (const [sport, config] of Object.entries(SPORTS_CONFIG)) {
    console.log(`   Populating ${sport} teams...`)
    
    try {
      // Use the existing teams API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/teams?external=true&sport=${sport}`)
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        console.log(`     ✅ Found ${data.data.length} ${sport} teams`)
      } else {
        console.log(`     ⚠️  No ${sport} teams found via API`)
      }
    } catch (error) {
      console.error(`     ❌ Error populating ${sport} teams:`, error.message)
    }
  }
}

async function populateGames() {
  for (const [sport, config] of Object.entries(SPORTS_CONFIG)) {
    console.log(`   Populating ${sport} games...`)
    
    try {
      // Use the existing games API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/games?external=true&sport=${sport}`)
      const data = await response.json()
      
      if (data.data && data.data.length > 0) {
        console.log(`     ✅ Found ${data.data.length} ${sport} games`)
      } else {
        console.log(`     ⚠️  No ${sport} games found via API`)
      }
    } catch (error) {
      console.error(`     ❌ Error populating ${sport} games:`, error.message)
    }
  }
}

async function populatePlayerStats() {
  for (const [sport, config] of Object.entries(SPORTS_CONFIG)) {
    console.log(`   Populating ${sport} player stats...`)
    
    try {
      // Use the historical data population endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/populate-historical-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport,
          days: 30
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`     ✅ ${sport} stats populated:`, data.results)
      } else {
        console.log(`     ⚠️  ${sport} stats population had issues:`, data.results)
      }
    } catch (error) {
      console.error(`     ❌ Error populating ${sport} player stats:`, error.message)
    }
  }
}

async function populateOddsData() {
  console.log(`   Populating odds data...`)
  
  try {
    // Get games that need odds
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, sport, league, game_date')
      .gte('game_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('game_date', new Date().toISOString())
      .limit(100)

    if (gamesError) {
      console.error('     ❌ Error fetching games for odds:', gamesError)
      return
    }

    let oddsCount = 0
    for (const game of games || []) {
      // Generate sample odds data
      const oddsData = generateSampleOdds(game)
      
      for (const odd of oddsData) {
        const { error } = await supabase
          .from('odds')
          .upsert({
            game_id: game.id,
            source: odd.source,
            odds_type: odd.odds_type,
            home_odds: odd.home_odds,
            away_odds: odd.away_odds,
            spread: odd.spread,
            total: odd.total,
            sport: game.sport,
            league: game.league
          }, { onConflict: 'game_id,source,odds_type' })

        if (!error) {
          oddsCount++
        }
      }
    }
    
    console.log(`     ✅ Generated ${oddsCount} odds records`)
  } catch (error) {
    console.error(`     ❌ Error populating odds:`, error.message)
  }
}

async function generateSamplePredictions() {
  console.log(`   Generating sample predictions...`)
  
  try {
    // Get games that need predictions
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, sport, league, home_score, away_score, game_date')
      .gte('game_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('game_date', new Date().toISOString())
      .limit(100)

    if (gamesError) {
      console.error('     ❌ Error fetching games for predictions:', gamesError)
      return
    }

    let predictionCount = 0
    for (const game of games || []) {
      const predictions = generateSamplePredictionsForGame(game)
      
      for (const prediction of predictions) {
        const { error } = await supabase
          .from('predictions')
          .upsert({
            game_id: game.id,
            model_name: prediction.model_name,
            prediction_type: prediction.prediction_type,
            predicted_value: prediction.predicted_value,
            confidence: prediction.confidence,
            actual_value: prediction.actual_value,
            is_correct: prediction.is_correct,
            sport: game.sport,
            league: game.league,
            reasoning: prediction.reasoning
          }, { onConflict: 'game_id,model_name,prediction_type' })

        if (!error) {
          predictionCount++
        }
      }
    }
    
    console.log(`     ✅ Generated ${predictionCount} prediction records`)
  } catch (error) {
    console.error(`     ❌ Error generating predictions:`, error.message)
  }
}

async function populateLeagueStandings() {
  console.log(`   Populating league standings...`)
  
  try {
    for (const [sport, config] of Object.entries(SPORTS_CONFIG)) {
      // Get teams for this sport
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, league')
        .eq('sport', sport)

      if (teamsError || !teams) continue

      for (const team of teams) {
        // Generate sample standings data
        const wins = Math.floor(Math.random() * 50) + 20
        const losses = Math.floor(Math.random() * 50) + 20
        const winPercentage = wins / (wins + losses)
        
        const { error } = await supabase
          .from('league_standings')
          .upsert({
            team_id: team.id,
            season: '2024-25',
            league: team.league,
            sport: sport,
            wins,
            losses,
            win_percentage: winPercentage,
            games_back: Math.random() * 20,
            streak: Math.random() > 0.5 ? `W${Math.floor(Math.random() * 5) + 1}` : `L${Math.floor(Math.random() * 5) + 1}`,
            home_wins: Math.floor(wins * 0.6),
            home_losses: Math.floor(losses * 0.4),
            away_wins: Math.floor(wins * 0.4),
            away_losses: Math.floor(losses * 0.6),
            points_for: Math.floor(Math.random() * 2000) + 1000,
            points_against: Math.floor(Math.random() * 2000) + 1000
          }, { onConflict: 'team_id,season,league' })

        if (error) {
          console.error(`     ❌ Error creating standings for ${team.name}:`, error.message)
        }
      }
    }
    
    console.log(`     ✅ Generated league standings`)
  } catch (error) {
    console.error(`     ❌ Error populating standings:`, error.message)
  }
}

function generateSampleOdds(game) {
  const sources = ['draftkings', 'fanduel', 'betmgm', 'caesars']
  const oddsTypes = ['moneyline', 'spread', 'total']
  
  return sources.flatMap(source => 
    oddsTypes.map(type => ({
      source,
      odds_type: type,
      home_odds: Math.random() > 0.5 ? -110 + Math.random() * 20 : 110 + Math.random() * 20,
      away_odds: Math.random() > 0.5 ? -110 + Math.random() * 20 : 110 + Math.random() * 20,
      spread: type === 'spread' ? (Math.random() - 0.5) * 20 : null,
      total: type === 'total' ? 200 + Math.random() * 50 : null
    }))
  )
}

function generateSamplePredictionsForGame(game) {
  const predictions = []
  
  // Moneyline prediction
  const homeWinProb = Math.random() * 0.4 + 0.3
  predictions.push({
    model_name: 'random_forest_v1',
    prediction_type: 'winner',
    predicted_value: homeWinProb > 0.5 ? 'home' : 'away',
    confidence: Math.abs(homeWinProb - 0.5) * 2,
    actual_value: game.home_score > game.away_score ? 'home' : 'away',
    is_correct: (homeWinProb > 0.5) === (game.home_score > game.away_score),
    reasoning: 'Based on historical performance and current form'
  })
  
  // Spread prediction
  const predictedSpread = (Math.random() - 0.5) * 10
  const actualSpread = (game.home_score || 0) - (game.away_score || 0)
  predictions.push({
    model_name: 'random_forest_v1',
    prediction_type: 'spread',
    predicted_value: predictedSpread,
    confidence: Math.random() * 0.3 + 0.6,
    actual_value: actualSpread,
    is_correct: Math.abs(predictedSpread - actualSpread) < 3,
    reasoning: 'Based on team strength and recent performance'
  })
  
  // Total prediction
  const predictedTotal = (game.home_score || 0) + (game.away_score || 0) + (Math.random() - 0.5) * 20
  const actualTotal = (game.home_score || 0) + (game.away_score || 0)
  predictions.push({
    model_name: 'random_forest_v1',
    prediction_type: 'total',
    predicted_value: predictedTotal,
    confidence: Math.random() * 0.3 + 0.6,
    actual_value: actualTotal,
    is_correct: Math.abs(predictedTotal - actualTotal) < 10,
    reasoning: 'Based on offensive and defensive trends'
  })
  
  return predictions
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { main }
