import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SportPredictionService } from "@/lib/services/predictions/sport-prediction-service"
import { SupportedSport } from "@/lib/services/core/service-factory"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    
    if (!sport) {
      return NextResponse.json({ 
        error: "Sport parameter is required. Supported sports: basketball, football, baseball, hockey, soccer" 
      }, { status: 400 })
    }

    // Validate sport parameter
    const supportedSports: SupportedSport[] = ['basketball', 'football', 'baseball', 'hockey', 'soccer']
    if (!supportedSports.includes(sport as SupportedSport)) {
      return NextResponse.json({ 
        error: `Unsupported sport: ${sport}. Supported sports: ${supportedSports.join(', ')}` 
      }, { status: 400 })
    }
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
      .eq("sport", sport)
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
    
    // Set default league based on sport
    const getDefaultLeague = (sport: string) => {
      const leagueMap: Record<string, string> = {
        'basketball': 'NBA',
        'football': 'NFL',
        'baseball': 'MLB',
        'hockey': 'NHL',
        'soccer': 'Premier League'
      }
      return leagueMap[sport] || sport.charAt(0).toUpperCase() + sport.slice(1) + ' League'
    }
    
    const predictionService = new SportPredictionService(sport as SupportedSport, getDefaultLeague(sport))
    
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
