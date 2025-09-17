"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Filter, Search, Trophy, RefreshCw } from "lucide-react"
import { TeamLogo } from "@/components/ui/sports-image"
import { simpleApiClient, type Game } from "@/lib/api-client-simple"
import { format, addDays, subDays } from "date-fns"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export default function GamesPage() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [availableLeagues, setAvailableLeagues] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 1),
    to: addDays(new Date(), 7)
  })
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadLeaguesForSport(selectedSport)
    }
  }, [selectedSport])

  const loadSupportedSports = async () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    // Set first available sport as default
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

  // Show loading state if no sport selected
  if (!selectedSport) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 relative">
          <div className="absolute inset-0 gradient-bg-soft opacity-20 rounded-3xl blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold premium-text-gradient animate-slide-in-down">
              Games & Matches
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in px-2">
              Track live games, upcoming matches, and historical results across all major sports leagues
            </p>
            <div className="flex justify-center animate-scale-in">
              <div className="glass px-4 py-2 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-muted-foreground">Real-time updates • Live scores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card className="glass-premium border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 premium-text-gradient">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search teams or games..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sport Selection */}
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

              {/* League Selection */}
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

              {/* Quick Date Range */}
              <Select onValueChange={(value) => setDateRange(getQuickDateRange(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Quick Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">Next 7 Days</SelectItem>
                  <SelectItem value="month">Next 30 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Range */}
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Games Tabs */}
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 glass-premium border border-primary/20">
            <TabsTrigger value="live" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="hidden sm:inline">Live Games</span>
              <span className="sm:hidden">Live</span>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Upcoming</span>
              <span className="sm:hidden">Next</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-primary">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
              <span className="sm:hidden">Done</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-6">
            <Suspense fallback={<LiveGamesSkeleton />}>
              <LiveGamesSection 
                selectedSport={selectedSport} 
                dateRange={dateRange}
                searchTerm={searchTerm}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Suspense fallback={<UpcomingGamesSkeleton />}>
              <UpcomingGamesSection 
                selectedSport={selectedSport} 
                dateRange={dateRange}
                searchTerm={searchTerm}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Suspense fallback={<CompletedGamesSkeleton />}>
              <CompletedGamesSection 
                selectedSport={selectedSport} 
                dateRange={dateRange}
                searchTerm={searchTerm}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Live Games Section
function LiveGamesSection({ 
  selectedSport, 
  dateRange, 
  searchTerm 
}: { 
  selectedSport: SupportedSport | null
  dateRange: { from: Date; to: Date }
  searchTerm: string
}) {
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLiveGames = useCallback(async () => {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      
      // Fetch from database with date range and search
      const games = await simpleApiClient.getGames({
        sport: selectedSport,
        status: "in_progress",
        dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
        dateTo: format(dateRange.to, 'yyyy-MM-dd'),
        search: searchTerm,
        limit: 50
      })
      
      setLiveGames(games)
    } catch (error) {
      console.error("Error fetching live games:", error)
      setLiveGames([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, dateRange.from, dateRange.to, searchTerm])

  useEffect(() => {
    if (selectedSport) {
      fetchLiveGames()
    }
  }, [selectedSport, fetchLiveGames])

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
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Live Games</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No live games found matching "${searchTerm}"` : "There are currently no games in progress"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {liveGames.map((game) => (
            <Card key={game.id} className="glass-premium border-red-300/50 bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/30 hover:shadow-xl transition-all duration-300 premium-hover data-card">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-center justify-center lg:justify-start space-x-4 lg:space-x-6">
                    <div className="text-center">
                      <TeamLogo teamName={game.away_team?.name || ''} alt={game.away_team?.abbreviation || 'Away'} width={32} height={32} className="mx-auto mb-2" />
                      <div className="text-xs lg:text-sm text-muted-foreground mb-1">{game.away_team?.abbreviation || 'Away'}</div>
                      <div className="text-xl lg:text-2xl font-bold stats-highlight">{game.away_score || 0}</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">VS</div>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-red-600">LIVE</span>
                      </div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>

                    <div className="text-center">
                      <TeamLogo teamName={game.home_team?.name || ''} alt={game.home_team?.abbreviation || 'Home'} width={32} height={32} className="mx-auto mb-2" />
                      <div className="text-xs lg:text-sm text-muted-foreground mb-1">{game.home_team?.abbreviation || 'Home'}</div>
                      <div className="text-xl lg:text-2xl font-bold stats-highlight">{game.home_score || 0}</div>
                    </div>
                  </div>

                  <div className="text-center lg:text-right">
                    <div className="flex items-center justify-center lg:justify-end gap-2 mb-2">
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
function UpcomingGamesSection({ 
  selectedSport, 
  dateRange, 
  searchTerm 
}: { 
  selectedSport: SupportedSport | null
  dateRange: { from: Date; to: Date }
  searchTerm: string
}) {
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUpcomingGames = useCallback(async () => {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      
      const games = await simpleApiClient.getGames({
        sport: selectedSport,
        status: "scheduled",
        dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
        dateTo: format(dateRange.to, 'yyyy-MM-dd'),
        search: searchTerm,
        limit: 50
      })
      
      setUpcomingGames(games)
    } catch (error) {
      console.error("Error fetching upcoming games:", error)
      setUpcomingGames([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, dateRange.from, dateRange.to, searchTerm])

  useEffect(() => {
    if (selectedSport) {
      fetchUpcomingGames()
    }
  }, [selectedSport, fetchUpcomingGames])

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
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Games</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No upcoming games found matching "${searchTerm}"` : "Check back later for scheduled matches"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {upcomingGames.map((game) => {
            const gameDate = new Date(game.game_date)
            return (
              <Card key={game.id} className="hover:shadow-lg transition-all duration-200">
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
function CompletedGamesSection({ 
  selectedSport, 
  dateRange, 
  searchTerm 
}: { 
  selectedSport: SupportedSport | null
  dateRange: { from: Date; to: Date }
  searchTerm: string
}) {
  const [completedGames, setCompletedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompletedGames = useCallback(async () => {
    if (!selectedSport) return
    
    try {
      setLoading(true)
      
      const games = await simpleApiClient.getGames({
        sport: selectedSport,
        status: "completed",
        dateFrom: format(dateRange.from, 'yyyy-MM-dd'),
        dateTo: format(dateRange.to, 'yyyy-MM-dd'),
        search: searchTerm,
        limit: 50
      })
      
      setCompletedGames(games)
    } catch (error) {
      console.error("Error fetching completed games:", error)
      setCompletedGames([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, dateRange.from, dateRange.to, searchTerm])

  useEffect(() => {
    if (selectedSport) {
      fetchCompletedGames()
    }
  }, [selectedSport, fetchCompletedGames])

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
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Recent Results</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No completed games found matching "${searchTerm}"` : "No completed games found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {completedGames.map((game) => {
            const gameDate = new Date(game.game_date)
            const homeWon = game.home_score && game.away_score && game.home_score > game.away_score
            return (
              <Card key={game.id} className="hover:shadow-lg transition-all duration-200">
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