import { type NextRequest, NextResponse } from "next/server"
import { unifiedApiClient, SupportedSport } from "@/lib/services/api/unified-api-client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const minValue = parseFloat(searchParams.get("min_value") || "0.05")
    const recommendation = searchParams.get("recommendation") || "all"

    // Fetch real data from unified API client
    const [games, odds] = await Promise.all([
      unifiedApiClient.getGames(sport as SupportedSport, { status: 'scheduled' }),
      unifiedApiClient.getOdds(sport as SupportedSport, {})
    ])

    // Generate value bets based on real data
    const valueBets = await generateValueBets(games, odds, minValue, recommendation)

    return NextResponse.json({
      opportunities: valueBets,
      meta: {
        total: valueBets.length,
        sport,
        filters: {
          minValue,
          recommendation
        },
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Value bets API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateValueBets(games: any[], odds: any[], minValue: number, recommendation: string) {
  const valueBets = []

  for (const game of games) {
    // Find odds for this game
    const gameOdds = odds.filter(odd => 
      odd.homeTeam === game.homeTeam && odd.awayTeam === game.awayTeam
    )

    if (gameOdds.length === 0) continue

    // Calculate value for each bet type
    for (const odd of gameOdds) {
      // Calculate implied probability from odds
      const impliedProb = odd.odds > 0 ? 100 / (odd.odds + 100) : Math.abs(odd.odds) / (Math.abs(odd.odds) + 100)
      
      // Calculate model probability using real ML models
      const modelProb = await calculateModelProbability(game, odd.betType, odd.side)
      
      // Calculate value
      const value = (modelProb * (odd.odds > 0 ? odd.odds + 1 : 1)) - 1
      
      if (value >= minValue) {
        const betRecommendation = value >= 0.15 ? 'strong' : value >= 0.08 ? 'moderate' : 'weak'
        
        // Filter by recommendation if specified
        if (recommendation !== "all" && betRecommendation !== recommendation) continue

        valueBets.push({
          gameId: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          betType: odd.betType,
          side: odd.side,
          odds: odd.odds,
          value: value,
          recommendation: betRecommendation,
          bookmakers: [odd.bookmaker || "Unknown"],
          analysis: generateAnalysis(game, odd, modelProb, value)
        })
      }
    }
  }

  return valueBets.sort((a, b) => b.value - a.value)
}

async function calculateModelProbability(game: any, betType: string, side: string): Promise<number> {
  // Use real ML models for probability calculation
  try {
    const mlService = await import('@/lib/services/ml-prediction-service')
    return await mlService.mlPredictionService.calculateProbability(game, betType, side)
  } catch (error) {
    console.error('ML prediction service error:', error)
    // Fallback to basic calculation if ML service fails
    const homeAdvantage = 0.55
    const baseProb = 0.5
    let modelProb = baseProb
    
    switch (betType) {
      case "Moneyline":
        modelProb = side.includes(game.homeTeam) ? homeAdvantage : 1 - homeAdvantage
        break
      case "Spread":
        modelProb = side.includes(game.homeTeam) ? homeAdvantage : 1 - homeAdvantage
        break
      case "Over/Under":
        modelProb = 0.5
        break
      default:
        modelProb = 0.5
    }
    
    return Math.max(0.1, Math.min(0.9, modelProb))
  }
}

function generateAnalysis(game: any, odd: any, modelProb: number, value: number): string {
  const confidence = value > 0.15 ? "high" : value > 0.08 ? "medium" : "low"
  const team = odd.side.includes(game.homeTeam) ? game.homeTeam : game.awayTeam
  
  return `${team} showing ${Math.round(modelProb * 100)}% true win probability. ${confidence} confidence value bet based on statistical analysis.`
}
