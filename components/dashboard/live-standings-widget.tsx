"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Medal,
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
  isPlayoffPosition: boolean
}

function StandingsRow({ team, isPlayoffPosition }: StandingsRowProps) {
  const getStreakIcon = (streak: string) => {
    if (streak.startsWith('W')) return <TrendingUp className="h-3 w-3 text-accent" />
    if (streak.startsWith('L')) return <TrendingDown className="h-3 w-3 text-destructive" />
    return null
  }

  const getStreakColor = (streak: string) => {
    if (streak.startsWith('W')) return 'text-accent'
    if (streak.startsWith('L')) return 'text-destructive'
    return 'text-muted-foreground'
  }

  return (
    <div className={`flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${isPlayoffPosition ? 'bg-accent/5' : ''}`}>
      <div className="w-8 flex items-center justify-center">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-primary">#{team.position}</span>
          {isPlayoffPosition && <Medal className="h-3 w-3 text-accent" />}
        </div>
      </div>
      
      <div className="w-8 flex justify-center">
        <Avatar className="h-6 w-6">
          <AvatarImage src={team.logo} alt={team.name} />
          <AvatarFallback className="text-xs">
            {team.abbreviation || team.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{team.name}</div>
        {team.conference && (
          <div className="text-xs text-muted-foreground">{team.conference}</div>
        )}
      </div>
      
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 text-center text-xs">
        <div className="font-semibold text-accent">{team.wins}</div>
        <div className="font-semibold text-destructive">{team.losses}</div>
        {team.draws !== undefined && <div className="hidden lg:block font-semibold">{team.draws}</div>}
        <div className="hidden lg:block font-semibold">
          {team.points !== undefined ? team.points : `${team.winPercentage.toFixed(1)}%`}
        </div>
      </div>
      
      <div className="w-12 flex justify-center">
        {team.streak && (
          <div className={`flex items-center gap-1 ${getStreakColor(team.streak)}`}>
            {getStreakIcon(team.streak)}
            <span className="text-xs font-medium">{team.streak}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function LiveStandingsWidget() {
  const { selectedSport } = useRealTimeData()
  const [conference, setConference] = useState<"all" | "eastern" | "western" | "american" | "national">("all")
  const [refreshing, setRefreshing] = useState(false)

  // Use database-first API client for standings
  const { data: standings, loading, error, refetch } = useApiData(
    useCallback(async () => {
      const { databaseFirstApiClient } = await import('@/lib/api-client-database-first')
      const params: { sport?: string; league?: string } = {}
      if (selectedSport && selectedSport !== 'all') {
        params.sport = selectedSport
      }
      if (conference !== "all") {
        params.league = conference
      }
      return databaseFirstApiClient.getStandings(params)
    }, [selectedSport, conference]),
    {
      enabled: true,
      refetchInterval: 600000 // Refresh every 10 minutes
    }
  )

  // Enhanced dynamic standings data transformation with memoization
  const processedStandings = useMemo(() => {
    if (!standings) return []
    
    return standings
      .filter((team: any) => team && (team.team_name || team.name || team.full_name))
      .filter((team: any) => !selectedSport || team.sport === selectedSport)
      .map((team: any, index: number) => {
        // Handle different data structures from API
        const teamName = team.team_name || team.name || team.full_name || team.team?.name
        const wins = team.wins || team.record?.wins || team.w || 0
        const losses = team.losses || team.record?.losses || team.l || 0
        const draws = team.ties || team.draws || team.record?.draws || team.d || 0
        const totalGames = wins + losses + draws
        
        // Calculate win percentage - handle both decimal and percentage formats
        let winPercentage = 0
        if (team.win_percentage !== undefined && team.win_percentage !== null) {
          // If it's already a percentage (0-1), convert to 0-100
          winPercentage = typeof team.win_percentage === 'string' 
            ? parseFloat(team.win_percentage) * 100
            : team.win_percentage * 100
        } else if (totalGames > 0) {
          // Calculate from wins/losses
          winPercentage = (wins / (wins + losses)) * 100
        }

        return {
          id: team.id || team.team_id || `standing-${index}`,
          name: teamName || 'Unknown Team',
          abbreviation: team.abbreviation || team.alias || team.abbr || teamName?.slice(0, 3).toUpperCase() || '',
          logo: team.logo_url || team.logo || team.image || team.team_logo || '',
          position: team.position || team.rank || team.standing || index + 1,
          wins,
          losses,
          draws,
          points: team.points || team.pts || 0,
          winPercentage,
          gamesBack: team.games_back || team.gb || 0,
          streak: team.streak || team.current_streak || team.win_streak || '',
          lastTen: team.last_ten || team.last10 || '',
          conference: team.conference || team.league || '',
          division: team.division || team.league || '',
          sport: team.sport || selectedSport || 'basketball',
          // Sport-specific fields
          goalsFor: team.goals_for || team.gf || team.scored || 0,
          goalsAgainst: team.goals_against || team.ga || team.conceded || 0,
          goalDifference: (team.goals_for || team.gf || 0) - (team.goals_against || team.ga || 0),
          played: team.played || team.games_played || totalGames
        }
      })
      .sort((a: StandingTeam, b: StandingTeam) => {
        // Dynamic sorting based on available data
        // If both teams have points, sort by points (points-based sports)
        if (a.points !== undefined && b.points !== undefined) {
          return (b.points || 0) - (a.points || 0) || a.position - b.position
        }
        // Otherwise sort by position and win percentage
        return a.position - b.position || b.winPercentage - a.winPercentage
      })
  }, [standings, selectedSport])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setTimeout(() => setRefreshing(false), 1000)
  }

  // Dynamic playoff positions based on sport - memoized
  const playoffPositions = useMemo(() => {
    // Get playoff positions from team data or use default
    if (processedStandings.length > 0) {
      // Look for playoff cutoff in the data
      const playoffCutoff = processedStandings.find(team => team.position > 8)
      if (playoffCutoff) {
        return playoffCutoff.position - 1
      }
    }
    // Default fallback - can be configured via environment or database
    return 8
  }, [processedStandings])

  const sportDisplayName = useMemo(() => {
    return selectedSport ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : "All Sports"
  }, [selectedSport])

  // Check if we're in off-season or have insufficient data
  const isOffSeason = useMemo(() => {
    if (!processedStandings.length) return true
    
    // Check if all teams have very few games (likely off-season or early season)
    const totalGames = processedStandings.reduce((sum, team) => sum + team.wins + team.losses + team.draws, 0)
    const avgGamesPerTeam = totalGames / processedStandings.length
    
    // If average games per team is less than 10, consider it off-season or early season
    return avgGamesPerTeam < 10
  }, [processedStandings])

  // Check if we have valid standings data
  const hasValidData = useMemo(() => {
    return processedStandings.length > 0 && processedStandings.some(team => 
      team.wins > 0 || team.losses > 0 || team.draws > 0
    )
  }, [processedStandings])

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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
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
            {processedStandings.length > 0 && processedStandings.some(team => team.conference) && (
              <select
                value={conference}
                onChange={(e) => setConference(e.target.value as any)}
                className="text-xs border rounded px-2 py-1 bg-background"
              >
                <option value="all">All</option>
                <option value="eastern">Eastern</option>
                <option value="western">Western</option>
                <option value="american">American</option>
                <option value="national">National</option>
              </select>
            )}
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
        {/* Off-season or insufficient data display */}
        {!hasValidData || isOffSeason ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isOffSeason ? 'Early Season / Off-Season' : 'No Standings Available'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isOffSeason 
                    ? 'Standings will be available once teams have played more games. Check back soon for updated league standings.'
                    : 'Standings data is not currently available. This may be due to off-season or data synchronization issues.'
                  }
                </p>
                {isOffSeason && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Standings become more meaningful after teams have played 10+ games
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {/* Dynamic Header based on sport */}
            <div className="flex items-center gap-3 p-3 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-background">
              <div className="w-8">#</div>
              <div className="w-8"></div>
              <div className="flex-1">Team</div>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 text-center">
                <div>W</div>
                <div>L</div>
                {processedStandings.length > 0 && processedStandings.some(team => team.draws !== undefined) && <div className="hidden lg:block">D</div>}
                <div className="hidden lg:block">
                  {processedStandings.length > 0 && processedStandings.some(team => team.points !== undefined) ? 'PTS' : 'PCT'}
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
              />
            ))}
          </div>
        )}

        {hasValidData && !isOffSeason && playoffPositions > 0 && (
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