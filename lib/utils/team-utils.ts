/**
 * Team Utilities
 * Centralized functions for team-related operations
 */

import { getTeamLogoUrl as getTeamLogoFromService, getPlayerPhotoUrl as getPlayerPhotoFromService } from '@/lib/services/image-service'

// Re-export the enhanced functions from image service
export const getTeamLogoUrl = (teamName: string): string => {
  return getTeamLogoFromService(teamName, 'NBA')
}

export const getPlayerPhotoUrl = (playerId: number): string => {
  return getPlayerPhotoFromService(playerId, 'NBA')
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
