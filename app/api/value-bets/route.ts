import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const minValue = parseFloat(searchParams.get("min_value") || "0.05")

    // For now, return mock value bets based on current data
    // In production, this would integrate with a value betting algorithm
    const valueBets = await generateValueBets(sport, minValue)

    return NextResponse.json({
      opportunities: valueBets,
      meta: {
        total: valueBets.length,
        sport,
        filters: {
          minValue,
          recommendation: searchParams.get("recommendation") || "all"
        },
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Value bets API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateValueBets(sport: string, minValue: number) {
  // In a real implementation, this would:
  // 1. Fetch current odds from multiple bookmakers
  // 2. Calculate implied probabilities
  // 3. Compare against predicted probabilities
  // 4. Identify statistical edges

  const mockValueBets = [
    {
      gameId: "1",
      homeTeam: "Los Angeles Lakers",
      awayTeam: "Golden State Warriors",
      betType: "Spread",
      side: "Lakers -4.5",
      odds: -110,
      value: 0.08,
      recommendation: "moderate" as const,
      bookmakers: ["DraftKings", "FanDuel", "BetMGM"],
      analysis: "Lakers have strong home court advantage, models suggest 52% win probability"
    },
    {
      gameId: "2",
      homeTeam: "Boston Celtics",
      awayTeam: "Illinois Eagles",
      betType: "Moneyline",
      side: "Celtics",
      odds: -150,
      value: 0.12,
      recommendation: "strong" as const,
      bookmakers: ["FanDuel", "Barstool", "Unibet"],
      analysis: "Celtics showing 65% true win probability against weaker opponents"
    },
    {
      gameId: "3",
      homeTeam: "Dallas Mavericks",
      awayTeam: "Chicago Bulls",
      betType: "Over/Under",
      side: "Over 215.5",
      odds: -105,
      value: 0.06,
      recommendation: "weak" as const,
      bookmakers: ["DraftKings", "BetRivers"],
      analysis: "Offensive tendencies suggest higher scoring game than lines indicate"
    }
  ].filter(bet => bet.value >= minValue)

  return mockValueBets
}
