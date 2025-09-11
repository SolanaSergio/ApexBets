"use client"

import { Suspense, useEffect, useState } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Filter, Search, Trophy, Target, TrendingUp, RefreshCw } from "lucide-react"
import { TeamLogo } from "@/components/ui/sports-image"
import { apiClient, type Game } from "@/lib/api-client"
import { format } from "date-fns"
import GamesList from "@/components/categories/sports/games-list"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { serviceFactory, SupportedSport } from "@/lib/services/core/service-factory"

export default function GamesPage() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])

  useEffect(() => {
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadLeaguesForSport(selectedSport)
    }
  }, [selectedSport])

  const loadSupportedSports = () => {
    const sports = serviceFactory.getSupportedSports()
    setSupportedSports(sports)
    // Don't set default sport - let user choose
  }

  const loadLeaguesForSport = (sport: SupportedSport) => {
    const leagues = SportConfigManager.getLeaguesForSport(sport)
    setAvailableLeagues(leagues)
    if (leagues.length > 0) {
      setSelectedLeague(leagues[0])
    }
  }

  // Show no sport selected state
  if (!selectedSport) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Games & Matches
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a sport to view live games, upcoming matches, and historical results
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
            Games & Matches
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track live games, upcoming matches, and historical results across all major sports leagues
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search teams or games..." 
                  className="pl-10"
                />
              </div>
              <Select value={selectedSport} onValueChange={(value) => setSelectedSport(value as SupportedSport)}>
                <SelectTrigger>
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
              <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                <SelectTrigger>
                  <SelectValue placeholder="Select League" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeagues.map((league) => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Games Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="live" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Games
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Trophy className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <Suspense fallback={<LiveGamesSkeleton />}>
              <LiveGamesSection selectedSport={selectedSport} selectedLeague={selectedLeague} />
            </Suspense>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Suspense fallback={<UpcomingGamesSkeleton />}>
              <UpcomingGamesSection selectedSport={selectedSport} selectedLeague={selectedLeague} />
            </Suspense>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Suspense fallback={<CompletedGamesSkeleton />}>
              <CompletedGamesSection selectedSport={selectedSport} selectedLeague={selectedLeague} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Live Games Section
function LiveGamesSection({ selectedSport, selectedLeague }: { selectedSport: SupportedSport | null, selectedLeague: string }) {
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSport) {
      fetchLiveGames()
    }
  }, [selectedSport, selectedLeague])

  async function fetchLiveGames() {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      // Use external APIs for better live data
      const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
      const liveGames = await cachedUnifiedApiClient.getLiveGames(selectedSport as any)
      
      // Transform to match expected format
      const transformedGames = liveGames.map(game => ({
        id: game.id,
        home_team_id: 'external_home',
        away_team_id: 'external_away',
        home_team: { name: game.homeTeam, abbreviation: game.homeTeam?.split(' ').pop() || 'HT' },
        away_team: { name: game.awayTeam, abbreviation: game.awayTeam?.split(' ').pop() || 'AT' },
        home_score: game.homeScore,
        away_score: game.awayScore,
        game_date: game.date,
        season: '2024-25',
        status: game.status,
        venue: game.venue
      })) as Game[]
      
      setLiveGames(transformedGames)
    } catch (error) {
      console.error("Error fetching live games:", error)
      // Fallback to API client
      try {
        const games = await apiClient.getGames({
          sport: selectedSport,
          status: "in_progress",
          limit: 10
        })
        setLiveGames(games)
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        setLiveGames([])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LiveGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          Live Games
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">
            {liveGames.length} Live
          </Badge>
          <Button variant="ghost" size="sm" onClick={fetchLiveGames} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {liveGames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Live Games</h3>
            <p className="text-muted-foreground">There are currently no games in progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {liveGames.map((game) => (
            <Card key={game.id} className="card-hover-enhanced">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <TeamLogo teamName={game.away_team?.name || ''} alt={game.away_team?.abbreviation || 'Away'} width={32} height={32} className="mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground mb-1">{game.away_team?.abbreviation || 'Away'}</div>
                      <div className="text-2xl font-bold">{game.away_score || 0}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">VS</div>
                      <div className="text-sm font-medium">Live</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>

                    <div className="text-center">
                      <TeamLogo teamName={game.home_team?.name || ''} alt={game.home_team?.abbreviation || 'Home'} width={32} height={32} className="mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground mb-1">{game.home_team?.abbreviation || 'Home'}</div>
                      <div className="text-2xl font-bold">{game.home_score || 0}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-red-600">LIVE</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{game.venue || 'TBD'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Upcoming Games Section
function UpcomingGamesSection({ selectedSport, selectedLeague }: { selectedSport: SupportedSport | null, selectedLeague: string }) {
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSport) {
      fetchUpcomingGames()
    }
  }, [selectedSport, selectedLeague])

  async function fetchUpcomingGames() {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      // Use external APIs for better upcoming data
      const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
      const upcomingGames = await cachedUnifiedApiClient.getGames(selectedSport as any, { 
        status: 'scheduled',
        limit: 10 
      })
      
      // Transform to match expected format
      const transformedGames = upcomingGames.map(game => ({
        id: game.id,
        home_team_id: 'external_home',
        away_team_id: 'external_away',
        home_team: { name: game.homeTeam, abbreviation: game.homeTeam?.split(' ').pop() || 'HT' },
        away_team: { name: game.awayTeam, abbreviation: game.awayTeam?.split(' ').pop() || 'AT' },
        home_score: game.homeScore,
        away_score: game.awayScore,
        game_date: game.date,
        season: '2024-25',
        status: game.status,
        venue: game.venue
      })) as Game[]
      
      setUpcomingGames(transformedGames)
    } catch (error) {
      console.error("Error fetching upcoming games:", error)
      // Fallback to API client
      try {
        const games = await apiClient.getGames({
          sport: selectedSport,
          status: "scheduled",
          limit: 10
        })
        setUpcomingGames(games)
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        setUpcomingGames([])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <UpcomingGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6" />
          Upcoming Games
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchUpcomingGames} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {upcomingGames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Games</h3>
            <p className="text-muted-foreground">Check back later for scheduled matches</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {upcomingGames.map((game) => {
            const gameDate = new Date(game.game_date)
            return (
              <Card key={game.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <TeamLogo teamName={game.away_team?.name || ''} alt={game.away_team?.abbreviation || 'Away'} width={24} height={24} className="mx-auto mb-1" />
                        <div className="text-sm text-muted-foreground mb-1">{game.away_team?.abbreviation || 'Away'}</div>
                        <div className="font-semibold">{game.away_team?.name || 'Away Team'}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">VS</div>
                        <div className="text-sm font-medium">
                          {format(gameDate, "MMM d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(gameDate, "h:mm a")}
                        </div>
                      </div>

                      <div className="text-center">
                        <TeamLogo teamName={game.home_team?.name || ''} alt={game.home_team?.abbreviation || 'Home'} width={24} height={24} className="mx-auto mb-1" />
                        <div className="text-sm text-muted-foreground mb-1">{game.home_team?.abbreviation || 'Home'}</div>
                        <div className="font-semibold">{game.home_team?.name || 'Home Team'}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline">{game.status}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{game.venue || 'TBD'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Completed Games Section
function CompletedGamesSection({ selectedSport, selectedLeague }: { selectedSport: SupportedSport | null, selectedLeague: string }) {
  const [completedGames, setCompletedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSport) {
      fetchCompletedGames()
    }
  }, [selectedSport, selectedLeague])

  async function fetchCompletedGames() {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      // Use external APIs for better completed data
      const { cachedUnifiedApiClient } = await import("@/lib/services/api/cached-unified-api-client")
      const completedGames = await cachedUnifiedApiClient.getGames(selectedSport as any, { 
        status: 'finished',
        limit: 10 
      })
      
      // Transform to match expected format
      const transformedGames = completedGames.map(game => ({
        id: game.id,
        home_team_id: 'external_home',
        away_team_id: 'external_away',
        home_team: { name: game.homeTeam, abbreviation: game.homeTeam?.split(' ').pop() || 'HT' },
        away_team: { name: game.awayTeam, abbreviation: game.awayTeam?.split(' ').pop() || 'AT' },
        home_score: game.homeScore,
        away_score: game.awayScore,
        game_date: game.date,
        season: '2024-25',
        status: game.status,
        venue: game.venue
      })) as Game[]
      
      setCompletedGames(transformedGames)
    } catch (error) {
      console.error("Error fetching completed games:", error)
      // Fallback to API client
      try {
        const games = await apiClient.getGames({
          sport: selectedSport,
          status: "completed",
          limit: 10
        })
        setCompletedGames(games)
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
        setCompletedGames([])
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <CompletedGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Recent Results
        </h2>
        <Button variant="ghost" size="sm" onClick={fetchCompletedGames} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {completedGames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Recent Results</h3>
            <p className="text-muted-foreground">No completed games found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {completedGames.map((game) => {
            const gameDate = new Date(game.game_date)
            const homeWon = game.home_score && game.away_score && game.home_score > game.away_score
            return (
              <Card key={game.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <TeamLogo teamName={game.away_team?.name || ''} alt={game.away_team?.abbreviation || 'Away'} width={24} height={24} className="mx-auto mb-1" />
                        <div className="text-sm text-muted-foreground mb-1">{game.away_team?.abbreviation || 'Away'}</div>
                        <div className={`text-2xl font-bold ${!homeWon ? "text-primary" : ""}`}>{game.away_score || 0}</div>
                      </div>

                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">FINAL</div>
                        <div className="text-sm font-medium">
                          {format(gameDate, "MMM d")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(gameDate, "h:mm a")}
                        </div>
                      </div>

                      <div className="text-center">
                        <TeamLogo teamName={game.home_team?.name || ''} alt={game.home_team?.abbreviation || 'Home'} width={24} height={24} className="mx-auto mb-1" />
                        <div className="text-sm text-muted-foreground mb-1">{game.home_team?.abbreviation || 'Home'}</div>
                        <div className={`text-2xl font-bold ${homeWon ? "text-primary" : ""}`}>{game.home_score || 0}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="secondary">Completed</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{game.venue || 'TBD'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Loading Skeletons
function LiveGamesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-6 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-3 w-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function UpcomingGamesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-3 w-6 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CompletedGamesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-36 bg-muted rounded animate-pulse" />
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
