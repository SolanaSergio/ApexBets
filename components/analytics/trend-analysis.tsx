"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendAnalysisProps {
  team: string
  timeRange: string
}

interface Trend {
  category: string
  trend: "up" | "down" | "neutral"
  value: string
  description: string
  confidence: number
}

interface TrendStats {
  profitableTrends: number
  averageEdge: string
  gamesAnalyzed: number
}

export function TrendAnalysis({ team, timeRange }: TrendAnalysisProps) {
  const [trends, setTrends] = useState<Trend[]>([])
  const [stats, setStats] = useState<TrendStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrendData()
  }, [team, timeRange])

  const fetchTrendData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch trend analysis data
      const response = await fetch(`/api/analytics/trends?team=${team}&timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trend data')
      }
      const result = await response.json()
      setTrends(result.trends || [])
      setStats(result.stats || null)

    } catch (err) {
      console.error('Error fetching trend data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-500"
      case "down":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Trends & Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
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
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-2">Error loading trend data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Trends & Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trend data available for {team}
            </div>
          ) : (
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(trend.trend)}
                    <div>
                      <div className="font-semibold">{trend.category}</div>
                      <div className="text-sm text-muted-foreground">{trend.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>{trend.value}</div>
                    <Badge variant="outline" className="text-xs">
                      {(trend.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {stats ? `${stats.profitableTrends}%` : '--'}
            </div>
            <div className="text-sm text-muted-foreground">Profitable Trends</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {stats ? stats.averageEdge : '--'}
            </div>
            <div className="text-sm text-muted-foreground">Average Edge</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">
              {stats ? stats.gamesAnalyzed : '--'}
            </div>
            <div className="text-sm text-muted-foreground">Games Analyzed</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
