/**
 * Sports Data Normalization Service
 * Standardizes data from different API providers into unified formats
 * Following best practices from the comprehensive sports data API guide
 */

// Unified data interfaces
export interface UnifiedTeam {
  id: string
  name: string
  city: string
  abbreviation: string
  conference?: string
  division?: string
  league: string
  sport: string
  logo?: string
  founded: number | undefined
  venue?: string
  colors?: {
    primary: string
    secondary: string
  }
  record: {
    wins: number
    losses: number
    ties?: number
    otLosses?: number
    winPercentage: number
  } | undefined
  provider: string
  lastUpdated: string
}

export interface UnifiedPlayer {
  id: string
  name: string
  firstName: string
  lastName: string
  position: string
  jerseyNumber: number | undefined
  team: {
    id: string
    name: string
    abbreviation: string
  }
  height: string | undefined
  weight: number | undefined
  age?: number
  birthDate?: string
  birthPlace?: {
    city?: string
    state?: string
    country: string
  }
  college?: string
  experience?: number
  isActive: boolean
  headshot?: string
  provider: string
  lastUpdated: string
}

export interface UnifiedGame {
  id: string
  date: string
  startTime?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled'
  season: string
  gameType: string
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    score: number | undefined
    record?: string
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    score: number | undefined
    record?: string
  }
  venue?: {
    name: string
    city: string
  }
  broadcast?: string[]
  attendance?: number
  gameStats?: {
    period?: number
    timeRemaining?: string
    lastPlay?: string
  }
  provider: string
  lastUpdated: string
}

export interface UnifiedStats {
  playerId: string
  playerName: string
  teamId: string
  season: string
  gameType: string
  stats: {
    gamesPlayed: number
    // Sport-specific stats will extend this
    [key: string]: number | string
  }
  provider: string
  lastUpdated: string
}

// Provider-specific normalizers
export class SportsDataNormalizer {
  
  // Team normalization
  static normalizeTeam(data: any, provider: string, sport: string): UnifiedTeam {
    switch (provider) {
      case 'thesportsdb':
        return this.normalizeTheSportsDBTeam(data, sport)
      case 'espn':
        return this.normalizeESPNTeam(data, sport)
      case 'balldontlie':
        return this.normalizeBallDontLieTeam(data, sport)
      case 'api-sports':
        return this.normalizeApiSportsTeam(data, sport)
      case 'nba-stats':
        return this.normalizeNBAStatsTeam(data, sport)
      case 'mlb-stats':
        return this.normalizeMLBStatsTeam(data, sport)
      case 'nhl':
        return this.normalizeNHLTeam(data, sport)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  private static normalizeTheSportsDBTeam(data: any, sport: string): UnifiedTeam {
    return {
      id: data.idTeam || data.id,
      name: data.strTeam || data.name,
      city: this.extractCityFromTeamName(data.strTeam || data.name),
      abbreviation: data.strTeamShort || this.generateAbbreviation(data.strTeam || data.name),
      conference: data.strConference,
      division: data.strDivision,
      league: data.strLeague || 'Unknown',
      sport: sport,
      logo: data.strTeamBadge || data.strTeamLogo,
      founded: data.intFormedYear ? parseInt(data.intFormedYear) : undefined,
      venue: data.strStadium || data.strArena,
      provider: 'thesportsdb',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeESPNTeam(data: any, sport: string): UnifiedTeam {
    const team = data.team || data
    return {
      id: team.id?.toString() || team.uid,
      name: team.displayName || team.name,
      city: team.location || this.extractCityFromTeamName(team.displayName || team.name),
      abbreviation: team.abbreviation || team.abbrev,
      conference: team.conference?.name,
      division: team.division?.name,
      league: team.league?.name || this.getLeagueFromSport(sport),
      sport: sport,
      logo: team.logos?.[0]?.href || team.logo,
      venue: team.venue?.fullName,
      colors: {
        primary: team.color || '#000000',
        secondary: team.alternateColor || '#FFFFFF'
      },
      record: team.record ? {
        wins: team.record.wins || 0,
        losses: team.record.losses || 0,
        winPercentage: team.record.winPercent || 0
      } : undefined,
      provider: 'espn',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeBallDontLieTeam(data: any, sport: string): UnifiedTeam {
    return {
      id: data.id?.toString(),
      name: data.full_name || `${data.city} ${data.name}`,
      city: data.city,
      abbreviation: data.abbreviation,
      conference: data.conference,
      division: data.division,
      league: 'NBA',
      sport: 'basketball',
      provider: 'balldontlie',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeApiSportsTeam(data: any, sport: string): UnifiedTeam {
    const team = data.team || data
    return {
      id: team.id?.toString(),
      name: team.name,
      city: this.extractCityFromTeamName(team.name),
      abbreviation: team.code || this.generateAbbreviation(team.name),
      league: team.league?.name || this.getLeagueFromSport(sport),
      sport: sport,
      logo: team.logo,
      founded: team.founded,
      venue: team.venue?.name,
      provider: 'api-sports',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeNBAStatsTeam(data: any, sport: string): UnifiedTeam {
    return {
      id: data.TEAM_ID?.toString(),
      name: data.TEAM_NAME,
      city: data.TEAM_CITY,
      abbreviation: data.TEAM_ABBREVIATION,
      conference: data.TEAM_CONFERENCE,
      division: data.TEAM_DIVISION,
      league: 'NBA',
      sport: 'basketball',
      founded: data.YEAR_FOUNDED,
      provider: 'nba-stats',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeMLBStatsTeam(data: any, sport: string): UnifiedTeam {
    return {
      id: data.id?.toString(),
      name: data.name,
      city: data.locationName,
      abbreviation: data.abbreviation,
      league: data.league?.name,
      division: data.division?.name,
      sport: 'baseball',
      founded: data.firstYearOfPlay ? parseInt(data.firstYearOfPlay) : undefined,
      venue: data.venue?.name,
      provider: 'mlb-stats',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeNHLTeam(data: any, sport: string): UnifiedTeam {
    return {
      id: data.id?.toString(),
      name: data.fullName || data.name,
      city: data.placeName?.default || this.extractCityFromTeamName(data.name),
      abbreviation: data.triCode || data.abbreviations?.default,
      conference: data.conference?.name,
      division: data.division?.name,
      league: 'NHL',
      sport: 'hockey',
      logo: data.logo,
      provider: 'nhl',
      lastUpdated: new Date().toISOString()
    }
  }

  // Player normalization
  static normalizePlayer(data: any, provider: string, sport: string): UnifiedPlayer {
    switch (provider) {
      case 'thesportsdb':
        return this.normalizeTheSportsDBPlayer(data, sport)
      case 'espn':
        return this.normalizeESPNPlayer(data, sport)
      case 'balldontlie':
        return this.normalizeBallDontLiePlayer(data, sport)
      case 'nba-stats':
        return this.normalizeNBAStatsPlayer(data, sport)
      case 'mlb-stats':
        return this.normalizeMLBStatsPlayer(data, sport)
      case 'nhl':
        return this.normalizeNHLPlayer(data, sport)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  private static normalizeTheSportsDBPlayer(data: any, sport: string): UnifiedPlayer {
    return {
      id: data.idPlayer,
      name: data.strPlayer,
      firstName: this.extractFirstName(data.strPlayer),
      lastName: this.extractLastName(data.strPlayer),
      position: data.strPosition || 'Unknown',
      team: {
        id: data.idTeam,
        name: data.strTeam,
        abbreviation: this.generateAbbreviation(data.strTeam)
      },
      height: data.strHeight,
      weight: data.strWeight ? parseInt(data.strWeight) : undefined,
      birthDate: data.dateBorn,
      birthPlace: {
        city: data.strBirthLocation,
        country: data.strNationality
      },
      isActive: true, // TheSportsDB doesn't specify
      headshot: data.strThumb,
      provider: 'thesportsdb',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeBallDontLiePlayer(data: any, sport: string): UnifiedPlayer {
    return {
      id: data.id?.toString(),
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      position: data.position,
      jerseyNumber: data.jersey_number ? parseInt(data.jersey_number) : undefined,
      team: {
        id: data.team?.id?.toString(),
        name: data.team?.full_name,
        abbreviation: data.team?.abbreviation
      },
      height: data.height,
      weight: data.weight,
      college: data.college,
      birthPlace: {
        country: data.country
      },
      isActive: true,
      provider: 'balldontlie',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeNBAStatsPlayer(data: any, sport: string): UnifiedPlayer {
    return {
      id: data.PERSON_ID?.toString(),
      name: data.DISPLAY_FIRST_LAST,
      firstName: this.extractFirstName(data.DISPLAY_FIRST_LAST),
      lastName: this.extractLastName(data.DISPLAY_FIRST_LAST),
      position: data.POSITION,
      jerseyNumber: data.JERSEY_NUMBER ? parseInt(data.JERSEY_NUMBER) : undefined,
      team: {
        id: data.TEAM_ID?.toString(),
        name: `${data.TEAM_CITY} ${data.TEAM_NAME}`,
        abbreviation: data.TEAM_ABBREVIATION
      },
      height: data.HEIGHT,
      weight: data.WEIGHT,
      age: data.AGE,
      birthDate: data.BIRTHDATE,
      college: data.SCHOOL,
      birthPlace: {
        country: data.COUNTRY
      },
      experience: data.EXP ? parseInt(data.EXP) : undefined,
      isActive: data.ROSTERSTATUS === 'Active',
      provider: 'nba-stats',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeMLBStatsPlayer(data: any, sport: string): UnifiedPlayer {
    return {
      id: data.id?.toString(),
      name: data.fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.primaryPosition?.name,
      jerseyNumber: data.primaryNumber ? parseInt(data.primaryNumber) : undefined,
      team: {
        id: '', // Would need to be filled from context
        name: '',
        abbreviation: ''
      },
      height: data.height,
      weight: data.weight,
      age: data.currentAge,
      birthDate: data.birthDate,
      birthPlace: {
        city: data.birthCity,
        state: data.birthStateProvince,
        country: data.birthCountry
      },
      isActive: data.active,
      provider: 'mlb-stats',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeNHLPlayer(data: any, sport: string): UnifiedPlayer {
    return {
      id: data.id?.toString(),
      name: data.fullName,
      firstName: data.firstName?.default,
      lastName: data.lastName?.default,
      position: data.position,
      jerseyNumber: data.sweaterNumber,
      team: {
        id: '', // Would need to be filled from context
        name: '',
        abbreviation: ''
      },
      height: data.heightInInches ? `${Math.floor(data.heightInInches / 12)}'${data.heightInInches % 12}"` : undefined,
      weight: data.weightInPounds,
      birthDate: data.birthDate,
      birthPlace: {
        city: data.birthCity?.default,
        state: data.birthStateProvince?.default,
        country: data.birthCountry
      },
      isActive: true, // NHL API doesn't specify
      headshot: data.headshot,
      provider: 'nhl',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeESPNPlayer(data: any, sport: string): UnifiedPlayer {
    const athlete = data.athlete || data
    return {
      id: athlete.id?.toString(),
      name: athlete.displayName || athlete.fullName,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      position: athlete.position?.displayName || athlete.position?.name,
      jerseyNumber: athlete.jersey ? parseInt(athlete.jersey) : undefined,
      team: {
        id: athlete.team?.id?.toString() || '',
        name: athlete.team?.displayName || '',
        abbreviation: athlete.team?.abbreviation || ''
      },
      height: athlete.displayHeight,
      weight: athlete.displayWeight ? parseInt(athlete.displayWeight) : undefined,
      age: athlete.age,
      birthDate: athlete.dateOfBirth,
      college: athlete.college?.name,
      experience: athlete.experience?.years,
      isActive: athlete.active !== false,
      headshot: athlete.headshot?.href,
      provider: 'espn',
      lastUpdated: new Date().toISOString()
    }
  }

  // Game normalization
  static normalizeGame(data: any, provider: string, sport: string): UnifiedGame {
    switch (provider) {
      case 'thesportsdb':
        return this.normalizeTheSportsDBGame(data, sport)
      case 'espn':
        return this.normalizeESPNGame(data, sport)
      case 'balldontlie':
        return this.normalizeBallDontLieGame(data, sport)
      case 'mlb-stats':
        return this.normalizeMLBStatsGame(data, sport)
      case 'nhl':
        return this.normalizeNHLGame(data, sport)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  private static normalizeTheSportsDBGame(data: any, sport: string): UnifiedGame {
    return {
      id: data.idEvent,
      date: data.dateEvent,
      startTime: data.strTime,
      status: this.normalizeGameStatus(data.strStatus),
      season: data.strSeason || new Date().getFullYear().toString(),
      gameType: 'regular',
      homeTeam: {
        id: data.idHomeTeam,
        name: data.strHomeTeam,
        abbreviation: this.generateAbbreviation(data.strHomeTeam),
        score: data.intHomeScore ? parseInt(data.intHomeScore) : undefined
      },
      awayTeam: {
        id: data.idAwayTeam,
        name: data.strAwayTeam,
        abbreviation: this.generateAbbreviation(data.strAwayTeam),
        score: data.intAwayScore ? parseInt(data.intAwayScore) : undefined
      },
      venue: {
        name: data.strVenue,
        city: data.strCity
      },
      provider: 'thesportsdb',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeBallDontLieGame(data: any, sport: string): UnifiedGame {
    return {
      id: data.id?.toString(),
      date: data.date,
      startTime: data.time,
      status: this.normalizeGameStatus(data.status),
      season: data.season?.toString(),
      gameType: data.postseason ? 'playoff' : 'regular',
      homeTeam: {
        id: data.home_team?.id?.toString(),
        name: data.home_team?.full_name,
        abbreviation: data.home_team?.abbreviation,
        score: data.home_team_score
      },
      awayTeam: {
        id: data.visitor_team?.id?.toString(),
        name: data.visitor_team?.full_name,
        abbreviation: data.visitor_team?.abbreviation,
        score: data.visitor_team_score
      },
      gameStats: {
        period: data.period
      },
      provider: 'balldontlie',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeMLBStatsGame(data: any, sport: string): UnifiedGame {
    return {
      id: data.gamePk?.toString(),
      date: data.gameDate?.split('T')[0],
      startTime: data.gameDate,
      status: this.normalizeGameStatus(data.status?.detailedState),
      season: data.season,
      gameType: data.gameType === 'R' ? 'regular' : data.gameType === 'P' ? 'playoff' : 'other',
      homeTeam: {
        id: data.teams?.home?.team?.id?.toString(),
        name: data.teams?.home?.team?.name,
        abbreviation: data.teams?.home?.team?.abbreviation,
        score: data.teams?.home?.score,
        record: `${data.teams?.home?.leagueRecord?.wins}-${data.teams?.home?.leagueRecord?.losses}`
      },
      awayTeam: {
        id: data.teams?.away?.team?.id?.toString(),
        name: data.teams?.away?.team?.name,
        abbreviation: data.teams?.away?.team?.abbreviation,
        score: data.teams?.away?.score,
        record: `${data.teams?.away?.leagueRecord?.wins}-${data.teams?.away?.leagueRecord?.losses}`
      },
      venue: {
        name: data.venue?.name,
        city: '' // MLB API doesn't include city in venue
      },
      provider: 'mlb-stats',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeNHLGame(data: any, sport: string): UnifiedGame {
    return {
      id: data.id?.toString(),
      date: data.gameDate?.split('T')[0],
      startTime: data.startTimeUTC,
      status: this.normalizeGameStatus(data.gameState),
      season: data.season?.toString(),
      gameType: data.gameType === 2 ? 'regular' : data.gameType === 3 ? 'playoff' : 'other',
      homeTeam: {
        id: data.homeTeam?.id?.toString(),
        name: data.homeTeam?.name?.default,
        abbreviation: data.homeTeam?.abbrev,
        score: data.homeTeam?.score
      },
      awayTeam: {
        id: data.awayTeam?.id?.toString(),
        name: data.awayTeam?.name?.default,
        abbreviation: data.awayTeam?.abbrev,
        score: data.awayTeam?.score
      },
      venue: {
        name: data.venue?.default,
        city: '' // NHL API doesn't include city in venue
      },
      gameStats: {
        period: data.periodDescriptor?.number,
        timeRemaining: data.clock?.timeRemaining
      },
      provider: 'nhl',
      lastUpdated: new Date().toISOString()
    }
  }

  private static normalizeESPNGame(data: any, sport: string): UnifiedGame {
    const competition = data.competitions?.[0] || data
    return {
      id: data.id || competition.id,
      date: data.date?.split('T')[0],
      startTime: data.date,
      status: this.normalizeGameStatus(competition.status?.type?.description),
      season: data.season?.year?.toString(),
      gameType: competition.type?.name || 'regular',
      homeTeam: {
        id: competition.competitors?.find((c: any) => c.homeAway === 'home')?.team?.id,
        name: competition.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName,
        abbreviation: competition.competitors?.find((c: any) => c.homeAway === 'home')?.team?.abbreviation,
        score: parseInt(competition.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'),
        record: competition.competitors?.find((c: any) => c.homeAway === 'home')?.records?.[0]?.summary
      },
      awayTeam: {
        id: competition.competitors?.find((c: any) => c.homeAway === 'away')?.team?.id,
        name: competition.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName,
        abbreviation: competition.competitors?.find((c: any) => c.homeAway === 'away')?.team?.abbreviation,
        score: parseInt(competition.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'),
        record: competition.competitors?.find((c: any) => c.homeAway === 'away')?.records?.[0]?.summary
      },
      venue: {
        name: competition.venue?.fullName,
        city: competition.venue?.address?.city
      },
      broadcast: competition.broadcasts?.map((b: any) => b.names?.[0]) || [],
      attendance: competition.attendance,
      provider: 'espn',
      lastUpdated: new Date().toISOString()
    }
  }

  // Utility methods
  private static extractCityFromTeamName(teamName: string): string {
    const cityWords = teamName.split(' ')
    // Common patterns: "Los Angeles Lakers", "New York Yankees", "Golden State Warriors"
    if (cityWords.length >= 2) {
      // Handle multi-word cities
      if (cityWords[0] === 'Los' || cityWords[0] === 'New' || cityWords[0] === 'San') {
        return cityWords.slice(0, 2).join(' ')
      }
      return cityWords[0]
    }
    return teamName
  }

  private static generateAbbreviation(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3)
  }

  private static extractFirstName(fullName: string): string {
    return fullName.split(' ')[0]
  }

  private static extractLastName(fullName: string): string {
    const parts = fullName.split(' ')
    return parts.slice(1).join(' ')
  }

  private static normalizeGameStatus(status: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
    if (!status) return 'scheduled'
    
    const normalizedStatus = status.toLowerCase()
    
    if (normalizedStatus.includes('scheduled') || normalizedStatus.includes('not started')) {
      return 'scheduled'
    }
    if (normalizedStatus.includes('live') || normalizedStatus.includes('in progress') || 
        normalizedStatus.includes('1st') || normalizedStatus.includes('2nd') || 
        normalizedStatus.includes('3rd') || normalizedStatus.includes('4th') ||
        normalizedStatus.includes('quarter') || normalizedStatus.includes('period') ||
        normalizedStatus.includes('inning')) {
      return 'live'
    }
    if (normalizedStatus.includes('final') || normalizedStatus.includes('finished') || 
        normalizedStatus.includes('completed')) {
      return 'finished'
    }
    if (normalizedStatus.includes('postponed') || normalizedStatus.includes('delayed')) {
      return 'postponed'
    }
    if (normalizedStatus.includes('cancelled') || normalizedStatus.includes('canceled')) {
      return 'cancelled'
    }
    
    return 'scheduled'
  }

  private static getLeagueFromSport(sport: string): string {
    const mapping: Record<string, string> = {
      'basketball': 'NBA',
      'football': 'NFL',
      'baseball': 'MLB',
      'hockey': 'NHL',
      'soccer': 'MLS'
    }
    return mapping[sport] || 'Unknown'
  }
}

// SportsDataNormalizer is already exported above as a class