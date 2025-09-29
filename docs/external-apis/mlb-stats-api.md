# MLB Stats API Documentation

## Overview

The MLB Stats API is the official API provided by Major League Baseball for accessing comprehensive baseball data. It's completely free and provides the most accurate and up-to-date MLB statistics, player information, and game data.

**Base URL:** `https://statsapi.mlb.com/api/v1`  
**Documentation:** https://statsapi.mlb.com/docs/  
**Rate Limit:** No official limit, but 100 requests/minute recommended  
**Cost:** Free (no API key required)

## Authentication

### No Authentication Required
The MLB Stats API doesn't require authentication or API keys, making it very accessible for developers.

### Usage in Code
```typescript
import { mlbStatsClient } from '@/lib/sports-apis'

// The client handles all requests automatically
const games = await mlbStatsClient.getGames()
```

## Endpoints

### Games

#### Get Games
**Endpoint:** `GET /schedule`

**Parameters:**
- `sportId` (number, optional) - Sport ID (1 for MLB)
- `date` (string, optional) - Date in YYYY-MM-DD format
- `teamId` (number, optional) - Team ID
- `leagueId` (number, optional) - League ID
- `season` (string, optional) - Season year
- `gameType` (string, optional) - Game type (R for regular season)

**Example Request:**
```bash
curl -X GET "https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=2024-01-15"
```

**Example Response:**
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "totalItems": 1,
  "totalEvents": 0,
  "totalGames": 1,
  "totalGamesInProgress": 0,
  "dates": [
    {
      "date": "2024-01-15",
      "totalItems": 1,
      "totalEvents": 0,
      "totalGames": 1,
      "totalGamesInProgress": 0,
      "games": [
        {
          "gamePk": 1234567890,
          "link": "/api/v1/game/1234567890/feed/live",
          "gameType": "R",
          "season": "2024",
          "gameDate": "2024-01-15T20:00:00Z",
          "officialDate": "2024-01-15",
          "rescheduledFrom": null,
          "rescheduledFromDate": null,
          "status": {
            "abstractGameState": "Final",
            "codedGameState": "F",
            "detailedState": "Final",
            "statusCode": "F",
            "startTimeTBD": false,
            "abstractGameCode": "F"
          },
          "teams": {
            "away": {
              "leagueRecord": {
                "wins": 25,
                "losses": 15,
                "pct": ".625"
              },
              "score": 5,
              "team": {
                "id": 147,
                "name": "New York Yankees",
                "link": "/api/v1/teams/147"
              }
            },
            "home": {
              "leagueRecord": {
                "wins": 20,
                "losses": 20,
                "pct": ".500"
              },
              "score": 3,
              "team": {
                "id": 111,
                "name": "Boston Red Sox",
                "link": "/api/v1/teams/111"
              }
            }
          },
          "venue": {
            "id": 3,
            "name": "Fenway Park",
            "link": "/api/v1/venues/3"
          },
          "content": {
            "link": "/api/v1/game/1234567890/content"
          }
        }
      ],
      "events": []
    }
  ]
}
```

### Teams

#### Get Teams
**Endpoint:** `GET /teams`

**Parameters:**
- `sportId` (number, optional) - Sport ID (1 for MLB)
- `season` (string, optional) - Season year
- `leagueId` (number, optional) - League ID
- `divisionId` (number, optional) - Division ID

**Example Request:**
```bash
curl -X GET "https://statsapi.mlb.com/api/v1/teams?sportId=1&season=2024"
```

**Example Response:**
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "teams": [
    {
      "id": 147,
      "name": "New York Yankees",
      "link": "/api/v1/teams/147",
      "season": 2024,
      "venue": {
        "id": 1,
        "name": "Yankee Stadium",
        "link": "/api/v1/venues/1"
      },
      "teamCode": "nya",
      "fileCode": "nyy",
      "abbreviation": "NYY",
      "teamName": "Yankees",
      "locationName": "New York",
      "firstYearOfPlay": "1901",
      "league": {
        "id": 103,
        "name": "American League",
        "link": "/api/v1/league/103"
      },
      "division": {
        "id": 201,
        "name": "American League East",
        "link": "/api/v1/divisions/201"
      },
      "sport": {
        "id": 1,
        "link": "/api/v1/sports/1",
        "name": "Major League Baseball"
      },
      "shortName": "NY Yankees",
      "franchiseName": "New York",
      "clubName": "Yankees",
      "active": true
    }
  ]
}
```

### Players

#### Get Players
**Endpoint:** `GET /teams/{teamId}/roster`

**Parameters:**
- `teamId` (number, required) - Team ID
- `season` (string, optional) - Season year
- `rosterType` (string, optional) - Roster type (active, full, etc.)

**Example Request:**
```bash
curl -X GET "https://statsapi.mlb.com/api/v1/teams/147/roster?season=2024"
```

**Example Response:**
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "roster": [
    {
      "person": {
        "id": 123456,
        "fullName": "Aaron Judge",
        "link": "/api/v1/people/123456",
        "firstName": "Aaron",
        "lastName": "Judge",
        "primaryNumber": "99",
        "birthDate": "1992-04-26",
        "currentAge": 31,
        "birthCity": "Linden",
        "birthStateProvince": "CA",
        "birthCountry": "USA",
        "height": "6' 7\"",
        "weight": 282,
        "active": true,
        "primaryPosition": {
          "code": "9",
          "name": "Outfielder",
          "type": "Outfielder",
          "abbreviation": "RF"
        },
        "useName": "Aaron",
        "middleName": "James",
        "boxscoreName": "Judge",
        "nickName": "All Rise",
        "mlbDebutDate": "2016-08-13",
        "batSide": {
          "code": "R",
          "description": "Right"
        },
        "pitchHand": {
          "code": "R",
          "description": "Right"
        },
        "nameFirstLast": "Aaron Judge",
        "nameSlug": "aaron-judge",
        "firstLastName": "Aaron Judge",
        "lastFirstName": "Judge, Aaron",
        "lastInitName": "Judge, A",
        "initLastName": "A Judge",
        "fullFMLName": "Aaron James Judge",
        "fullLFMName": "Judge, Aaron James"
      },
      "jerseyNumber": "99",
      "position": {
        "code": "9",
        "name": "Outfielder",
        "type": "Outfielder",
        "abbreviation": "RF"
      },
      "status": {
        "code": "A",
        "description": "Active"
      },
      "parentTeamId": 147
    }
  ]
}
```

### Standings

#### Get Standings
**Endpoint:** `GET /standings`

**Parameters:**
- `leagueId` (number, optional) - League ID
- `season` (string, optional) - Season year
- `standingsType` (string, optional) - Standings type (regularSeason, wildCard, etc.)
- `date` (string, optional) - Date in YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=2024"
```

**Example Response:**
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "records": [
    {
      "standingsType": "regularSeason",
      "league": {
        "id": 103,
        "name": "American League",
        "link": "/api/v1/league/103"
      },
      "division": {
        "id": 201,
        "name": "American League East",
        "link": "/api/v1/divisions/201"
      },
      "sport": {
        "id": 1,
        "link": "/api/v1/sports/1",
        "name": "Major League Baseball"
      },
      "lastUpdated": "2024-01-15T20:00:00Z",
      "teamRecords": [
        {
          "team": {
            "id": 147,
            "name": "New York Yankees",
            "link": "/api/v1/teams/147"
          },
          "season": "2024",
          "streak": {
            "streakType": "wins",
            "streakNumber": 3,
            "streakCode": "W3"
          },
          "divisionRank": "1",
          "leagueRank": "1",
          "sportRank": "1",
          "gamesPlayed": 40,
          "gamesBack": "0",
          "wildCardGamesBack": "0",
          "leagueRecord": {
            "wins": 25,
            "losses": 15,
            "pct": ".625"
          },
          "records": {
            "splitRecords": [
              {
                "wins": 15,
                "losses": 5,
                "type": "home",
                "pct": ".750"
              },
              {
                "wins": 10,
                "losses": 10,
                "type": "away",
                "pct": ".500"
              }
            ]
          },
          "runsAllowed": 180,
          "runsScored": 220,
          "runDifferential": 40,
          "home": {
            "wins": 15,
            "losses": 5,
            "pct": ".750"
          },
          "away": {
            "wins": 10,
            "losses": 10,
            "pct": ".500"
          },
          "lastUpdated": "2024-01-15T20:00:00Z"
        }
      ]
    }
  ]
}
```

### Game Details

#### Get Game Details
**Endpoint:** `GET /game/{gamePk}/feed/live`

**Parameters:**
- `gamePk` (number, required) - Game ID

**Example Request:**
```bash
curl -X GET "https://statsapi.mlb.com/api/v1/game/1234567890/feed/live"
```

**Example Response:**
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "gamePk": 1234567890,
  "link": "/api/v1/game/1234567890/feed/live",
  "metaData": {
    "wait": 10,
    "timeStamp": "20240115_200000"
  },
  "gameData": {
    "game": {
      "pk": 1234567890,
      "type": "R",
      "doubleHeader": "N",
      "id": "2024/01/15/nyamlb-bosmlb-1",
      "gamedayType": "P",
      "tiebreaker": "N",
      "gameNumber": 1,
      "calendarEventID": "14-1234567890",
      "season": "2024",
      "seasonDisplay": "2024"
    },
    "datetime": {
      "originalDate": "2024-01-15",
      "originalTime": "20:00",
      "dayNight": "night",
      "time": "20:00",
      "ampm": "PM"
    },
    "status": {
      "abstractGameState": "Final",
      "codedGameState": "F",
      "detailedState": "Final",
      "statusCode": "F",
      "startTimeTBD": false,
      "abstractGameCode": "F"
    },
    "teams": {
      "away": {
        "id": 147,
        "name": "New York Yankees",
        "link": "/api/v1/teams/147",
        "season": 2024,
        "venue": {
          "id": 1,
          "name": "Yankee Stadium",
          "link": "/api/v1/venues/1"
        },
        "teamCode": "nya",
        "fileCode": "nyy",
        "abbreviation": "NYY",
        "teamName": "Yankees",
        "locationName": "New York",
        "firstYearOfPlay": "1901",
        "league": {
          "id": 103,
          "name": "American League",
          "link": "/api/v1/league/103"
        },
        "division": {
          "id": 201,
          "name": "American League East",
          "link": "/api/v1/divisions/201"
        },
        "sport": {
          "id": 1,
          "link": "/api/v1/sports/1",
          "name": "Major League Baseball"
        },
        "shortName": "NY Yankees",
        "franchiseName": "New York",
        "clubName": "Yankees",
        "active": true
      },
      "home": {
        "id": 111,
        "name": "Boston Red Sox",
        "link": "/api/v1/teams/111",
        "season": 2024,
        "venue": {
          "id": 3,
          "name": "Fenway Park",
          "link": "/api/v1/venues/3"
        },
        "teamCode": "bos",
        "fileCode": "bos",
        "abbreviation": "BOS",
        "teamName": "Red Sox",
        "locationName": "Boston",
        "firstYearOfPlay": "1901",
        "league": {
          "id": 103,
          "name": "American League",
          "link": "/api/v1/league/103"
        },
        "division": {
          "id": 201,
          "name": "American League East",
          "link": "/api/v1/divisions/201"
        },
        "sport": {
          "id": 1,
          "link": "/api/v1/sports/1",
          "name": "Major League Baseball"
        },
        "shortName": "Boston",
        "franchiseName": "Boston",
        "clubName": "Red Sox",
        "active": true
      }
    },
    "players": {
      "ID123456": {
        "id": 123456,
        "fullName": "Aaron Judge",
        "link": "/api/v1/people/123456",
        "firstName": "Aaron",
        "lastName": "Judge",
        "primaryNumber": "99",
        "birthDate": "1992-04-26",
        "currentAge": 31,
        "birthCity": "Linden",
        "birthStateProvince": "CA",
        "birthCountry": "USA",
        "height": "6' 7\"",
        "weight": 282,
        "active": true,
        "primaryPosition": {
          "code": "9",
          "name": "Outfielder",
          "type": "Outfielder",
          "abbreviation": "RF"
        },
        "useName": "Aaron",
        "middleName": "James",
        "boxscoreName": "Judge",
        "nickName": "All Rise",
        "mlbDebutDate": "2016-08-13",
        "batSide": {
          "code": "R",
          "description": "Right"
        },
        "pitchHand": {
          "code": "R",
          "description": "Right"
        },
        "nameFirstLast": "Aaron Judge",
        "nameSlug": "aaron-judge",
        "firstLastName": "Aaron Judge",
        "lastFirstName": "Judge, Aaron",
        "lastInitName": "Judge, A",
        "initLastName": "A Judge",
        "fullFMLName": "Aaron James Judge",
        "fullLFMName": "Judge, Aaron James"
      }
    },
    "venue": {
      "id": 3,
      "name": "Fenway Park",
      "link": "/api/v1/venues/3"
    },
    "weather": {
      "condition": "Clear",
      "temp": "72",
      "wind": "5 mph, Out to RF"
    },
    "game": {
      "pk": 1234567890,
      "type": "R",
      "doubleHeader": "N",
      "id": "2024/01/15/nyamlb-bosmlb-1",
      "gamedayType": "P",
      "tiebreaker": "N",
      "gameNumber": 1,
      "calendarEventID": "14-1234567890",
      "season": "2024",
      "seasonDisplay": "2024"
    }
  },
  "liveData": {
    "plays": {
      "allPlays": [
        {
          "result": {
            "type": "single",
            "event": "Single",
            "eventType": "single",
            "description": "Aaron Judge singles on a line drive to center field.",
            "rbi": 0,
            "awayScore": 1,
            "homeScore": 0
          },
          "about": {
            "atBatIndex": 0,
            "halfInning": "top",
            "isTopInning": true,
            "inning": 1,
            "startTime": "2024-01-15T20:05:00.000Z",
            "endTime": "2024-01-15T20:05:30.000Z",
            "isComplete": true,
            "isStrike": false,
            "isBall": false,
            "hasOut": false,
            "captivatingIndex": 0
          },
          "count": {
            "balls": 1,
            "strikes": 2,
            "outs": 0
          },
          "matchup": {
            "batter": {
              "id": 123456,
              "fullName": "Aaron Judge",
              "link": "/api/v1/people/123456"
            },
            "batSide": {
              "code": "R",
              "description": "Right"
            },
            "pitcher": {
              "id": 789012,
              "fullName": "Chris Sale",
              "link": "/api/v1/people/789012"
            },
            "pitchHand": {
              "code": "L",
              "description": "Left"
            },
            "postOnFirst": {
              "id": 123456,
              "fullName": "Aaron Judge",
              "link": "/api/v1/people/123456"
            },
            "postOnSecond": null,
            "postOnThird": null
          },
          "pitchIndex": [0, 1, 2],
          "actionIndex": [],
          "runnerIndex": [0],
          "runners": [
            {
              "movement": {
                "originBase": null,
                "start": null,
                "end": "1B",
                "outBase": null,
                "isOut": false,
                "outNumber": null
              },
              "details": {
                "event": "Single",
                "eventType": "single",
                "movementReason": null,
                "runner": {
                  "id": 123456,
                  "fullName": "Aaron Judge",
                  "link": "/api/v1/people/123456"
                },
                "responsiblePitcher": null,
                "isScoringEvent": false,
                "rbi": false,
                "earned": false,
                "teamUnearned": false,
                "playIndex": 0
              },
              "credits": [
                {
                  "player": {
                    "id": 123456,
                    "link": "/api/v1/people/123456"
                  },
                  "position": {
                    "code": "9",
                    "name": "Outfielder",
                    "type": "Outfielder",
                    "abbreviation": "RF"
                  },
                  "credit": "f_single"
                }
              ]
            }
          ],
          "playEvents": [
            {
              "details": {
                "description": "Ball",
                "event": "Ball",
                "eventType": "ball",
                "awayScore": 0,
                "homeScore": 0,
                "isScoringPlay": false,
                "hasReview": false
              },
              "count": {
                "balls": 1,
                "strikes": 0,
                "outs": 0
              },
              "index": 0,
              "startTime": "2024-01-15T20:05:00.000Z",
              "endTime": "2024-01-15T20:05:10.000Z",
              "isPitch": true,
              "type": "pitch",
              "playId": "1234567890-0"
            }
          ]
        }
      ],
      "currentPlay": {
        "result": {
          "type": "single",
          "event": "Single",
          "eventType": "single",
          "description": "Aaron Judge singles on a line drive to center field.",
          "rbi": 0,
          "awayScore": 1,
          "homeScore": 0
        },
        "about": {
          "atBatIndex": 0,
          "halfInning": "top",
          "isTopInning": true,
          "inning": 1,
          "startTime": "2024-01-15T20:05:00.000Z",
          "endTime": "2024-01-15T20:05:30.000Z",
          "isComplete": true,
          "isStrike": false,
          "isBall": false,
          "hasOut": false,
          "captivatingIndex": 0
        },
        "count": {
          "balls": 1,
          "strikes": 2,
          "outs": 0
        },
        "matchup": {
          "batter": {
            "id": 123456,
            "fullName": "Aaron Judge",
            "link": "/api/v1/people/123456"
          },
          "batSide": {
            "code": "R",
            "description": "Right"
          },
          "pitcher": {
            "id": 789012,
            "fullName": "Chris Sale",
            "link": "/api/v1/people/789012"
          },
          "pitchHand": {
            "code": "L",
            "description": "Left"
          },
          "postOnFirst": {
            "id": 123456,
            "fullName": "Aaron Judge",
            "link": "/api/v1/people/123456"
          },
          "postOnSecond": null,
          "postOnThird": null
        },
        "pitchIndex": [0, 1, 2],
        "actionIndex": [],
        "runnerIndex": [0],
        "runners": [
          {
            "movement": {
              "originBase": null,
              "start": null,
              "end": "1B",
              "outBase": null,
              "isOut": false,
              "outNumber": null
            },
            "details": {
              "event": "Single",
              "eventType": "single",
              "movementReason": null,
              "runner": {
                "id": 123456,
                "fullName": "Aaron Judge",
                "link": "/api/v1/people/123456"
              },
              "responsiblePitcher": null,
              "isScoringEvent": false,
              "rbi": false,
              "earned": false,
              "teamUnearned": false,
              "playIndex": 0
            },
            "credits": [
              {
                "player": {
                  "id": 123456,
                  "link": "/api/v1/people/123456"
                },
                "position": {
                  "code": "9",
                  "name": "Outfielder",
                  "type": "Outfielder",
                  "abbreviation": "RF"
                },
                "credit": "f_single"
              }
            ]
          }
        ],
        "playEvents": [
          {
            "details": {
              "description": "Ball",
              "event": "Ball",
              "eventType": "ball",
              "awayScore": 0,
              "homeScore": 0,
              "isScoringPlay": false,
              "hasReview": false
            },
            "count": {
              "balls": 1,
              "strikes": 0,
              "outs": 0
            },
            "index": 0,
            "startTime": "2024-01-15T20:05:00.000Z",
            "endTime": "2024-01-15T20:05:10.000Z",
            "isPitch": true,
            "type": "pitch",
            "playId": "1234567890-0"
          }
        ]
      },
      "playsByInning": [
        {
          "num": 1,
          "home": {
            "runs": 0,
            "hits": 0,
            "errors": 0,
            "leftOnBase": 0
          },
          "away": {
            "runs": 1,
            "hits": 1,
            "errors": 0,
            "leftOnBase": 1
          }
        }
      ],
      "teams": {
        "away": {
          "runs": 5,
          "hits": 8,
          "errors": 0,
          "leftOnBase": 7
        },
        "home": {
          "runs": 3,
          "hits": 6,
          "errors": 1,
          "leftOnBase": 5
        }
      }
    },
    "linescore": {
      "currentInning": 9,
      "currentInningOrdinal": "9th",
      "inningState": "End",
      "inningHalf": "Top",
      "isTopInning": true,
      "scheduledInnings": 9,
      "innings": [
        {
          "num": 1,
          "ordinalNum": "1st",
          "home": {
            "runs": 0,
            "hits": 0,
            "errors": 0,
            "leftOnBase": 0
          },
          "away": {
            "runs": 1,
            "hits": 1,
            "errors": 0,
            "leftOnBase": 1
          }
        }
      ],
      "teams": {
        "home": {
          "runs": 3,
          "hits": 6,
          "errors": 1,
          "leftOnBase": 5
        },
        "away": {
          "runs": 5,
          "hits": 8,
          "errors": 0,
          "leftOnBase": 7
        }
      },
      "defense": {
        "pitcher": {
          "id": 789012,
          "fullName": "Chris Sale",
          "link": "/api/v1/people/789012"
        },
        "catcher": {
          "id": 345678,
          "fullName": "Christian Vazquez",
          "link": "/api/v1/people/345678"
        },
        "first": {
          "id": 456789,
          "fullName": "Rafael Devers",
          "link": "/api/v1/people/456789"
        },
        "second": {
          "id": 567890,
          "fullName": "Enrique Hernandez",
          "link": "/api/v1/people/567890"
        },
        "third": {
          "id": 678901,
          "fullName": "Xander Bogaerts",
          "link": "/api/v1/people/678901"
        },
        "short": {
          "id": 789012,
          "fullName": "Trevor Story",
          "link": "/api/v1/people/789012"
        },
        "left": {
          "id": 890123,
          "fullName": "Alex Verdugo",
          "link": "/api/v1/people/890123"
        },
        "center": {
          "id": 901234,
          "fullName": "Kike Hernandez",
          "link": "/api/v1/people/901234"
        },
        "right": {
          "id": 123456,
          "fullName": "Hunter Renfroe",
          "link": "/api/v1/people/123456"
        },
        "batter": {
          "id": 234567,
          "fullName": "Gleyber Torres",
          "link": "/api/v1/people/234567"
        },
        "onDeck": {
          "id": 345678,
          "fullName": "DJ LeMahieu",
          "link": "/api/v1/people/345678"
        },
        "inHole": {
          "id": 456789,
          "fullName": "Anthony Rizzo",
          "link": "/api/v1/people/456789"
        },
        "battingOrder": 1,
        "team": {
          "id": 147,
          "name": "New York Yankees",
          "link": "/api/v1/teams/147"
        }
      },
      "offense": {
        "batter": {
          "id": 234567,
          "fullName": "Gleyber Torres",
          "link": "/api/v1/people/234567"
        },
        "onDeck": {
          "id": 345678,
          "fullName": "DJ LeMahieu",
          "link": "/api/v1/people/345678"
        },
        "inHole": {
          "id": 456789,
          "fullName": "Anthony Rizzo",
          "link": "/api/v1/people/456789"
        },
        "battingOrder": 1,
        "team": {
          "id": 147,
          "name": "New York Yankees",
          "link": "/api/v1/teams/147"
        }
      }
    },
    "boxscore": {
      "teams": {
        "away": {
          "team": {
            "id": 147,
            "name": "New York Yankees",
            "link": "/api/v1/teams/147"
          },
          "teamStats": {
            "batting": {
              "runs": 5,
              "hits": 8,
              "errors": 0,
              "leftOnBase": 7
            },
            "pitching": {
              "runs": 3,
              "hits": 6,
              "errors": 1,
              "leftOnBase": 5
            },
            "fielding": {
              "runs": 3,
              "hits": 6,
              "errors": 1,
              "leftOnBase": 5
            }
          },
          "players": {
            "ID123456": {
              "person": {
                "id": 123456,
                "fullName": "Aaron Judge",
                "link": "/api/v1/people/123456"
              },
              "jerseyNumber": "99",
              "position": {
                "code": "9",
                "name": "Outfielder",
                "type": "Outfielder",
                "abbreviation": "RF"
              },
              "stats": {
                "batting": {
                  "gamesPlayed": 1,
                  "flyOuts": 0,
                  "groundOuts": 0,
                  "runs": 1,
                  "doubles": 0,
                  "triples": 0,
                  "homeRuns": 0,
                  "strikeOuts": 0,
                  "baseOnBalls": 0,
                  "intentionalWalks": 0,
                  "hits": 1,
                  "hitByPitch": 0,
                  "avg": "1.000",
                  "atBats": 1,
                  "obp": "1.000",
                  "slg": "1.000",
                  "ops": "2.000",
                  "caughtStealing": 0,
                  "stolenBases": 0,
                  "stolenBasePercentage": ".000",
                  "groundIntoDoublePlay": 0,
                  "groundIntoTriplePlay": 0,
                  "plateAppearances": 1,
                  "totalBases": 1,
                  "rbi": 0,
                  "leftOnBase": 0,
                  "sacBunts": 0,
                  "sacFlies": 0,
                  "babip": "1.000"
                }
              },
              "seasonStats": {
                "batting": {
                  "gamesPlayed": 40,
                  "flyOuts": 15,
                  "groundOuts": 20,
                  "runs": 25,
                  "doubles": 8,
                  "triples": 1,
                  "homeRuns": 12,
                  "strikeOuts": 35,
                  "baseOnBalls": 20,
                  "intentionalWalks": 2,
                  "hits": 45,
                  "hitByPitch": 3,
                  "avg": ".300",
                  "atBats": 150,
                  "obp": ".400",
                  "slg": ".600",
                  "ops": "1.000",
                  "caughtStealing": 1,
                  "stolenBases": 2,
                  "stolenBasePercentage": ".667",
                  "groundIntoDoublePlay": 3,
                  "groundIntoTriplePlay": 0,
                  "plateAppearances": 175,
                  "totalBases": 90,
                  "rbi": 30,
                  "leftOnBase": 25,
                  "sacBunts": 0,
                  "sacFlies": 2,
                  "babip": ".350"
                }
              },
              "gameStatus": {
                "isCurrentBatter": false,
                "isCurrentPitcher": false,
                "isOnBench": false,
                "isSubstitute": false
              },
              "allPositions": [
                {
                  "code": "9",
                  "name": "Outfielder",
                  "type": "Outfielder",
                  "abbreviation": "RF"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

## Rate Limits

### Recommended Limits
- **Per Minute:** 100 requests (conservative)
- **Per Hour:** 1000 requests
- **Per Day:** 10000 requests

### Rate Limit Handling
```typescript
// Conservative rate limiting for MLB Stats API
const rateLimits = {
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000
}
```

## Error Handling

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| 200 | Success | Request successful |
| 400 | Bad Request | Check request parameters |
| 404 | Not Found | Verify endpoint URL |
| 429 | Too Many Requests | Reduce request frequency |
| 500 | Internal Server Error | Retry request |

### Error Response Format
```json
{
  "copyright": "Copyright 2024 MLB Advanced Media, L.P.",
  "message": "Invalid request",
  "messageNumber": 1,
  "messageDetail": "The requested resource was not found"
}
```

## Code Examples

### TypeScript Integration
```typescript
import { mlbStatsClient } from '@/lib/sports-apis'

// Get MLB games for a specific date
async function getMLBGames(date?: string) {
  try {
    const games = await mlbStatsClient.getGames(date)
    
    return games.dates[0]?.games.map(game => ({
      id: game.gamePk,
      homeTeam: game.teams.home.team,
      awayTeam: game.teams.away.team,
      homeScore: game.teams.home.score,
      awayScore: game.teams.away.score,
      date: game.gameDate,
      status: game.status.detailedState,
      venue: game.venue?.name
    })) || []
  } catch (error) {
    console.error('Failed to fetch MLB games:', error)
    throw error
  }
}

// Get MLB teams
async function getMLBTeams() {
  try {
    const teams = await mlbStatsClient.getTeams()
    
    return teams.teams.map(team => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      location: team.locationName,
      division: team.division?.name,
      league: team.league?.name,
      venue: team.venue?.name,
      firstYear: team.firstYearOfPlay,
      active: team.active
    }))
  } catch (error) {
    console.error('Failed to fetch MLB teams:', error)
    throw error
  }
}

// Get MLB standings
async function getMLBStandings() {
  try {
    const standings = await mlbStatsClient.getStandings()
    
    return standings.records.map(record => ({
      division: record.division.name,
      league: record.league.name,
      teams: record.teamRecords.map(team => ({
        team: team.team,
        wins: team.leagueRecord.wins,
        losses: team.leagueRecord.losses,
        winPercentage: team.leagueRecord.pct,
        gamesBack: team.gamesBack,
        runsScored: team.runsScored,
        runsAllowed: team.runsAllowed,
        runDifferential: team.runDifferential,
        streak: team.streak.streakCode
      }))
    }))
  } catch (error) {
    console.error('Failed to fetch MLB standings:', error)
    throw error
  }
}

// Get team roster
async function getTeamRoster(teamId: number) {
  try {
    const roster = await mlbStatsClient.getTeamRoster(teamId)
    
    return roster.roster.map(player => ({
      id: player.person.id,
      name: player.person.fullName,
      position: player.position.name,
      jerseyNumber: player.jerseyNumber,
      status: player.status.description,
      age: player.person.currentAge,
      height: player.person.height,
      weight: player.person.weight,
      batSide: player.person.batSide?.description,
      pitchHand: player.person.pitchHand?.description
    }))
  } catch (error) {
    console.error('Failed to fetch team roster:', error)
    throw error
  }
}
```

### JavaScript Example
```javascript
// Using fetch directly
async function fetchMLBStatsData(endpoint, params = {}) {
  const baseUrl = 'https://statsapi.mlb.com/api/v1'
  
  const queryString = new URLSearchParams(params).toString()
  const url = `${baseUrl}${endpoint}?${queryString}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApexBets/1.0.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Check for empty responses
    if (!data || (data.dates && data.dates.length === 0)) {
      throw new Error('No data returned from MLB Stats API')
    }
    
    return data
  } catch (error) {
    console.error('MLB Stats API request failed:', error)
    throw error
  }
}

// Usage
const games = await fetchMLBStatsData('/schedule', {
  sportId: 1,
  date: '2024-01-15'
})
```

## Best Practices

### 1. Headers and User-Agent
Always include proper headers to avoid being blocked:
```typescript
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'ApexBets/1.0.0'
}
```

### 2. Data Validation
Always validate responses as MLB Stats API can return empty data:
```typescript
function validateMLBGame(game: any): boolean {
  return (
    game.gamePk &&
    game.teams?.home?.team &&
    game.teams?.away?.team &&
    game.gameDate &&
    game.status?.detailedState
  )
}

const games = await mlbStatsClient.getGames()
const validGames = games.dates[0]?.games.filter(validateMLBGame) || []
```

### 3. Error Handling with Retry
```typescript
async function safeMLBStatsCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall()
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        console.warn(`Rate limit exceeded, waiting ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded:', error)
        return null
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return null
}
```

### 4. Caching Strategy
```typescript
import { getCache, setCache } from '@/lib/redis'

async function getCachedMLBData(endpoint: string, params: any) {
  const cacheKey = `mlb-stats-${endpoint}-${JSON.stringify(params)}`
  const cached = await getCache(cacheKey)
  
  if (cached) {
    return cached
  }
  
  const data = await mlbStatsClient.request(endpoint, params)
  await setCache(cacheKey, data, 300) // Cache for 5 minutes
  
  return data
}
```

## Integration with ApexBets

The MLB Stats API is integrated into the ApexBets system as the primary data source for MLB data. It's used in the following services:

- **BaseballService** - Primary data source for MLB games and statistics
- **PlayerStatsService** - Player statistics and performance data
- **TeamService** - Team information and standings
- **GameService** - Game schedules and results

The API is configured with conservative rate limiting, proper headers, and robust error handling to ensure reliable data access while respecting the MLB's servers.
