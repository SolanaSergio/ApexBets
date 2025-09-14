import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiFallbackStrategy } from "@/lib/services/api-fallback-strategy"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const useExternalApi = searchParams.get("external") === "true"
    
    if (useExternalApi) {
      // Use API fallback strategy for real-time data
      const sport = searchParams.get("sport")
      
      if (!sport) {
        return NextResponse.json({ error: "Sport parameter is required" }, { status: 400 })
      }
      
      const status = searchParams.get("status") as "scheduled" | "live" | "finished" | undefined
      const date = searchParams.get("date") || new Date().toISOString().split('T')[0]
      
      try {
        // Use the API fallback strategy to get games
        const fallbackResult = await apiFallbackStrategy.executeWithFallback({
          sport,
          dataType: 'games',
          params: { date, status },
          priority: 'medium'
        })
        
        if (fallbackResult.success && fallbackResult.data) {
          // Normalize the data to our expected format - use real team data
          const normalizedGames = await Promise.all(
            Array.isArray(fallbackResult.data) 
            ? fallbackResult.data.map(async (game: any) => {
                // Extract real team names from API response - no hardcoded fallbacks
                // Handle different API response structures including nested teams object
                let homeTeamName, awayTeamName;
                
                // Check if teams data is in a nested object structure
                if (game.teams && typeof game.teams === 'object') {
                  // Handle teams object with home/away properties
                  if (game.teams.home && game.teams.away) {
                    homeTeamName = game.teams.home.name || 
                                 game.teams.home.team?.name || 
                                 game.teams.home.teamName ||
                                 game.teams.home.displayName ||
                                 game.teams.home.full_name;
                    awayTeamName = game.teams.away.name || 
                                 game.teams.away.team?.name || 
                                 game.teams.away.teamName ||
                                 game.teams.away.displayName ||
                                 game.teams.away.full_name;
                  }
                  // Handle teams array structure
                  else if (Array.isArray(game.teams) && game.teams.length >= 2) {
                    homeTeamName = game.teams[0]?.name || 
                                 game.teams[0]?.team?.name || 
                                 game.teams[0]?.teamName ||
                                 game.teams[0]?.displayName ||
                                 game.teams[0]?.full_name;
                    awayTeamName = game.teams[1]?.name || 
                                 game.teams[1]?.team?.name || 
                                 game.teams[1]?.teamName ||
                                 game.teams[1]?.displayName ||
                                 game.teams[1]?.full_name;
                  }
                }
                
                // Fallback to direct field access if teams object didn't work
                if (!homeTeamName || !awayTeamName) {
                  homeTeamName = game.home_team?.name || 
                               game.strHomeTeam || 
                               game.homeTeam?.name || 
                               game.homeTeam || 
                               game.homeTeamName ||
                               game.home_team?.displayName ||
                               game.home_team?.full_name ||
                               game.home_team?.teamName;
                                
                  awayTeamName = game.away_team?.name || 
                               game.strAwayTeam || 
                               game.awayTeam?.name || 
                               game.awayTeam || 
                               game.awayTeamName ||
                               game.away_team?.displayName ||
                               game.away_team?.full_name ||
                               game.away_team?.teamName;
                }
                
                // If we still don't have team names, log the structure and return null
                if (!homeTeamName || !awayTeamName) {
                  console.warn('Missing team names in API response:', { 
                    homeTeamName, 
                    awayTeamName, 
                    availableFields: Object.keys(game),
                    homeTeamFields: game.home_team ? Object.keys(game.home_team) : 'no home_team',
                    awayTeamFields: game.away_team ? Object.keys(game.away_team) : 'no away_team'
                  });
                  return null; // Skip this game if team names are missing
                }
                
                // Use dynamic abbreviation generation
                const generateAbbreviation = (teamName: string): string => {
                  if (!teamName) return 'TBD';
                  const words = teamName.split(' ').filter(word => word.length > 0);
                  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
                  return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
                };
                
                // Use fallback values instead of async calls in map
                const currentYear = new Date().getFullYear()
                const season = game.season || `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
                const status = game.status || 'scheduled'
                const league = game.league || game.strLeague || 'Unknown'
                
                // Create a truly unique ID by combining multiple identifiers
                const createUniqueGameId = (game: any): string => {
                  const baseId = game.id?.toString() || game.idEvent || '';
                  const homeTeam = game.home_team?.name || game.strHomeTeam || game.homeTeam?.name || game.homeTeam || 'home';
                  const awayTeam = game.away_team?.name || game.strAwayTeam || game.awayTeam?.name || game.awayTeam || 'away';
                  const gameDate = game.date || game.dateEvent || game.game_date || new Date().toISOString();
                  
                  // If we have a base ID, use it with a hash of game details to ensure uniqueness
                  if (baseId) {
                    const gameHash = `${homeTeam}-${awayTeam}-${gameDate}`.replace(/\s+/g, '').toLowerCase();
                    return `${baseId}_${gameHash.slice(0, 8)}`;
                  }
                  
                  // Fallback: create ID from game details with timestamp
                  const timestamp = Date.now();
                  const randomSuffix = Math.random().toString(36).substr(2, 9);
                  return `external_${timestamp}_${randomSuffix}`;
                };
                
                return {
                  id: createUniqueGameId(game),
                  home_team_id: `external_home_${game.id || Math.random().toString(36).substr(2, 9)}`,
                  away_team_id: `external_away_${game.id || Math.random().toString(36).substr(2, 9)}`,
                  game_date: game.date || game.dateEvent || game.game_date || new Date().toISOString(),
                  season,
                  home_score: game.home_score || game.intHomeScore || null,
                  away_score: game.away_score || game.intAwayScore || null,
                  status,
                  venue: game.venue || game.strVenue || null,
                  league,
                  home_team: {
                    name: homeTeamName,
                    abbreviation: game.home_team?.abbreviation || generateAbbreviation(homeTeamName),
                    logo_url: game.home_team?.logoUrl || game.home_team?.logo || undefined
                  },
                  away_team: {
                    name: awayTeamName,
                    abbreviation: game.away_team?.abbreviation || generateAbbreviation(awayTeamName),
                    logo_url: game.away_team?.logoUrl || game.away_team?.logo || undefined
                  }
                }
              })
            : []
          )
          
          // Filter out null games (games with missing team names) and remove duplicates
          const validGames = normalizedGames.filter(game => game !== null)
          const deduplicatedGames = validGames.filter((game, index, array) => 
            array.findIndex(g => g.id === game.id) === index
          )
          
          // If we have no valid games from external API, log this for debugging
          if (deduplicatedGames.length === 0) {
            console.warn(`No valid games found from external API for sport: ${sport}. All games had missing team names.`)
          }
          
          return NextResponse.json({
            data: deduplicatedGames,
            meta: {
              fromCache: fallbackResult.cached,
              responseTime: fallbackResult.responseTime,
              source: `api_fallback_${fallbackResult.provider}`,
              fallbacksUsed: fallbackResult.fallbacksUsed,
              originalCount: normalizedGames.length,
              deduplicatedCount: deduplicatedGames.length
            }
          })
        } else {
          console.warn('API fallback failed:', fallbackResult.error)
          return NextResponse.json({
            data: [],
            meta: {
              fromCache: false,
              responseTime: fallbackResult.responseTime,
              source: "api_fallback_failed",
              error: fallbackResult.error
            }
          })
        }
      } catch (error) {
        console.error('External API error:', error)
        return NextResponse.json({
          data: [],
          meta: {
            fromCache: false,
            responseTime: 0,
            source: "external_api_error",
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }

    // Fallback to Supabase for stored data
    const supabase = await createClient()
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const status = searchParams.get("status")
    const teamId = searchParams.get("team_id")
    const search = searchParams.get("search")
    const sport = searchParams.get("sport")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    let query = supabase.from("games").select(`
        *,
        home_team:teams!games_home_team_id_fkey(id, name, abbreviation, logo_url),
        away_team:teams!games_away_team_id_fkey(id, name, abbreviation, logo_url)
      `)

    if (dateFrom) {
      query = query.gte("game_date", dateFrom)
    }

    if (dateTo) {
      query = query.lte("game_date", dateTo)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (teamId) {
      query = query.or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    }

    if (sport) {
      query = query.eq("sport", sport)
    }

    const { data: games, error } = await query.order("game_date", { ascending: false }).limit(limit)

    // Filter by search term if provided
    let filteredGames = games || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredGames = filteredGames.filter(game => 
        game.home_team?.name?.toLowerCase().includes(searchLower) ||
        game.away_team?.name?.toLowerCase().includes(searchLower) ||
        game.home_team?.abbreviation?.toLowerCase().includes(searchLower) ||
        game.away_team?.abbreviation?.toLowerCase().includes(searchLower)
      )
    }

    if (error) {
      console.error("Error fetching games:", error)
      return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
    }

    return NextResponse.json({
      data: filteredGames,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase"
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client initialization failed" }, { status: 500 })
    }
    const gameData = await request.json()

    // Validate required fields
    if (!gameData.homeTeam || !gameData.awayTeam) {
      return NextResponse.json({ error: "Missing required fields: homeTeam, awayTeam" }, { status: 400 })
    }

    // Find team IDs by name
    const { data: homeTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", gameData.homeTeam)
      .single()

    if (!homeTeam) {
      return NextResponse.json({ error: "Home team not found in database" }, { status: 400 })
    }

    const { data: awayTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("name", gameData.awayTeam)
      .single()

    if (!awayTeam) {
      return NextResponse.json({ error: "Away team not found in database" }, { status: 400 })
    }

    const { data: game, error } = await supabase
      .from("games")
      .insert([{
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        game_date: gameData.date ? new Date(gameData.date).toISOString() : new Date().toISOString(),
        season: gameData.season || '2024-25',
        status: gameData.status || 'scheduled',
        home_score: gameData.homeScore || null,
        away_score: gameData.awayScore || null,
        venue: gameData.venue || null
      }])
      .select()
      .single()

    if (error) {
      console.error("Error inserting game:", error)
      return NextResponse.json({ error: "Failed to insert game" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: game })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}