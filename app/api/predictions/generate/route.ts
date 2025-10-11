import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Note: No direct DB writes in website runtime; use Supabase Edge Function for mutations
import { EnsembleModel, TeamStats, GameContext } from '@/lib/ml/prediction-algorithms'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Generate new ML predictions for upcoming games
 * This endpoint creates fresh predictions using advanced ML algorithms
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport')
    if (!sport) {
      return NextResponse.json({ success: false, error: 'sport required' }, { status: 400 })
    }
    const league = searchParams.get('league') || undefined
    const gameId = searchParams.get('gameId') || undefined

    // Edge Function config
    const edgeBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_EDGE_URL as string | undefined
    const fnName = process.env.GENERATE_PREDICTIONS_EDGE_FUNCTION_NAME as string | undefined
    const edgeSecret = process.env.EDGE_FUNCTION_SECRET as string | undefined

    // Get games to predict (upcoming or specific game)
    let gamesQuery = supabase
      .from('games')
      .select(
        `
        *,
        home_team_data:teams!games_home_team_id_fkey(
          id, name, abbreviation,
          league_standings!league_standings_team_id_fkey(*)
        ),
        away_team_data:teams!games_away_team_id_fkey(
          id, name, abbreviation,
          league_standings!league_standings_team_id_fkey(*)
        )
      `
      )
      .eq('sport', sport)
      .in('status', ['scheduled', 'live'])

    if (league) {
      gamesQuery = gamesQuery.eq('league_name', league)
    }

    if (gameId) {
      gamesQuery = gamesQuery.eq('id', gameId)
    } else {
      gamesQuery = gamesQuery.limit(5) // Limit to 5 games for performance
    }

    // Fetch candidate games via read path (database-first APIs) using same-origin
    const listUrl = new URL('/api/database-first/games', request.url)
    listUrl.searchParams.set('sport', sport)
    if (league) listUrl.searchParams.set('league', league)
    if (gameId) listUrl.searchParams.set('id', gameId)
    listUrl.searchParams.set('status', 'scheduled')
    const listRes = await fetch(listUrl.toString(), { method: 'GET' })
    if (!listRes.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch games' }, { status: 502 })
    }
    const listPayload = await listRes.json()
    const games = Array.isArray(listPayload?.data)
      ? listPayload.data
      : Array.isArray(listPayload)
        ? listPayload
        : []

    if (!games || games.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No games found for prediction',
          details: undefined,
        },
        { status: 404 }
      )
    }

    const predictions = []

    // Generate predictions for each game
    for (const game of games) {
      try {
        // Get team standings data
        const homeStandings = game.home_team_data?.league_standings?.[0]
        const awayStandings = game.away_team_data?.league_standings?.[0]

        if (!homeStandings || !awayStandings) {
          console.warn(`Missing standings data for game ${game.id}`)
          continue
        }

        // Convert to TeamStats format for ML algorithms
        const homeStats: TeamStats = {
          wins: homeStandings.wins || 0,
          losses: homeStandings.losses || 0,
          ties: homeStandings.ties || 0,
          pointsFor: homeStandings.points_for || 0,
          pointsAgainst: homeStandings.points_against || 0,
          homeRecord: {
            wins: homeStandings.home_wins || 0,
            losses: homeStandings.home_losses || 0,
            ties: homeStandings.home_ties || 0,
          },
          awayRecord: {
            wins: homeStandings.away_wins || 0,
            losses: homeStandings.away_losses || 0,
            ties: homeStandings.away_ties || 0,
          },
          recentForm: homeStandings.streak ? parseStreakToForm(homeStandings.streak) : [],
          strengthOfSchedule: 0.5, // Default - could be calculated
          avgMarginOfVictory: homeStandings.point_differential || 0,
          consistency: 0.7, // Default - could be calculated from game-by-game variance
        }

        const awayStats: TeamStats = {
          wins: awayStandings.wins || 0,
          losses: awayStandings.losses || 0,
          ties: awayStandings.ties || 0,
          pointsFor: awayStandings.points_for || 0,
          pointsAgainst: awayStandings.points_against || 0,
          homeRecord: {
            wins: awayStandings.home_wins || 0,
            losses: awayStandings.home_losses || 0,
            ties: awayStandings.home_ties || 0,
          },
          awayRecord: {
            wins: awayStandings.away_wins || 0,
            losses: awayStandings.away_losses || 0,
            ties: awayStandings.away_ties || 0,
          },
          recentForm: awayStandings.streak ? parseStreakToForm(awayStandings.streak) : [],
          strengthOfSchedule: 0.5,
          avgMarginOfVictory: awayStandings.point_differential || 0,
          consistency: 0.7,
        }

        // Create game context
        const gameContext: GameContext = {
          isPlayoffs: game.game_type === 'playoffs' || game.season?.includes('playoffs'),
          isRivalry: false, // Could be enhanced with rivalry detection
          restDays: calculateRestDays(game.game_date),
          travelDistance: 0, // Could be calculated
          venue: game.venue ?? null,
          weather: game.weather_conditions,
          sport: game.sport,
        }

        // Generate ML prediction using ensemble model
        const mlPrediction = EnsembleModel.predict(homeStats, awayStats, gameContext)

        // Persist via Edge Function if configured
        let storedPredictionId: string | undefined
        if (edgeBaseUrl && fnName && edgeSecret) {
          try {
            const res = await fetch(`${edgeBaseUrl}/${fnName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${edgeSecret}`,
              },
              body: JSON.stringify({
                action: 'insert_prediction',
                sport: game.sport,
                league: game.league,
                gameId: game.id,
                winner: mlPrediction.homeWinProbability > 0.5 ? 'home' : 'away',
                confidence: mlPrediction.confidence,
                model: mlPrediction.model,
                featureImportance: mlPrediction.featureImportance,
                confidenceInterval: {
                  low: Math.max(0, mlPrediction.homeWinProbability - 0.1),
                  high: Math.min(1, mlPrediction.homeWinProbability + 0.1),
                },
              }),
            })
            if (res.ok) {
              const j = await res.json()
              storedPredictionId = j?.id
            }
          } catch {}
        }

        // Add to results
        predictions.push({
          gameId: game.id,
          homeTeam: game.home_team_data?.name ?? null,
          awayTeam: game.away_team_data?.name ?? null,
          prediction: mlPrediction,
          game: {
            date: game.game_date,
            venue: game.venue,
            status: game.status,
          },
          storedPredictionId,
        })

        // Also generate spread and total predictions
        if (mlPrediction.predictedSpread !== 0 && edgeBaseUrl && fnName && edgeSecret) {
          try {
            await fetch(`${edgeBaseUrl}/${fnName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${edgeSecret}`,
              },
              body: JSON.stringify({
                action: 'insert_prediction_spread',
                sport: game.sport,
                league: game.league,
                gameId: game.id,
                spread: mlPrediction.predictedSpread,
                confidence: mlPrediction.confidence * 0.9,
                model: mlPrediction.model,
              }),
            })
          } catch {}
        }

        if (mlPrediction.predictedTotal > 0 && edgeBaseUrl && fnName && edgeSecret) {
          try {
            await fetch(`${edgeBaseUrl}/${fnName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${edgeSecret}`,
              },
              body: JSON.stringify({
                action: 'insert_prediction_total',
                sport: game.sport,
                league: game.league,
                gameId: game.id,
                total: mlPrediction.predictedTotal,
                confidence: mlPrediction.confidence * 0.85,
                model: mlPrediction.model,
              }),
            })
          } catch {}
        }
      } catch (error) {
        console.error(`Error generating prediction for game ${game.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      sport,
      league: league || 'all',
      predictionsGenerated: predictions.length,
      predictions,
      meta: {
        timestamp: new Date().toISOString(),
        model: 'ensemble_ml_v2.1',
        gamesAnalyzed: games.length,
      },
    })
  } catch (error) {
    console.error('Error in prediction generation:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to parse streak string to recent form array
 */
function parseStreakToForm(streak: string): string[] {
  if (!streak) return []

  // Handle different streak formats
  // Example: "W3" = ["W", "W", "W"], "L2" = ["L", "L"]
  const match = streak.match(/([WL])(\d+)/)
  if (match) {
    const [, result, count] = match
    return Array(parseInt(count)).fill(result)
  }

  // Handle comma-separated format: "W,W,L,W,W"
  if (streak.includes(',')) {
    return streak
      .split(',')
      .map(s => s.trim())
      .filter(s => s === 'W' || s === 'L')
  }

  // Handle simple format: "WWLWW"
  return streak.split('').filter(s => s === 'W' || s === 'L')
}

/**
 * Calculate rest days between games
 */
function calculateRestDays(gameDate: string): number {
  const gameTime = new Date(gameDate)
  const now = new Date()
  const diffTime = gameTime.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}
