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
      <Card className="card-hover-enhanced animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Games</CardTitle>
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold stats-highlight mb-1">
            {stats?.total_games.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">Tracked across all leagues</p>
          <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" style={{ width: '75%' }} />
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover-enhanced animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Predictions Made</CardTitle>
          <div className="p-2 rounded-lg bg-accent/10">
            <Target className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold stats-highlight mb-1">
            {stats?.total_predictions.toLocaleString() || 0}
          </div>
          <p className="text-xs text-muted-foreground">{recentPredictions} in last 30 days</p>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600 font-medium">+12% this week</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover-enhanced animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
          <div className="p-2 rounded-lg bg-green-100">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-2">
            <div className="text-3xl font-bold stats-highlight">{accuracyPercentage}%</div>
            <Badge variant={accuracyPercentage >= 60 ? "default" : "secondary"} className="text-xs animate-bounce-gentle">
              {accuracyPercentage >= 60 ? "Excellent" : "Improving"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2">Overall prediction accuracy</p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${accuracyPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover-enhanced animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Teams</CardTitle>
          <div className="p-2 rounded-lg bg-blue-100">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold stats-highlight mb-1">30</div>
          <p className="text-xs text-muted-foreground">NBA teams tracked</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent border-2 border-background animate-float" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">All active</span>
          </div>
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
