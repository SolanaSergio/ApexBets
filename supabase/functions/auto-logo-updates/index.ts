/**
 * Supabase Edge Function: Auto Logo Updates
 * Automatically fetches and updates team logos when teams are added or updated
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface TeamData {
  id: string
  name: string
  sport: string
  abbreviation?: string
  league_name?: string
}

interface LogoSource {
  name: string
  getTeamLogoUrl: (teamName: string, sport: string) => Promise<string | null>
  priority: number
}

class AutoLogoService {
  private logoSources: LogoSource[] = []

  constructor() {
    this.initializeLogoSources()
  }

  private initializeLogoSources(): void {
    this.logoSources = [
      {
        name: 'espn-cdn',
        getTeamLogoUrl: this.getESPNLogoUrl.bind(this),
        priority: 1,
      },
      {
        name: 'sportsdb',
        getTeamLogoUrl: this.getSportsDBLogoUrl.bind(this),
        priority: 2,
      },
    ]
  }

  async updateTeamLogo(team: TeamData): Promise<{
    success: boolean
    logoUrl?: string
    source?: string
    error?: string
  }> {
    console.log(`Updating logo for team: ${team.name} (${team.sport})`)

    // Try each logo source in priority order
    for (const source of this.logoSources.sort((a, b) => a.priority - b.priority)) {
      try {
        const logoUrl = await source.getTeamLogoUrl(team.name, team.sport)

        if (logoUrl && (await this.validateLogoUrl(logoUrl))) {
          console.log(`Found logo for ${team.name} from ${source.name}: ${logoUrl}`)

          return {
            success: true,
            logoUrl,
            source: source.name,
          }
        }
      } catch (error) {
        console.log(`Logo source ${source.name} failed for ${team.name}:`, error)
      }
    }

    console.log(`No logo found for team: ${team.name}`)
    return {
      success: false,
      error: 'No valid logo found from any source',
    }
  }

  private async getESPNLogoUrl(teamName: string, sport: string): Promise<string | null> {
    const sportMappings: Record<string, { league: string; teamMappings: Record<string, string> }> =
      {
        basketball: {
          league: 'nba',
          teamMappings: {
            'Los Angeles Lakers': '3',
            'Boston Celtics': '2',
            'Golden State Warriors': '9',
            'Chicago Bulls': '4',
            'Miami Heat': '14',
            'Dallas Mavericks': '6',
            'Denver Nuggets': '7',
            'Phoenix Suns': '21',
            'Milwaukee Bucks': '17',
            'Philadelphia 76ers': '20',
            'Brooklyn Nets': '1',
            'New York Knicks': '18',
            'Atlanta Hawks': '1',
            'Charlotte Hornets': '30',
            'Cleveland Cavaliers': '5',
            'Detroit Pistons': '8',
            'Indiana Pacers': '11',
            'Orlando Magic': '19',
            'Washington Wizards': '27',
            'Toronto Raptors': '28',
            'Portland Trail Blazers': '22',
            'Utah Jazz': '26',
            'Oklahoma City Thunder': '25',
            'Minnesota Timberwolves': '16',
            'San Antonio Spurs': '24',
            'Houston Rockets': '10',
            'Memphis Grizzlies': '15',
            'New Orleans Pelicans': '3',
            'Sacramento Kings': '23',
            'Los Angeles Clippers': '12',
          },
        },
        football: {
          league: 'nfl',
          teamMappings: {
            'Arizona Cardinals': 'ari',
            'Atlanta Falcons': 'atl',
            'Baltimore Ravens': 'bal',
            'Buffalo Bills': 'buf',
            'Carolina Panthers': 'car',
            'Chicago Bears': 'chi',
            'Cincinnati Bengals': 'cin',
            'Cleveland Browns': 'cle',
            'Dallas Cowboys': 'dal',
            'Denver Broncos': 'den',
            'Detroit Lions': 'det',
            'Green Bay Packers': 'gb',
            'Houston Texans': 'hou',
            'Indianapolis Colts': 'ind',
            'Jacksonville Jaguars': 'jax',
            'Kansas City Chiefs': 'kc',
            'Las Vegas Raiders': 'lv',
            'Los Angeles Chargers': 'lac',
            'Los Angeles Rams': 'lar',
            'Miami Dolphins': 'mia',
            'Minnesota Vikings': 'min',
            'New England Patriots': 'ne',
            'New Orleans Saints': 'no',
            'New York Giants': 'nyg',
            'New York Jets': 'nyj',
            'Philadelphia Eagles': 'phi',
            'Pittsburgh Steelers': 'pit',
            'San Francisco 49ers': 'sf',
            'Seattle Seahawks': 'sea',
            'Tampa Bay Buccaneers': 'tb',
            'Tennessee Titans': 'ten',
            'Washington Commanders': 'wsh',
          },
        },
        baseball: {
          league: 'mlb',
          teamMappings: {
            'Arizona Diamondbacks': 'ari',
            'Atlanta Braves': 'atl',
            'Baltimore Orioles': 'bal',
            'Boston Red Sox': 'bos',
            'Chicago Cubs': 'chc',
            'Chicago White Sox': 'cws',
            'Cincinnati Reds': 'cin',
            'Cleveland Guardians': 'cle',
            'Colorado Rockies': 'col',
            'Detroit Tigers': 'det',
            'Houston Astros': 'hou',
            'Kansas City Royals': 'kc',
            'Los Angeles Angels': 'laa',
            'Los Angeles Dodgers': 'lad',
            'Miami Marlins': 'mia',
            'Milwaukee Brewers': 'mil',
            'Minnesota Twins': 'min',
            'New York Mets': 'nym',
            'New York Yankees': 'nyy',
            'Oakland Athletics': 'oak',
            'Philadelphia Phillies': 'phi',
            'Pittsburgh Pirates': 'pit',
            'San Diego Padres': 'sd',
            'San Francisco Giants': 'sf',
            'Seattle Mariners': 'sea',
            'St. Louis Cardinals': 'stl',
            'Tampa Bay Rays': 'tb',
            'Texas Rangers': 'tex',
            'Toronto Blue Jays': 'tor',
            'Washington Nationals': 'was',
          },
        },
        hockey: {
          league: 'nhl',
          teamMappings: {
            'Anaheim Ducks': 'ana',
            'Arizona Coyotes': 'ari',
            'Boston Bruins': 'bos',
            'Buffalo Sabres': 'buf',
            'Calgary Flames': 'cgy',
            'Carolina Hurricanes': 'car',
            'Chicago Blackhawks': 'chi',
            'Colorado Avalanche': 'col',
            'Columbus Blue Jackets': 'cbj',
            'Dallas Stars': 'dal',
            'Detroit Red Wings': 'det',
            'Edmonton Oilers': 'edm',
            'Florida Panthers': 'fla',
            'Los Angeles Kings': 'lak',
            'Minnesota Wild': 'min',
            'Montreal Canadiens': 'mtl',
            'Nashville Predators': 'nsh',
            'New Jersey Devils': 'nj',
            'New York Islanders': 'nyi',
            'New York Rangers': 'nyr',
            'Ottawa Senators': 'ott',
            'Philadelphia Flyers': 'phi',
            'Pittsburgh Penguins': 'pit',
            'San Jose Sharks': 'sjs',
            'Seattle Kraken': 'sea',
            'St. Louis Blues': 'stl',
            'Tampa Bay Lightning': 'tb',
            'Toronto Maple Leafs': 'tor',
            'Vancouver Canucks': 'van',
            'Vegas Golden Knights': 'vgk',
            'Washington Capitals': 'wsh',
            'Winnipeg Jets': 'wpg',
          },
        },
      }

    const sportConfig = sportMappings[sport]
    if (!sportConfig) return null

    const teamId = sportConfig.teamMappings[teamName]
    if (!teamId) return null

    return `https://a.espncdn.com/i/teamlogos/${sportConfig.league}/500/${teamId}.png`
  }

  private async getSportsDBLogoUrl(teamName: string, sport: string): Promise<string | null> {
    const teamSlug = teamName.toLowerCase().replace(/\s+/g, '')
    return `https://www.thesportsdb.com/images/media/team/logo/${teamSlug}.png`
  }

  private async validateLogoUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    const { method } = req

    if (method === 'POST') {
      const body = await req.json()
      const { team, action } = body

      if (!team) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Team data is required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const autoLogoService = new AutoLogoService()

      if (action === 'update_logo') {
        const result = await autoLogoService.updateTeamLogo(team)

        return new Response(
          JSON.stringify({
            success: true,
            data: result,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid action',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Auto Logo Service is running',
        endpoints: {
          'POST /auto-logo-updates': 'Update team logo automatically',
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Auto logo service error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
