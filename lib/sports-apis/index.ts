/**
 * Sports APIs Index
 * Centralized exports for all sports API clients
 */

export { sportsDBClient, SportsDBClient } from './sportsdb-client'
export { apiSportsClient, ApiSportsClient } from './api-sports-client'
export { ballDontLieClient, BallDontLieClient } from './balldontlie-client'
export { oddsApiClient, OddsApiClient } from './odds-api-client'
export { espnClient, ESPNClient } from './espn-client'
export { nbaStatsClient, NBAStatsClient } from './nba-stats-client'
export { mlbStatsClient, MLBStatsClient } from './mlb-stats-client'
export { nhlClient, NHLClient } from './nhl-client'

// Re-export types
export type { 
  SportsDBEvent,
  SportsDBTeam,
  SportsDBPlayer 
} from './sportsdb-client'

export type {
  ApiSportsFixture,
  ApiSportsTeam,
  ApiSportsStanding
} from './api-sports-client'

export type {
  BallDontLiePlayer,
  BallDontLieTeam,
  BallDontLieGame,
  BallDontLieStats
} from './balldontlie-client'

export type {
  OddsApiEvent,
  OddsApiSports,
  OddsApiScores
} from './odds-api-client'

export type {
  ESPNGame,
  ESPNTeam,
  ESPNStanding
} from './espn-client'

export type {
  NBAStatsPlayer,
  NBAStatsTeam,
  NBAStatsGame
} from './nba-stats-client'

export type {
  MLBTeam,
  MLBPlayer,
  MLBGame,
  MLBStandings
} from './mlb-stats-client'

export type {
  NHLTeam,
  NHLPlayer,
  NHLGame,
  NHLStandings
} from './nhl-client'
