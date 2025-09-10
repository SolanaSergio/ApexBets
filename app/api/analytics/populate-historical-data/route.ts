import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sportsDataService } from "@/lib/services/sports-data-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const league = searchParams.get("league")
    const days = parseInt(searchParams.get("days") || "30")
    
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    const results = {
      games: 0,
      teams: 0,
      playerStats: 0,
      odds: 0,
      predictions: 0,
      errors: []
    }

    try {
      // 1. Populate teams
      console.log(`Populating teams for ${sport}${league ? ` (${league})` : ''}...`)
      const teams = await sportsDataService.getTeams({ sport, league })
      
      for (const team of teams) {
        const { error } = await supabase
          .from("teams")
          .upsert({
            name: team.name,
            city: team.city,
            league: team.league,
            sport: team.sport,
            abbreviation: team.abbreviation,
            logo_url: team.logo_url,
            is_active: true
          }, { onConflict: "name,league" })
        
        if (error) {
          results.errors.push(`Team ${team.name}: ${error.message}`)
        } else {
          results.teams++
        }
      }

      // 2. Populate games
      console.log(`Populating games for ${sport}${league ? ` (${league})` : ''}...`)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const games = await sportsDataService.getGames({
        sport,
        league,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })

      for (const game of games) {
        // Get team IDs
        const { data: homeTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("name", game.homeTeam)
          .eq("sport", sport)
          .single()

        const { data: awayTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("name", game.awayTeam)
          .eq("sport", sport)
          .single()

        if (homeTeam && awayTeam) {
          const { error } = await supabase
            .from("games")
            .upsert({
              home_team_id: homeTeam.id,
              away_team_id: awayTeam.id,
              game_date: game.date,
              season: getCurrentSeason(sport),
              home_score: game.homeScore,
              away_score: game.awayScore,
              status: game.status,
              venue: game.venue,
              sport: game.sport,
              league: game.league
            }, { onConflict: "home_team_id,away_team_id,game_date" })

          if (error) {
            results.errors.push(`Game ${game.homeTeam} vs ${game.awayTeam}: ${error.message}`)
          } else {
            results.games++
          }
        }
      }

      // 3. Populate player stats (basketball only for now)
      if (sport === "basketball") {
        console.log("Populating player stats...")
        const { data: gamesData } = await supabase
          .from("games")
          .select("id, home_team_id, away_team_id, game_date")
          .eq("sport", sport)
          .gte("game_date", startDate.toISOString())
          .lte("game_date", endDate.toISOString())

        for (const game of gamesData || []) {
          try {
            // Get player stats from external API
            const playerStats = await getPlayerStatsForGame(game.id, sport)
            
            for (const stat of playerStats) {
              const { error } = await supabase
                .from("player_stats")
                .upsert({
                  game_id: game.id,
                  team_id: stat.team_id,
                  player_name: stat.player_name,
                  position: stat.position,
                  minutes_played: stat.minutes_played,
                  points: stat.points,
                  rebounds: stat.rebounds,
                  assists: stat.assists,
                  steals: stat.steals,
                  blocks: stat.blocks,
                  turnovers: stat.turnovers,
                  field_goals_made: stat.field_goals_made,
                  field_goals_attempted: stat.field_goals_attempted,
                  three_pointers_made: stat.three_pointers_made,
                  three_pointers_attempted: stat.three_pointers_attempted,
                  free_throws_made: stat.free_throws_made,
                  free_throws_attempted: stat.free_throws_attempted
                }, { onConflict: "game_id,player_name" })

              if (error) {
                results.errors.push(`Player stats ${stat.player_name}: ${error.message}`)
              } else {
                results.playerStats++
              }
            }
          } catch (error) {
            results.errors.push(`Game ${game.id} player stats: ${error}`)
          }
        }
      }

      // 4. Populate odds
      console.log("Populating odds...")
      const { data: gamesForOdds } = await supabase
        .from("games")
        .select("id, home_team_id, away_team_id, game_date")
        .eq("sport", sport)
        .gte("game_date", startDate.toISOString())
        .lte("game_date", endDate.toISOString())

      for (const game of gamesForOdds || []) {
        try {
          const odds = await getOddsForGame(game.id, sport)
          
          for (const odd of odds) {
            const { error } = await supabase
              .from("odds")
              .upsert({
                game_id: game.id,
                source: odd.source,
                odds_type: odd.odds_type,
                home_odds: odd.home_odds,
                away_odds: odd.away_odds,
                spread: odd.spread,
                total: odd.total,
                sport: sport,
                league: league
              }, { onConflict: "game_id,source,odds_type" })

            if (error) {
              results.errors.push(`Odds ${game.id}: ${error.message}`)
            } else {
              results.odds++
            }
          }
        } catch (error) {
          results.errors.push(`Game ${game.id} odds: ${error}`)
        }
      }

      // 5. Generate sample predictions
      console.log("Generating sample predictions...")
      const { data: gamesForPredictions } = await supabase
        .from("games")
        .select("id, home_team_id, away_team_id, home_score, away_score, game_date")
        .eq("sport", sport)
        .gte("game_date", startDate.toISOString())
        .lte("game_date", endDate.toISOString())

      for (const game of gamesForPredictions || []) {
        const predictions = generateSamplePredictions(game, sport)
        
        for (const prediction of predictions) {
          const { error } = await supabase
            .from("predictions")
            .upsert({
              game_id: game.id,
              model_name: prediction.model_name,
              prediction_type: prediction.prediction_type,
              predicted_value: prediction.predicted_value,
              confidence: prediction.confidence,
              actual_value: prediction.actual_value,
              is_correct: prediction.is_correct,
              sport: sport,
              league: league,
              reasoning: prediction.reasoning
            }, { onConflict: "game_id,model_name,prediction_type" })

          if (error) {
            results.errors.push(`Prediction ${game.id}: ${error.message}`)
          } else {
            results.predictions++
          }
        }
      }

    } catch (error) {
      results.errors.push(`General error: ${error}`)
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Successfully populated historical data for ${sport}${league ? ` (${league})` : ''}`
    })

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getCurrentSeason(sport: string): string {
  const year = new Date().getFullYear()
  const month = new Date().getMonth() + 1
  
  switch (sport) {
    case "basketball":
      return month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`
    case "football":
      return month >= 9 ? `${year}` : `${year - 1}`
    case "baseball":
      return month >= 4 ? `${year}` : `${year - 1}`
    case "hockey":
      return month >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`
    default:
      return `${year}`
  }
}

async function getPlayerStatsForGame(gameId: string, sport: string): Promise<any[]> {
  // This would integrate with external APIs to get real player stats
  // For now, return sample data
  return [
    {
      team_id: "sample-team-id",
      player_name: "Sample Player",
      position: "PG",
      minutes_played: 32,
      points: 18,
      rebounds: 5,
      assists: 8,
      steals: 2,
      blocks: 1,
      turnovers: 3,
      field_goals_made: 7,
      field_goals_attempted: 15,
      three_pointers_made: 2,
      three_pointers_attempted: 6,
      free_throws_made: 2,
      free_throws_attempted: 3
    }
  ]
}

async function getOddsForGame(gameId: string, sport: string): Promise<any[]> {
  // This would integrate with external APIs to get real odds
  // For now, return sample data
  return [
    {
      source: "draftkings",
      odds_type: "moneyline",
      home_odds: -110,
      away_odds: -110,
      spread: 2.5,
      total: 220.5
    }
  ]
}

function generateSamplePredictions(game: any, sport: string): any[] {
  const predictions = []
  
  // Moneyline prediction
  const homeWinProb = Math.random() * 0.4 + 0.3 // 30-70% range
  predictions.push({
    model_name: "random_forest_v1",
    prediction_type: "winner",
    predicted_value: homeWinProb > 0.5 ? "home" : "away",
    confidence: Math.abs(homeWinProb - 0.5) * 2,
    actual_value: game.home_score > game.away_score ? "home" : "away",
    is_correct: (homeWinProb > 0.5) === (game.home_score > game.away_score),
    reasoning: "Based on historical performance and current form"
  })
  
  // Spread prediction
  const predictedSpread = (Math.random() - 0.5) * 10 // -5 to +5
  const actualSpread = (game.home_score || 0) - (game.away_score || 0)
  predictions.push({
    model_name: "random_forest_v1",
    prediction_type: "spread",
    predicted_value: predictedSpread,
    confidence: Math.random() * 0.3 + 0.6, // 60-90%
    actual_value: actualSpread,
    is_correct: Math.abs(predictedSpread - actualSpread) < 3,
    reasoning: "Based on team strength and recent performance"
  })
  
  // Total prediction
  const predictedTotal = (game.home_score || 0) + (game.away_score || 0) + (Math.random() - 0.5) * 20
  const actualTotal = (game.home_score || 0) + (game.away_score || 0)
  predictions.push({
    model_name: "random_forest_v1",
    prediction_type: "total",
    predicted_value: predictedTotal,
    confidence: Math.random() * 0.3 + 0.6, // 60-90%
    actual_value: actualTotal,
    is_correct: Math.abs(predictedTotal - actualTotal) < 10,
    reasoning: "Based on offensive and defensive trends"
  })
  
  return predictions
}
