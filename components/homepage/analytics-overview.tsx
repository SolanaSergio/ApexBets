"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRealTimeData, useDashboardStats } from "@/components/data/real-time-provider"
import { BarChart3, Target, TrendingUp, Activity, Zap } from "lucide-react"

export function AnalyticsOverview() {
  const { selectedSport, supportedSports } = useRealTimeData()
  const { stats, loading, error, lastUpdate, isConnected } = useDashboardStats()

  // Calculate trend data for sparklines
  const trendData = useMemo(() => {
    // Mock trend data - in real implementation, this would come from historical data
    const baseValue = stats.accuracy
    return {
      week: baseValue + Math.random() * 10 - 5,
      month: baseValue + Math.random() * 15 - 7,
      overall: baseValue
    }
  }, [stats.accuracy])

  const statCards = [
    {
      icon: Activity,
      title: "Live Games",
      value: stats.liveGames,
      subtitle: "Active now",
      color: "text-destructive",
      bgColor: "bg-destructive/5",
      borderColor: "border-destructive/20"
    },
    {
      icon: Target,
      title: "Accuracy Rate",
      value: `${stats.accuracy}%`,
      subtitle: "Prediction success",
      color: "text-accent",
      bgColor: "bg-accent/5",
      borderColor: "border-accent/20"
    },
    {
      icon: BarChart3,
      title: "Total Predictions",
      value: stats.dataPoints.toLocaleString(),
      subtitle: "AI insights generated",
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20"
    },
    {
      icon: TrendingUp,
      title: "Performance",
      value: stats.accuracy > 75 ? "↗ Rising" : "→ Stable",
      subtitle: "Overall trend",
      color: stats.accuracy > 75 ? "text-accent" : "text-muted-foreground",
      bgColor: stats.accuracy > 75 ? "bg-accent/5" : "bg-muted/5",
      borderColor: stats.accuracy > 75 ? "border-accent/20" : "border-muted/20"
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted rounded"></div>
                    <div className="h-8 w-16 bg-muted rounded"></div>
                    <div className="h-3 w-24 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
        </div>
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <div className="text-destructive text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground">
              Unable to load analytics data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={index} 
              className={`card-modern ${stat.borderColor} hover:border-primary transition-colors`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.title === "Performance" && (
                    <div className={`text-xs px-2 py-1 rounded-full ${stat.bgColor} ${stat.color}`}>
                      {stats.accuracy > 75 ? "↗" : "→"}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 space-y-1">
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {stat.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.subtitle}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Performance Trend</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="text-sm font-medium text-accent">
                  {trendData.week > stats.accuracy ? '+' : ''}{Math.round(trendData.week - stats.accuracy)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-sm font-medium text-accent">
                  {trendData.month > stats.accuracy ? '+' : ''}{Math.round(trendData.month - stats.accuracy)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall</span>
                <span className="text-sm font-medium text-foreground">{stats.accuracy}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Games Tracked</span>
                <span className="text-sm font-medium text-foreground">{stats.totalGames}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sports Covered</span>
                <span className="text-sm font-medium text-foreground">
                  {selectedSport === "all" ? supportedSports.length : 1}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Teams Tracked</span>
                <span className="text-sm font-medium text-foreground">{stats.teamsTracked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Correct Predictions</span>
                <span className="text-sm font-medium text-foreground">{stats.correctPredictions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sport-specific insights */}
      {selectedSport !== "all" && (
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Insights</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.liveGames}</div>
                <div className="text-sm text-muted-foreground">Live Games</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{stats.scheduledGames}</div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.completedGames}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{stats.dataPoints}</div>
                <div className="text-sm text-muted-foreground">Data Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
