"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, Target, DollarSign } from "lucide-react"
import { TeamPerformanceChart } from "./team-performance-chart"
import { PredictionAccuracyChart } from "./prediction-accuracy-chart"
import { OddsAnalysisChart } from "./odds-analysis-chart"
import { TrendAnalysis } from "./trend-analysis"
import { PlayerAnalytics } from "./player-analytics"
import { ValueBettingOpportunities } from "./value-betting-opportunities"

interface AnalyticsOverview {
  totalGames: number
  totalPredictions: number
  accuracyRate: number
  totalValueBets: number
  averageValue: number
  profitLoss: number
  winRate: number
  roi: number
}

export function AnalyticsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("30d")
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchAnalyticsOverview()
  }, [timeRange])

  const fetchAnalyticsOverview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/stats?external=true&timeRange=${timeRange}`)
      const data = await response.json()
      setOverview(data.overview)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchAnalyticsOverview()
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Games</p>
                  <p className="text-2xl font-bold">{overview.totalGames}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p>
                  <p className="text-2xl font-bold">{(overview.accuracyRate * 100).toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value Bets</p>
                  <p className="text-2xl font-bold">{overview.totalValueBets}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg Value: {(overview.averageValue * 100).toFixed(1)}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ROI</p>
                  <p className="text-2xl font-bold">
                    {overview.roi > 0 ? '+' : ''}{(overview.roi * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    P&L: ${overview.profitLoss.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analytics Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="lakers">Los Angeles Lakers</SelectItem>
                  <SelectItem value="warriors">Golden State Warriors</SelectItem>
                  <SelectItem value="celtics">Boston Celtics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="season">This Season</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="odds">Odds Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="betting">Value Bets</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <TeamPerformanceChart team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionAccuracyChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="odds" className="space-y-6">
          <OddsAnalysisChart team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <PlayerAnalytics team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="betting" className="space-y-6">
          <ValueBettingOpportunities timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
