import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { dataSyncService } from "@/lib/services/data-sync-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, sport, league } = body

    console.log(`Received webhook: ${type} for ${sport}/${league}`)

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not available" }, { status: 500 })
    }

    switch (type) {
      case "game_update":
        await handleGameUpdate(supabase, data)
        break

      case "score_update":
        await handleScoreUpdate(supabase, data)
        break

      case "odds_update":
        await handleOddsUpdate(supabase, data)
        break

      case "team_update":
        await handleTeamUpdate(supabase, data)
        break

      case "full_sync":
        // Trigger full sync for the sport
        await dataSyncService.performSync()
        break

      default:
        console.log(`Unknown webhook type: ${type}`)
        return NextResponse.json({ error: "Unknown webhook type" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Webhook processed" })

  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleGameUpdate(supabase: any, data: any) {
  const { game_id, status, home_score, away_score, venue, game_date } = data

  const { error } = await supabase
    .from('games')
    .update({
      status: status,
      home_score: home_score,
      away_score: away_score,
      venue: venue,
      game_date: game_date,
      updated_at: new Date().toISOString()
    })
    .eq('id', game_id)

  if (error) {
    console.error('Error updating game:', error)
    throw error
  }

  console.log(`Game ${game_id} updated successfully`)
}

async function handleScoreUpdate(supabase: any, data: any) {
  const { game_id, home_score, away_score, quarter, time_remaining } = data

  const { error } = await supabase
    .from('games')
    .update({
      home_score: home_score,
      away_score: away_score,
      quarter: quarter,
      time_remaining: time_remaining,
      updated_at: new Date().toISOString()
    })
    .eq('id', game_id)

  if (error) {
    console.error('Error updating score:', error)
    throw error
  }

  console.log(`Score updated for game ${game_id}`)
}

async function handleOddsUpdate(supabase: any, data: any) {
  const { game_id, odds_type, home_odds, away_odds, spread, total, source } = data

  const { error } = await supabase
    .from('odds')
    .upsert({
      id: `${game_id}_${odds_type}_${Date.now()}`,
      game_id: game_id,
      source: source || 'webhook',
      odds_type: odds_type,
      home_odds: home_odds,
      away_odds: away_odds,
      spread: spread,
      total: total,
      timestamp: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (error) {
    console.error('Error updating odds:', error)
    throw error
  }

  console.log(`Odds updated for game ${game_id}`)
}

async function handleTeamUpdate(supabase: any, data: any) {
  const { team_id, name, abbreviation, logo_url, record, standings } = data

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (name) updateData.name = name
  if (abbreviation) updateData.abbreviation = abbreviation
  if (logo_url) updateData.logo_url = logo_url
  if (record) updateData.record = record

  const { error } = await supabase
    .from('teams')
    .update(updateData)
    .eq('id', team_id)

  if (error) {
    console.error('Error updating team:', error)
    throw error
  }

  // Update standings if provided
  if (standings) {
    const { error: standingsError } = await supabase
      .from('league_standings')
      .upsert({
        id: `${standings.sport}_${team_id}_${standings.season}`,
        sport: standings.sport,
        league: standings.league,
        team_id: team_id,
        team_name: name,
        season: standings.season,
        wins: standings.wins,
        losses: standings.losses,
        ties: standings.ties || 0,
        win_percentage: standings.win_percentage,
        games_back: standings.games_back,
        conference: standings.conference,
        division: standings.division,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (standingsError) {
      console.error('Error updating standings:', standingsError)
    }
  }

  console.log(`Team ${team_id} updated successfully`)
}
