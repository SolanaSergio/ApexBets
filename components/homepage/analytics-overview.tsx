"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { databaseFirstApiClient } from "@/lib/api-client-database-first"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { BarChart3, Target, TrendingUp, Activity } from "lucide-react"

interface AnalyticsData {
  totalGames: number
  liveGames: number
  accuracyRate: number
  totalPredictions: number
  trendingUp: boolean
}

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalGames: 0,
    liveGames: 0,
    accuracyRate: 0,
    totalPredictions: 0,
    trendingUp: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const supportedSports = SportConfigManager.getSupportedSports()
      
      let totalGames = 0
      let liveGames = 0
      let totalPredictions = 0
      
      // Aggregate data across all sports
      for (const sport of supportedSports) {
        try {
          const [games, live, predictions] = await Promise.all([
            databaseFirstApiClient.getGames({ sport, limit: 100 }),
            databaseFirstApiClient.getGames({ sport, status: 'in_progress' }),
            databaseFirstApiClient.getPredictions({ sport, limit: 50 })
          ])
          
          totalGames += games.length
          liveGames += live.length
          totalPredictions += predictions.length
        } catch (error) {
          console.error(`Error loading analytics for ${sport}:`, error)
        }
      }
      
      // Calculate accuracy rate
      let accuracyRate = 0
      try {
        const allPredictions = await databaseFirstApiClient.getPredictions({ limit: 100 })
        if (allPredictions && allPredictions.length > 0) {
          const correctPredictions = allPredictions.filter(p => p.accuracy === true).length
          accuracyRate = Math.round((correctPredictions / allPredictions.length) * 100)
        }
      } catch (error) {
        console.warn('Could not calculate accuracy rate:', error)
      }
      
      setAnalytics({
        totalGames,
        liveGames,
        accuracyRate,
        totalPredictions,
        trendingUp: accuracyRate > 75
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: Activity,
      title: "Live Games",
      value: analytics.liveGames,
      subtitle: "Active now",
      color: "text-destructive",
      bgColor: "bg-destructive/5",
      borderColor: "border-destructive/20"
    },
    {
      icon: Target,
      title: "Accuracy Rate",
      value: `${analytics.accuracyRate}%`,
      subtitle: "Prediction success",
      color: "text-accent",
      bgColor: "bg-accent/5",
      borderColor: "border-accent/20"
    },
    {
      icon: BarChart3,
      title: "Total Predictions",
      value: analytics.totalPredictions.toLocaleString(),
      subtitle: "AI insights generated",
      color: "text-primary",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20"
    },
    {
      icon: TrendingUp,
      title: "Performance",
      value: analytics.trendingUp ? "↗ Rising" : "→ Stable",
      subtitle: "Overall trend",
      color: analytics.trendingUp ? "text-accent" : "text-muted-foreground",
      bgColor: analytics.trendingUp ? "bg-accent/5" : "bg-muted/5",
      borderColor: analytics.trendingUp ? "border-accent/20" : "border-muted/20"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
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
                      {analytics.trendingUp ? "↗" : "→"}
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
                <span className="text-sm font-medium text-accent">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-sm font-medium text-accent">+8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall</span>
                <span className="text-sm font-medium text-foreground">{analytics.accuracyRate}%</span>
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
                <span className="text-sm font-medium text-foreground">{analytics.totalGames}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sports Covered</span>
                <span className="text-sm font-medium text-foreground">
                  {SportConfigManager.getSupportedSports().length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Data Points</span>
                <span className="text-sm font-medium text-foreground">
                  {(analytics.totalGames * 2).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
