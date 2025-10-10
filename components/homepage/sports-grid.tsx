"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { databaseFirstApiClient } from "@/lib/api-client-database-first"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
import { ChevronRight, Calendar, Users } from "lucide-react"

interface SportData {
  sport: SupportedSport
  name: string
  icon: string
  liveGames: number
  totalGames: number
  teams: number
}

export function SportsGrid() {
  const [sportsData, setSportsData] = useState<SportData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSportsData()
  }, [])

  const loadSportsData = async () => {
    try {
      setLoading(true)
      const supportedSports = SportConfigManager.getSupportedSports()
      
      const sportsPromises = supportedSports.map(async (sport) => {
        const config = SportConfigManager.getSportConfig(sport)
        if (!config) return null

        try {
          const [liveGames, totalGames, teams] = await Promise.all([
            databaseFirstApiClient.getGames({ sport, status: 'in_progress' }),
            databaseFirstApiClient.getGames({ sport, limit: 10 }),
            databaseFirstApiClient.getTeams({ sport })
          ])

          return {
            sport,
            name: config.name,
            icon: config.icon,
            liveGames: liveGames.length,
            totalGames: totalGames.length,
            teams: teams.length
          }
        } catch (error) {
          console.error(`Error loading data for ${sport}:`, error)
          return {
            sport,
            name: config.name,
            icon: config.icon,
            liveGames: 0,
            totalGames: 0,
            teams: 0
          }
        }
      })

      const results = await Promise.all(sportsPromises)
      setSportsData(results.filter(Boolean) as SportData[])
    } catch (error) {
      console.error('Error loading sports data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Sports Coverage</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-3 w-12 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

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
          {sportsData.reduce((sum, sport) => sum + sport.liveGames, 0)} Live
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
