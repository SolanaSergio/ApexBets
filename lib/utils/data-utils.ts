/**
 * Data utilities for handling sports data consistently across the application
 */

/**
 * Generate a unique game ID based on game details to prevent duplicates
 */
export function generateGameId(gameData: {
  homeTeam: string;
  awayTeam: string;
  date: string;
  sport: string;
  league?: string;
}): string {
  // Create a more robust hash of the game details to ensure uniqueness
  const gameString = `${gameData.homeTeam}-${gameData.awayTeam}-${gameData.date}-${gameData.sport}-${gameData.league || ''}`;
  // Use a more reliable hashing method
  let hash = 0;
  for (let i = 0; i < gameString.length; i++) {
    const char = gameString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `game_${Math.abs(hash)}`;
}

/**
 * Generate a unique team ID based on team details
 */
export function generateTeamId(teamData: {
  name: string;
  sport: string;
  league?: string;
}): string {
  // Create a more robust hash of the team details to ensure uniqueness
  const teamString = `${teamData.name}-${teamData.sport}-${teamData.league || ''}`;
  // Use a more reliable hashing method
  let hash = 0;
  for (let i = 0; i < teamString.length; i++) {
    const char = teamString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `team_${Math.abs(hash)}`;
}

/**
 * Normalize team data to ensure consistency across all sports
 */
export function normalizeTeamData(team: any, sport: string, league?: string) {
  // Handle different data sources and normalize team names
  const teamName = team.name || team.displayName || team.full_name || team.teamName || 'Unknown Team';
  
  // Special handling for common naming inconsistencies
  const normalizedTeamName = teamName
    .replace(' FC', '')
    .replace(' FC.', '')
    .replace(' CF', '')
    .replace(' SC', '')
    .replace(' AFC', '')
    .replace(' BFC', '')
    .replace(' RFC', '')
    .replace(' LFC', '')
    .replace('IFK ', '')
    .replace(' BK ', '')
    .replace(' FK ', ' ')
    .trim();

  return {
    id: team.id || generateTeamId({ name: normalizedTeamName, sport, league: league || 'Unknown' }),
    name: normalizedTeamName,
    city: team.city || team.location || team.venueCity || null,
    league: team.league || league || 'Unknown',
    sport: team.sport || sport,
    abbreviation: team.abbreviation || team.abbrev || team.shortName || null,
    logo_url: team.logo_url || team.logo || team.teamLogo || team.crest || team.badge || null,
    founded: team.founded || team.established || null,
    venue: team.venue || team.stadium || team.homeStadium || null,
    capacity: team.capacity || team.venueCapacity || null,
    created_at: team.created_at || new Date().toISOString(),
    updated_at: team.updated_at || new Date().toISOString()
  };
}

/**
 * Normalize game data to ensure consistency across all sports
 */
export function normalizeGameData(game: any, sport: string, league?: string) {
  // Normalize team data first with better error handling
  const homeTeamData = game.home_team || game.homeTeam || game.home || {};
  const awayTeamData = game.away_team || game.awayTeam || game.away || {};
  
  const normalizedHomeTeam = normalizeTeamData(homeTeamData, sport, league);
  const normalizedAwayTeam = normalizeTeamData(awayTeamData, sport, league);
  
  // Normalize date handling for different formats
  let gameDate = new Date().toISOString();
  if (game.game_date) {
    gameDate = new Date(game.game_date).toISOString();
  } else if (game.date) {
    gameDate = new Date(game.date).toISOString();
  } else if (game.dateTime) {
    gameDate = new Date(game.dateTime).toISOString();
  }
  
  // Normalize status with more comprehensive mapping
  let status = game.status || 'scheduled';
  // Ensure status is a string before calling toLowerCase
  const statusLower = typeof status === 'string' ? status.toLowerCase() : String(status).toLowerCase();
  
  if (statusLower.includes('live') || statusLower.includes('in progress') || statusLower.includes('in_progress')) {
    status = 'in_progress';
  } else if (statusLower.includes('complete') || statusLower.includes('final') || statusLower.includes('finished')) {
    status = 'completed';
  } else if (statusLower.includes('postponed') || statusLower.includes('delayed')) {
    status = 'postponed';
  } else if (statusLower.includes('scheduled') || statusLower.includes('upcoming')) {
    status = 'scheduled';
  }

  return {
    id: game.id || generateGameId({
      homeTeam: normalizedHomeTeam.name,
      awayTeam: normalizedAwayTeam.name,
      date: gameDate,
      sport,
      league: league || 'Unknown'
    }),
    home_team_id: normalizedHomeTeam.id,
    away_team_id: normalizedAwayTeam.id,
    game_date: gameDate,
    season: game.season || game.year || new Date().getFullYear().toString(),
    week: game.week || game.matchday || game.round || null,
    home_score: game.home_score !== undefined ? game.home_score : 
               game.homeScore !== undefined ? game.homeScore : 
               game.score?.home !== undefined ? game.score.home : null,
    away_score: game.away_score !== undefined ? game.away_score : 
               game.awayScore !== undefined ? game.awayScore : 
               game.score?.away !== undefined ? game.score.away : null,
    status: status,
    venue: game.venue || game.location || game.stadium || game.arena || null,
    league: game.league || league || 'Unknown',
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
    updated_at: game.updated_at || new Date().toISOString()
  };
}

/**
 * Check if a game is actually live (not just marked as live)
 * Only returns true for games that are truly in progress with real activity
 */
export function isGameActuallyLive(game: any): boolean {
  const status = (game.status || '').toLowerCase();
  
  // Must have live status
  const hasLiveStatus = status.includes('live') || 
                       status.includes('progress') || 
                       status.includes('in_progress') ||
                       status.includes('in progress') ||
                       status === 'live';
  
  if (!hasLiveStatus) {
    return false;
  }
  
  // Must have actual scores (not just 0-0 or null)
  const homeScore = game.home_score !== null && game.home_score !== undefined ? game.home_score : 0;
  const awayScore = game.away_score !== null && game.away_score !== undefined ? game.away_score : 0;
  const hasRealScores = homeScore > 0 || awayScore > 0;
  
  // Additional checks for various live indicators
  const hasLiveIndicators = status.includes('quarter') ||
                           status.includes('period') ||
                           status.includes('inning') ||
                           status.includes('half') ||
                           status.includes('overtime') ||
                           status.includes('extra') ||
                           status.includes('q') ||
                           status.includes('p');
  
  // Game must have live status AND either real scores or live indicators
  return hasLiveStatus && (hasRealScores || hasLiveIndicators);
}

/**
 * Enhanced deduplication for games with better conflict resolution
 */
export function deduplicateGames(games: any[]): any[] {
  const gameMap = new Map<string, any>();
  
  games.forEach(game => {
    // If we already have this game, resolve conflicts intelligently
    if (gameMap.has(game.id)) {
      const existingGame = gameMap.get(game.id);
      
      // Prefer games with actual scores over those without
      const currentHasScores = (game.home_score !== null || game.away_score !== null);
      const existingHasScores = (existingGame.home_score !== null || existingGame.away_score !== null);
      
      if (currentHasScores && !existingHasScores) {
        gameMap.set(game.id, game);
        return;
      }
      
      if (!currentHasScores && existingHasScores) {
        return; // Keep existing game
      }
      
      // If both have scores or both don't, prefer the one with more recent updates
      const currentUpdateTime = new Date(game.updated_at || game.created_at || new Date());
      const existingUpdateTime = new Date(existingGame.updated_at || existingGame.created_at || new Date());
      
      if (currentUpdateTime > existingUpdateTime) {
        gameMap.set(game.id, game);
        return;
      }
      
      // If timestamps are equal or existing is newer, check for more complete data
      const currentCompleteness = Object.values(game).filter(v => v !== null && v !== undefined).length;
      const existingCompleteness = Object.values(existingGame).filter(v => v !== null && v !== undefined).length;
      
      if (currentCompleteness > existingCompleteness) {
        gameMap.set(game.id, game);
      }
    } else {
      gameMap.set(game.id, game);
    }
  });
  
  return Array.from(gameMap.values());
}

/**
 * Enhanced deduplication for teams with better conflict resolution
 */
export function deduplicateTeams(teams: any[]): any[] {
  const teamMap = new Map<string, any>();
  
  teams.forEach(team => {
    // If we already have this team, resolve conflicts intelligently
    if (teamMap.has(team.id)) {
      const existingTeam = teamMap.get(team.id);
      
      // Prefer teams with more complete data
      const currentCompleteness = Object.values(team).filter(v => v !== null && v !== undefined).length;
      const existingCompleteness = Object.values(existingTeam).filter(v => v !== null && v !== undefined).length;
      
      if (currentCompleteness > existingCompleteness) {
        teamMap.set(team.id, team);
        return;
      }
      
      // If completeness is equal, prefer the one with more recent updates
      const currentUpdateTime = new Date(team.updated_at || team.created_at || new Date());
      const existingUpdateTime = new Date(existingTeam.updated_at || existingTeam.created_at || new Date());
      
      if (currentUpdateTime > existingUpdateTime) {
        teamMap.set(team.id, team);
      }
    } else {
      teamMap.set(team.id, team);
    }
  });
  
  return Array.from(teamMap.values());
}

/**
 * Cross-sport normalization for consistent data representation
 */
export function normalizeSportData(data: any, sport: string): any {
  // Apply sport-specific normalization rules
  switch (sport.toLowerCase()) {
    case 'basketball':
      return normalizeBasketballData(data);
    case 'football':
    case 'soccer':
      return normalizeFootballData(data);
    case 'baseball':
      return normalizeBaseballData(data);
    case 'hockey':
      return normalizeHockeyData(data);
    default:
      return data; // Return as-is for unknown sports
  }
}

/**
 * Basketball-specific data normalization
 */
function normalizeBasketballData(data: any): any {
  return {
    ...data,
    quarter: data.quarter || data.period || null,
    time_remaining: data.time_remaining || data.clock || null,
  };
}

/**
 * Football/Soccer-specific data normalization
 */
function normalizeFootballData(data: any): any {
  return {
    ...data,
    half: data.half || data.period || null,
    time_remaining: data.time_remaining || data.clock || null,
  };
}

/**
 * Baseball-specific data normalization
 */
function normalizeBaseballData(data: any): any {
  return {
    ...data,
    inning: data.inning || data.period || null,
    outs: data.outs || null,
    balls: data.balls || null,
    strikes: data.strikes || null,
  };
}

/**
 * Hockey-specific data normalization
 */
function normalizeHockeyData(data: any): any {
  return {
    ...data,
    period: data.period || data.quarter || null,
    time_remaining: data.time_remaining || data.clock || null,
  };
}
