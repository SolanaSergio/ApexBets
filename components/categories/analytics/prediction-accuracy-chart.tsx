"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Target, TrendingUp, CheckCircle } from "lucide-react"

interface PredictionAccuracyChartProps {
  team: string
  timeRange: string
  sport: string
  league: string
}

export default function PredictionAccuracyChart({ team, timeRange, sport, league }: PredictionAccuracyChartProps) {
  const [accuracyData, setAccuracyData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccuracyData()
  }, [team, timeRange, sport, league])

  const fetchAccuracyData = async () => {
    try {
      setLoading(true)
      
      // Fetch real prediction accuracy data from API
      const response = await fetch(`/api/analytics/prediction-accuracy?sport=${sport}&league=${league}&team=${team}&timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAccuracyData(data.accuracy || [])
      } else {
        console.error('API returned error:', data.error)
        setAccuracyData([])
      }
    } catch (error) {
      console.error('Error fetching accuracy data:', error)
      setAccuracyData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy</CardTitle>
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
            <Target className="h-5 w-5" />
            Prediction Accuracy Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="accuracy" stroke="#8884d8" strokeWidth={2} name="Accuracy" />
                <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" name="Target" />
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
                <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
                <p className="text-2xl font-bold">
                  {accuracyData.length > 0 ? 
                    (accuracyData.reduce((acc, curr) => acc + curr.accuracy, 0) / accuracyData.length).toFixed(1) + '%' : 
                    '0%'
                  }
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Week</p>
                <p className="text-2xl font-bold">
                  {accuracyData.length > 0 ? 
                    Math.max(...accuracyData.map(d => d.accuracy)).toFixed(1) + '%' : 
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
                <p className="text-sm font-medium text-muted-foreground">Trend</p>
                <p className="text-2xl font-bold">
                  {accuracyData.length > 1 ? 
                    (accuracyData[accuracyData.length - 1]?.accuracy > accuracyData[0]?.accuracy ? '↗' : '↘') : 
                    '→'
                  }
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}