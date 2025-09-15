import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { normalizeGameData, normalizeTeamData, deduplicateGames } from "@/lib/utils/data-utils"


// Map to store active connections
const connections = new Map<string, {
  response: any
  sport: string
  lastPing: number
}>()

// Cleanup inactive connections
setInterval(() => {
  const now = Date.now()
  for (const [id, connection] of connections) {
    // Remove connections that haven't pinged in 2 minutes
    if (now - connection.lastPing > 120000) {
      connections.delete(id)
    }
  }
}, 30000) // Check every 30 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "all"
  const connectionId = Math.random().toString(36).substring(2, 15)

  // Create a readable stream
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Send SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  }

  // Store connection
  connections.set(connectionId, {
    response: writer,
    sport,
    lastPing: Date.now()
  })

  // Send initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({
    type: "connected",
    timestamp: new Date().toISOString()
  })}\n\n`))

  // Function to send data to this client
  const sendData = (data: any) => {
    if (connections.has(connectionId)) {
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      } catch (error) {
        // Remove broken connections
        connections.delete(connectionId)
      }
    }
  }

  // Function to fetch and send live data with enhanced error handling
  const sendLiveData = async () => {
    try {
      const supabase = await createClient()

      if (!supabase) {
        sendData({
          type: "error",
          data: { message: "Database connection failed" },
          timestamp: new Date().toISOString()
        })
        return
      }

      // Skip if sport is "all" to prevent excessive queries
      if (sport === "all") {
        sendData({
          type: "game_update",
          data: [],
          timestamp: new Date().toISOString()
        })
        return
      }

      // Get live games from database with enhanced filtering and error handling
      const { data: liveGames, error: liveGamesError } = await supabase
        .from('games')
        .select(`
          *,
          home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
          away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
        `)
        .eq('sport', sport)
        .in('status', ['live', 'in_progress', 'in progress'])
        .order('game_date', { ascending: true })
        .limit(50) // Limit results to prevent excessive data

      if (liveGamesError) {
        console.error('Live games error:', liveGamesError)
        // Send empty data instead of error to prevent client-side failures
        sendData({
          type: "game_update",
          data: [],
          timestamp: new Date().toISOString()
        })
        return
      }

      // Format live games with enhanced data normalization
      const formattedLiveGames = (liveGames || []).map(game => {
        const homeTeam = game.home_team_data || { 
          name: game.home_team || 'Home Team', 
          logo_url: null, 
          abbreviation: null 
        }
        const awayTeam = game.away_team_data || { 
          name: game.away_team || 'Visiting Team', 
          logo_url: null, 
          abbreviation: null 
        }
        
        // Normalize team data with sport context
        const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league)
        const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league)
        
        const gameData = {
          id: game.id,
          home_team_id: game.home_team_id,
          away_team_id: game.away_team_id,
          game_date: game.game_date,
          season: game.season,
          week: game.week,
          home_score: game.home_score,
          away_score: game.away_score,
          status: game.status,
          venue: game.venue,
          league: game.league,
          sport: game.sport,
          broadcast: game.broadcast,
          attendance: game.attendance,
          game_time: game.game_time,
          time_remaining: game.time_remaining,
          quarter: game.quarter,
          period: game.period,
          possession: game.possession,
          last_play: game.last_play,
          home_team: normalizedHomeTeam,
          away_team: normalizedAwayTeam,
          created_at: game.created_at,
          updated_at: game.updated_at
        }
        
        // Normalize and return the game data with sport-specific normalization
        return normalizeGameData(gameData, sport, game.league)
      })

      // Remove duplicates and ensure data consistency
      const uniqueGames = deduplicateGames(formattedLiveGames)

      // Send live game updates
      sendData({
        type: "game_update",
        data: uniqueGames,
        timestamp: new Date().toISOString()
      })

      // Send heartbeat
      sendData({
        type: "heartbeat",
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("Live stream error:", error)
      // Send empty data instead of error to prevent client disconnection
      sendData({
        type: "game_update",
        data: [],
        timestamp: new Date().toISOString()
      })
    }
  }

  // Send initial data
  await sendLiveData()

  // Set up periodic updates (every 60 seconds to reduce API spam)
  const intervalId = setInterval(sendLiveData, 60000)

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(intervalId)
    connections.delete(connectionId)
    try {
      writer.close()
    } catch (error) {
      // Ignore errors when closing writer
    }
  })

  // Return the response with SSE stream
  return new Response(readable, { headers })
}

// API route to send updates to all connected clients
export async function POST(request: NextRequest) {
  try {
    const { sport, data } = await request.json()
    
    // Send data to all clients interested in this sport
    for (const [id, connection] of connections) {
      if (connection.sport === sport) {
        try {
          const encoder = new TextEncoder()
          connection.response.write(encoder.encode(`data: ${JSON.stringify({
            type: "game_update",
            data,
            timestamp: new Date().toISOString()
          })}\n\n`))
        } catch (error) {
          // Remove broken connections
          connections.delete(id)
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to send updates' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}