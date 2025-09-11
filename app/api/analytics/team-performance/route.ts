import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sportsAPI } from "@/lib/api/sports-api"
import { SupportedSport } from "@/lib/services/core/service-factory"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get("team") || ""
    const sport = searchParams.get("sport")
    const league = searchParams.get("league")
    
    if (!sport) {
      return NextResponse.json({ 
        error: "Sport parameter is required. Supported sports: basketball, football, baseball, hockey, soccer" 
      }, { status: 400 })
    }

    // Validate sport parameter
    const supportedSports: SupportedSport[] = ['basketball', 'football', 'baseball', 'hockey', 'soccer']
    if (!supportedSports.includes(sport as SupportedSport)) {
      return NextResponse.json({ 
        error: `Unsupported sport: ${sport}. Supported sports: ${supportedSports.join(', ')}` 
      }, { status: 400 })
    }
    const finalSport = sport as SupportedSport
    const timeRange = searchParams.get("timeRange") || "30"

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }
    
    // Get team performance data - use external APIs for better data
    let teamData = null
    
    try {
      // Try to get team data from external APIs first
      const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
      const teams = await cachedUnifiedApiClient.getTeams(finalSport, { limit: 100 })
      
      if (team && team !== 'all') {
        teamData = teams.find(t => t.name === team || t.id === team)
      } else {
        teamData = teams[0] // Use first team if no specific team requested
      }
    } catch (error) {
      console.error('External API error, falling back to database:', error)
      
      // Fallback to database
      let teamQuery = supabase
        .from('teams')
        .select('*')
        .eq('sport', finalSport)
      
      if (team && team !== 'all') {
        teamQuery = teamQuery.eq('name', team)
      }
      
      if (league) {
        teamQuery = teamQuery.eq('league', league)
      }

      const { data: dbTeamData, error: teamError } = await teamQuery.single()
      
      if (teamError || !dbTeamData) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 })
      }
      
      teamData = dbTeamData
    }

    if (!teamData) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get recent games for this team - use external APIs for better data
    let games = []
    
    try {
      // Try to get games from external APIs first
      const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
      const allGames = await cachedUnifiedApiClient.getGames(finalSport, { 
        limit: parseInt(timeRange),
        date: new Date().toISOString().split('T')[0]
      })
      
      // Filter games for this team
      games = allGames.filter(game => 
        game.homeTeam === teamData.name || 
        game.awayTeam === teamData.name
      )
    } catch (error) {
      console.error('External API error, falling back to database:', error)
      
      // Fallback to database
      let gamesQuery = supabase
        .from('games')
        .select('*')
        .or(`home_team_id.eq.${teamData.id},away_team_id.eq.${teamData.id}`)
        .eq('sport', finalSport)
        .order('game_date', { ascending: false })
        .limit(parseInt(timeRange))
      
      if (league) {
        gamesQuery = gamesQuery.eq('league', league)
      }

      const { data: dbGames, error: gamesError } = await gamesQuery

      if (gamesError) {
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
      }
      
      games = dbGames || []
    }

    // Calculate performance metrics - handle both external API and database data
    const performance = games?.map(game => {
      // Handle external API data format
      if (game.homeTeam && game.awayTeam) {
        const isHome = game.homeTeam === teamData.name
        const teamScore = isHome ? (game.homeScore || 0) : (game.awayScore || 0)
        const opponentScore = isHome ? (game.awayScore || 0) : (game.homeScore || 0)
        const won = teamScore > opponentScore
        
        return {
          date: game.date || new Date().toISOString(),
          opponent: isHome ? game.awayTeam : game.homeTeam,
          score: `${teamScore}-${opponentScore}`,
          won,
          points: teamScore,
          opponentPoints: opponentScore,
          margin: teamScore - opponentScore
        }
      } else {
        // Handle database data format
        const isHome = game.home_team_id === teamData.id
        const teamScore = isHome ? game.home_score : game.away_score
        const opponentScore = isHome ? game.away_score : game.home_score
        const won = teamScore > opponentScore
        
        return {
          date: game.date || game.game_date || new Date().toISOString(),
          opponent: isHome ? (game.away_team?.name || 'Away Team') : (game.home_team?.name || 'Home Team'),
          score: `${teamScore}-${opponentScore}`,
          won,
          points: teamScore,
          opponentPoints: opponentScore,
          margin: teamScore - opponentScore
        }
      }
    }) || []

    // Calculate team stats
    const wins = performance.filter(p => p.won).length
    const losses = performance.length - wins
    const winPercentage = performance.length > 0 ? (wins / performance.length) * 100 : 0
    const avgPoints = performance.length > 0 ? 
      performance.reduce((sum, p) => sum + p.points, 0) / performance.length : 0
    const avgOpponentPoints = performance.length > 0 ? 
      performance.reduce((sum, p) => sum + p.opponentPoints, 0) / performance.length : 0

    return NextResponse.json({
      team: teamData,
      performance,
      stats: {
        wins,
        losses,
        winPercentage: Math.round(winPercentage * 100) / 100,
        avgPoints: Math.round(avgPoints * 100) / 100,
        avgOpponentPoints: Math.round(avgOpponentPoints * 100) / 100,
        pointDifferential: Math.round((avgPoints - avgOpponentPoints) * 100) / 100
      },
      timeRange: parseInt(timeRange)
    })

  } catch (error) {
    console.error("Team performance API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}