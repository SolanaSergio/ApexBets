"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiClient, type AnalyticsStats } from "@/lib/api-client"
import { BarChart3, Target, TrendingUp, Users } from "lucide-react"

export function StatsCards() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await apiClient.getAnalyticsStats()
        setStats(data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <StatsCardsSkeleton />
  }

  const accuracyPercentage = stats ? Math.round(stats.accuracy_rate * 100) : 0
  const recentPredictions =
    stats?.recent_performance.daily_stats.reduce((sum, day) => sum + day.predictions_made, 0) || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Games</CardTitle>
          <BarChart3 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold stats-highlight">{stats?.total_games.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">Tracked across all leagues</p>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Predictions Made</CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold stats-highlight">{stats?.total_predictions.toLocaleString() || 0}</div>
          <p className="text-xs text-muted-foreground">{recentPredictions} in last 30 days</p>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold stats-highlight">{accuracyPercentage}%</div>
            <Badge variant={accuracyPercentage >= 60 ? "default" : "secondary"} className="text-xs">
              {accuracyPercentage >= 60 ? "Good" : "Improving"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Overall prediction accuracy</p>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold stats-highlight">30</div>
          <p className="text-xs text-muted-foreground">NBA teams tracked</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded w-24"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-16 mb-2"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
