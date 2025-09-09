"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Calendar,
  RefreshCw,
  Award,
  Zap
} from "lucide-react"
import { ballDontLieClient, type BallDontLiePlayer, type BallDontLieStats } from "@/lib/sports-apis"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts"

interface PlayerTrendsProps {
  selectedPlayer?: BallDontLiePlayer | null
}

export function PlayerTrends({ selectedPlayer }: PlayerTrendsProps) {
  const [stats, setStats] = useState<BallDontLieStats[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>("pts")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("last20")
  const [trends, setTrends] = useState<any>(null)

  const metrics = [
    { value: "pts", label: "Points", color: "#8884d8" },
    { value: "reb", label: "Rebounds", color: "#82ca9d" },
    { value: "ast", label: "Assists", color: "#ffc658" },
    { value: "stl", label: "Steals", color: "#ff7300" },
    { value: "blk", label: "Blocks", color: "#00ff00" },
    { value: "fg_pct", label: "FG%", color: "#0088fe" },
    { value: "fg3_pct", label: "3P%", color: "#00c49f" },
    { value: "ft_pct", label: "FT%", color: "#ffbb28" }
  ]

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerStats()
    }
  }, [selectedPlayer, selectedPeriod])

  useEffect(() => {
    if (stats.length > 0) {
      calculateTrends()
    }
  }, [stats, selectedMetric])

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
          startDate = "2024-10-01"
          break
        default:
          startDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }

      const response = await ballDontLieClient.getStats({
        player_ids: [selectedPlayer.id],
        start_date: startDate,
        end_date: endDate,
        seasons: [2024],
        per_page: 50
      })

      setStats(response.data)
    } catch (error) {
      console.error("Error fetching player stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrends = () => {
    if (stats.length < 2) return

    const recent = stats.slice(-5)
    const previous = stats.slice(-10, -5)

    const recentAvg = recent.reduce((sum, stat) => sum + (stat as any)[selectedMetric], 0) / recent.length
    const previousAvg = previous.length > 0 
      ? previous.reduce((sum, stat) => sum + (stat as any)[selectedMetric], 0) / previous.length 
      : recentAvg

    const change = ((recentAvg - previousAvg) / previousAvg) * 100
    const isImproving = change > 0

    setTrends({
      current: recentAvg,
      previous: previousAvg,
      change: Math.abs(change),
      isImproving,
      recent,
      previous
    })
  }

  const prepareChartData = () => {
    return stats.map((stat, index) => ({
      game: `G${index + 1}`,
      date: stat.game.date,
      pts: stat.pts,
      reb: stat.reb,
      ast: stat.ast,
      stl: stat.stl,
      blk: stat.blk,
      fg_pct: stat.fg_pct * 100,
      fg3_pct: stat.fg3_pct * 100,
      ft_pct: stat.ft_pct * 100,
      fgm: stat.fgm,
      fga: stat.fga,
      fg3m: stat.fg3m,
      fg3a: stat.fg3a,
      ftm: stat.ftm,
      fta: stat.fta
    }))
  }

  const getMetricValue = (stat: BallDontLieStats, metric: string) => {
    if (metric.includes('_pct')) {
      return ((stat as any)[metric] * 100).toFixed(1)
    }
    return (stat as any)[metric]
  }

  const getTrendIcon = (isImproving: boolean) => {
    return isImproving ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTrendColor = (isImproving: boolean) => {
    return isImproving ? "text-green-500" : "text-red-500"
  }

  const chartData = prepareChartData()
  const selectedMetricData = metrics.find(m => m.value === selectedMetric)

  if (!selectedPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
            <p className="text-sm">Choose a player to view their performance trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
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

            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={fetchPlayerStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trend Summary */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Average</p>
                  <p className="text-2xl font-bold">{trends.current.toFixed(1)}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Previous Average</p>
                  <p className="text-2xl font-bold">{trends.previous.toFixed(1)}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Change</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.isImproving)}
                    <p className={`text-2xl font-bold ${getTrendColor(trends.isImproving)}`}>
                      {trends.change.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {trends.isImproving ? (
                  <Award className="h-8 w-8 text-green-500" />
                ) : (
                  <Zap className="h-8 w-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="line" className="space-y-4">
        <TabsList>
          <TabsTrigger value="line">Line Chart</TabsTrigger>
          <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          <TabsTrigger value="area">Area Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="line" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedMetricData?.label} Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [
                        selectedMetric.includes('_pct') ? `${value.toFixed(1)}%` : value,
                        selectedMetricData?.label
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={selectedMetricData?.color || "#8884d8"} 
                      strokeWidth={3}
                      dot={{ fill: selectedMetricData?.color || "#8884d8", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedMetricData?.label} Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [
                        selectedMetric.includes('_pct') ? `${value.toFixed(1)}%` : value,
                        selectedMetricData?.label
                      ]}
                    />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill={selectedMetricData?.color || "#8884d8"}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="area" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {selectedMetricData?.label} Area Chart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [
                        selectedMetric.includes('_pct') ? `${value.toFixed(1)}%` : value,
                        selectedMetricData?.label
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={selectedMetricData?.color || "#8884d8"} 
                      fill={selectedMetricData?.color || "#8884d8"}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Games Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Games Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.slice(-10).map((stat, index) => (
              <div key={stat.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Game {stats.length - 9 + index}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(stat.game.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">
                      {getMetricValue(stat, selectedMetric)}
                      {selectedMetric.includes('_pct') && '%'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedMetricData?.label}
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedMetricData?.color }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
