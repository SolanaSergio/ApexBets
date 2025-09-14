import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport")
    const limit = parseInt(searchParams.get("limit") || "10")
    const gameId = searchParams.get("gameId")

    // If sport is provided, try sport-specific endpoint first, fallback to general query
    if (sport) {
      try {
        // Try to get odds from sport-specific endpoint
        const sportResponse = await fetch(`${request.url.replace('/api/odds', `/api/odds/${sport}`)}`)
        if (sportResponse.ok) {
          const sportData = await sportResponse.json()
          if (sportData.success && sportData.data && sportData.data.length > 0) {
            return NextResponse.json(sportData.data)
          }
        }
      } catch (error) {
        console.warn(`Sport-specific odds failed for ${sport}, falling back to general query:`, error)
      }
    }

    // Get general odds data from database
    let query = supabase
      .from("odds")
      .select(`
        *,
        game:games!odds_game_id_fkey(
          id,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation),
          game_date,
          status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (gameId) {
      query = query.eq("game_id", gameId)
    }

    if (sport) {
      query = query.eq("sport", sport)
    }

    const { data: odds, error } = await query

    if (error) {
      console.error("Error fetching odds:", error)
      return NextResponse.json({ error: "Failed to fetch odds" }, { status: 500 })
    }

    if (!odds || odds.length === 0) {
      return NextResponse.json([])
    }

    // Transform data to match expected format - only include odds with valid team data
    const transformedOdds = odds
      .filter(odd => odd.game?.home_team?.name && odd.game?.away_team?.name) // Only include odds with real team data
      .map(odd => ({
        id: odd.id,
        game_id: odd.game_id,
        home_team: odd.game.home_team.name,
        away_team: odd.game.away_team.name,
        home_odds: odd.home_odds,
        away_odds: odd.away_odds,
        draw_odds: odd.draw_odds,
        over_odds: odd.over_odds,
        under_odds: odd.under_odds,
        sport: odd.sport,
        league: odd.league,
        market: odd.market,
        bookmaker: odd.bookmaker,
        last_updated: odd.updated_at,
        game_date: odd.game?.game_date,
        status: odd.game?.status
      }))

    return NextResponse.json(transformedOdds)

  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
