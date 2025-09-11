import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SportPredictionService } from "@/lib/services/predictions/sport-prediction-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const days = Number.parseInt(searchParams.get("days") || "7")

    // Get upcoming games (scheduled games in the next N days)
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const { data: upcomingGames, error: gamesError } = await supabase
      .from("games")
      .select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation)
      `)
      .eq("status", "scheduled")
      .gte("game_date", startDate.toISOString())
      .lte("game_date", endDate.toISOString())
      .order("game_date", { ascending: true })
      .limit(limit)

    if (gamesError) {
      console.error("Error fetching upcoming games:", gamesError)
      return NextResponse.json({ error: "Failed to fetch upcoming games" }, { status: 500 })
    }

    if (!upcomingGames || upcomingGames.length === 0) {
      return NextResponse.json([])
    }

    // Generate predictions for each upcoming game
    const predictions = []
    const predictionService = new SportPredictionService('basketball', 'NBA')
    
    for (const game of upcomingGames) {
      try {
        const gamePredictions = await predictionService.getPredictions({ gameId: game.id })
        if (gamePredictions && gamePredictions.length > 0) {
          const prediction = gamePredictions[0]
          predictions.push({
            id: prediction.gameId || `pred-${game.id}`,
            game_id: game.id,
            game: `${game.away_team?.name || 'Away'} @ ${game.home_team?.name || 'Home'}`,
            type: "winner",
            prediction: prediction.homeWinProbability || 0.5,
            confidence: prediction.confidence || 0.75,
            gameDate: new Date(game.game_date).toLocaleDateString(),
            gameTime: new Date(game.game_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: prediction.model || "AI Model v1.0",
            home_team: game.home_team,
            away_team: game.away_team,
            venue: game.venue
          })
        }
      } catch (error) {
        console.error(`Error generating prediction for game ${game.id}:`, error)
        // Add a fallback prediction
        predictions.push({
          id: `pred-${game.id}`,
          game_id: game.id,
          game: `${game.away_team?.name || 'Away'} @ ${game.home_team?.name || 'Home'}`,
          type: "winner",
          prediction: 0.5,
          confidence: 0.6,
          gameDate: new Date(game.game_date).toLocaleDateString(),
          gameTime: new Date(game.game_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: "Fallback Model",
          home_team: game.home_team,
          away_team: game.away_team,
          venue: game.venue
        })
      }
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
