
import { sportsDBClient, SportsDBClient } from './sportsdb-client'
import { espnClient, ESPNClient } from './espn-client'
import { getOddsApiClient, OddsApiClient } from './odds-api-client'

class UnifiedApiClient {
  public sportsdb: SportsDBClient
  public espn: ESPNClient
  public odds: OddsApiClient | null

  constructor() {
    this.sportsdb = sportsDBClient
    this.espn = espnClient
    this.odds = getOddsApiClient()
  }
}

export const unifiedApiClient = new UnifiedApiClient()
