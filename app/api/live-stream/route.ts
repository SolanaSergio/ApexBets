import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeGameData, normalizeTeamData, deduplicateGames } from '@/lib/utils/data-utils'
import { cachedSupabaseQuery } from '@/lib/utils/supabase-query-cache'

// Map to store active connections
const connections = new Map<
  string,
  {
    response: any
    sport: string
    lastPing: number
  }
>()

// Keep track of last sent data to avoid sending duplicates
const lastSentData = new Map<string, string>()

// Cleanup inactive connections
setInterval(() => {
  const now = Date.now()
  for (const [id, connection] of connections) {
    // Remove connections that haven't pinged in 2 minutes
    if (now - connection.lastPing > 120000) {
      connections.delete(id)
    }
  }

  // Clean up old last sent data
  for (const [sport, _dataStr] of lastSentData) {
    // Remove entries older than 10 minutes
    if (Math.random() < 0.1) {
      // Random cleanup to avoid performance issues
      lastSentData.delete(sport)
    }
  }
}, 30000) // Check every 30 seconds

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'all'
  const connectionId = Math.random().toString(36).substring(2, 15)

  // Create a readable stream
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Send SSE headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  }

  // Store connection
  connections.set(connectionId, {
    response: writer,
    sport,
    lastPing: Date.now(),
  })

  // Send initial connection message
  writer.write(
    encoder.encode(
      `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
      })}\n\n`
    )
  )

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

  // Function to fetch live data with caching
  const fetchLiveDataWithCache = async (sport: string) => {
    // Skip if sport is "all" to prevent excessive queries
    if (sport === 'all') {
      return []
    }

    try {
      // Use cached query to reduce database load
      const cacheKey = `live-games-${sport}`
      const liveGames = await cachedSupabaseQuery(
        cacheKey,
        async () => {
          const supabase = await createClient()

          if (!supabase) {
            throw new Error('Database connection failed')
          }

          // Get live games from database with enhanced filtering and error handling
          // NOTE: Removed 'broadcast' column as it doesn't exist in the database
          const { data: liveGames, error: liveGamesError } = await supabase
            .from('games')
            .select(
              `
            id,
            external_id,
            sport,
            league_id,
            league_name,
            season,
            home_team_id,
            away_team_id,
            home_team_name,
            away_team_name,
            home_team_score,
            away_team_score,
            game_date,
            game_time_local,
            status,
            game_type,
            venue,
            attendance,
            weather_conditions,
            referee_info,
            broadcast_info,
            betting_odds,
            last_updated,
            created_at,
            home_team_data:teams!games_home_team_id_fkey(name, logo_url, abbreviation),
            away_team_data:teams!games_away_team_id_fkey(name, logo_url, abbreviation)
          `
            )
            .eq('sport', sport)
            .in('status', ['live', 'in_progress', 'in progress'])
            .order('game_date', { ascending: true })
            .limit(50) // Limit results to prevent excessive data

          if (liveGamesError) {
            console.error('Live games error:', liveGamesError)
            throw liveGamesError
          }

          return liveGames || []
        },
        30000
      ) // 30 second cache TTL

      // Format live games with enhanced data normalization
      const formattedLiveGames = liveGames.map(game => {
        const homeTeam = game.home_team_data || {
          name: 'Home Team',
          logo_url: null,
          abbreviation: null,
        }
        const awayTeam = game.away_team_data || {
          name: 'Visiting Team',
          logo_url: null,
          abbreviation: null,
        }

        // Normalize team data with sport context
        const normalizedHomeTeam = normalizeTeamData(homeTeam, sport, game.league_name)
        const normalizedAwayTeam = normalizeTeamData(awayTeam, sport, game.league_name)

        const gameData = {
          id: game.id,
          home_team_id: game.home_team_id,
          away_team_id: game.away_team_id,
          game_date: game.game_date,
          season: game.season,
          // week: game.week, // Not stored in database
          home_score: game.home_team_score,
          away_score: game.away_team_score,
          status: game.status,
          venue: game.venue,
          league: game.league_name,
          sport: game.sport,
          // Removed broadcast field as it doesn't exist in the database
          attendance: game.attendance,
          game_type: game.game_type,
          // overtime periods not selected in query
          home_team: normalizedHomeTeam,
          away_team: normalizedAwayTeam,
          created_at: game.created_at,
          updated_at: game.last_updated,
        }

        // Normalize and return the game data with sport-specific normalization
        return normalizeGameData(gameData, sport, game.league_name)
      })

      // Remove duplicates and ensure data consistency
      const uniqueGames = deduplicateGames(formattedLiveGames)

      return uniqueGames
    } catch (error) {
      console.error('Live stream data fetch error:', error)
      // Return empty array on error
      return []
    }
  }

  // Function to send live data with enhanced error handling and deduplication
  const sendLiveData = async () => {
    try {
      const liveGames = await fetchLiveDataWithCache(sport)

      // Create a string representation to check for changes
      const dataStr = JSON.stringify(liveGames)
      const lastDataStr = lastSentData.get(sport)

      // Only send data if it has changed
      if (dataStr !== lastDataStr) {
        lastSentData.set(sport, dataStr)

        // Send live game updates
        sendData({
          type: 'game_update',
          data: liveGames,
          timestamp: new Date().toISOString(),
        })
      }

      // Send heartbeat
      sendData({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Live stream error:', error)
      // Send empty data instead of error to prevent client disconnection
      sendData({
        type: 'game_update',
        data: [],
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Send initial data
  await sendLiveData()

  // Set up periodic updates (every 15 seconds for better responsiveness)
  const intervalId = setInterval(sendLiveData, 15000)

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

    // Update last sent data
    const dataStr = JSON.stringify(data)
    lastSentData.set(sport, dataStr)

    // Send data to all clients interested in this sport
    for (const [id, connection] of connections) {
      if (connection.sport === sport) {
        try {
          const encoder = new TextEncoder()
          connection.response.write(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'game_update',
                data,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          )
        } catch (error) {
          // Remove broken connections
          connections.delete(id)
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to send updates' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
