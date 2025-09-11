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
  AlertCircle,
  CheckCircle,
  RefreshCw
} from "lucide-react"
import { enhancedApiClient } from "@/lib/api-client-enhanced"
import { EnhancedSportSelector, EnhancedLeagueSelector } from "@/components/navigation/enhanced-sport-selector"
import { SportsImage } from "@/components/ui/sports-image"
import type { Game, Team, Player } from "@/lib/api-client-enhanced"

interface EnhancedDashboardOverviewProps {
  className?: string
}

const sportIcons = {
  basketball: "🏀",
  football: "🏈",
  baseball: "⚾",
  hockey: "🏒",
  soccer: "⚽",
  tennis: "🎾",
  golf: "⛳"
}

const sportColors = {
  basketball: "text-orange-500",
  football: "text-green-500",
  baseball: "text-blue-500",
  hockey: "text-red-500",
  soccer: "text-emerald-500",
  tennis: "text-yellow-500",
  golf: "text-teal-500"
}

export function EnhancedDashboardOverview({ className = "" }: EnhancedDashboardOverviewProps) {
  const [selectedSport, setSelectedSport] = useState("basketball")
  const [selectedLeague, setSelectedLeague] = useState("NBA")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [serviceHealth, setServiceHealth] = useState<Record<string, boolean>>({})
  const [stats, setStats] = useState({
    totalGames: 0,
    liveGames: 0,
    totalTeams: 0,
    totalPlayers: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [selectedSport, selectedLeague])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadLiveGames(),
        loadUpcomingGames(),
        loadRecentGames(),
        loadTeams(),
        loadPlayers(),
        loadServiceHealth(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLiveGames = async () => {
    try {
      const games = await enhancedApiClient.getLiveGames(selectedSport)
      setLiveGames(games)
    } catch (error) {
      console.error('Error loading live games:', error)
    }
  }

  const loadUpcomingGames = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const games = await enhancedApiClient.getGames({
        sport: selectedSport,
        league: selectedLeague,
        date: today,
        status: 'scheduled',
        limit: 10
      })
      setUpcomingGames(games)
    } catch (error) {
      console.error('Error loading upcoming games:', error)
    }
  }

  const loadRecentGames = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const games = await enhancedApiClient.getGames({
        sport: selectedSport,
        league: selectedLeague,
        date: today,
        status: 'finished',
        limit: 5
      })
      setRecentGames(games)
    } catch (error) {
      console.error('Error loading recent games:', error)
    }
  }

  const loadTeams = async () => {
    try {
      const teamsData = await enhancedApiClient.getTeams({
        sport: selectedSport,
        league: selectedLeague,
        limit: 20
      })
      setTeams(teamsData)
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const loadPlayers = async () => {
    try {
      const playersData = await enhancedApiClient.getPlayers({
        sport: selectedSport,
        limit: 10
      })
      setPlayers(playersData)
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const loadServiceHealth = async () => {
    try {
      const health = await enhancedApiClient.getServiceHealth()
      setServiceHealth(health)
    } catch (error) {
      console.error('Error loading service health:', error)
    }
  }

  const loadStats = async () => {
    try {
      const allGames = await enhancedApiClient.getGames({ sport: selectedSport })
      const liveGames = await enhancedApiClient.getLiveGames(selectedSport)
      const allTeams = await enhancedApiClient.getTeams({ sport: selectedSport })
      const allPlayers = await enhancedApiClient.getPlayers({ sport: selectedSport })
      
      setStats({
        totalGames: allGames.length,
        liveGames: liveGames.length,
        totalTeams: allTeams.length,
        totalPlayers: allPlayers.length
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

  const currentSportConfig = enhancedApiClient.getSportConfig(selectedSport)
  const isServiceHealthy = serviceHealth[selectedSport] ?? false

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {currentSportConfig?.displayName} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Real-time sports data and analytics
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

        {/* Sport and League Selectors */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <EnhancedSportSelector
              selectedSport={selectedSport}
              onSportChange={setSelectedSport}
            />
          </div>
          <div className="flex-1">
            <EnhancedLeagueSelector
              sport={selectedSport}
              selectedLeague={selectedLeague}
              onLeagueChange={setSelectedLeague}
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
              {selectedSport} games tracked
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
              {selectedLeague} teams
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Active players
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live">Live Games</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Upcoming Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Games
                </CardTitle>
                <CardDescription>
                  Today's scheduled {selectedSport} games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingGames.length > 0 ? (
                    upcomingGames.slice(0, 5).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <SportsImage
                            type="team"
                            league={game.league || selectedLeague}
                            teamName={game.home_team?.name || game.homeTeam}
                            className="h-8 w-8"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {game.home_team?.name || game.homeTeam} vs {game.away_team?.name || game.awayTeam}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {game.time} • {game.venue}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {game.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No upcoming games today
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Games */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Results
                </CardTitle>
                <CardDescription>
                  Latest {selectedSport} game results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentGames.length > 0 ? (
                    recentGames.map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <SportsImage
                            type="team"
                            league={game.league || selectedLeague}
                            teamName={game.home_team?.name || game.homeTeam}
                            className="h-8 w-8"
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {game.home_team?.name || game.homeTeam} vs {game.away_team?.name || game.awayTeam}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {game.date} • {game.venue}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {game.homeScore} - {game.awayScore}
                          </div>
                          <Badge variant="secondary">
                            Final
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No recent games
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Live Games
              </CardTitle>
              <CardDescription>
                Currently playing {selectedSport} games
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveGames.length > 0 ? (
                <div className="space-y-4">
                  {liveGames.map((game) => (
                    <div key={game.id} className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <SportsImage
                            type="team"
                            league={game.league || selectedLeague}
                            teamName={game.home_team?.name || game.homeTeam}
                            className="h-10 w-10"
                          />
                          <div>
                            <div className="font-bold text-lg">
                              {game.home_team?.name || game.homeTeam} vs {game.away_team?.name || game.awayTeam}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {game.venue} • {game.time}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {game.homeScore} - {game.awayScore}
                          </div>
                          <Badge className="bg-green-500">
                            LIVE
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No live games at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                {selectedLeague} teams and standings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                  <div key={team.id} className="p-4 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <SportsImage
                        type="team"
                        league={team.league || selectedLeague}
                        teamName={team.name}
                        className="h-12 w-12"
                      />
                      <div>
                        <div className="font-bold">{team.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {team.city} • {team.abbreviation}
                        </div>
                        {team.stats && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {team.stats.wins}-{team.stats.losses} record
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
              <CardDescription>
                Top {selectedSport} players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <SportsImage
                        type="player"
                        league={selectedLeague}
                        playerName={player.name}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {player.team} • {player.position}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {player.stats && Object.keys(player.stats).length > 0 ? 
                          `${Object.keys(player.stats).length} stats` : 
                          'No stats'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
