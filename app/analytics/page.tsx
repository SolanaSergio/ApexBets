"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Target, Users, Calendar, RefreshCw, Activity } from "lucide-react"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export default function AnalyticsPage() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [analyticsData, setAnalyticsData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const loadSupportedSports = async () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    if (sports.length > 0) {
      setSelectedSport(sports[0])
    }
  }

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch real analytics data from APIs
      const [overallStats, predictionAccuracy, trends, recentPredictions] = await Promise.all([
        fetch('/api/analytics').then(res => res.json()).catch(() => ({ data: {} })),
        fetch('/api/analytics/prediction-accuracy').then(res => res.json()).catch(() => ({ data: {} })),
        fetch('/api/analytics/trends').then(res => res.json()).catch(() => ({ data: [] })),
        fetch('/api/database-first/predictions?limit=100').then(res => res.json()).catch(() => ({ data: [] }))
      ])

      // Calculate sport breakdown from recent predictions
      const sportBreakdown = calculateSportBreakdown(recentPredictions.data || [])
      
      // Calculate monthly trends from trends API
      const monthlyTrend = calculateMonthlyTrends(trends.data || [])
      
      // Calculate recent performance from recent predictions
      const recentPerformance = calculateRecentPerformance(recentPredictions.data || [])

      const analyticsData = {
        totalGames: overallStats.data?.totalGames || 0,
        totalPredictions: overallStats.data?.totalPredictions || recentPredictions.data?.length || 0,
        accuracyRate: predictionAccuracy.data?.accuracy || 0,
        avgConfidence: predictionAccuracy.data?.avgConfidence || 0,
        winStreak: predictionAccuracy.data?.winStreak || 0,
        monthlyTrend,
        sportBreakdown,
        recentPerformance
      }
      
      setAnalyticsData(analyticsData)
    } catch (error) {
      console.error('Error loading analytics data:', error)
      setAnalyticsData({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSupportedSports()
    loadAnalyticsData()
  }, [loadAnalyticsData])

  useEffect(() => {
    if (selectedSport) {
      loadAnalyticsData()
    }
  }, [selectedSport, loadAnalyticsData])

  // Helper function to calculate sport breakdown
  const calculateSportBreakdown = (predictions: any[]) => {
    const sportStats = new Map()
    
    predictions.forEach(prediction => {
      const sport = prediction.sport || 'Unknown'
      if (!sportStats.has(sport)) {
        sportStats.set(sport, { predictions: 0, correct: 0 })
      }
      const stats = sportStats.get(sport)
      stats.predictions++
      if (prediction.accuracy === true) {
        stats.correct++
      }
    })

    return Array.from(sportStats.entries()).map(([sport, stats]) => ({
      sport,
      accuracy: stats.predictions > 0 ? stats.correct / stats.predictions : 0,
      predictions: stats.predictions
    }))
  }

  // Helper function to calculate monthly trends
  const calculateMonthlyTrends = (trends: any[]) => {
    const monthlyData = new Map()
    
    trends.forEach(trend => {
      const month = new Date(trend.created_at).toLocaleDateString('en-US', { month: 'short' })
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { predictions: 0, correct: 0 })
      }
      const data = monthlyData.get(month)
      data.predictions++
      if (trend.accuracy === true) {
        data.correct++
      }
    })

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      accuracy: data.predictions > 0 ? data.correct / data.predictions : 0,
      predictions: data.predictions
    }))
  }

  // Helper function to calculate recent performance
  const calculateRecentPerformance = (predictions: any[]) => {
    const dailyData = new Map()
    
    predictions.slice(0, 50).forEach(prediction => {
      const date = new Date(prediction.created_at).toISOString().split('T')[0]
      if (!dailyData.has(date)) {
        dailyData.set(date, { predictions: 0, correct: 0 })
      }
      const data = dailyData.get(date)
      data.predictions++
      if (prediction.accuracy === true) {
        data.correct++
      }
    })

    return Array.from(dailyData.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5)
      .map(([date, data]) => ({
        date,
        accuracy: data.predictions > 0 ? data.correct / data.predictions : 0,
        predictions: data.predictions
      }))
  }

  const keyMetrics = useMemo(() => {
    return [
      {
        title: "Overall Accuracy",
        value: `${(analyticsData.accuracyRate * 100).toFixed(1)}%`,
        icon: Target,
        color: "text-primary",
        bgColor: "bg-primary/5",
        trend: "+2.3%"
      },
      {
        title: "Total Predictions",
        value: analyticsData.totalPredictions?.toLocaleString() || "0",
        icon: BarChart3,
        color: "text-accent",
        bgColor: "bg-accent/5",
        trend: "+12.5%"
      },
      {
        title: "Win Streak",
        value: analyticsData.winStreak || "0",
        icon: TrendingUp,
        color: "text-secondary",
        bgColor: "bg-secondary/5",
        trend: "Current"
      },
      {
        title: "Avg Confidence",
        value: `${((analyticsData.avgConfidence || 0) * 100).toFixed(0)}%`,
        icon: Activity,
        color: "text-primary",
        bgColor: "bg-primary/5",
        trend: "+1.8%"
      }
    ]
  }, [analyticsData])

  if (loading) {
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
            Advanced Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Deep insights into team performance, predictions, and betting trends
          </p>
        </div>

        {/* Sport Filter */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Filter by Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supportedSports.map((sport) => {
                const config = SportConfigManager.getSportConfig(sport)
                return (
                  <Button
                    key={sport}
                    variant={selectedSport === sport ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSport(sport)}
                    className="gap-2"
                  >
                    <span>{config?.icon}</span>
                    {config?.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {keyMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <Card key={index} className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                      <p className="text-xs text-muted-foreground">{metric.trend}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <Icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="sports" className="gap-2">
              <Users className="h-4 w-4" />
              Sports
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trend Chart */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle>Monthly Performance Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.monthlyTrend?.map((month: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.month}</span>
                          <span className="text-sm text-muted-foreground">
                            {(month.accuracy * 100).toFixed(1)}% accuracy
                          </span>
                        </div>
                        <Progress value={month.accuracy * 100} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {month.predictions} predictions
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Performance */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle>Recent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.recentPerformance?.map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div>
                          <div className="font-medium">{day.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {day.predictions} predictions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {(day.accuracy * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">accuracy</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Prediction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/20">
                      <div className="text-2xl font-bold text-primary">
                        {((analyticsData.accuracyRate || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Accuracy</div>
                      <div className="text-xs text-accent">Based on recent data</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/20">
                      <div className="text-2xl font-bold text-accent">
                        {analyticsData.totalPredictions?.toLocaleString() || "0"}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Predictions</div>
                      <div className="text-xs text-accent">All time</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/20">
                      <div className="text-2xl font-bold text-secondary">
                        {analyticsData.winStreak || "0"}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                      <div className="text-xs text-accent">Best this season</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sports" className="space-y-6">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Sport-by-Sport Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.sportBreakdown?.map((sport: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold">{sport.sport}</span>
                        </div>
                        <div>
                          <div className="font-medium">{sport.sport}</div>
                          <div className="text-sm text-muted-foreground">
                            {sport.predictions} predictions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {(sport.accuracy * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Prediction Accuracy</span>
                      <span className="text-sm font-bold text-primary">
                        {((analyticsData.accuracyRate || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(analyticsData.accuracyRate || 0) * 100} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm font-bold text-accent">
                        {((analyticsData.avgConfidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={(analyticsData.avgConfidence || 0) * 100} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Win Streak</span>
                      <span className="text-sm font-bold text-secondary">
                        {analyticsData.winStreak || "0"}
                      </span>
                    </div>
                    <Progress value={Math.min((analyticsData.winStreak || 0) * 10, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analytics
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Detailed Charts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
