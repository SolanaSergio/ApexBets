/**
 * Image Service
 * Centralized service for handling all image operations including logos, player photos, and general images
 * Supports all major sports leagues: NBA, NFL, MLB, NHL, Premier League, La Liga, Serie A, Bundesliga, Ligue 1
 */

export type SportsLeague = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'Premier League' | 'La Liga' | 'Serie A' | 'Bundesliga' | 'Ligue 1' | 'Champions League' | 'Europa League' | 'MLS' | 'NFL' | 'CFL' | 'AFL' | 'NRL' | 'Super Rugby' | 'IPL' | 'BBL' | 'PSL' | 'CPL'

export interface ImageConfig {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'png' | 'jpg' | 'svg'
}

export interface TeamLogoConfig extends ImageConfig {
  variant?: 'primary' | 'secondary' | 'monochrome' | 'light' | 'dark'
}

export interface PlayerPhotoConfig extends ImageConfig {
  variant?: 'headshot' | 'action' | 'portrait' | 'card'
}

/**
 * Free image sources for different types of content
 */
export const IMAGE_SOURCES = {
  // Official Sports APIs
  NBA: {
    LOGOS: 'https://cdn.nba.com/logos/nba',
    PLAYERS: 'https://cdn.nba.com/headshots/nba/latest',
    TEAMS: 'https://cdn.nba.com/logos/nba'
  },
  NFL: {
    LOGOS: 'https://static.www.nfl.com/image/private/t_headshot_desktop/league',
    PLAYERS: 'https://static.www.nfl.com/image/private/t_headshot_desktop/league',
    TEAMS: 'https://static.www.nfl.com/image/private/t_headshot_desktop/league'
  },
  MLB: {
    LOGOS: 'https://www.mlbstatic.com/team-logos',
    PLAYERS: 'https://img.mlbstatic.com/mlb-photos/image/upload/w_200,h_200,c_fill,g_face,q_auto:best,f_auto/v1/people',
    TEAMS: 'https://www.mlbstatic.com/team-logos'
  },
  NHL: {
    LOGOS: 'https://assets.nhle.com/logos',
    PLAYERS: 'https://cms.nhl.bamgrid.com/images/headshots/current/168x168',
    TEAMS: 'https://assets.nhle.com/logos'
  },
  
  // Soccer/Football APIs
  SOCCER: {
    PREMIER_LEAGUE: 'https://resources.premierleague.com/premierleague/badges/t1',
    LA_LIGA: 'https://media.api-sports.io/football/teams',
    SERIE_A: 'https://media.api-sports.io/football/teams',
    BUNDESLIGA: 'https://media.api-sports.io/football/teams',
    LIGUE_1: 'https://media.api-sports.io/football/teams',
    CHAMPIONS_LEAGUE: 'https://media.api-sports.io/football/teams',
    EUROPA_LEAGUE: 'https://media.api-sports.io/football/teams',
    MLS: 'https://media.api-sports.io/football/teams'
  },
  
  // Free stock images
  UNSPLASH: 'https://images.unsplash.com',
  PEXELS: 'https://images.pexels.com/photos',
  PIXABAY: 'https://cdn.pixabay.com/photo',
  
  // Sports-specific free images
  SPORTS_IMAGES: {
    BASKETBALL: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    FOOTBALL: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c',
    BASEBALL: 'https://images.unsplash.com/photo-1566577739112-f51824d2c0b0',
    HOCKEY: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
    SOCCER: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d',
    TENNIS: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256',
    GOLF: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b',
    STADIUM: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    TROPHY: 'https://images.unsplash.com/photo-1518611012118-4608a0b0c4e4',
    ANALYTICS: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    PREDICTION: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
    SPORTS_GENERIC: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b'
  }
} as const

/**
 * Team mappings for all major sports leagues
 */
const TEAM_MAPPINGS = {
  NBA: {
    'Lakers': 'LAL', 'Los Angeles Lakers': 'LAL',
    'Warriors': 'GSW', 'Golden State Warriors': 'GSW',
    'Celtics': 'BOS', 'Boston Celtics': 'BOS',
    'Heat': 'MIA', 'Miami Heat': 'MIA',
    'Bulls': 'CHI', 'Chicago Bulls': 'CHI',
    'Knicks': 'NYK', 'New York Knicks': 'NYK',
    'Nets': 'BKN', 'Brooklyn Nets': 'BKN',
    '76ers': 'PHI', 'Philadelphia 76ers': 'PHI',
    'Raptors': 'TOR', 'Toronto Raptors': 'TOR',
    'Bucks': 'MIL', 'Milwaukee Bucks': 'MIL',
    'Pacers': 'IND', 'Indiana Pacers': 'IND',
    'Cavaliers': 'CLE', 'Cleveland Cavaliers': 'CLE',
    'Pistons': 'DET', 'Detroit Pistons': 'DET',
    'Magic': 'ORL', 'Orlando Magic': 'ORL',
    'Hawks': 'ATL', 'Atlanta Hawks': 'ATL',
    'Hornets': 'CHA', 'Charlotte Hornets': 'CHA',
    'Wizards': 'WAS', 'Washington Wizards': 'WAS',
    'Mavericks': 'DAL', 'Dallas Mavericks': 'DAL',
    'Spurs': 'SAS', 'San Antonio Spurs': 'SAS',
    'Rockets': 'HOU', 'Houston Rockets': 'HOU',
    'Grizzlies': 'MEM', 'Memphis Grizzlies': 'MEM',
    'Pelicans': 'NOP', 'New Orleans Pelicans': 'NOP',
    'Thunder': 'OKC', 'Oklahoma City Thunder': 'OKC',
    'Nuggets': 'DEN', 'Denver Nuggets': 'DEN',
    'Trail Blazers': 'POR', 'Portland Trail Blazers': 'POR',
    'Jazz': 'UTA', 'Utah Jazz': 'UTA',
    'Timberwolves': 'MIN', 'Minnesota Timberwolves': 'MIN',
    'Suns': 'PHX', 'Phoenix Suns': 'PHX',
    'Kings': 'SAC', 'Sacramento Kings': 'SAC',
    'Clippers': 'LAC', 'Los Angeles Clippers': 'LAC'
  },
  NFL: {
    'Patriots': 'NE', 'New England Patriots': 'NE',
    'Bills': 'BUF', 'Buffalo Bills': 'BUF',
    'Dolphins': 'MIA', 'Miami Dolphins': 'MIA',
    'Jets': 'NYJ', 'New York Jets': 'NYJ',
    'Ravens': 'BAL', 'Baltimore Ravens': 'BAL',
    'Bengals': 'CIN', 'Cincinnati Bengals': 'CIN',
    'Browns': 'CLE', 'Cleveland Browns': 'CLE',
    'Steelers': 'PIT', 'Pittsburgh Steelers': 'PIT',
    'Texans': 'HOU', 'Houston Texans': 'HOU',
    'Colts': 'IND', 'Indianapolis Colts': 'IND',
    'Jaguars': 'JAX', 'Jacksonville Jaguars': 'JAX',
    'Titans': 'TEN', 'Tennessee Titans': 'TEN',
    'Broncos': 'DEN', 'Denver Broncos': 'DEN',
    'Chiefs': 'KC', 'Kansas City Chiefs': 'KC',
    'Raiders': 'LV', 'Las Vegas Raiders': 'LV',
    'Chargers': 'LAC', 'Los Angeles Chargers': 'LAC',
    'Cowboys': 'DAL', 'Dallas Cowboys': 'DAL',
    'Giants': 'NYG', 'New York Giants': 'NYG',
    'Eagles': 'PHI', 'Philadelphia Eagles': 'PHI',
    'Commanders': 'WAS', 'Washington Commanders': 'WAS',
    'Bears': 'CHI', 'Chicago Bears': 'CHI',
    'Lions': 'DET', 'Detroit Lions': 'DET',
    'Packers': 'GB', 'Green Bay Packers': 'GB',
    'Vikings': 'MIN', 'Minnesota Vikings': 'MIN',
    'Falcons': 'ATL', 'Atlanta Falcons': 'ATL',
    'Panthers': 'CAR', 'Carolina Panthers': 'CAR',
    'Saints': 'NO', 'New Orleans Saints': 'NO',
    'Buccaneers': 'TB', 'Tampa Bay Buccaneers': 'TB',
    'Cardinals': 'ARI', 'Arizona Cardinals': 'ARI',
    'Rams': 'LAR', 'Los Angeles Rams': 'LAR',
    '49ers': 'SF', 'San Francisco 49ers': 'SF',
    'Seahawks': 'SEA', 'Seattle Seahawks': 'SEA'
  },
  MLB: {
    'Yankees': 'NYY', 'New York Yankees': 'NYY',
    'Red Sox': 'BOS', 'Boston Red Sox': 'BOS',
    'Rays': 'TB', 'Tampa Bay Rays': 'TB',
    'Blue Jays': 'TOR', 'Toronto Blue Jays': 'TOR',
    'Orioles': 'BAL', 'Baltimore Orioles': 'BAL',
    'White Sox': 'CWS', 'Chicago White Sox': 'CWS',
    'Guardians': 'CLE', 'Cleveland Guardians': 'CLE',
    'Tigers': 'DET', 'Detroit Tigers': 'DET',
    'Royals': 'KC', 'Kansas City Royals': 'KC',
    'Twins': 'MIN', 'Minnesota Twins': 'MIN',
    'Astros': 'HOU', 'Houston Astros': 'HOU',
    'Angels': 'LAA', 'Los Angeles Angels': 'LAA',
    'Athletics': 'OAK', 'Oakland Athletics': 'OAK',
    'Mariners': 'SEA', 'Seattle Mariners': 'SEA',
    'Rangers': 'TEX', 'Texas Rangers': 'TEX',
    'Braves': 'ATL', 'Atlanta Braves': 'ATL',
    'Marlins': 'MIA', 'Miami Marlins': 'MIA',
    'Mets': 'NYM', 'New York Mets': 'NYM',
    'Phillies': 'PHI', 'Philadelphia Phillies': 'PHI',
    'Nationals': 'WSH', 'Washington Nationals': 'WSH',
    'Cubs': 'CHC', 'Chicago Cubs': 'CHC',
    'Reds': 'CIN', 'Cincinnati Reds': 'CIN',
    'Brewers': 'MIL', 'Milwaukee Brewers': 'MIL',
    'Pirates': 'PIT', 'Pittsburgh Pirates': 'PIT',
    'Cardinals': 'STL', 'St. Louis Cardinals': 'STL',
    'Diamondbacks': 'ARI', 'Arizona Diamondbacks': 'ARI',
    'Rockies': 'COL', 'Colorado Rockies': 'COL',
    'Dodgers': 'LAD', 'Los Angeles Dodgers': 'LAD',
    'Padres': 'SD', 'San Diego Padres': 'SD',
    'Giants': 'SF', 'San Francisco Giants': 'SF'
  },
  NHL: {
    'Bruins': 'BOS', 'Boston Bruins': 'BOS',
    'Sabres': 'BUF', 'Buffalo Sabres': 'BUF',
    'Red Wings': 'DET', 'Detroit Red Wings': 'DET',
    'Panthers': 'FLA', 'Florida Panthers': 'FLA',
    'Canadiens': 'MTL', 'Montreal Canadiens': 'MTL',
    'Senators': 'OTT', 'Ottawa Senators': 'OTT',
    'Lightning': 'TB', 'Tampa Bay Lightning': 'TB',
    'Maple Leafs': 'TOR', 'Toronto Maple Leafs': 'TOR',
    'Hurricanes': 'CAR', 'Carolina Hurricanes': 'CAR',
    'Blue Jackets': 'CBJ', 'Columbus Blue Jackets': 'CBJ',
    'Devils': 'NJD', 'New Jersey Devils': 'NJD',
    'Islanders': 'NYI', 'New York Islanders': 'NYI',
    'Rangers': 'NYR', 'New York Rangers': 'NYR',
    'Flyers': 'PHI', 'Philadelphia Flyers': 'PHI',
    'Penguins': 'PIT', 'Pittsburgh Penguins': 'PIT',
    'Capitals': 'WSH', 'Washington Capitals': 'WSH',
    'Blackhawks': 'CHI', 'Chicago Blackhawks': 'CHI',
    'Avalanche': 'COL', 'Colorado Avalanche': 'COL',
    'Stars': 'DAL', 'Dallas Stars': 'DAL',
    'Wild': 'MIN', 'Minnesota Wild': 'MIN',
    'Predators': 'NSH', 'Nashville Predators': 'NSH',
    'Blues': 'STL', 'St. Louis Blues': 'STL',
    'Jets': 'WPG', 'Winnipeg Jets': 'WPG',
    'Ducks': 'ANA', 'Anaheim Ducks': 'ANA',
    'Coyotes': 'ARI', 'Arizona Coyotes': 'ARI',
    'Flames': 'CGY', 'Calgary Flames': 'CGY',
    'Oilers': 'EDM', 'Edmonton Oilers': 'EDM',
    'Kings': 'LAK', 'Los Angeles Kings': 'LAK',
    'Sharks': 'SJ', 'San Jose Sharks': 'SJ',
    'Canucks': 'VAN', 'Vancouver Canucks': 'VAN',
    'Golden Knights': 'VGK', 'Vegas Golden Knights': 'VGK'
  },
  'Premier League': {
    'Arsenal': '1', 'Manchester United': '33', 'Manchester City': '50',
    'Liverpool': '40', 'Chelsea': '49', 'Tottenham': '47',
    'Newcastle': '34', 'Brighton': '51', 'West Ham': '48',
    'Aston Villa': '66', 'Crystal Palace': '52', 'Fulham': '36',
    'Brentford': '55', 'Everton': '45', 'Nottingham Forest': '65',
    'Wolves': '39', 'Bournemouth': '35', 'Sheffield United': '62',
    'Burnley': '44', 'Luton Town': '1359'
  }
} as const

/**
 * Get team logo URL with fallback support for all major sports
 */
export function getTeamLogoUrl(
  teamName: string,
  league: SportsLeague = 'NBA',
  config: TeamLogoConfig = {}
): string {
  const { width = 200, height = 200, variant = 'primary' } = config

  // Get team abbreviation/ID
  let teamId = (TEAM_MAPPINGS as any)[league]?.[teamName] || teamName.toLowerCase().replace(/\s+/g, '-')

  // Handle short names
  if (teamName.toLowerCase().includes('lakers')) teamId = 'LAL'
  if (teamName.toLowerCase().includes('warriors')) teamId = 'GSW'
  if (teamName.toLowerCase().includes('celtics')) teamId = 'BOS'
  if (teamName.toLowerCase().includes('heat')) teamId = 'MIA'
  if (teamName.toLowerCase().includes('bulls')) teamId = 'CHI'
  if (teamName.toLowerCase().includes('knicks') || teamName === 'NYK') teamId = 'NYK'
  if (teamName.toLowerCase().includes('nets') || teamName === 'BKN') teamId = 'BKN'
  if (teamName.toLowerCase().includes('76ers') || teamName === 'PHI') teamId = 'PHI'

  switch (league) {
    case 'NBA':
      // Use more reliable ESPN CDN for NBA logos
      return `https://a.espncdn.com/i/teamlogos/nba/500/${teamId}.png`

    case 'NFL':
      return `https://a.espncdn.com/i/teamlogos/nfl/500/${teamId}.png`

    case 'MLB':
      return `https://a.espncdn.com/i/teamlogos/mlb/500/${teamId}.png`

    case 'NHL':
      return `https://a.espncdn.com/i/teamlogos/nhl/500/${teamId}.png`

    case 'Premier League':
      // Use reliable soccer logo sources
      return `https://logos-world.net/wp-content/uploads/2021/03/${teamName.toLowerCase().replace(/\s+/g, '-')}-logo.png`

    case 'La Liga':
    case 'Serie A':
    case 'Bundesliga':
    case 'Ligue 1':
    case 'Champions League':
    case 'Europa League':
    case 'MLS':
      // Use reliable logo repository
      return `https://logo.clearbit.com/${teamName.toLowerCase().replace(/\s+/g, '')}.com?w=150&h=150`

    default:
      // Try to get a real logo first, then fallback
      const attempts = [
        getSportsImageUrl('BASKETBALL', { width, height }),
        `https://logo.clearbit.com/${teamName.toLowerCase().replace(/\s+/g, '')}.com?w=${width}&h=${height}`,
        getSportsImageUrl('SPORTS_GENERIC', { width, height })
      ]
      return attempts[0]
  }
}

/**
 * Get player photo URL with fallback support for all major sports
 */
export function getPlayerPhotoUrl(
  playerId: number | string,
  league: SportsLeague = 'NBA',
  config: PlayerPhotoConfig = {}
): string {
  const { width = 260, height = 190, variant = 'headshot' } = config
  
  switch (league) {
    case 'NBA':
      return `${IMAGE_SOURCES.NBA.PLAYERS}/${width}x${height}/${playerId}.png`
    
    case 'NFL':
      return `https://a.espncdn.com/i/headshots/nfl/players/full/${playerId}.png`
    
    case 'MLB':
      return `${IMAGE_SOURCES.MLB.PLAYERS}/${playerId}.png`
    
    case 'NHL':
      return `${IMAGE_SOURCES.NHL.PLAYERS}/${playerId}.jpg`
    
    case 'Premier League':
    case 'La Liga':
    case 'Serie A':
    case 'Bundesliga':
    case 'Ligue 1':
    case 'Champions League':
    case 'Europa League':
    case 'MLS':
      return `https://media.api-sports.io/football/players/${playerId}.png`
    
    default:
      return getFallbackImageUrl('player')
  }
}

/**
 * Get sports-related stock image URL
 */
export function getSportsImageUrl(
  category: keyof typeof IMAGE_SOURCES.SPORTS_IMAGES,
  config: ImageConfig = {}
): string {
  const { width = 800, height = 600, quality = 80 } = config
  const baseUrl = IMAGE_SOURCES.SPORTS_IMAGES[category]
  
  // For Unsplash, we can add query parameters for sizing
  if (baseUrl.includes('unsplash.com')) {
    return `${baseUrl}?w=${width}&h=${height}&q=${quality}&auto=format&fit=crop`
  }
  
  return baseUrl
}

/**
 * Get optimized image URL with Next.js Image optimization
 */
export function getOptimizedImageUrl(
  src: string,
  config: ImageConfig = {}
): string {
  const { width = 800, height = 600, quality = 80, format = 'webp' } = config
  
  // If it's already an optimized URL or external API, return as-is
  if (src.includes('cdn.nba.com') || src.includes('unsplash.com') || src.includes('pexels.com')) {
    return src
  }
  
  // For local images, we'll use Next.js Image optimization
  return `/api/image-optimizer?src=${encodeURIComponent(src)}&w=${width}&h=${height}&q=${quality}&f=${format}`
}

/**
 * Get fallback image for when primary image fails to load
 */
export function getFallbackImageUrl(type: 'team' | 'player' | 'sports' = 'sports'): string {
  switch (type) {
    case 'team':
      return '/images/fallback-team-logo.svg'
    case 'player':
      return '/images/fallback-player.png'
    case 'sports':
    default:
      return '/images/fallback-sports.png'
  }
}

/**
 * Generate placeholder image URL for loading states
 */
export function getPlaceholderImageUrl(
  width: number = 200,
  height: number = 200,
  text?: string
): string {
  const encodedText = text ? encodeURIComponent(text) : ''
  return `https://via.placeholder.com/${width}x${height}/f3f4f6/6b7280?text=${encodedText}`
}

/**
 * Check if image URL is valid and accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
    return response.ok || response.status === 200
  } catch {
    return false
  }
}

/**
 * Get sample team logo URLs for testing
 */
export function getSampleTeamLogos() {
  return {
    'Lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/LAL.png',
    'Warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/GSW.png',
    'Celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/BOS.png',
    'Heat': 'https://a.espncdn.com/i/teamlogos/nba/500/MIA.png',
    'Bulls': 'https://a.espncdn.com/i/teamlogos/nba/500/CHI.png'
  }
}

/**
 * Get image with fallback chain
 */
export async function getImageWithFallback(
  primaryUrl: string,
  fallbackUrls: string[] = [],
  type: 'team' | 'player' | 'sports' = 'sports'
): Promise<string> {
  // Try primary URL first
  if (await validateImageUrl(primaryUrl)) {
    return primaryUrl
  }
  
  // Try fallback URLs
  for (const fallbackUrl of fallbackUrls) {
    if (await validateImageUrl(fallbackUrl)) {
      return fallbackUrl
    }
  }
  
  // Return default fallback
  return getFallbackImageUrl(type)
}
