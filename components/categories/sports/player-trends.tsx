"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Target, Activity } from "lucide-react"

interface PlayerTrendsProps {
  playerName: string
  timeRange: string
  sport: string
  league: string
}

export default function PlayerTrends({ playerName, timeRange, sport, league }: PlayerTrendsProps) {
  const [trendsData, setTrendsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrendsData()
  }, [playerName, timeRange, sport, league, fetchTrendsData])

  const fetchTrendsData = async () => {
    try {
      setLoading(true)
      
      // Fetch real player trends data from API
      const response = await fetch(`/api/analytics/player-analytics?sport=${sport}&league=${league}&player=${playerName}&timeRange=${timeRange}`)
      const data = await response.json()
      
      setTrendsData(data.trends || [])
    } catch (error) {
      console.error('Error fetching player trends:', error)
      setTrendsData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Trends</CardTitle>
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
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="points" stroke="#8884d8" strokeWidth={2} name="Points" />
                <Line type="monotone" dataKey="rebounds" stroke="#82ca9d" strokeWidth={2} name="Rebounds" />
                <Line type="monotone" dataKey="assists" stroke="#ffc658" strokeWidth={2} name="Assists" />
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
                <p className="text-sm font-medium text-muted-foreground">Avg Points</p>
                <p className="text-2xl font-bold">
                  {trendsData.length > 0 ? 
                    (trendsData.reduce((acc, curr) => acc + curr.points, 0) / trendsData.length).toFixed(1) : 
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
                <p className="text-sm font-medium text-muted-foreground">Avg Rebounds</p>
                <p className="text-2xl font-bold">
                  {trendsData.length > 0 ? 
                    (trendsData.reduce((acc, curr) => acc + curr.rebounds, 0) / trendsData.length).toFixed(1) : 
                    '0'
                  }
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Assists</p>
                <p className="text-2xl font-bold">
                  {trendsData.length > 0 ? 
                    (trendsData.reduce((acc, curr) => acc + curr.assists, 0) / trendsData.length).toFixed(1) : 
                    '0'
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
