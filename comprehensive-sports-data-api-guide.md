# Comprehensive Free Sports Data API Documentation Guide

## Table of Contents
1. [Free Sports Data APIs](#free-sports-data-apis)
2. [Historical & Live Data APIs](#historical--live-data-apis)
3. [Sports Betting & Odds APIs](#sports-betting--odds-apis)
4. [Sport-Specific APIs](#sport-specific-apis)
5. [Implementation Examples](#implementation-examples)
6. [API Comparison Table](#api-comparison-table)
7. [Code Examples](#code-examples)

## Free Sports Data APIs

### 1. The Sports DB
**Base URL:** `https://www.thesportsdb.com/api/v1/json`

**Free Tier:** Unlimited requests with rate limits
**Coverage:** 40+ sports, extensive historical data
**Authentication:** Optional API key for premium features

#### Key Endpoints:
```
# Search for teams
GET /api/v1/json/123/searchteams.php?t=Arsenal

# Get league standings  
GET /api/v1/json/123/lookuptable.php?l=4328&s=2020-2021

# Search events/games
GET /api/v1/json/123/searchevents.php?e=Arsenal_vs_Chelsea

# Get player information
GET /api/v1/json/123/searchplayers.php?p=Danny_Welbeck

# Get live scores
GET /api/v2/json/livescore/soccer

# Get team roster
GET /api/v1/json/123/lookup_all_players.php?id=133604
```

#### Documentation & Features:
- **Free forever** with basic access
- Historical data back to 1900s for many sports
- Player stats, team info, league standings
- Event timelines and match results
- Custom artwork and images
- V2 API with improved endpoints

### 2. API-Sports.io
**Base URL:** `https://api-sports.io`

**Free Tier:** 100 requests/day per API
**Coverage:** Football, Basketball, Baseball, Formula-1, Handball, Hockey, MMA, NBA, NFL, Rugby, Volleyball
**Authentication:** API Key required

#### Sports Coverage:
- **Football API:** 950+ leagues, live scores, odds
- **Basketball API:** NBA, Euroleague, international leagues
- **Baseball API:** MLB, NPB, KBO leagues
- **MMA API:** UFC, Bellator, other promotions
- **Tennis API:** ATP, WTA tournaments

#### Key Endpoints (Football):
```
# Get leagues
GET /leagues?country=england

# Get teams in a league
GET /teams?league=39&season=2024

# Get fixtures/games
GET /fixtures?league=39&season=2024&round=Regular Season - 1

# Get live scores
GET /fixtures?live=all

# Get standings
GET /standings?league=39&season=2024

# Get player statistics
GET /players?team=33&season=2024

# Get odds (pre-match and live)
GET /odds?fixture=215662
```

#### Authentication:
```javascript
headers: {
  'X-RapidAPI-Key': 'your-api-key',
  'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
}
```

### 3. ESPN Hidden API
**Base URL:** `http://site.api.espn.com/apis/site/v2`

**Free Tier:** No official limits (unofficial API)
**Coverage:** NFL, NBA, MLB, NHL, College sports
**Authentication:** None required

#### Key Endpoints:
```
# NFL Scoreboard
GET /sports/football/nfl/scoreboard

# NBA Standings
GET /sports/basketball/nba/standings

# MLB Schedule
GET /sports/baseball/mlb/schedule

# Team roster
GET /sports/football/nfl/teams/1/roster

# Player stats
GET /sports/basketball/nba/athletes/1891/stats
```

### 4. Ball Don't Lie API
**Base URL:** `https://api.balldontlie.io`

**Free Tier:** Start free, scale with usage
**Coverage:** NBA, NFL, MLB, NHL, EPL
**Authentication:** API Key required

#### SDK Integration:
```javascript
import { BalldontlieAPI } from "@balldontlie/sdk";

const api = new BalldontlieAPI({ apiKey: "your-api-key" });

// Get NBA stats
await api.nba.getStats({ dates: ["2024-11-13", "2024-11-14"] });

// Get NFL stats  
await api.nfl.getStats({ seasons: [2024] });

// Get MLB stats
await api.mlb.getStats({ player_ids: [208] });
```

## Historical & Live Data APIs

### 1. SportsData.io
**Base URL:** `https://api.sportsdata.io`

**Free Trial:** Never expires, full access to test
**Coverage:** NFL, NBA, MLB, NHL, Soccer, Golf, MMA
**Authentication:** API Key via header

#### Pricing:
- **Free Trial:** Unlimited testing access
- **Paid Plans:** Starting at $19/month per sport
- **Enterprise:** Custom pricing for high volume

#### Key Features:
- Unlimited API calls on paid plans
- Real-time and historical data
- XML and JSON formats
- 24/7 technical support
- Comprehensive documentation

#### Endpoints:
```
# Get NFL teams
GET /v3/nfl/scores/json/AllTeams

# Get NBA games
GET /v3/nba/scores/json/GamesByDate/2024-01-15

# Get MLB player stats
GET /v3/mlb/stats/json/PlayerSeasonStats/2024

# Get live odds
GET /v4/nfl/odds/json/LiveGameOddsByDate/2024-01-15
```

### 2. Sportradar
**Base URL:** Various sport-specific URLs

**Free Trial:** 30 days full access
**Coverage:** 80+ sports, 500+ leagues
**Authentication:** API Key required

#### Features:
- Enterprise-grade reliability
- Real-time data feeds
- Historical archives
- Advanced analytics
- Player tracking data
- 24/7 support

#### Pricing:
- **Free Trial:** 30 days
- **Standard Plans:** $500+/month per sport
- **Enterprise:** Custom solutions

## Sports Betting & Odds APIs

### 1. The Odds API
**Base URL:** `https://api.the-odds-api.com`

**Free Tier:** 500 credits/month
**Coverage:** 70+ sports, 40+ bookmakers
**Authentication:** API Key required

#### Bookmaker Coverage:
- **US:** DraftKings, FanDuel, BetMGM, Caesars, Bovada
- **UK:** Unibet, William Hill, Ladbrokes, Betfair
- **EU:** 1xBet, Pinnacle, Betfair
- **AU:** Sportsbet, TAB, Neds

#### Key Endpoints:
```
# Get available sports
GET /v4/sports

# Get odds for a sport
GET /v4/sports/americanfootball_nfl/odds

# Get historical odds
GET /v4/sports/americanfootball_nfl/odds/history

# Get scores and results
GET /v4/sports/americanfootball_nfl/scores
```

#### Pricing:
- **Starter:** Free - 500 credits/month
- **20K:** $30/month - 20,000 credits
- **100K:** $59/month - 100,000 credits
- **5M:** $119/month - 5M credits

### 2. Sports Game Odds (SGO)
**Base URL:** `https://api.sportsgameodds.com`

**Free Trial:** 14 days
**Coverage:** Major sports + eSports
**Authentication:** API Key required

#### Features:
- Live betting odds
- Player props
- Deep linking capabilities
- Real-time updates
- Historical odds data

#### Pricing:
- **Free Trial:** 14 days
- **Rookie:** $99/month
- **Pro:** Custom pricing
- **All-Star:** Enterprise level

### 3. Pinnacle Odds API
**Base URL:** `https://api.pinnacle.com`

**Free Tier:** Basic access available
**Revenue Model:** Commission-based referrals
**Coverage:** Major sports, eSports

#### Endpoints:
```
# Get sports
GET /v2/sports

# Get leagues
GET /v2/leagues?sportId=29

# Get fixtures
GET /v4/fixtures?sportId=29&leagueIds=1980

# Get odds
GET /v1/odds?sportId=29&leagueIds=1980
```

## Sport-Specific APIs

### NBA APIs

#### 1. NBA Stats API (Official)
**Base URL:** `https://stats.nba.com/stats`
**Free:** Yes (unofficial usage)
**Coverage:** Complete NBA data

```python
# Using nba_api package
from nba_api.stats.endpoints import playercareerstats

career = playercareerstats.PlayerCareerStats(player_id='203999')
career.get_data_frames()[0]
```

#### 2. NBA Live API
```python
from nba_api.live.nba.endpoints import scoreboard

games = scoreboard.ScoreBoard()
games.get_json()
```

### NFL APIs

#### 1. FantasyData NFL API
**Base URL:** `https://api.fantasydata.com`

**Pricing:**
- **NFL Fantasy Data:** $99/month, $599/year
- **NFL Betting Data:** $99/month, $599/year
- **Combined:** $149/month, $899/year

#### Endpoints:
```
# Get teams
GET /v3/nfl/scores/json/Teams

# Get player stats
GET /v3/nfl/stats/json/PlayerSeasonStats/2024

# Get game results
GET /v3/nfl/scores/json/ScoresByWeek/2024/1
```

### MLB APIs

#### 1. MLB Stats API (Official)
**Base URL:** `https://statsapi.mlb.com`

```python
# Using MLB-StatsAPI package
import statsapi

# Get player info
statsapi.lookup_player('mike trout')

# Get schedule
statsapi.schedule(start_date='2024-04-01', end_date='2024-04-07')
```

#### 2. MLB Gameday API
**Base URL:** Various XML endpoints

Historical XML files with Pitchf/x data:
```
# Game data structure
/year_2024/month_04/day_15/gid_2024_04_15_anamlb_texmlb_1/
```

### NHL APIs

#### 1. NHL API (Official - New 2025)
**Base URL:** `https://api-web.nhle.com`

```python
# Using nhl-api-py
from nhlpy import NHLClient

client = NHLClient()
teams = client.teams.teams()
standings = client.standings.league_standings()
```

#### 2. NHL Stats API (Legacy)
**Base URL:** `https://statsapi.web.nhl.com/api/v1`

```
# Get teams
GET /teams

# Get player stats
GET /people/8477956/stats?stats=statsSingleSeason&season=20232024

# Get game data
GET /game/2023020001/feed/live
```

### Soccer/Football APIs

#### 1. FIFA API
**Base URL:** `https://givevoicetofootball.fifa.com/api/v1`

Free access to FIFA competition data:
```
# Get seasons
GET /seasons/search?name=FIFA%20U-20%20Women%20World%20Cup

# Get matches
GET /calendar/matches?idSeason=278491&idCompetition=108

# Get players
GET /players/seasons/278491?count=1000
```

#### 2. API-Football
**Base URL:** `https://v3.football.api-sports.io`

**Free:** 100 requests/day
**Coverage:** 960+ leagues worldwide

### Tennis APIs

#### 1. Entity Sport Tennis API
**Base URL:** `https://api.entitysport.com`

Features:
- Live match data
- Player rankings (Singles & Doubles)
- Point-by-point statistics
- Surface-specific player stats
- ATP and WTA tournaments

### Golf APIs

#### 1. SportsData Golf API
Coverage includes:
- PGA Tour
- European Tour
- Major Championships
- Player statistics
- Tournament results

### MMA APIs

#### 1. API-Sports MMA
**Base URL:** `https://v1.mma.api-sports.io`

**Free:** 100 requests/day
**Coverage:** UFC, Bellator, other promotions

#### Endpoints:
```
# Get fights
GET /fights

# Get fighters
GET /fighters

# Get events
GET /events
```

## Implementation Examples

### JavaScript/Node.js Example

```javascript
// Using The Odds API
const fetch = require('node-fetch');

const API_KEY = 'your-api-key';
const SPORT = 'americanfootball_nfl';

async function getOdds() {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${SPORT}/odds?apiKey=${API_KEY}&regions=us&markets=h2h,spreads&oddsFormat=american`
    );
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Using API-Sports Football
async function getFootballFixtures() {
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': 'your-rapid-api-key',
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(
      'https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all',
      options
    );
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Python Example

```python
import requests
import json

# The Sports DB - Free API
def get_team_info(team_name):
    url = f"https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t={team_name}"
    response = requests.get(url)
    return response.json()

# NBA API using nba_api
from nba_api.stats.endpoints import leaguegamefinder

def get_nba_games():
    gamefinder = leaguegamefinder.LeagueGameFinder(
        season_nullable='2023-24',
        season_type_nullable='Regular Season'
    )
    games = gamefinder.get_data_frames()[0]
    return games.head()

# SportsData.io with API key
def get_nfl_scores(date):
    url = f"https://api.sportsdata.io/v3/nfl/scores/json/ScoresByDate/{date}"
    headers = {
        'Ocp-Apim-Subscription-Key': 'your-api-key'
    }
    response = requests.get(url, headers=headers)
    return response.json()

# The Odds API
def get_betting_odds(sport):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    params = {
        'apiKey': 'your-api-key',
        'regions': 'us',
        'markets': 'h2h,spreads,totals',
        'oddsFormat': 'american'
    }
    response = requests.get(url, params=params)
    return response.json()
```

### PHP Example

```php
<?php
// The Sports DB API
function getSportsDbData($endpoint) {
    $url = "https://www.thesportsdb.com/api/v1/json/1/" . $endpoint;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);
    curl_close($ch);
    return json_decode($data, true);
}

// API-Sports with authentication
function getApiSportsData($endpoint, $apiKey) {
    $url = "https://v3.football.api-sports.io/" . $endpoint;
    $headers = [
        "X-RapidAPI-Key: " . $apiKey,
        "X-RapidAPI-Host: api-football-v1.p.rapidapi.com"
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);
    curl_close($ch);
    return json_decode($data, true);
}

// Usage examples
$teamData = getSportsDbData("searchteams.php?t=Arsenal");
$fixtures = getApiSportsData("fixtures?live=all", "your-api-key");
?>
```

## API Comparison Table

| API Provider | Free Tier | Sports Coverage | Historical Data | Live Data | Odds/Betting | Rate Limits | Authentication |
|-------------|-----------|-----------------|-----------------|-----------|--------------|-------------|----------------|
| **The Sports DB** | ✅ Unlimited | 40+ sports | ✅ Extensive | ✅ Yes | ❌ No | Reasonable | Optional |
| **API-Sports.io** | 100 req/day | 12 sports | ✅ 15+ years | ✅ Yes | ✅ Yes | 100/day free | API Key |
| **ESPN API** | ✅ Unofficial | Major US sports | ✅ Yes | ✅ Yes | ❌ No | Unknown | None |
| **Ball Don't Lie** | Start free | 5 sports | ✅ Yes | ✅ Yes | ❌ No | Varies | API Key |
| **SportsData.io** | Free trial | 20+ sports | ✅ Extensive | ✅ Yes | ✅ Yes | Trial unlimited | API Key |
| **The Odds API** | 500 credits/month | 70+ sports | ✅ Yes | ✅ Yes | ✅ Primary focus | Credit-based | API Key |
| **Sportradar** | 30-day trial | 80+ sports | ✅ Extensive | ✅ Yes | ✅ Yes | Trial limited | API Key |
| **FantasyData** | No free tier | US major sports | ✅ Yes | ✅ Yes | ✅ Yes | None free | API Key |

## Best Practices & Tips

### 1. Authentication & Rate Limiting
```javascript
// Implement rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Use API key securely
const API_KEY = process.env.SPORTS_API_KEY;
```

### 2. Error Handling
```python
import time
from functools import wraps

def retry_on_failure(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(delay * (2 ** attempt))
            return None
        return wrapper
    return decorator

@retry_on_failure(max_retries=3, delay=2)
def fetch_sports_data(url, headers=None):
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()
```

### 3. Caching Strategy
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getCachedData(key, fetchFunction) {
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData;
  }
  
  const freshData = await fetchFunction();
  cache.set(key, freshData);
  return freshData;
}
```

### 4. Data Normalization
```python
def normalize_team_data(api_response, source='thesportsdb'):
    """Normalize team data from different API sources"""
    if source == 'thesportsdb':
        return {
            'id': api_response.get('idTeam'),
            'name': api_response.get('strTeam'),
            'league': api_response.get('strLeague'),
            'founded': api_response.get('intFormedYear')
        }
    elif source == 'api_sports':
        return {
            'id': api_response.get('team', {}).get('id'),
            'name': api_response.get('team', {}).get('name'),
            'league': api_response.get('league', {}).get('name'),
            'founded': api_response.get('team', {}).get('founded')
        }
```

## Recommended Free API Stack

### For Beginners:
1. **The Sports DB** - Start here for learning
2. **ESPN Hidden API** - US sports focus
3. **API-Sports.io** - 100 free requests/day

### For Betting Applications:
1. **The Odds API** - 500 free credits/month
2. **Pinnacle API** - Revenue sharing model
3. **API-Sports.io** - Includes odds data

### For Production Applications:
1. **SportsData.io** - Free trial, then affordable plans
2. **Sportradar** - Enterprise grade (expensive)
3. **FantasyData** - US sports specialists

### For Historical Analysis:
1. **The Sports DB** - Extensive free historical data
2. **Sports Reference** (via Sportsipy) - Free Python package
3. **Official league APIs** - NBA, MLB, NHL stats

This comprehensive guide provides everything needed to start building sports applications with free and affordable APIs. Each API has its strengths, so choose based on your specific requirements for sports coverage, data freshness, and budget constraints.