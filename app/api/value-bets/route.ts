import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { predictionService } from "@/lib/services/prediction-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const minValue = parseFloat(searchParams.get("min_value") || "0")
    const recommendation = searchParams.get("recommendation")
    
    // For now, return a simple response to avoid hanging
    // TODO: Implement proper value betting opportunities calculation
    const opportunities = [
      {
        gameId: "sample-1",
        homeTeam: "Lakers",
        awayTeam: "Warriors",
        betType: "moneyline",
        side: "home",
        odds: 1.85,
        probability: 0.58,
        value: 0.15,
        recommendation: "moderate",
        expectedValue: 0.12,
        kellyPercentage: 0.08
      },
      {
        gameId: "sample-2", 
        homeTeam: "Celtics",
        awayTeam: "Heat",
        betType: "spread",
        side: "home",
        odds: 1.90,
        probability: 0.55,
        value: 0.12,
        recommendation: "moderate",
        expectedValue: 0.10,
        kellyPercentage: 0.06
      }
    ]
    
    // Filter by criteria
    let filteredOpportunities = opportunities
    
    if (minValue > 0) {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.value >= minValue)
    }
    
    if (recommendation) {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.recommendation === recommendation)
    }
    
    return NextResponse.json({
      data: filteredOpportunities,
      meta: {
        total: filteredOpportunities.length,
        sport,
        filters: {
          minValue,
          recommendation
        },
        note: "Sample data - full implementation pending"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}