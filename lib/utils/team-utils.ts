/**
 * Team Utilities
 * Centralized functions for team-related operations
 */

export const getTeamLogoUrl = (teamName: string): string => {
  const teamMap: Record<string, string> = {
    // NBA Teams
    'Lakers': 'LAL',
    'Warriors': 'GSW', 
    'Celtics': 'BOS', 
    'Heat': 'MIA', 
    'Bulls': 'CHI',
    'Knicks': 'NYK', 
    'Nets': 'BKN', 
    '76ers': 'PHI', 
    'Raptors': 'TOR', 
    'Bucks': 'MIL',
    'Pacers': 'IND', 
    'Cavaliers': 'CLE', 
    'Pistons': 'DET', 
    'Magic': 'ORL', 
    'Hawks': 'ATL',
    'Hornets': 'CHA', 
    'Wizards': 'WAS', 
    'Mavericks': 'DAL', 
    'Spurs': 'SAS', 
    'Rockets': 'HOU',
    'Grizzlies': 'MEM', 
    'Pelicans': 'NOP', 
    'Thunder': 'OKC', 
    'Nuggets': 'DEN', 
    'Trail Blazers': 'POR',
    'Jazz': 'UTA', 
    'Timberwolves': 'MIN', 
    'Suns': 'PHX', 
    'Kings': 'SAC', 
    'Clippers': 'LAC',
    
    // Alternative names
    'Los Angeles Lakers': 'LAL',
    'Golden State Warriors': 'GSW',
    'Boston Celtics': 'BOS',
    'Miami Heat': 'MIA',
    'Chicago Bulls': 'CHI',
    'New York Knicks': 'NYK',
    'Brooklyn Nets': 'BKN',
    'Philadelphia 76ers': 'PHI',
    'Toronto Raptors': 'TOR',
    'Milwaukee Bucks': 'MIL',
    'Indiana Pacers': 'IND',
    'Cleveland Cavaliers': 'CLE',
    'Detroit Pistons': 'DET',
    'Orlando Magic': 'ORL',
    'Atlanta Hawks': 'ATL',
    'Charlotte Hornets': 'CHA',
    'Washington Wizards': 'WAS',
    'Dallas Mavericks': 'DAL',
    'San Antonio Spurs': 'SAS',
    'Houston Rockets': 'HOU',
    'Memphis Grizzlies': 'MEM',
    'New Orleans Pelicans': 'NOP',
    'Oklahoma City Thunder': 'OKC',
    'Denver Nuggets': 'DEN',
    'Portland Trail Blazers': 'POR',
    'Utah Jazz': 'UTA',
    'Minnesota Timberwolves': 'MIN',
    'Phoenix Suns': 'PHX',
    'Sacramento Kings': 'SAC',
    'Los Angeles Clippers': 'LAC'
  }
  
  const abbreviation = teamMap[teamName] || 'NBA'
  return `https://cdn.nba.com/logos/nba/${abbreviation}/global/L/logo.svg`
}

export const getPlayerPhotoUrl = (playerId: number): string => {
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${playerId}.png`
}

export const getTeamColors = (teamName: string): { primary: string; secondary: string } => {
  const teamColors: Record<string, { primary: string; secondary: string }> = {
    'Lakers': { primary: '#552583', secondary: '#FDB927' },
    'Warriors': { primary: '#1D428A', secondary: '#FFC72C' },
    'Celtics': { primary: '#007A33', secondary: '#BA9653' },
    'Heat': { primary: '#98002E', secondary: '#F9A01B' },
    'Bulls': { primary: '#CE1141', secondary: '#000000' },
    'Knicks': { primary: '#006BB6', secondary: '#F58426' },
    'Nets': { primary: '#000000', secondary: '#FFFFFF' },
    '76ers': { primary: '#006BB6', secondary: '#ED174C' },
    'Raptors': { primary: '#CE1141', secondary: '#000000' },
    'Bucks': { primary: '#00471B', secondary: '#EEE1C6' },
    'Pacers': { primary: '#002D62', secondary: '#FDBB30' },
    'Cavaliers': { primary: '#860038', secondary: '#FDBB30' },
    'Pistons': { primary: '#C8102E', secondary: '#1D42BA' },
    'Magic': { primary: '#0077C0', secondary: '#C4CED4' },
    'Hawks': { primary: '#E03A3E', secondary: '#C1D32F' },
    'Hornets': { primary: '#1D1160', secondary: '#00788C' },
    'Wizards': { primary: '#002B5C', secondary: '#E31837' },
    'Mavericks': { primary: '#00538C', secondary: '#002B5E' },
    'Spurs': { primary: '#C4CED4', secondary: '#000000' },
    'Rockets': { primary: '#CE1141', secondary: '#000000' },
    'Grizzlies': { primary: '#5D76A9', secondary: '#12173F' },
    'Pelicans': { primary: '#0C2340', secondary: '#C8102E' },
    'Thunder': { primary: '#007AC1', secondary: '#EF3B24' },
    'Nuggets': { primary: '#0E2240', secondary: '#FEC524' },
    'Trail Blazers': { primary: '#E03A3E', secondary: '#000000' },
    'Jazz': { primary: '#002B5C', secondary: '#F9A01B' },
    'Timberwolves': { primary: '#0C2340', secondary: '#236192' },
    'Suns': { primary: '#1D1160', secondary: '#E56020' },
    'Kings': { primary: '#5A2D81', secondary: '#63727A' },
    'Clippers': { primary: '#C8102E', secondary: '#1D428A' }
  }
  
  return teamColors[teamName] || { primary: '#1D428A', secondary: '#C4CED4' }
}

export const formatTeamName = (teamName: string): string => {
  // Handle common team name variations
  const nameMap: Record<string, string> = {
    'Los Angeles Lakers': 'Lakers',
    'Golden State Warriors': 'Warriors',
    'Boston Celtics': 'Celtics',
    'Miami Heat': 'Heat',
    'Chicago Bulls': 'Bulls',
    'New York Knicks': 'Knicks',
    'Brooklyn Nets': 'Nets',
    'Philadelphia 76ers': '76ers',
    'Toronto Raptors': 'Raptors',
    'Milwaukee Bucks': 'Bucks',
    'Indiana Pacers': 'Pacers',
    'Cleveland Cavaliers': 'Cavaliers',
    'Detroit Pistons': 'Pistons',
    'Orlando Magic': 'Magic',
    'Atlanta Hawks': 'Hawks',
    'Charlotte Hornets': 'Hornets',
    'Washington Wizards': 'Wizards',
    'Dallas Mavericks': 'Mavericks',
    'San Antonio Spurs': 'Spurs',
    'Houston Rockets': 'Rockets',
    'Memphis Grizzlies': 'Grizzlies',
    'New Orleans Pelicans': 'Pelicans',
    'Oklahoma City Thunder': 'Thunder',
    'Denver Nuggets': 'Nuggets',
    'Portland Trail Blazers': 'Trail Blazers',
    'Utah Jazz': 'Jazz',
    'Minnesota Timberwolves': 'Timberwolves',
    'Phoenix Suns': 'Suns',
    'Sacramento Kings': 'Kings',
    'Los Angeles Clippers': 'Clippers'
  }
  
  return nameMap[teamName] || teamName
}
