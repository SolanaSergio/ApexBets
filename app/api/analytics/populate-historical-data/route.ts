import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { serviceFactory, SupportedSport } from "@/lib/services/core/service-factory"
import { SportOddsService } from "@/lib/services/odds/sport-odds-service"
import { SportPredictionService } from "@/lib/services/predictions/sport-prediction-service"
import { cachedSupabaseQuery } from "@/lib/utils/supabase-query-cache"

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

      // Use cached query to get all teams for this sport once, instead of per game
      const allTeams = await cachedSupabaseQuery(
        'teams',
        'select',
        { sport: sport },
        async () => {
          const { data, error } = await supabase
            .from("teams")
            .select("id, name, sport")
            .eq("sport", sport)
          if (error) throw error
          return data || []
        }
      )

      // Create a map for quick lookup
      const teamMap = new Map<string, any>()
      allTeams.forEach(team => {
        teamMap.set(team.name, team)
      })

      for (const game of games) {
        // Use cached team lookups instead of database calls
        const homeTeam = teamMap.get(game.homeTeam)
        const awayTeam = teamMap.get(game.awayTeam)

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
        // Use cached query to prevent duplicate calls
        const gamesData = await cachedSupabaseQuery(
          'games',
          'select',
          { sport: sport, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
          async () => {
            const { data, error } = await supabase
              .from("games")
              .select("id, home_team_id, away_team_id, game_date")
              .eq("sport", sport)
              .gte("game_date", startDate.toISOString())
              .lte("game_date", endDate.toISOString())
            if (error) throw error
            return data || []
          }
        )

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
      // Use the same cached query for games to prevent duplicate calls
      const gamesForOdds = await cachedSupabaseQuery(
        'games',
        'select',
        { sport: sport, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        async () => {
          const { data, error } = await supabase
            .from("games")
            .select("id, home_team_id, away_team_id, game_date")
            .eq("sport", sport)
            .gte("game_date", startDate.toISOString())
            .lte("game_date", endDate.toISOString())
          if (error) throw error
          return data || []
        }
      )

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
      // Use the same cached query for games to prevent duplicate calls
      const gamesForPredictions = await cachedSupabaseQuery(
        'games',
        'select',
        { sport: sport, startDate: startDate.toISOString(), endDate: endDate.toISOString(), fields: 'id,home_team_id,away_team_id,game_date,home_score,away_score' },
        async () => {
          const { data, error } = await supabase
            .from("games")
            .select("id, home_team_id, away_team_id, game_date, home_score, away_score")
            .eq("sport", sport)
            .gte("game_date", startDate.toISOString())
            .lte("game_date", endDate.toISOString())
          if (error) throw error
          return data || []
        }
      )

      const predictionService = new SportPredictionService(sport as SupportedSport)
      
      for (const game of gamesForPredictions || []) {
        try {
          // Generate predictions using ML models
          const predictions = await predictionService.generatePredictions({
            gameId: game.id,
            homeTeamId: game.home_team_id,
            awayTeamId: game.away_team_id,
            gameDate: game.game_date
          })
          
          for (const prediction of predictions) {
            const { error } = await supabase
              .from("predictions")
              .upsert({
                game_id: game.id,
                prediction_type: prediction.type,
                home_win_probability: prediction.homeWinProbability,
                predicted_score_home: prediction.predictedScoreHome,
                predicted_score_away: prediction.predictedScoreAway,
                confidence: prediction.confidence,
                model_version: prediction.modelVersion,
                sport: sport
              }, { onConflict: "game_id,prediction_type" })

            if (error) {
              results.errors.push(`Prediction for game ${game.id}: ${error.message}`)
            } else {
              results.predictions++
            }
          }
        } catch (error) {
          results.errors.push(`Game ${game.id} predictions: ${error}`)
        }
      }

      return NextResponse.json({
        success: true,
        results,
        message: `Successfully populated data for ${sport}`
      })

    } catch (error) {
      console.error("Error populating historical data:", error)
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results
      }, { status: 500 })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Helper function to get current season
function getCurrentSeason(sport: string): string {
  const now = new Date()
  const year = now.getFullYear()
  
  switch (sport) {
    case "basketball":
      // NBA season spans two years
      return now.getMonth() >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`
    case "football":
      // NFL season is in one year
      return now.getMonth() >= 9 ? `${year + 1}` : `${year}`
    case "baseball":
      // MLB season is in one year
      return `${year}`
    case "hockey":
      // NHL season spans two years
      return now.getMonth() >= 10 ? `${year}-${year + 1}` : `${year - 1}-${year}`
    default:
      return `${year}`
  }
}

// Mock function - in real implementation this would fetch from external APIs
async function getPlayerStatsForGame(gameId: string, sport: string): Promise<any[]> {
  // This would be implemented with actual API calls
  return []
}

// Mock function - in real implementation this would fetch from external APIs
async function getOddsForGame(gameId: string, sport: string): Promise<any[]> {
  // This would be implemented with actual API calls
  return []
}