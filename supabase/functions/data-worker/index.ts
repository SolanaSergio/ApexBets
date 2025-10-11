import { unifiedApiClient } from '../../lib/sports-apis/unified-client.ts'
import { mapSports, mapGames, mapTeams } from './mapper.ts'
import { dal } from '../../lib/data/data-access-layer.ts'
import { loggingService } from '../../lib/services/logging-service.ts'

export async function handler(sport: string, league: string) {
  try {
    // Fetch data from external APIs here
    const sports = await unifiedApiClient.odds?.getSports()
    if (!sports) {
      loggingService.log('warn', 'No sports found from Odds API')
    }

    const games = await unifiedApiClient.sportsdb.getEventsByDate(new Date().toISOString().split('T')[0], sport)
    if (!games) {
      loggingService.log('warn', `No games found for ${sport} from TheSportsDB`)
    }

    const teams = await unifiedApiClient.espn.getTeams(sport, league)
    if (!teams) {
      loggingService.log('warn', `No teams found for ${sport} and ${league} from ESPN`)
    }

    // Map data to database schema
    const mappedSports = mapSports(sports)
    const mappedGames = mapGames(games)
    const mappedTeams = mapTeams(teams)

    // Store data in database
    const sportsResult = await dal.upsert('sports', mappedSports)
    if (!sportsResult) {
      loggingService.log('error', 'Failed to upsert sports', mappedSports)
    }

    const gamesResult = await dal.upsert('games', mappedGames)
    if (!gamesResult) {
      loggingService.log('error', 'Failed to upsert games', mappedGames)
    }

    const teamsResult = await dal.upsert('teams', mappedTeams)
    if (!teamsResult) {
      loggingService.log('error', 'Failed to upsert teams', mappedTeams)
    }

    return { sportsResult, gamesResult, teamsResult }
  } catch (error) {
    loggingService.log('error', 'An error occurred in the data worker', error)
    throw error
  }
}