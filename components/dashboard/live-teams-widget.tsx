"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  BarChart3
} from "lucide-react"
import { useRealTimeData } from "@/components/data/real-time-provider"

interface Team {
  id: string
  name: string
  city: string
  abbreviation: string
  logo?: string
  wins: number
  losses: number
  winPercentage: number
  streak: string
  sport: string
}

interface TeamCardProps {
  team: Team
  rank: number
}

function TeamCard({ team, rank }: TeamCardProps) {
  const winPercentage = team.winPercentage || (team.wins / (team.wins + team.losses)) * 100

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              #{rank}
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={team.logo} alt={team.name} />
              <AvatarFallback className="text-xs">
                {team.abbreviation || team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <Badge variant="outline" className="text-xs">
            {team.sport}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm">{team.name}</h3>
          <p className="text-xs text-muted-foreground">{team.city}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold text-accent">{team.wins}</div>
            <div className="text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-destructive">{team.losses}</div>
            <div className="text-muted-foreground">Losses</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{winPercentage.toFixed(1)}%</div>
            <div className="text-muted-foreground">Win %</div>
          </div>
        </div>

        {team.streak && (
          <div className="flex items-center justify-center gap-1 text-xs">
            {team.streak.startsWith('W') ? (
              <TrendingUp className="h-3 w-3 text-accent" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            <span className="font-medium">{team.streak}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function LiveTeamsWidget() {
  const { data, selectedSport, refreshData } = useRealTimeData()
  const { games, loading, error } = data
  const [viewMode, setViewMode] = useState<"standings" | "performance">("standings")

  const teams = useMemo(() => {
    if (!games) return []
    const allTeams = games.reduce((acc, game) => {
      if (game.home_team) acc.set(game.home_team.id, game.home_team)
      if (game.away_team) acc.set(game.away_team.id, game.away_team)
      return acc
    }, new Map<string, any>())

    return Array.from(allTeams.values())
  }, [games])

  // Enhanced team data processing - fully dynamic with useMemo
  const processedTeams = useMemo(() => {
    if (!teams) return []
    
    return teams
      .filter((team: any) => team && (team.name || team.full_name || team.team_name))
      .filter((team: any) => !selectedSport || team.sport === selectedSport)
      .map((team: any, index: number) => {
        // Handle different data structures from API
        const teamName = team.name || team.full_name || team.team_name
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
          id: team.id || team.team_id || `team-${index}`,
          name: teamName || 'Unknown Team',
          city: team.city || team.market || team.location || '',
          abbreviation: team.abbreviation || team.alias || team.abbr || teamName?.slice(0, 3).toUpperCase() || '',
          logo: team.logo_url || team.logo || team.image || team.team_logo || '',
          wins,
          losses,
          draws,
          winPercentage,
          streak: team.streak || team.current_streak || team.win_streak || '',
          sport: (team.sport || selectedSport) ?? null,
          // Additional dynamic fields
          points: team.points || team.pts || 0,
          goalsFor: team.goals_for || team.gf || 0,
          goalsAgainst: team.goals_against || team.ga || 0
        }
      })
      .sort((a: Team, b: Team) => {
        if (viewMode === "standings") {
          return b.winPercentage - a.winPercentage
        } else {
          return b.wins - a.wins
        }
      })
      .slice(0, 12) // Show more teams for better space utilization
  }, [teams, selectedSport, viewMode])

  // Check if we're in off-season or have insufficient data
  const isOffSeason = useMemo(() => {
    if (!processedTeams.length) return true
    
    // Check if all teams have very few games (likely off-season or early season)
    const totalGames = processedTeams.reduce((sum, team) => sum + team.wins + team.losses + team.draws, 0)
    const avgGamesPerTeam = totalGames / processedTeams.length
    
    // If average games per team is less than 10, consider it off-season or early season
    return avgGamesPerTeam < 10
  }, [processedTeams])

  // Check if we have valid team data
  const hasValidData = useMemo(() => {
    return processedTeams.length > 0 && processedTeams.some(team => 
      team.wins > 0 || team.losses > 0 || team.draws > 0
    )
  }, [processedTeams])

  const sportDisplayName = selectedSport ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : "All Sports"

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !teams || teams.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {error ? 'Failed to load teams data' : `No teams data available${selectedSport ? ` for ${selectedSport}` : ''}`}
            </p>
            <Button onClick={refreshData} variant="outline" size="sm" className="mt-4 hover:scale-105 transition-transform">
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
            <Users className="h-5 w-5 text-primary" />
            Teams - {sportDisplayName}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("standings")}
              variant={viewMode === "standings" ? "default" : "outline"}
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              <Trophy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Standings</span>
              <span className="sm:hidden">Rank</span>
            </Button>
            <Button
              onClick={() => setViewMode("performance")}
              variant={viewMode === "performance" ? "default" : "outline"}
              size="sm"
              className="hover:scale-105 transition-transform"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Perf</span>
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
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isOffSeason ? 'Early Season / Off-Season' : 'No Team Data Available'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isOffSeason 
                    ? 'Team statistics will be available once teams have played more games. Check back soon for updated team performance data.'
                    : 'Team data is not currently available. This may be due to off-season or data synchronization issues.'
                  }
                </p>
                {isOffSeason && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Team statistics become more meaningful after teams have played 10+ games
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Optimized Grid Layout for Better Space Utilization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {processedTeams.map((team: Team, index: number) => (
                <TeamCard key={team.id} team={team} rank={index + 1} />
              ))}
            </div>
          </>
        )}

        {processedTeams.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No teams found for {sportDisplayName}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
