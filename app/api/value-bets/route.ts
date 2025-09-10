import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { predictionService } from "@/lib/services/prediction-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "basketball"
    const minValue = parseFloat(searchParams.get("min_value") || "0")
    const recommendation = searchParams.get("recommendation")
    
    // Get value betting opportunities from prediction service
    const opportunities = await predictionService.findValueBettingOpportunities(sport)
    
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
        }
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}