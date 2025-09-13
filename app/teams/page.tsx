"use client"

import { Suspense, useEffect, useState } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, Search, Filter, Trophy, TrendingUp, Target } from "lucide-react"
import { TeamLogo } from "@/components/ui/sports-image"
import { simpleApiClient as apiClient } from "@/lib/api-client-simple"
import { TeamsList } from "@/components/sports/teams-list"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export default function TeamsPage() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])

  useEffect(() => {
    loadSupportedSports()
  }, [])

  const loadSupportedSports = () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    // Don't set default sport - let user choose
  }

  // Show no sport selected state
  if (!selectedSport) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Teams & Rosters
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a sport to explore team statistics, player rosters, and performance analytics
            </p>
            <div className="mt-8">
              <select 
                value={selectedSport || ""} 
                onChange={(e) => setSelectedSport(e.target.value as SupportedSport || null)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="">Select a Sport</option>
                {supportedSports.map((sport) => {
                  const config = SportConfigManager.getSportConfig(sport)
                  return (
                    <option key={sport} value={sport}>
                      {config?.name || sport}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Teams & Rosters
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore team statistics, player rosters, and performance analytics across all leagues
          </p>
          
          {/* Sport Selector */}
          <div className="mt-4">
            <Select value={selectedSport} onValueChange={(value) => setSelectedSport(value as SupportedSport)}>
              <SelectTrigger className="w-48 mx-auto">
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                {supportedSports.map((sport) => {
                  const config = SportConfigManager.getSportConfig(sport)
                  return (
                    <SelectItem key={sport} value={sport}>
                      <span className="flex items-center gap-2">
                        <span>{config?.icon}</span>
                        {config?.name}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Team Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search teams..." 
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select League" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const sportConfig = SportConfigManager.getSportConfig(selectedSport)
                    return sportConfig?.leagues.map((league: any) => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    )) || []
                  })()}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wins">Wins</SelectItem>
                  <SelectItem value="winrate">Win Rate</SelectItem>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Advanced Stats
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview" className="gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="standings" className="gap-2">
              <Trophy className="h-4 w-4" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Target className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<TeamsOverviewSkeleton />}>
              <TeamsOverviewSection selectedSport={selectedSport} />
            </Suspense>
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            <Suspense fallback={<StandingsSkeleton />}>
              <StandingsSection selectedSport={selectedSport} />
            </Suspense>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsSection selectedSport={selectedSport} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Teams Overview Section
function TeamsOverviewSection({ selectedSport }: { selectedSport: SupportedSport | null }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Overview</h2>
      </div>
      {selectedSport && <TeamsList sport={selectedSport} />}
    </div>
  )
}

// Standings Section
function StandingsSection({ selectedSport }: { selectedSport: SupportedSport }) {
  const [standings, setStandings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStandings()
  }, [selectedSport, fetchStandings])

  async function fetchStandings() {
    if (!selectedSport) return
    try {
      setLoading(true)
      const standingsData = await apiClient.getStandings({
        sport: selectedSport
      })
      setStandings(standingsData)
    } catch (error) {
      console.error("Error fetching standings:", error)
      setStandings([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <StandingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Conference Standings</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Eastern</Button>
          <Button variant="default" size="sm">Western</Button>
        </div>
      </div>

      {standings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Standings Available</h3>
            <p className="text-muted-foreground">Standings data will be available soon</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
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
                          <TeamLogo teamName={team.team} alt={team.team.split(' ')[0]} width={32} height={32} className="rounded-full" />
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
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

// Stats Section
function StatsSection({ selectedSport }: { selectedSport: SupportedSport }) {
  const [teamStats, setTeamStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamStats()
  }, [selectedSport, fetchTeamStats])

  async function fetchTeamStats() {
    if (!selectedSport) return
    try {
      setLoading(true)
      const statsData = await apiClient.getTeamStats({
        sport: selectedSport
      })
      setTeamStats(statsData)
    } catch (error) {
      console.error("Error fetching team stats:", error)
      setTeamStats([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <StatsSkeleton />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Statistics</h2>

      {teamStats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Statistics Available</h3>
            <p className="text-muted-foreground">Team statistics will be available soon</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {teamStats.map((team) => (
            <Card key={team.teamId} className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TeamLogo teamName={team.teamName} alt={team.teamAbbreviation} width={32} height={32} className="rounded-full" />
                  {team.teamName} ({team.teamAbbreviation})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {team.sport} • {team.league} • {team.gamesPlayed} games played
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {team.stats.map((stat: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{stat.category}</h4>
                        <Badge variant="secondary" className="text-xs">#{stat.rank}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">{stat.value}</span>
                          <div className={`flex items-center gap-1 text-xs ${
                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            <TrendingUp className={`h-3 w-3 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                            {stat.trend === "up" ? "↗" : "↘"}
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          League Rank: #{stat.rank}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Loading Skeletons
function TeamsOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-center space-y-1">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-10 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
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

function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
