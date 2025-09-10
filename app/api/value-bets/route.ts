import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "basketball"

  return NextResponse.json({
    data: [],
    meta: {
      total: 0,
      sport,
      filters: {
        minValue: parseFloat(searchParams.get("min_value") || "0"),
        recommendation: searchParams.get("recommendation")
      }
    }
  })
}
