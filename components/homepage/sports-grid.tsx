"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRealTimeData } from "@/components/data/real-time-provider"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
import { Users, Calendar, ChevronRight, Activity } from "lucide-react"

interface SportData {
  sport: SupportedSport
  name: string
  icon: string
  liveGames: number
  totalGames: number
  teams: number
}

export function SportsGrid() {
  const { supportedSports, data } = useRealTimeData()

  // Calculate sport-specific data from real-time provider
  const sportsData = useMemo(() => {
    return supportedSports.map(sport => {
      const config = SportConfigManager.getSportConfig(sport)
      if (!config) return null

      const sportGames = data.games.filter(game => game.sport === sport)
      const liveGames = sportGames.filter(game => game.status === 'in_progress')
      const sportTeams = [...new Set([
        ...sportGames.map(g => g.home_team_id),
        ...sportGames.map(g => g.away_team_id)
      ])].filter(Boolean)

      return {
        sport,
        name: config.name,
        icon: config.icon,
        liveGames: liveGames.length,
        totalGames: sportGames.length,
        teams: sportTeams.length
      }
    }).filter(Boolean) as SportData[]
  }, [supportedSports, data.games])

  const totalLiveGames = sportsData.reduce((sum, sport) => sum + sport.liveGames, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Sports Coverage</h2>
        </div>
        <Badge variant="outline" className="gap-2">
          <Calendar className="h-3 w-3" />
          {totalLiveGames} Live
        </Badge>
      </div>

      {/* Sports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sportsData.map((sport) => (
          <Link key={sport.sport} href={`/games?sport=${sport.sport}`}>
            <Card className="card-modern hover:border-primary transition-all duration-200 group cursor-pointer">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Sport Icon and Name */}
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{sport.icon}</div>
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {sport.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sport.teams} teams
                      </p>
                    </div>
                  </div>

                  {/* Live Games Badge */}
                  {sport.liveGames > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="gap-1">
                        <div className="live-indicator" />
                        {sport.liveGames} Live
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Games Today</span>
                      <span className="font-medium">{sport.totalGames}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Teams</span>
                      <span className="font-medium">{sport.teams}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${
                          sport.liveGames > 0 ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs">
                          {sport.liveGames > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Indicator */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">View Games</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total Sports</div>
                <div className="text-lg font-bold">{sportsData.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent" />
              <div>
                <div className="text-sm text-muted-foreground">Live Games</div>
                <div className="text-lg font-bold">{totalLiveGames}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total Teams</div>
                <div className="text-lg font-bold">
                  {sportsData.reduce((sum, sport) => sum + sport.teams, 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {sportsData.length === 0 && (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sports Available</h3>
            <p className="text-muted-foreground">
              Sports data will appear here once configured
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
