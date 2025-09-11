"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, DollarSign } from "lucide-react"

interface OddsAnalysisChartProps {
  team: string
  timeRange: string
  sport: string
  league: string
}

export default function OddsAnalysisChart({ team, timeRange, sport, league }: OddsAnalysisChartProps) {
  const [oddsData, setOddsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOddsData()
  }, [team, timeRange, sport, league])

  const fetchOddsData = async () => {
    try {
      setLoading(true)
      
      // Fetch real odds data from API
      const response = await fetch(`/api/analytics/odds-analysis?sport=${sport}&league=${league}&team=${team}&timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setOddsData(data.odds || [])
      } else {
        console.error('API returned error:', data.error)
        setOddsData([])
      }
    } catch (error) {
      console.error('Error fetching odds data:', error)
      setOddsData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Odds Analysis</CardTitle>
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
            Odds Movement Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={oddsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="homeOdds" stroke="#8884d8" strokeWidth={2} name="Home Odds" />
                <Line type="monotone" dataKey="awayOdds" stroke="#82ca9d" strokeWidth={2} name="Away Odds" />
                <Line type="monotone" dataKey="total" stroke="#ffc658" strokeWidth={2} name="Total" />
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
                <p className="text-sm font-medium text-muted-foreground">Avg Home Odds</p>
                <p className="text-2xl font-bold">
                  {oddsData.length > 0 ? 
                    (oddsData.reduce((acc, curr) => acc + curr.homeOdds, 0) / oddsData.length).toFixed(1) : 
                    '0'
                  }
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
                <p className="text-sm font-medium text-muted-foreground">Avg Away Odds</p>
                <p className="text-2xl font-bold">
                  {oddsData.length > 0 ? 
                    (oddsData.reduce((acc, curr) => acc + curr.awayOdds, 0) / oddsData.length).toFixed(1) : 
                    '0'
                  }
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
                <p className="text-sm font-medium text-muted-foreground">Avg Total</p>
                <p className="text-2xl font-bold">
                  {oddsData.length > 0 ? 
                    (oddsData.reduce((acc, curr) => acc + curr.total, 0) / oddsData.length).toFixed(1) : 
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
