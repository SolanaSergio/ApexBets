import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { serviceFactory, SupportedSport } from "@/lib/services/core/service-factory"
import { SportOddsService } from "@/lib/services/odds/sport-odds-service"
import { SportPredictionService } from "@/lib/services/predictions/sport-prediction-service"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    
    if (!sport) {
      return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
    }
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
      errors: [] as string[]
    }

    try {
      // 1. Populate teams
      console.log(`Populating teams for ${sport}${league ? ` (${league})` : ''}...`)
      const sportService = await serviceFactory.getService(sport as SupportedSport, league || undefined)
      const teams = await sportService.getTeams({ league })
      
      for (const team of teams) {
        const { error } = await supabase
          .from("teams")
          .upsert({
            name: team.name,
            city: team.city,
            league: team.league,
            sport: team.sport,
            abbreviation: team.abbreviation,
            logo_url: (team as any).logo_url || (team as any).logo,
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

      const games = await sportService.getGames({
        date: startDate.toISOString().split('T')[0]
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

      // 5. Generate predictions using real ML models
      console.log("Generating predictions using ML models...")
      const { data: gamesForPredictions } = await supabase
        .from("games")
        .select("id, home_team_id, away_team_id, home_score, away_score, game_date")
        .eq("sport", sport)
        .gte("game_date", startDate.toISOString())
        .lte("game_date", endDate.toISOString())

      for (const game of gamesForPredictions || []) {
        try {
          // Use real ML prediction service instead of sample data
          const predictionService = new SportPredictionService(sport as SupportedSport)
          const predictions = await predictionService.getPredictions({ gameId: game.id })
          
          for (const prediction of predictions) {
            const { error } = await supabase
              .from("predictions")
              .upsert({
                game_id: prediction.gameId,
                model_name: prediction.model,
                prediction_type: 'game_outcome',
                predicted_value: prediction.homeWinProbability,
                confidence: prediction.confidence,
                actual_value: null, // Will be updated when game is finished
                is_correct: null, // Will be updated when game is finished
                sport: sport,
                league: league,
                reasoning: prediction.factors.join(', ')
              }, { onConflict: "game_id,model_name,prediction_type" })

            if (error) {
              results.errors.push(`Prediction ${game.id}: ${error.message}`)
            } else {
              results.predictions++
            }
          }
        } catch (predictionError) {
          results.errors.push(`Prediction generation failed for game ${game.id}: ${predictionError}`)
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
  // Get real player stats from external APIs
  try {
    const sportService = await serviceFactory.getService(sport as SupportedSport)
    return await sportService.getPlayers({ gameId })
  } catch (error) {
    console.error(`Error fetching player stats for game ${gameId}:`, error)
    return []
  }
}

async function getOddsForGame(gameId: string, sport: string): Promise<any[]> {
  // Get real odds from external APIs
  try {
    const oddsService = new SportOddsService(sport as SupportedSport)
    return await oddsService.getOdds({ gameId })
  } catch (error) {
    console.error(`Error fetching odds for game ${gameId}:`, error)
    return []
  }
}
