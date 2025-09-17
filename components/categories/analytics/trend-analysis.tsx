"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, BarChart3 } from "lucide-react"

interface TrendAnalysisProps {
  team: string
  timeRange: string
  sport: string
  league: string
}

export default function TrendAnalysis({ team, timeRange, sport, league }: TrendAnalysisProps) {
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Use simpleApiClient for consistent error handling and caching
      const response = await fetch(`/api/analytics/trend-analysis?sport=${sport}&league=${league}&team=${team}&timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setTrendData(data.trends || [])
      } else {
        console.error('API returned error:', data.error)
        setTrendData([])
      }
    } catch (error) {
      console.error('Error fetching trend data:', error)
      setTrendData([])
    } finally {
      setLoading(false)
    }
  }, [team, timeRange, sport, league])

  useEffect(() => {
    fetchTrendData()
  }, [fetchTrendData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Market Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="volume" stroke="#8884d8" strokeWidth={2} name="Volume" />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} name="Value" />
                <Line type="monotone" dataKey="accuracy" stroke="#ffc658" strokeWidth={2} name="Accuracy" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">
                  {trendData.reduce((acc, curr) => acc + curr.volume, 0).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Value</p>
                <p className="text-2xl font-bold">
                  {trendData.length > 0 ? 
                    (trendData.reduce((acc, curr) => acc + curr.value, 0) / trendData.length).toFixed(1) + '%' : 
                    '0%'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trend Direction</p>
                <p className="text-2xl font-bold">
                  {trendData.length > 1 ? 
                    (trendData[trendData.length - 1]?.value > trendData[0]?.value ? '↗' : '↘') : 
                    '→'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
