import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const team = searchParams.get("team") || "all"
    const timeRange = searchParams.get("timeRange") || "30d"
    const sport = searchParams.get("sport") || "basketball"
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({
        players: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Database connection failed"
        }
      })
    }

    // Get player stats based on sport
    let tableName = "player_stats"
    let statsColumns = `
      player_name,
      position,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      field_goals_made,
      field_goals_attempted,
      three_pointers_made,
      three_pointers_attempted,
      free_throws_made,
      free_throws_attempted,
      minutes_played,
      created_at
    `
    
    switch (sport) {
      case "football":
        tableName = "football_player_stats"
        statsColumns = `
          player_name,
          position,
          passing_yards,
          passing_touchdowns,
          rushing_yards,
          rushing_touchdowns,
          receiving_yards,
          receiving_touchdowns,
          receptions,
          tackles,
          sacks,
          interceptions,
          created_at
        `
        break
      case "baseball":
        tableName = "baseball_player_stats"
        statsColumns = `
          player_name,
          position,
          at_bats,
          hits,
          runs,
          rbi,
          home_runs,
          doubles,
          triples,
          walks,
          strikeouts,
          batting_average,
          created_at
        `
        break
      case "hockey":
        tableName = "hockey_player_stats"
        statsColumns = `
          player_name,
          position,
          goals,
          assists,
          points,
          plus_minus,
          penalty_minutes,
          shots,
          hits,
          blocked_shots,
          created_at
        `
        break
      case "soccer":
        tableName = "soccer_player_stats"
        statsColumns = `
          player_name,
          position,
          goals,
          assists,
          shots,
          shots_on_target,
          passes,
          passes_completed,
          tackles,
          interceptions,
          created_at
        `
        break
    }

    let query = supabase
      .from(tableName)
      .select(`
        ${statsColumns},
        team_id,
        game_id,
        games!inner(
          game_date,
          home_team:teams!games_home_team_id_fkey(name, abbreviation),
          away_team:teams!games_away_team_id_fkey(name, abbreviation)
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())

    if (team !== "all") {
      query = query.eq("team_id", team)
    }

    const { data: playerStats, error: statsError } = await query

    if (statsError) {
      console.error("Error fetching player stats:", statsError)
      return NextResponse.json({
        players: [],
        meta: {
          fromCache: false,
          responseTime: 0,
          source: "supabase",
          error: "Failed to fetch player stats"
        }
      })
    }

    // Process player performance data
    const players = processPlayerPerformance(playerStats || [], sport)
    
    return NextResponse.json({
      players,
      meta: {
        fromCache: false,
        responseTime: 0,
        source: "supabase",
        total: players.length
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processPlayerPerformance(playerStats: any[], sport: string) {
  const playerMap: Record<string, any> = {}
  
  playerStats.forEach(stat => {
    const playerName = stat.player_name
    if (!playerName) return
    
    if (!playerMap[playerName]) {
      playerMap[playerName] = {
        name: playerName,
        position: stat.position,
        games: 0,
        stats: {},
        team: stat.games?.home_team?.name || stat.games?.away_team?.name || 'Unknown'
      }
    }
    
    playerMap[playerName].games++
    
    // Aggregate stats based on sport
    switch (sport) {
      case "basketball":
        playerMap[playerName].stats = {
          points: (playerMap[playerName].stats.points || 0) + (stat.points || 0),
          rebounds: (playerMap[playerName].stats.rebounds || 0) + (stat.rebounds || 0),
          assists: (playerMap[playerName].stats.assists || 0) + (stat.assists || 0),
          steals: (playerMap[playerName].stats.steals || 0) + (stat.steals || 0),
          blocks: (playerMap[playerName].stats.blocks || 0) + (stat.blocks || 0),
          fgm: (playerMap[playerName].stats.fgm || 0) + (stat.field_goals_made || 0),
          fga: (playerMap[playerName].stats.fga || 0) + (stat.field_goals_attempted || 0),
          fg3m: (playerMap[playerName].stats.fg3m || 0) + (stat.three_pointers_made || 0),
          fg3a: (playerMap[playerName].stats.fg3a || 0) + (stat.three_pointers_attempted || 0),
          ftm: (playerMap[playerName].stats.ftm || 0) + (stat.free_throws_made || 0),
          fta: (playerMap[playerName].stats.fta || 0) + (stat.free_throws_attempted || 0),
          minutes: (playerMap[playerName].stats.minutes || 0) + (stat.minutes_played || 0)
        }
        break
      case "football":
        playerMap[playerName].stats = {
          passingYards: (playerMap[playerName].stats.passingYards || 0) + (stat.passing_yards || 0),
          passingTDs: (playerMap[playerName].stats.passingTDs || 0) + (stat.passing_touchdowns || 0),
          rushingYards: (playerMap[playerName].stats.rushingYards || 0) + (stat.rushing_yards || 0),
          rushingTDs: (playerMap[playerName].stats.rushingTDs || 0) + (stat.rushing_touchdowns || 0),
          receivingYards: (playerMap[playerName].stats.receivingYards || 0) + (stat.receiving_yards || 0),
          receivingTDs: (playerMap[playerName].stats.receivingTDs || 0) + (stat.receiving_touchdowns || 0),
          receptions: (playerMap[playerName].stats.receptions || 0) + (stat.receptions || 0),
          tackles: (playerMap[playerName].stats.tackles || 0) + (stat.tackles || 0),
          sacks: (playerMap[playerName].stats.sacks || 0) + (stat.sacks || 0),
          interceptions: (playerMap[playerName].stats.interceptions || 0) + (stat.interceptions || 0)
        }
        break
      case "baseball":
        playerMap[playerName].stats = {
          atBats: (playerMap[playerName].stats.atBats || 0) + (stat.at_bats || 0),
          hits: (playerMap[playerName].stats.hits || 0) + (stat.hits || 0),
          runs: (playerMap[playerName].stats.runs || 0) + (stat.runs || 0),
          rbi: (playerMap[playerName].stats.rbi || 0) + (stat.rbi || 0),
          homeRuns: (playerMap[playerName].stats.homeRuns || 0) + (stat.home_runs || 0),
          doubles: (playerMap[playerName].stats.doubles || 0) + (stat.doubles || 0),
          triples: (playerMap[playerName].stats.triples || 0) + (stat.triples || 0),
          walks: (playerMap[playerName].stats.walks || 0) + (stat.walks || 0),
          strikeouts: (playerMap[playerName].stats.strikeouts || 0) + (stat.strikeouts || 0)
        }
        break
      case "hockey":
        playerMap[playerName].stats = {
          goals: (playerMap[playerName].stats.goals || 0) + (stat.goals || 0),
          assists: (playerMap[playerName].stats.assists || 0) + (stat.assists || 0),
          points: (playerMap[playerName].stats.points || 0) + (stat.points || 0),
          plusMinus: (playerMap[playerName].stats.plusMinus || 0) + (stat.plus_minus || 0),
          penaltyMinutes: (playerMap[playerName].stats.penaltyMinutes || 0) + (stat.penalty_minutes || 0),
          shots: (playerMap[playerName].stats.shots || 0) + (stat.shots || 0),
          hits: (playerMap[playerName].stats.hits || 0) + (stat.hits || 0),
          blockedShots: (playerMap[playerName].stats.blockedShots || 0) + (stat.blocked_shots || 0)
        }
        break
      case "soccer":
        playerMap[playerName].stats = {
          goals: (playerMap[playerName].stats.goals || 0) + (stat.goals || 0),
          assists: (playerMap[playerName].stats.assists || 0) + (stat.assists || 0),
          shots: (playerMap[playerName].stats.shots || 0) + (stat.shots || 0),
          shotsOnTarget: (playerMap[playerName].stats.shotsOnTarget || 0) + (stat.shots_on_target || 0),
          passes: (playerMap[playerName].stats.passes || 0) + (stat.passes || 0),
          passesCompleted: (playerMap[playerName].stats.passesCompleted || 0) + (stat.passes_completed || 0),
          tackles: (playerMap[playerName].stats.tackles || 0) + (stat.tackles || 0),
          interceptions: (playerMap[playerName].stats.interceptions || 0) + (stat.interceptions || 0)
        }
        break
    }
  })
  
  // Calculate averages and sort by performance
  const players = Object.values(playerMap).map((player: any) => {
    const games = player.games
    const stats = player.stats
    
    // Calculate averages based on sport
    switch (sport) {
      case "basketball":
        return {
          ...player,
          averages: {
            points: games > 0 ? (stats.points / games).toFixed(1) : 0,
            rebounds: games > 0 ? (stats.rebounds / games).toFixed(1) : 0,
            assists: games > 0 ? (stats.assists / games).toFixed(1) : 0,
            steals: games > 0 ? (stats.steals / games).toFixed(1) : 0,
            blocks: games > 0 ? (stats.blocks / games).toFixed(1) : 0,
            fgPct: stats.fga > 0 ? ((stats.fgm / stats.fga) * 100).toFixed(1) : 0,
            fg3Pct: stats.fg3a > 0 ? ((stats.fg3m / stats.fg3a) * 100).toFixed(1) : 0,
            ftPct: stats.fta > 0 ? ((stats.ftm / stats.fta) * 100).toFixed(1) : 0,
            minutes: games > 0 ? (stats.minutes / games).toFixed(1) : 0
          },
          totalStats: stats
        }
      case "football":
        return {
          ...player,
          averages: {
            passingYards: games > 0 ? (stats.passingYards / games).toFixed(1) : 0,
            passingTDs: games > 0 ? (stats.passingTDs / games).toFixed(1) : 0,
            rushingYards: games > 0 ? (stats.rushingYards / games).toFixed(1) : 0,
            rushingTDs: games > 0 ? (stats.rushingTDs / games).toFixed(1) : 0,
            receivingYards: games > 0 ? (stats.receivingYards / games).toFixed(1) : 0,
            receivingTDs: games > 0 ? (stats.receivingTDs / games).toFixed(1) : 0,
            receptions: games > 0 ? (stats.receptions / games).toFixed(1) : 0,
            tackles: games > 0 ? (stats.tackles / games).toFixed(1) : 0,
            sacks: games > 0 ? (stats.sacks / games).toFixed(1) : 0,
            interceptions: games > 0 ? (stats.interceptions / games).toFixed(1) : 0
          },
          totalStats: stats
        }
      case "baseball":
        return {
          ...player,
          averages: {
            battingAvg: stats.atBats > 0 ? (stats.hits / stats.atBats).toFixed(3) : 0,
            runs: games > 0 ? (stats.runs / games).toFixed(1) : 0,
            rbi: games > 0 ? (stats.rbi / games).toFixed(1) : 0,
            homeRuns: games > 0 ? (stats.homeRuns / games).toFixed(1) : 0,
            doubles: games > 0 ? (stats.doubles / games).toFixed(1) : 0,
            triples: games > 0 ? (stats.triples / games).toFixed(1) : 0,
            walks: games > 0 ? (stats.walks / games).toFixed(1) : 0,
            strikeouts: games > 0 ? (stats.strikeouts / games).toFixed(1) : 0
          },
          totalStats: stats
        }
      case "hockey":
        return {
          ...player,
          averages: {
            goals: games > 0 ? (stats.goals / games).toFixed(1) : 0,
            assists: games > 0 ? (stats.assists / games).toFixed(1) : 0,
            points: games > 0 ? (stats.points / games).toFixed(1) : 0,
            plusMinus: games > 0 ? (stats.plusMinus / games).toFixed(1) : 0,
            penaltyMinutes: games > 0 ? (stats.penaltyMinutes / games).toFixed(1) : 0,
            shots: games > 0 ? (stats.shots / games).toFixed(1) : 0,
            hits: games > 0 ? (stats.hits / games).toFixed(1) : 0,
            blockedShots: games > 0 ? (stats.blockedShots / games).toFixed(1) : 0
          },
          totalStats: stats
        }
      case "soccer":
        return {
          ...player,
          averages: {
            goals: games > 0 ? (stats.goals / games).toFixed(1) : 0,
            assists: games > 0 ? (stats.assists / games).toFixed(1) : 0,
            shots: games > 0 ? (stats.shots / games).toFixed(1) : 0,
            shotsOnTarget: games > 0 ? (stats.shotsOnTarget / games).toFixed(1) : 0,
            passes: games > 0 ? (stats.passes / games).toFixed(1) : 0,
            passAccuracy: stats.passes > 0 ? ((stats.passesCompleted / stats.passes) * 100).toFixed(1) : 0,
            tackles: games > 0 ? (stats.tackles / games).toFixed(1) : 0,
            interceptions: games > 0 ? (stats.interceptions / games).toFixed(1) : 0
          },
          totalStats: stats
        }
      default:
        return player
    }
  })
  
  // Sort by primary performance metric
  return players.sort((a: any, b: any) => {
    const aPrimary = parseFloat(a.averages?.points || a.averages?.goals || a.averages?.runs || 0)
    const bPrimary = parseFloat(b.averages?.points || b.averages?.goals || b.averages?.runs || 0)
    return bPrimary - aPrimary
  }).slice(0, 20) // Top 20 performers
}
