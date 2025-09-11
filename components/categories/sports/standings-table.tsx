"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  TrendingUp, 
  RefreshCw,
  Users
} from "lucide-react"
import { unifiedApiClient, SupportedSport } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { SportsImage } from "@/components/ui/sports-image"

interface StandingsTableProps {
  sport: SupportedSport
  className?: string
}

interface StandingsData {
  rank: number
  team: string
  wins: number
  losses: number
  ties?: number
  winRate: number
  gamesBehind: number
  conference?: string
  division?: string
}

export default function StandingsTable({ sport, className = "" }: StandingsTableProps) {
  const [standings, setStandings] = useState<StandingsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConference, setSelectedConference] = useState<string>("all")

  useEffect(() => {
    loadStandings()
  }, [sport, selectedConference])

  const loadStandings = async () => {
    try {
      setLoading(true)
      const standingsData = await unifiedApiClient.getStandings(sport)
      
      // Filter by conference if specified
      let filteredStandings = standingsData
      if (selectedConference !== "all") {
        filteredStandings = standingsData.filter(team => 
          team.conference === selectedConference
        )
      }
      
      setStandings(filteredStandings)
    } catch (error) {
      console.error('Error loading standings:', error)
    } finally {
      setLoading(false)
    }
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <StandingsSkeleton />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className={sportConfig?.color}>{sportConfig?.icon}</span>
            {sportConfig?.name} Standings
          </h2>
          <p className="text-muted-foreground">
            Current {sportConfig?.name.toLowerCase()} league standings
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStandings}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Conference Filter */}
      {standings.some(team => team.conference) && (
        <div className="flex gap-2">
          <Button
            variant={selectedConference === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedConference("all")}
          >
            All
          </Button>
          {Array.from(new Set(standings.map(team => team.conference).filter(Boolean))).map((conference) => (
            <Button
              key={conference}
              variant={selectedConference === conference ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedConference(conference!)}
            >
              {conference}
            </Button>
          ))}
        </div>
      )}

      {/* Standings Table */}
      <Card>
        <CardContent className="p-0">
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Rank</th>
                    <th className="p-4 font-medium">Team</th>
                    <th className="p-4 font-medium text-center">W</th>
                    <th className="p-4 font-medium text-center">L</th>
                    {standings[0]?.ties !== undefined && (
                      <th className="p-4 font-medium text-center">T</th>
                    )}
                    <th className="p-4 font-medium text-center">Win%</th>
                    <th className="p-4 font-medium text-center">GB</th>
                    {standings[0]?.conference && (
                      <th className="p-4 font-medium text-center">Conf</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr key={team.rank} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">#{team.rank}</span>
                          {team.rank <= 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <SportsImage
                            type="team"
                            league={sportConfig?.leagues[0] || sport}
                            teamName={team.team}
                            className="h-8 w-8 rounded-full"
                          />
                          <span className="font-medium">{team.team}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-primary">{team.wins}</td>
                      <td className="p-4 text-center">{team.losses}</td>
                      {team.ties !== undefined && (
                        <td className="p-4 text-center">{team.ties}</td>
                      )}
                      <td className="p-4 text-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.round(team.winRate * 100)}%</span>
                          <Progress value={team.winRate * 100} className="w-16 h-2" />
                        </div>
                      </td>
                      <td className="p-4 text-center text-muted-foreground">
                        {team.gamesBehind === 0 ? "-" : `${team.gamesBehind}`}
                      </td>
                      {team.conference && (
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="text-xs">
                            {team.conference}
                          </Badge>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Standings Available</h3>
              <p className="text-sm">Standings data will be available soon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="h-10 w-64 bg-muted rounded animate-pulse" />
      
      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
