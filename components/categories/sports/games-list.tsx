"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Clock, 
  CheckCircle,
  Zap,
  RefreshCw
} from "lucide-react"
import { unifiedApiClient, SupportedSport, UnifiedGameData } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

type GameData = UnifiedGameData
import { SportsImage } from "@/components/ui/sports-image"

interface GamesListProps {
  sport: SupportedSport
  className?: string
}

export default function GamesList({ sport, className = "" }: GamesListProps) {
  const [activeTab, setActiveTab] = useState("live")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [liveGames, setLiveGames] = useState<GameData[]>([])
  const [upcomingGames, setUpcomingGames] = useState<GameData[]>([])
  const [recentGames, setRecentGames] = useState<GameData[]>([])

  useEffect(() => {
    loadGamesData()
  }, [sport])

  const loadGamesData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadLiveGames(),
        loadUpcomingGames(),
        loadRecentGames()
      ])
    } catch (error) {
      console.error('Error loading games data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLiveGames = async () => {
    try {
      const games = await unifiedApiClient.getLiveGames(sport)
      setLiveGames(games)
    } catch (error) {
      console.error('Error loading live games:', error)
    }
  }

  const loadUpcomingGames = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const games = await unifiedApiClient.getGames(sport, {
        date: today,
        status: 'scheduled'
      })
      setUpcomingGames(games)
    } catch (error) {
      console.error('Error loading upcoming games:', error)
    }
  }

  const loadRecentGames = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const games = await unifiedApiClient.getGames(sport, {
        date: today,
        status: 'finished'
      })
      setRecentGames(games)
    } catch (error) {
      console.error('Error loading recent games:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGamesData()
    setRefreshing(false)
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <GamesListSkeleton />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className={sportConfig?.color}>{sportConfig?.icon}</span>
            {sportConfig?.name} Games
          </h2>
          <p className="text-muted-foreground">
            Live and upcoming {sportConfig?.name.toLowerCase()} games
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Games Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live ({liveGames.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingGames.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recent ({recentGames.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Live Games
              </CardTitle>
              <CardDescription>
                Currently playing {sportConfig?.name.toLowerCase()} games
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
                            league={game.league}
                            teamName={game.homeTeam}
                            className="h-10 w-10"
                          />
                          <div>
                            <div className="font-bold text-lg">
                              {game.homeTeam} vs {game.awayTeam}
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

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Games
              </CardTitle>
              <CardDescription>
                Today's scheduled {sportConfig?.name.toLowerCase()} games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingGames.length > 0 ? (
                  upcomingGames.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <SportsImage
                          type="team"
                          league={game.league}
                          teamName={game.homeTeam}
                          className="h-8 w-8"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {game.homeTeam} vs {game.awayTeam}
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
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recent Results
              </CardTitle>
              <CardDescription>
                Latest {sportConfig?.name.toLowerCase()} game results
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
                          league={game.league}
                          teamName={game.homeTeam}
                          className="h-8 w-8"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {game.homeTeam} vs {game.awayTeam}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GamesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
