"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Star,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { cachedUnifiedApiClient, SupportedSport, UnifiedGameData, UnifiedTeamData } from "@/lib/services/api/cached-unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

type GameData = UnifiedGameData
type TeamData = UnifiedTeamData
import { SportSelector, SportSelectorCompact } from "@/components/shared/sport-selector"
import { GamesList } from "@/components/sports/games-list"
import { TeamsList } from "@/components/sports/teams-list"
import { NoSportSelected } from "@/components/shared/no-sport-selected"

interface CleanDashboardProps {
  className?: string
}

export function CleanDashboard({ className = "" }: CleanDashboardProps) {
  const [selectedSupportedSport, setSelectedSupportedSport] = useState<SupportedSport>("basketball")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [allLiveGames, setAllLiveGames] = useState<GameData[]>([])
  const [allUpcomingGames, setAllUpcomingGames] = useState<GameData[]>([])
  const [allTeams, setAllTeams] = useState<TeamData[]>([])
  const [serviceHealth, setServiceHealth] = useState<Record<SupportedSport, boolean>>({} as Record<SupportedSport, boolean>)
  const [stats, setStats] = useState({
    totalGames: 0,
    liveGames: 0,
    totalTeams: 0,
    totalSupportedSports: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadAllLiveGames(),
        loadAllUpcomingGames(),
        loadAllTeams(),
        loadServiceHealth(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllLiveGames = async () => {
    try {
      const supportedSports = cachedUnifiedApiClient.getSupportedSports()
      const allGames: GameData[] = []
      
      for (const sport of supportedSports) {
        try {
          const games = await cachedUnifiedApiClient.getLiveGames(sport)
          allGames.push(...games)
        } catch (sportError) {
          console.warn(`Failed to load live games for ${sport}:`, sportError)
          // Continue with other sports even if one fails
        }
      }
      
      setAllLiveGames(allGames)
    } catch (error) {
      console.error('Error loading live games:', error)
      setAllLiveGames([]) // Set empty array on complete failure
    }
  }

  const loadAllUpcomingGames = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const supportedSports = cachedUnifiedApiClient.getSupportedSports()
      const allGames: GameData[] = []
      
      for (const sport of supportedSports) {
        try {
          const games = await cachedUnifiedApiClient.getGames(sport, {
            date: today,
            status: 'scheduled',
            limit: 20
          })
          allGames.push(...games)
        } catch (sportError) {
          console.warn(`Failed to load upcoming games for ${sport}:`, sportError)
          // Continue with other sports even if one fails
        }
      }
      
      setAllUpcomingGames(allGames)
    } catch (error) {
      console.error('Error loading upcoming games:', error)
      setAllUpcomingGames([]) // Set empty array on complete failure
    }
  }

  const loadAllTeams = async () => {
    try {
      const supportedSports = cachedUnifiedApiClient.getSupportedSports()
      const allTeams: TeamData[] = []
      
      for (const sport of supportedSports) {
        try {
          const teams = await cachedUnifiedApiClient.getTeams(sport, { limit: 50 })
          allTeams.push(...teams)
        } catch (sportError) {
          console.warn(`Failed to load teams for ${sport}:`, sportError)
          // Continue with other sports even if one fails
        }
      }
      
      setAllTeams(allTeams)
    } catch (error) {
      console.error('Error loading teams:', error)
      setAllTeams([]) // Set empty array on complete failure
    }
  }

  const loadServiceHealth = async () => {
    try {
      const health = await cachedUnifiedApiClient.getHealthStatus()
      setServiceHealth(health)
    } catch (error) {
      console.error('Error loading service health:', error)
    }
  }

  const loadStats = async () => {
    try {
      const supportedSports = cachedUnifiedApiClient.getSupportedSports()
      let totalGames = 0
      let liveGames = 0
      let totalTeams = 0
      
      for (const sport of supportedSports) {
        const games = await cachedUnifiedApiClient.getGames(sport, { limit: 100 })
        const live = await cachedUnifiedApiClient.getLiveGames(sport)
        const teams = await cachedUnifiedApiClient.getTeams(sport, { limit: 100 })
        
        totalGames += games.length
        liveGames += live.length
        totalTeams += teams.length
      }
      
      setStats({
        totalGames,
        liveGames,
        totalTeams,
        totalSupportedSports: supportedSports.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const currentSupportedSportConfig = SportConfigManager.getSportConfig(selectedSupportedSport)
  const isServiceHealthy = serviceHealth[selectedSupportedSport] ?? false

  if (loading) {
    return <DashboardSkeleton />
  }

  // Show no sport selected state if no sport is available
  if (!selectedSupportedSport || !serviceHealth[selectedSupportedSport]) {
    return (
      <div className={className}>
        <NoSportSelected 
          onSportSelect={setSelectedSupportedSport}
          title="Welcome to ApexBets"
          description="Select a sport to view live data, games, and analytics"
        />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              ApexBets Dashboard
            </h1>
            <p className="text-muted-foreground">
              Multi-sport analytics and predictions
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant={isServiceHealthy ? "default" : "destructive"}>
              {isServiceHealthy ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Healthy</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Issues</>
              )}
            </Badge>
          </div>
        </div>

        {/* SupportedSport Selector */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <SportSelector
              selectedSport={selectedSupportedSport}
              onSportChange={setSelectedSupportedSport}
            />
          </div>
          <div className="sm:hidden">
            <SportSelectorCompact
              selectedSport={selectedSupportedSport}
              onSportChange={setSelectedSupportedSport}
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              Across all sports
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Games</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.liveGames}</div>
            <p className="text-xs text-muted-foreground">
              Currently playing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Across all leagues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SupportedSports</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSupportedSports}</div>
            <p className="text-xs text-muted-foreground">
              Supported sports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="all-sports">All SupportedSports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Live Games Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Live Games
                </CardTitle>
                <CardDescription>
                  Currently playing across all sports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allLiveGames.length > 0 ? (
                    allLiveGames.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {SportConfigManager.getSportConfig(game.sport)?.icon}
                          </span>
                          <div>
                            <div className="font-medium text-sm">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {game.league} • {game.time}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {game.homeScore} - {game.awayScore}
                          </div>
                          <Badge className="bg-green-500 text-xs">
                            LIVE
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No live games at the moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Games Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>
                  Today's scheduled games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allUpcomingGames.length > 0 ? (
                    allUpcomingGames.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {SportConfigManager.getSportConfig(game.sport)?.icon}
                          </span>
                          <div>
                            <div className="font-medium text-sm">
                              {game.homeTeam} vs {game.awayTeam}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {game.league} • {game.time}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {game.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming games today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4">
          <GamesList sport={selectedSupportedSport} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TeamsList sport={selectedSupportedSport} />
        </TabsContent>

        <TabsContent value="all-sports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cachedUnifiedApiClient.getSupportedSports().map((sport: SupportedSport) => {
              const config = SportConfigManager.getSportConfig(sport)
              const isHealthy = serviceHealth[sport] ?? false
              
              return (
                <Card key={sport} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSupportedSport(sport)}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg bg-muted/50 ${selectedSupportedSport === sport ? 'bg-primary/10' : ''}`}>
                        <span className={`text-2xl ${config?.color}`}>{config?.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg">{config?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {config?.leagues.length} leagues
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {isHealthy ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {isHealthy ? 'Healthy' : 'Issues'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
