"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  Calendar,
  RefreshCw,
  User,
  Trophy,
  Zap
} from "lucide-react"
import { ballDontLieClient, type BallDontLiePlayer, type BallDontLieStats } from "@/lib/sports-apis"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { getTeamLogoUrl, getPlayerPhotoUrl } from "@/lib/utils/team-utils"

interface PlayerStatsProps {
  selectedPlayer?: BallDontLiePlayer | null
}

export function PlayerStats({ selectedPlayer }: PlayerStatsProps) {
  const [stats, setStats] = useState<BallDontLieStats[]>([])
  const [seasonAverages, setSeasonAverages] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<number>(2024)
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last10")

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerStats()
      fetchSeasonAverages()
    }
  }, [selectedPlayer, selectedSeason, selectedPeriod])

  const fetchPlayerStats = async () => {
    if (!selectedPlayer) return

    setLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      let startDate: string

      switch (selectedPeriod) {
        case "last5":
          startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case "last10":
          startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case "last20":
          startDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          break
        case "season":
          startDate = `${selectedSeason}-10-01`
          break
        default:
          startDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      const response = await ballDontLieClient.getStats({
        player_ids: [selectedPlayer.id],
        start_date: startDate,
        end_date: endDate,
        seasons: [selectedSeason],
        per_page: 50
      })

      setStats(response.data)
    } catch (error) {
      console.error("Error fetching player stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSeasonAverages = async () => {
    if (!selectedPlayer) return

    try {
      const response = await ballDontLieClient.getSeasonAverages({
        season: selectedSeason,
        player_ids: [selectedPlayer.id]
      })

      if (response.data && response.data.length > 0) {
        setSeasonAverages(response.data[0])
      }
    } catch (error) {
      console.error("Error fetching season averages:", error)
    }
  }

  const calculateAverages = () => {
    if (stats.length === 0) return null

    const totals = stats.reduce((acc, stat) => ({
      pts: acc.pts + stat.pts,
      reb: acc.reb + stat.reb,
      ast: acc.ast + stat.ast,
      stl: acc.stl + stat.stl,
      blk: acc.blk + stat.blk,
      fgm: acc.fgm + stat.fgm,
      fga: acc.fga + stat.fga,
      fg3m: acc.fg3m + stat.fg3m,
      fg3a: acc.fg3a + stat.fg3a,
      ftm: acc.ftm + stat.ftm,
      fta: acc.fta + stat.fta,
      turnover: acc.turnover + stat.turnover,
      pf: acc.pf + stat.pf,
      games: acc.games + 1
    }), {
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
      fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
      turnover: 0, pf: 0, games: 0
    })

    return {
      pts: (totals.pts / totals.games).toFixed(1),
      reb: (totals.reb / totals.games).toFixed(1),
      ast: (totals.ast / totals.games).toFixed(1),
      stl: (totals.stl / totals.games).toFixed(1),
      blk: (totals.blk / totals.games).toFixed(1),
      fg_pct: totals.fga > 0 ? ((totals.fgm / totals.fga) * 100).toFixed(1) : 0,
      fg3_pct: totals.fg3a > 0 ? ((totals.fg3m / totals.fg3a) * 100).toFixed(1) : 0,
      ft_pct: totals.fta > 0 ? ((totals.ftm / totals.fta) * 100).toFixed(1) : 0,
      games: totals.games
    }
  }

  const getPlayerInitials = (player: BallDontLiePlayer) => {
    return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase()
  }


  const prepareChartData = () => {
    return stats.slice(-10).map((stat, index) => ({
      game: `G${stats.length - 9 + index}`,
      pts: stat.pts,
      reb: stat.reb,
      ast: stat.ast,
      fg_pct: stat.fg_pct * 100
    }))
  }

  const averages = calculateAverages()
  const chartData = prepareChartData()

  if (!selectedPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
            <p className="text-sm">Choose a player from the search above to view their statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={getPlayerPhotoUrl(selectedPlayer.id)}
                  alt={`${selectedPlayer.first_name} ${selectedPlayer.last_name}`}
                />
                <AvatarFallback className="text-lg">
                  {getPlayerInitials(selectedPlayer)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedPlayer.first_name} {selectedPlayer.last_name}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="secondary">{selectedPlayer.position}</Badge>
                  <span className="flex items-center gap-1">
                    <img 
                      src={getTeamLogoUrl(selectedPlayer.team.name)} 
                      alt={selectedPlayer.team.name}
                      className="h-4 w-4"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {selectedPlayer.team.name}
                  </span>
                  {selectedPlayer.height_feet && selectedPlayer.height_inches && (
                    <span>{selectedPlayer.height_feet}'{selectedPlayer.height_inches}"</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Season Averages</div>
              {seasonAverages && (
                <div className="text-2xl font-bold text-primary">
                  {seasonAverages.pts} PTS
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={selectedSeason.toString()} onValueChange={(value) => setSelectedSeason(Number(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last5">Last 5 Games</SelectItem>
                <SelectItem value="last10">Last 10 Games</SelectItem>
                <SelectItem value="last20">Last 20 Games</SelectItem>
                <SelectItem value="season">Full Season</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchPlayerStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {averages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold">{averages.pts}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rebounds</p>
                  <p className="text-2xl font-bold">{averages.reb}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assists</p>
                  <p className="text-2xl font-bold">{averages.ast}</p>
                </div>
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Games</p>
                  <p className="text-2xl font-bold">{averages.games}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Stats */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shooting">Shooting</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Per Game Averages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Points</span>
                  <span className="font-semibold">{averages?.pts || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rebounds</span>
                  <span className="font-semibold">{averages?.reb || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assists</span>
                  <span className="font-semibold">{averages?.ast || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steals</span>
                  <span className="font-semibold">{averages?.stl || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blocks</span>
                  <span className="font-semibold">{averages?.blk || '0.0'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shooting Percentages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Field Goal %</span>
                    <span className="font-semibold">{averages?.fg_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.fg_pct) || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>3-Point %</span>
                    <span className="font-semibold">{averages?.fg3_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.fg3_pct) || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Free Throw %</span>
                    <span className="font-semibold">{averages?.ft_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.ft_pct) || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shooting Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.fg_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">FG%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.fg3_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">3P%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.ft_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">FT%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.pts || '0.0'}</div>
                  <div className="text-sm text-muted-foreground">PPG</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pts" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="reb" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="ast" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
