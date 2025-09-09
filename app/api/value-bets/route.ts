import { type NextRequest, NextResponse } from "next/server"
import { predictionService } from "@/lib/services/prediction-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const minValue = parseFloat(searchParams.get("min_value") || "0.1")
    const recommendation = searchParams.get("recommendation") as "strong" | "moderate" | "weak" | null

    const opportunities = await predictionService.findValueBettingOpportunities(sport)
    
    // Filter by minimum value and recommendation level
    let filteredOpportunities = opportunities.filter(opp => opp.value >= minValue)
    
    if (recommendation) {
      filteredOpportunities = filteredOpportunities.filter(opp => opp.recommendation === recommendation)
    }

    // Sort by value (highest first)
    filteredOpportunities.sort((a, b) => b.value - a.value)

    return NextResponse.json({
      opportunities: filteredOpportunities,
      total: filteredOpportunities.length,
      filters: {
        sport,
        minValue,
        recommendation
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
