"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Medal,
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react"
import { useApiData } from "@/hooks/use-api-data"
import { useRealTimeData } from "@/components/data/real-time-provider"

interface StandingTeam {
  id: string
  name: string
  abbreviation: string
  logo?: string
  position: number
  wins: number
  losses: number
  draws?: number // For sports like soccer
  points?: number // For points-based systems
  winPercentage: number
  gamesBack?: number
  streak: string
  lastTen?: string
  conference?: string
  division?: string
  sport: string
  // Dynamic sport-specific fields
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
  played?: number
}

interface StandingsRowProps {
  team: StandingTeam
  isPlayoffPosition?: boolean
  sportType: string
}

function StandingsRow({ team, isPlayoffPosition, sportType }: StandingsRowProps) {
  // Dynamic display based on sport type
  const getSecondaryStats = () => {
    switch (sportType) {
      case 'soccer':
        return `${team.points || 0} pts | GD: ${team.goalDifference || 0}`
      case 'hockey':
        return `${team.points || 0} pts | ${team.goalsFor || 0}-${team.goalsAgainst || 0}`
      default:
        return `${team.wins}-${team.losses} | ${team.winPercentage.toFixed(1)}%`
    }
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
      isPlayoffPosition ? 'bg-accent/5 border-l-2 border-accent' : ''
    }`}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
        {team.position}
      </div>
      
      <Avatar className="h-8 w-8">
        <AvatarImage src={team.logo} alt={team.name} />
        <AvatarFallback className="text-xs">
          {team.abbreviation || team.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{team.name}</div>
        <div className="text-xs text-muted-foreground">
          {getSecondaryStats()}
        </div>
      </div>

      {/* Dynamic stats grid based on sport */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 text-center text-xs">
        <div>
          <div className="font-bold">{team.wins}</div>
          <div className="text-muted-foreground">W</div>
        </div>
        <div>
          <div className="font-bold">{team.losses}</div>
          <div className="text-muted-foreground">L</div>
        </div>
        {sportType === 'soccer' && team.draws !== undefined && (
          <div>
            <div className="font-bold">{team.draws}</div>
            <div className="text-muted-foreground">D</div>
          </div>
        )}
        {(sportType === 'soccer' || sportType === 'hockey') && team.points !== undefined ? (
          <div className="hidden lg:block">
            <div className="font-bold">{team.points}</div>
            <div className="text-muted-foreground">PTS</div>
          </div>
        ) : (
          <div className="hidden lg:block">
            <div className="font-bold">{team.winPercentage.toFixed(3)}</div>
            <div className="text-muted-foreground">PCT</div>
          </div>
        )}
      </div>
      
      {team.streak && (
        <div className="flex items-center gap-1 text-xs">
          {team.streak.startsWith('W') ? (
            <TrendingUp className="h-3 w-3 text-accent" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
          <span className="font-medium">{team.streak}</span>
        </div>
      )}
      
      {isPlayoffPosition && (
        <Medal className="h-4 w-4 text-accent" />
      )}
    </div>
  )
}

export function LiveStandingsWidget() {
  const { selectedSport } = useRealTimeData()
  const [conference, setConference] = useState<"all" | "eastern" | "western" | "american" | "national">("all")
  const [refreshing, setRefreshing] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetch = useCallback(async () => {
    const now = Date.now()
    // Prevent calls within 30 seconds of each other
    if (now - lastFetchTime < 30000) {
      return []
    }

    if (!selectedSport || selectedSport === "all") return []

    try {
      setLastFetchTime(now)
      const response = await fetch(`/api/standings?sport=${selectedSport}&conference=${conference}`, {
        headers: {
          'Cache-Control': 'max-age=300', // Cache for 5 minutes
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || result.standings || []
    } catch (error) {
      console.error('Error fetching standings:', error)
      return []
    }
  }, [selectedSport, conference, lastFetchTime])

  const { data: standings, loading, error, refetch } = useApiData(
    debouncedFetch,
    {
      enabled: selectedSport !== "all",
      refetchInterval: 600000 // Refresh every 10 minutes instead of 5
    }
  )

  // Enhanced dynamic standings data transformation
  const processedStandings = standings ? standings
    .filter((team: any) => team && (team.name || team.full_name))
    .map((team: any, index: number) => {
      // Calculate win percentage dynamically
      const wins = team.wins || team.record?.wins || team.w || 0
      const losses = team.losses || team.record?.losses || team.l || 0
      const draws = team.draws || team.record?.draws || team.d || 0
      const totalGames = wins + losses + draws
      const winPercentage = totalGames > 0 ? (wins / (wins + losses)) * 100 : 0

      return {
        id: team.id || team.team_id || `standing-${index}`,
        name: team.name || team.full_name || team.team_name || 'Unknown Team',
        abbreviation: team.abbreviation || team.alias || team.abbr || team.name?.slice(0, 3).toUpperCase() || '',
        logo: team.logo || team.logo_url || team.image || team.team_logo || '',
        position: team.position || team.rank || team.standing || index + 1,
        wins,
        losses,
        draws,
        points: team.points || team.pts || (selectedSport === 'soccer' ? (wins * 3 + draws) : 0),
        winPercentage,
        gamesBack: team.games_back || team.gb || 0,
        streak: team.streak || team.current_streak || team.form || '',
        lastTen: team.last_ten || team.recent_form || '',
        conference: team.conference || team.group || '',
        division: team.division || team.league || '',
        sport: team.sport || selectedSport,
        // Sport-specific fields
        goalsFor: team.goals_for || team.gf || team.scored || 0,
        goalsAgainst: team.goals_against || team.ga || team.conceded || 0,
        goalDifference: (team.goals_for || team.gf || 0) - (team.goals_against || team.ga || 0),
        played: team.played || team.games_played || totalGames
      }
    })
    .sort((a: StandingTeam, b: StandingTeam) => {
      // Dynamic sorting based on sport
      if (selectedSport === 'soccer' || selectedSport === 'hockey') {
        return (b.points || 0) - (a.points || 0) || a.position - b.position
      }
      return a.position - b.position || b.winPercentage - a.winPercentage
    }) : []

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Dynamic playoff positions based on sport
  const getPlayoffPositions = (sport: string) => {
    const playoffMap: Record<string, number> = {
      'basketball': 8,
      'hockey': 8,
      'football': 7,
      'baseball': 6,
      'soccer': 4 // Top 4 for Champions League
    }
    return playoffMap[sport] || 6
  }

  const playoffPositions = getPlayoffPositions(selectedSport)
  const sportDisplayName = selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)

  if (selectedSport === "all") {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Standings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a specific sport to view standings</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Standings - {sportDisplayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !standings || standings.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Standings - {sportDisplayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {error ? 'Failed to load standings' : `No standings data available for ${sportDisplayName}`}
            </p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4 hover:scale-105 transition-transform">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Standings - {sportDisplayName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {/* Dynamic Header based on sport */}
          <div className="flex items-center gap-3 p-3 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-background">
            <div className="w-8">#</div>
            <div className="w-8"></div>
            <div className="flex-1">Team</div>
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 text-center">
              <div>W</div>
              <div>L</div>
              {selectedSport === 'soccer' && <div className="hidden lg:block">D</div>}
              <div className="hidden lg:block">
                {selectedSport === 'soccer' || selectedSport === 'hockey' ? 'PTS' : 'PCT'}
              </div>
            </div>
            <div className="w-12">Form</div>
          </div>

          {/* Enhanced Standings */}
          {processedStandings.slice(0, 16).map((team: StandingTeam) => (
            <StandingsRow
              key={team.id}
              team={team}
              isPlayoffPosition={team.position <= playoffPositions}
              sportType={selectedSport}
            />
          ))}
        </div>

        {playoffPositions > 0 && (
          <div className="mt-4 p-3 bg-accent/5 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Medal className="h-4 w-4 text-accent" />
              <span>Top {playoffPositions} teams qualify for playoffs</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
