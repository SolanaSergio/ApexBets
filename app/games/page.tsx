"use client"

import { Suspense, useEffect, useState, useCallback, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameCard } from "@/components/sports/game-card"
import { Calendar, Clock, Filter, Search, Trophy, RefreshCw } from "lucide-react"
import { databaseFirstApiClient, type Game } from "@/lib/api-client-database-first"
import { format, addDays, subDays } from "date-fns"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
import { subscribeToTable, unsubscribeFromTable } from "@/lib/supabase/realtime"

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 1),
    to: addDays(new Date(), 7)
  })
  const [searchTerm, setSearchTerm] = useState("")

  const fetchGames = useCallback(async () => {
    if (!selectedSport) return

    try {
      setLoading(true)
      const [live, upcoming, completed] = await Promise.all([
        databaseFirstApiClient.getGames({
          sport: selectedSport,
          status: "in_progress",
          dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
          dateTo: format(dateRange.to, 'yyyy-MM-dd'),
          search: searchTerm,
          limit: 50
        }),
        databaseFirstApiClient.getGames({
          sport: selectedSport,
          status: "scheduled",
          dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
          dateTo: format(dateRange.to, 'yyyy-MM-dd'),
          search: searchTerm,
          limit: 50
        }),
        databaseFirstApiClient.getGames({
          sport: selectedSport,
          status: "completed",
          dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
          dateTo: format(dateRange.to, 'yyyy-MM-dd'),
          search: searchTerm,
          limit: 50
        })
      ])
      setGames([...live, ...upcoming, ...completed])
    } catch (error) {
      console.error("Error fetching games:", error)
      setGames([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, dateRange.from, dateRange.to, searchTerm])

  useEffect(() => {
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadLeaguesForSport(selectedSport)
      fetchGames()
    }
  }, [selectedSport, fetchGames])

  useEffect(() => {
    const handleRealtimeUpdate = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      setGames(currentGames => {
        if (eventType === 'INSERT') {
          return [...currentGames, newRecord];
        }
        if (eventType === 'UPDATE') {
          return currentGames.map(game => game.id === newRecord.id ? newRecord : game);
        }
        if (eventType === 'DELETE') {
          return currentGames.filter(game => game.id !== oldRecord.id);
        }
        return currentGames;
      });
    };

    subscribeToTable('games', handleRealtimeUpdate);

    return () => {
      unsubscribeFromTable('games');
    };
  }, []);

  const loadSupportedSports = async () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    if (sports.length > 0) {
      setSelectedSport(sports[0])
    }
  }

  const loadLeaguesForSport = async (sport: SupportedSport) => {
    const leagues = await SportConfigManager.getLeaguesForSport(sport)
    setAvailableLeagues(leagues)
    if (leagues.length > 0) {
      setSelectedLeague(leagues[0])
    }
  }

  const handleDateChange = (type: 'from' | 'to', value: string) => {
    const date = new Date(value)
    setDateRange(prev => ({
      ...prev,
      [type]: date
    }))
  }

  const getQuickDateRange = (range: string) => {
    const today = new Date()
    switch (range) {
      case 'today':
        return { from: today, to: today }
      case 'tomorrow':
        return { from: addDays(today, 1), to: addDays(today, 1) }
      case 'week':
        return { from: subDays(today, 1), to: addDays(today, 7) }
      case 'month':
        return { from: subDays(today, 7), to: addDays(today, 30) }
      default:
        return dateRange
    }
  }

  const filteredGames = useMemo(() => {
    return games.filter(game =>
      (game.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedLeague ? game.league === selectedLeague : true)
    )
  }, [games, searchTerm, selectedLeague])

  const liveGames = useMemo(() => filteredGames.filter(g => g.status === 'in_progress'), [filteredGames])
  const upcomingGames = useMemo(() => filteredGames.filter(g => g.status === 'scheduled'), [filteredGames])
  const completedGames = useMemo(() => filteredGames.filter(g => g.status === 'completed'), [filteredGames])

  if (!selectedSport) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold">
            Games & Matches
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Track live games, upcoming matches, and historical results across all major sports leagues
          </p>
        </div>

        {/* Filters Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card className="card-modern sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Sport Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sport</label>
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
                </div>

                {/* League Selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">League</label>
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
                </div>

                {/* Quick Date Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Quick Range</label>
                  <Select onValueChange={(value) => setDateRange(getQuickDateRange(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="week">Next 7 Days</SelectItem>
                      <SelectItem value="month">Next 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={format(dateRange.from, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateChange('from', e.target.value)}
                    />
                    <Input
                      type="date"
                      value={format(dateRange.to, 'yyyy-MM-dd')}
                      onChange={(e) => handleDateChange('to', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="live" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="live" className="gap-2">
                  <div className="live-indicator" />
                  <span>Live Games</span>
                  {liveGames.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {liveGames.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Upcoming</span>
                  {upcomingGames.length > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {upcomingGames.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Results</span>
                  {completedGames.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {completedGames.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="live" className="space-y-4">
                <Suspense fallback={<LiveGamesSkeleton />}>
                  <LiveGamesSection
                    games={liveGames}
                    loading={loading}
                    onRefresh={fetchGames}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-4">
                <Suspense fallback={<UpcomingGamesSkeleton />}>
                  <UpcomingGamesSection
                    games={upcomingGames}
                    loading={loading}
                    onRefresh={fetchGames}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="completed" className="space-y-4">
                <Suspense fallback={<CompletedGamesSkeleton />}>
                  <CompletedGamesSection
                    games={completedGames}
                    loading={loading}
                    onRefresh={fetchGames}
                  />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function LiveGamesSection({ games, loading, onRefresh }: { games: Game[], loading: boolean, onRefresh: () => void }) {
  if (loading) {
    return <LiveGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="live-indicator" />
          Live Games
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="animate-pulse">
            {games.length} Live
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {games.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Live Games</h3>
            <p className="text-muted-foreground">
              There are currently no games in progress
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} variant="detailed" />
          ))}
        </div>
      )}
    </div>
  )
}

function UpcomingGamesSection({ games, loading, onRefresh }: { games: Game[], loading: boolean, onRefresh: () => void }) {
  if (loading) {
    return <UpcomingGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Games
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {games.length} Scheduled
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {games.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Games</h3>
            <p className="text-muted-foreground">
              No games are scheduled for the selected date range
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} variant="default" />
          ))}
        </div>
      )}
    </div>
  )
}

function CompletedGamesSection({ games, loading, onRefresh }: { games: Game[], loading: boolean, onRefresh: () => void }) {
  if (loading) {
    return <CompletedGamesSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Completed Games
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {games.length} Results
          </Badge>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {games.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Completed Games</h3>
            <p className="text-muted-foreground">
              No completed games found for the selected date range
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} variant="default" />
          ))}
        </div>
      )}
    </div>
  )
}

function LiveGamesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-6 w-48 bg-muted rounded"></div>
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
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-muted rounded animate-pulse"></div>
        <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-6 w-48 bg-muted rounded"></div>
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
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 bg-muted rounded animate-pulse"></div>
        <div className="h-6 w-18 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-16 bg-muted rounded"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-6 w-48 bg-muted rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}