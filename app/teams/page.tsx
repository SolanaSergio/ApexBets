import { Suspense } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, Search, Filter, Trophy, TrendingUp, Target, Calendar, MapPin } from "lucide-react"

export default function TeamsPage() {
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
                  <SelectItem value="nba">NBA</SelectItem>
                  <SelectItem value="nfl">NFL</SelectItem>
                  <SelectItem value="mlb">MLB</SelectItem>
                  <SelectItem value="nhl">NHL</SelectItem>
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
              <TeamsOverviewSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            <Suspense fallback={<StandingsSkeleton />}>
              <StandingsSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <Suspense fallback={<StatsSkeleton />}>
              <StatsSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Teams Overview Section
function TeamsOverviewSection() {
  const teams = [
    {
      id: "1",
      name: "Los Angeles Lakers",
      abbreviation: "LAL",
      city: "Los Angeles",
      league: "NBA",
      logo: "/placeholder-logo.png",
      wins: 25,
      losses: 15,
      winRate: 0.625,
      pointsPerGame: 115.2,
      conference: "Western",
      division: "Pacific",
      lastGame: "W vs Warriors 120-115",
      nextGame: "vs Celtics (Jan 16)"
    },
    {
      id: "2",
      name: "Golden State Warriors",
      abbreviation: "GSW",
      city: "San Francisco",
      league: "NBA",
      logo: "/placeholder-logo.png",
      wins: 22,
      losses: 18,
      winRate: 0.55,
      pointsPerGame: 112.8,
      conference: "Western",
      division: "Pacific",
      lastGame: "L vs Lakers 115-120",
      nextGame: "vs Heat (Jan 17)"
    },
    {
      id: "3",
      name: "Boston Celtics",
      abbreviation: "BOS",
      city: "Boston",
      league: "NBA",
      logo: "/placeholder-logo.png",
      wins: 28,
      losses: 12,
      winRate: 0.7,
      pointsPerGame: 118.5,
      conference: "Eastern",
      division: "Atlantic",
      lastGame: "W vs Heat 112-108",
      nextGame: "vs Lakers (Jan 16)"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Overview</h2>
        <Badge variant="secondary">{teams.length} Teams</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="card-hover-enhanced">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{team.abbreviation}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{team.city}</p>
                  </div>
                </div>
                <Badge variant="outline">{team.conference}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Record */}
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{team.wins}</div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{team.losses}</div>
                  <div className="text-xs text-muted-foreground">Losses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{Math.round(team.winRate * 100)}%</div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
              </div>

              {/* Win Rate Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Win Rate</span>
                  <span>{Math.round(team.winRate * 100)}%</span>
                </div>
                <Progress value={team.winRate * 100} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Points/Game</div>
                  <div className="font-semibold">{team.pointsPerGame}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Division</div>
                  <div className="font-semibold">{team.division}</div>
                </div>
              </div>

              {/* Recent Games */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Last: </span>
                  <span className="font-medium">{team.lastGame}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Next: </span>
                  <span className="font-medium">{team.nextGame}</span>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Standings Section
function StandingsSection() {
  const standings = [
    { rank: 1, team: "Boston Celtics", wins: 28, losses: 12, winRate: 0.7, gamesBehind: 0 },
    { rank: 2, team: "Los Angeles Lakers", wins: 25, losses: 15, winRate: 0.625, gamesBehind: 3 },
    { rank: 3, team: "Golden State Warriors", wins: 22, losses: 18, winRate: 0.55, gamesBehind: 6 },
    { rank: 4, team: "Miami Heat", wins: 20, losses: 20, winRate: 0.5, gamesBehind: 8 },
    { rank: 5, team: "New York Knicks", wins: 18, losses: 22, winRate: 0.45, gamesBehind: 10 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Conference Standings</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Eastern</Button>
          <Button variant="default" size="sm">Western</Button>
        </div>
      </div>

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
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-bold">{team.team.split(' ').map(w => w[0]).join('')}</span>
                        </div>
                        <span className="font-medium">{team.team}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-primary">{team.wins}</td>
                    <td className="p-4 text-center">{team.losses}</td>
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
    </div>
  )
}

// Stats Section
function StatsSection() {
  const teamStats = [
    { category: "Points Per Game", value: "115.2", rank: 3, trend: "up" },
    { category: "Rebounds Per Game", value: "45.8", rank: 7, trend: "down" },
    { category: "Assists Per Game", value: "28.4", rank: 2, trend: "up" },
    { category: "Field Goal %", value: "47.2%", rank: 5, trend: "up" },
    { category: "3-Point %", value: "36.8%", rank: 4, trend: "down" },
    { category: "Free Throw %", value: "82.1%", rank: 1, trend: "up" }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Team Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamStats.map((stat, index) => (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{stat.category}</h3>
                <Badge variant="secondary">#{stat.rank}</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-primary">{stat.value}</span>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    <TrendingUp className={`h-4 w-4 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                    {stat.trend === "up" ? "↗" : "↘"}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  League Rank: #{stat.rank}
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
