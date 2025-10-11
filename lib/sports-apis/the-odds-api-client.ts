import { structuredLogger } from '@/lib/services/structured-logger'

class TheOddsApiClient {
  private apiKey: string
  private baseUrl: string = 'https://api.the-odds-api.com/v4'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getOdds(sport: string, region: string = 'us') {
    if (!this.apiKey || this.apiKey === 'YOUR_API_KEY') {
      structuredLogger.warn('The Odds API key not provided. Please set the THE_ODDS_API_KEY environment variable.')
      return []
    }

    try {
      const url = `${this.baseUrl}/sports/${sport}/odds/?regions=${region}&apiKey=${this.apiKey}`
      const response = await fetch(url)
      const data = await response.json()
      return data
    } catch (error) {
      structuredLogger.error('Error fetching odds from The Odds API', { error })
      return []
    }
  }
}

// The user needs to provide their own API key.
export const theOddsApiClient = new TheOddsApiClient(process.env.THE_ODDS_API_KEY || 'YOUR_API_KEY')
