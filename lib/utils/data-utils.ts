/**
 * Data utilities for handling sports data consistently across the application
 */

// Simple cache for normalized data to prevent redundant operations
const normalizationCache = new Map<string, any>()
const CACHE_TTL = 60000 // 1 minute

// Store timestamps with cache entries for proper cleanup
const cacheTimestamps = new Map<string, number>()

/**
 * Generate a unique game ID based on game details to prevent duplicates
 */
export function generateGameId(gameData: {
  homeTeam: string | null
  awayTeam: string | null
  date: string
  sport: string
  league?: string | null
}): string {
  // Create a more robust hash of the game details to ensure uniqueness
  const gameString = `${gameData.homeTeam}-${gameData.awayTeam}-${gameData.date}-${gameData.sport}-${gameData.league || ''}`
  // Use a more reliable hashing method
  let hash = 0
  for (let i = 0; i < gameString.length; i++) {
    const char = gameString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `game_${Math.abs(hash)}`
}

/**
 * Generate a unique team ID based on team details
 */
export function generateTeamId(teamData: {
  name: string | null
  sport: string
  league?: string | null
}): string {
  // Create a more robust hash of the team details to ensure uniqueness
  const teamString = `${teamData.name}-${teamData.sport}-${teamData.league || ''}`
  // Use a more reliable hashing method
  let hash = 0
  for (let i = 0; i < teamString.length; i++) {
    const char = teamString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `team_${Math.abs(hash)}`
}

/**
 * Normalize team data to ensure consistency across all sports
 */
export function normalizeTeamData(team: any, sport: string, league?: string) {
  // Check cache first for better performance
  const cacheKey = `team-${JSON.stringify(team)}-${sport}-${league || ''}`
  const cached = normalizationCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Handle different data sources and normalize team names
  // If team is null/undefined, return null instead of placeholder data
  if (!team || (typeof team === 'object' && Object.keys(team).length === 0)) {
    return null
  }

  const teamName = (team.name || team.displayName || team.full_name || team.teamName) ?? null

  // Special handling for common naming inconsistencies
  const normalizedTeamName = teamName
    .replace(' FC', '')
    .replace(' FC.', '')
    .replace(' CF', '')
    .replace(' SC', '')
    .replace(' AFC', '')
    .replace(' BFC', '')
    .replace(' RFC', ' ')
    .replace(' LFC', '')
    .replace('IFK ', '')
    .replace(' BK ', '')
    .replace(' FK ', ' ')
    .trim()

  const result = {
    id:
      team.id ||
      generateTeamId({ name: normalizedTeamName || null, sport, league: league ?? null }),
    name: normalizedTeamName,
    city: team.city || team.location || team.venueCity || null,
    league: (team.league || league) ?? null,
    sport: team.sport || sport,
    abbreviation: team.abbreviation || team.abbrev || team.shortName || null,
    logo_url: team.logo_url || team.logo || team.teamLogo || team.crest || team.badge || null,
    founded: team.founded || team.established || null,
    venue: team.venue || team.stadium || team.homeStadium || null,
    capacity: team.capacity || team.venueCapacity || null,
    created_at: team.created_at || new Date().toISOString(),
    updated_at: team.updated_at || new Date().toISOString(),
  }

  normalizationCache.set(cacheKey, result)
  cacheTimestamps.set(cacheKey, Date.now())
  return result
}

/**
 * Normalize game data to ensure consistency across all sports
 */
export function normalizeGameData(game: any, sport: string, league?: string) {
  // Check cache first for better performance
  const cacheKey = `game-${JSON.stringify(game)}-${sport}-${league || ''}`
  const cached = normalizationCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Normalize team data first with better error handling - support multiple data structures
  const homeTeamData = game.home_team_data || game.home_team || game.homeTeam || game.home || {}
  const awayTeamData = game.away_team_data || game.away_team || game.awayTeam || game.away || {}

  const normalizedHomeTeam = normalizeTeamData(homeTeamData, sport, league)
  const normalizedAwayTeam = normalizeTeamData(awayTeamData, sport, league)

  // Normalize date handling for different formats
  let gameDate = new Date().toISOString()
  if (game.game_date) {
    gameDate = new Date(game.game_date).toISOString()
  } else if (game.date) {
    gameDate = new Date(game.date).toISOString()
  } else if (game.dateTime) {
    gameDate = new Date(game.dateTime).toISOString()
  }

  // Normalize status with more comprehensive mapping
  let status = game.status || 'scheduled'
  // Ensure status is a string before calling toLowerCase
  const statusLower =
    typeof status === 'string' ? status.toLowerCase() : String(status || '').toLowerCase()

  if (
    statusLower.includes('live') ||
    statusLower.includes('in progress') ||
    statusLower.includes('in_progress')
  ) {
    status = 'in_progress'
  } else if (
    statusLower.includes('complete') ||
    statusLower.includes('final') ||
    statusLower.includes('finished')
  ) {
    status = 'completed'
  } else if (statusLower.includes('postponed') || statusLower.includes('delayed')) {
    status = 'postponed'
  } else if (statusLower.includes('scheduled') || statusLower.includes('upcoming')) {
    status = 'scheduled'
  }

  const result = {
    id:
      game.id ||
      generateGameId({
        homeTeam: normalizedHomeTeam?.name || 'home',
        awayTeam: normalizedAwayTeam?.name || 'away',
        date: gameDate,
        sport,
        league: league ?? null,
      }),
    home_team_id: normalizedHomeTeam.id,
    away_team_id: normalizedAwayTeam.id,
    game_date: gameDate,
    season: game.season || game.year || new Date().getFullYear().toString(),
    // week: game.week || game.matchday || game.round || null, // Not stored in database
    home_score:
      game.home_score !== undefined
        ? game.home_score
        : game.homeScore !== undefined
          ? game.homeScore
          : game.score?.home !== undefined
            ? game.score.home
            : null,
    away_score:
      game.away_score !== undefined
        ? game.away_score
        : game.awayScore !== undefined
          ? game.awayScore
          : game.score?.away !== undefined
            ? game.score.away
            : null,
    status: status,
    venue: game.venue || game.location || game.stadium || game.arena || null,
    league: (game.league || league) ?? null,
    sport: game.sport || sport,
    broadcast: game.broadcast || game.tv || game.channel || null,
    attendance: game.attendance || game.attendees || null,
    game_time: game.game_time || game.time || game.kickoffTime || null,
    time_remaining: game.time_remaining || game.clock || game.timeRemaining || null,
    quarter: game.quarter || game.period || game.half || null,
    possession: game.possession || null,
    last_play: game.last_play || game.lastPlay || null,
    home_team: normalizedHomeTeam,
    away_team: normalizedAwayTeam,
    created_at: game.created_at || new Date().toISOString(),
    updated_at: game.updated_at || new Date().toISOString(),
  }

  normalizationCache.set(cacheKey, result)
  cacheTimestamps.set(cacheKey, Date.now())
  return result
}

/**
 * Check if a game is actually live (not just marked as live)
 * Only returns true for games that are truly in progress with real activity
 */
export function isGameActuallyLive(game: any, options?: { graceWindowMinutes?: number }): boolean {
  // Validate input
  if (!game || typeof game !== 'object') {
    return false
  }

  // CRITICAL FIX: Ensure status is always a string before calling toLowerCase
  let status = ''
  let statusLower = ''

  try {
    if (game.status === null || game.status === undefined) {
      status = ''
    } else if (typeof game.status === 'string') {
      status = game.status
    } else if (typeof game.status === 'object' && game.status !== null) {
      // Handle status objects - extract the actual status value
      const statusObj = game.status
      status =
        statusObj.status ||
        statusObj.state ||
        statusObj.detailedState ||
        statusObj.abstractGameState ||
        statusObj.codedGameState ||
        String(statusObj)

      // Log the status object for debugging
      console.log('Status object detected:', {
        status: game.status,
        extractedStatus: status,
        gameId: game.id,
      })
    } else {
      // Handle other non-string status values (numbers, etc.)
      status = String(game.status)
    }

    // Now safely call toLowerCase
    statusLower = status.toLowerCase()
  } catch (error) {
    console.error('Error processing game status:', error, {
      game,
      status: game.status,
      statusType: typeof game.status,
    })
    return false
  }

  // Must have live status
  const hasLiveStatus =
    statusLower.includes('live') ||
    statusLower.includes('progress') ||
    statusLower.includes('in_progress') ||
    statusLower.includes('in progress') ||
    statusLower === 'live'

  if (!hasLiveStatus) {
    return false
  }

  // Must have actual scores (not just 0-0 or null)
  const homeScore =
    game.home_score !== null && game.home_score !== undefined ? Number(game.home_score) : 0
  const awayScore =
    game.away_score !== null && game.away_score !== undefined ? Number(game.away_score) : 0
  const hasRealScores = homeScore > 0 || awayScore > 0

  // Additional checks for various live indicators
  const hasLiveIndicators =
    statusLower.includes('quarter') ||
    statusLower.includes('period') ||
    statusLower.includes('inning') ||
    statusLower.includes('half') ||
    statusLower.includes('overtime') ||
    statusLower.includes('extra') ||
    statusLower.includes('q') ||
    statusLower.includes('p')

  // Grace window: treat as live for a limited time after scheduled start even if 0-0
  let withinGraceWindow = false
  try {
    const gameStart = game.game_date ? new Date(game.game_date).getTime() : NaN
    if (!Number.isNaN(gameStart)) {
      const now = Date.now()
      const windowMs = ((options?.graceWindowMinutes ?? 15) * 60 * 1000)
      withinGraceWindow = now - gameStart >= 0 && now - gameStart <= windowMs
    }
  } catch {}

  // Game must have live status AND either: real scores, live indicators, or be in grace window
  return hasLiveStatus && (hasRealScores || hasLiveIndicators || withinGraceWindow)
}

/**
 * Enhanced deduplication for games with better conflict resolution
 */
export function deduplicateGames(games: any[]): any[] {
  const gameMap = new Map<string, any>()

  games.forEach(game => {
    // If we already have this game, resolve conflicts intelligently
    if (gameMap.has(game.id)) {
      const existingGame = gameMap.get(game.id)

      // Prefer games with actual scores over those without
      const currentHasScores = game.home_score !== null || game.away_score !== null
      const existingHasScores = existingGame.home_score !== null || existingGame.away_score !== null

      if (currentHasScores && !existingHasScores) {
        gameMap.set(game.id, game)
        return
      }

      if (!currentHasScores && existingHasScores) {
        return // Keep existing game
      }

      // If both have scores or both don't, prefer the one with more recent updates
      const currentUpdateTime = new Date(game.updated_at || game.created_at || new Date())
      const existingUpdateTime = new Date(
        existingGame.updated_at || existingGame.created_at || new Date()
      )

      if (currentUpdateTime > existingUpdateTime) {
        gameMap.set(game.id, game)
        return
      }

      // If timestamps are equal or existing is newer, check for more complete data
      const currentCompleteness = Object.values(game).filter(
        v => v !== null && v !== undefined
      ).length
      const existingCompleteness = Object.values(existingGame).filter(
        v => v !== null && v !== undefined
      ).length

      if (currentCompleteness > existingCompleteness) {
        gameMap.set(game.id, game)
      }
    } else {
      gameMap.set(game.id, game)
    }
  })

  return Array.from(gameMap.values())
}

/**
 * Enhanced deduplication for teams with better conflict resolution
 */
export function deduplicateTeams(teams: any[]): any[] {
  const teamMap = new Map<string, any>()

  teams.forEach(team => {
    // If we already have this team, resolve conflicts intelligently
    if (teamMap.has(team.id)) {
      const existingTeam = teamMap.get(team.id)

      // Prefer teams with more complete data
      const currentCompleteness = Object.values(team).filter(
        v => v !== null && v !== undefined
      ).length
      const existingCompleteness = Object.values(existingTeam).filter(
        v => v !== null && v !== undefined
      ).length

      if (currentCompleteness > existingCompleteness) {
        teamMap.set(team.id, team)
        return
      }

      // If completeness is equal, prefer the one with more recent updates
      const currentUpdateTime = new Date(team.updated_at || team.created_at || new Date())
      const existingUpdateTime = new Date(
        existingTeam.updated_at || existingTeam.created_at || new Date()
      )

      if (currentUpdateTime > existingUpdateTime) {
        teamMap.set(team.id, team)
      }
    } else {
      teamMap.set(team.id, team)
    }
  })

  return Array.from(teamMap.values())
}

/**
 * Cross-sport normalization for consistent data representation
 * Uses dynamic sport configuration from database instead of hardcoded rules
 */
export async function normalizeSportData(data: any, sport: string): Promise<any> {
  // Check cache first for better performance
  const cacheKey = `sport-${JSON.stringify(data)}-${sport}`
  const cached = normalizationCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Get sport configuration dynamically
    const { SportConfigManager } = await import('@/lib/services/core/sport-config')
    const config = await SportConfigManager.getSportConfig(sport)

    if (!config) {
      console.warn(`No configuration found for sport: ${sport}`)
      normalizationCache.set(cacheKey, data) // Cache the result
      cacheTimestamps.set(cacheKey, Date.now())
      return data // Return as-is for unknown sports
    }

    // Apply dynamic normalization based on sport configuration
    const normalized = { ...data }

    // Apply sport-specific field mappings based on configuration
    if (config.scoringFields) {
      // Map scoring fields dynamically
      if (data.quarter !== undefined || data.period !== undefined) {
        normalized.period = data.quarter || data.period || null
      }
      if (data.time_remaining !== undefined || data.clock !== undefined) {
        normalized.time_remaining = data.time_remaining || data.clock || null
      }
    }

    normalizationCache.set(cacheKey, normalized) // Cache the result
    cacheTimestamps.set(cacheKey, Date.now())
    return normalized
  } catch (error) {
    console.error('Error in dynamic sport normalization:', error)
    normalizationCache.set(cacheKey, data) // Cache the result
    cacheTimestamps.set(cacheKey, Date.now())
    return data // Fallback to original data
  }
}

// Periodically clean up the cache
setInterval(() => {
  const now = Date.now()
  const expiredKeys: string[] = []

  // Find expired entries
  for (const [key, timestamp] of cacheTimestamps) {
    if (now - timestamp > CACHE_TTL) {
      expiredKeys.push(key)
    }
  }

  // Remove expired entries
  for (const key of expiredKeys) {
    normalizationCache.delete(key)
    cacheTimestamps.delete(key)
  }

  // Only log if we actually cleaned up entries
  if (expiredKeys.length > 0) {
    console.log(`[Data Utils] Cleaned up ${expiredKeys.length} expired cache entries`)
  }
}, 30000) // Clean up every 30 seconds

/**
 * DEPRECATED: Legacy sport-specific functions removed in favor of dynamic configuration
 * All sport normalization now uses the dynamic normalizeSportData function above
 * that reads from the sports configuration database table
 */
