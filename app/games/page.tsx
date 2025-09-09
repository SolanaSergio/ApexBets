import { Suspense } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Filter, Search, Trophy, Target, TrendingUp } from "lucide-react"

export default function GamesPage() {
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select League" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nba">NBA</SelectItem>
                  <SelectItem value="nfl">NFL</SelectItem>
                  <SelectItem value="mlb">MLB</SelectItem>
                  <SelectItem value="nhl">NHL</SelectItem>
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
              <LiveGamesSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Suspense fallback={<UpcomingGamesSkeleton />}>
              <UpcomingGamesSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Suspense fallback={<CompletedGamesSkeleton />}>
              <CompletedGamesSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Live Games Section
function LiveGamesSection() {
  const liveGames = [
    {
      id: "1",
      homeTeam: { name: "Lakers", abbreviation: "LAL", logo: "/placeholder-logo.png" },
      awayTeam: { name: "Warriors", abbreviation: "GSW", logo: "/placeholder-logo.png" },
      homeScore: 98,
      awayScore: 95,
      quarter: "4th",
      timeRemaining: "2:34",
      status: "live",
      venue: "Crypto.com Arena"
    },
    {
      id: "2",
      homeTeam: { name: "Celtics", abbreviation: "BOS", logo: "/placeholder-logo.png" },
      awayTeam: { name: "Heat", abbreviation: "MIA", logo: "/placeholder-logo.png" },
      homeScore: 112,
      awayScore: 108,
      quarter: "3rd",
      timeRemaining: "5:12",
      status: "live",
      venue: "TD Garden"
    }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          Live Games
        </h2>
        <Badge variant="destructive" className="animate-pulse">
          {liveGames.length} Live
        </Badge>
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
                      <div className="text-sm text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                      <div className="text-2xl font-bold">{game.awayScore}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">VS</div>
                      <div className="text-sm font-medium">{game.quarter}</div>
                      <div className="text-xs text-muted-foreground">{game.timeRemaining}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                      <div className="text-2xl font-bold">{game.homeScore}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-red-600">LIVE</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{game.venue}</div>
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
function UpcomingGamesSection() {
  const upcomingGames = [
    {
      id: "3",
      homeTeam: { name: "Knicks", abbreviation: "NYK", logo: "/placeholder-logo.png" },
      awayTeam: { name: "Nets", abbreviation: "BKN", logo: "/placeholder-logo.png" },
      gameDate: "2024-01-15T20:00:00Z",
      status: "scheduled",
      venue: "Madison Square Garden"
    },
    {
      id: "4",
      homeTeam: { name: "Bulls", abbreviation: "CHI", logo: "/placeholder-logo.png" },
      awayTeam: { name: "76ers", abbreviation: "PHI", logo: "/placeholder-logo.png" },
      gameDate: "2024-01-15T22:30:00Z",
      status: "scheduled",
      venue: "United Center"
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Clock className="h-6 w-6" />
        Upcoming Games
      </h2>

      <div className="grid gap-4">
        {upcomingGames.map((game) => (
          <Card key={game.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                    <div className="font-semibold">{game.awayTeam.name}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">VS</div>
                    <div className="text-sm font-medium">
                      {new Date(game.gameDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(game.gameDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                    <div className="font-semibold">{game.homeTeam.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="outline">{game.status}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">{game.venue}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Completed Games Section
function CompletedGamesSection() {
  const completedGames = [
    {
      id: "5",
      homeTeam: { name: "Lakers", abbreviation: "LAL", logo: "/placeholder-logo.png" },
      awayTeam: { name: "Warriors", abbreviation: "GSW", logo: "/placeholder-logo.png" },
      homeScore: 120,
      awayScore: 115,
      status: "completed",
      gameDate: "2024-01-14T20:00:00Z",
      venue: "Crypto.com Arena"
    }
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        Recent Results
      </h2>

      <div className="grid gap-4">
        {completedGames.map((game) => (
          <Card key={game.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                    <div className="text-2xl font-bold">{game.awayScore}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">FINAL</div>
                    <div className="text-sm font-medium">
                      {new Date(game.gameDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                    <div className="text-2xl font-bold">{game.homeScore}</div>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant="secondary">Completed</Badge>
                  <div className="text-xs text-muted-foreground mt-1">{game.venue}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
