"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Target, Trophy } from "lucide-react"

interface TeamPerformanceChartProps {
  team: string
  timeRange: string
  sport: string
  league: string
}

export default function TeamPerformanceChart({ team, timeRange, sport, league }: TeamPerformanceChartProps) {
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch real performance data from API
      const params = new URLSearchParams({
        sport: sport,
        timeRange: timeRange
      })
      if (league) params.set('league', league)
      if (team && team !== 'all') params.set('team', team)
      
      const response = await fetch(`/api/analytics/team-performance?${params}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Team performance API error:', data.error)
        setPerformanceData([])
        return
      }
      
      // Transform the data for the chart
      const chartData = data.performance?.map((game: any) => ({
        date: game.date,
        winRate: game.won ? 100 : 0,
        points: game.points || 0,
        accuracy: game.accuracy || 0
      })) || []
      
      setPerformanceData(chartData)
    } catch (error) {
      console.error('Error fetching performance data:', error)
      setPerformanceData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [team, timeRange, sport, league, fetchPerformanceData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
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
            Team Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="winRate" stroke="#8884d8" strokeWidth={2} name="Win Rate" />
                <Line type="monotone" dataKey="points" stroke="#82ca9d" strokeWidth={2} name="Points" />
                <Line type="monotone" dataKey="accuracy" stroke="#ffc658" strokeWidth={2} name="Prediction Accuracy" />
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
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">
                  {performanceData.length > 0 ? 
                    (performanceData[performanceData.length - 1]?.winRate || 0).toFixed(1) + '%' : 
                    '0%'
                  }
                </p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Points</p>
                <p className="text-2xl font-bold">
                  {performanceData.length > 0 ? 
                    (performanceData[performanceData.length - 1]?.points || 0).toFixed(1) : 
                    '0'
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prediction Accuracy</p>
                <p className="text-2xl font-bold">
                  {performanceData.length > 0 ? 
                    (performanceData[performanceData.length - 1]?.accuracy || 0).toFixed(1) + '%' : 
                    '0%'
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
