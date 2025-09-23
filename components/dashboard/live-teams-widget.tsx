"use client"

import { useState } from "react"
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
import { useTeams } from "@/hooks/use-api-data"
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
  const { selectedSport } = useRealTimeData()
  const { data: teams, loading, error, refetch } = useTeams(selectedSport)
  const [viewMode, setViewMode] = useState<"standings" | "performance">("standings")

  // Enhanced team data processing - fully dynamic
  const processedTeams = teams ? teams
    .filter((team: any) => team && (team.name || team.full_name))
    .filter((team: any) => !selectedSport || team.sport === selectedSport)
    .map((team: any, index: number) => {
      // Calculate win percentage dynamically
      const wins = team.wins || team.record?.wins || team.w || 0
      const losses = team.losses || team.record?.losses || team.l || 0
      const totalGames = wins + losses
      const winPercentage = totalGames > 0 ? (wins / totalGames) * 100 : 0

      return {
        id: team.id || team.team_id || `team-${index}`,
        name: (team.name || team.full_name || team.team_name) ?? null,
        city: team.city || team.market || team.location || '',
        abbreviation: team.abbreviation || team.alias || team.abbr || team.name?.slice(0, 3).toUpperCase() || '',
        logo: team.logo || team.logo_url || team.image || team.team_logo || '',
        wins,
        losses,
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
    .slice(0, 12) : [] // Show more teams for better space utilization

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
            <Button onClick={refetch} variant="outline" size="sm" className="mt-4 hover:scale-105 transition-transform">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sportDisplayName = selectedSport ? selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1) : "All Sports"

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
        {/* Optimized Grid Layout for Better Space Utilization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {processedTeams.map((team: Team, index: number) => (
            <TeamCard key={team.id} team={team} rank={index + 1} />
          ))}
        </div>

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
