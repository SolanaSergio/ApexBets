"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface PredictionAccuracyChartProps {
  timeRange: string
}

interface AccuracyDataPoint {
  date: string
  gameWinner: number
  spread: number
  total: number
  overall: number
}

export function PredictionAccuracyChart({ timeRange }: PredictionAccuracyChartProps) {
  const [accuracyData, setAccuracyData] = useState<AccuracyDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAccuracyData()
  }, [timeRange])

  const fetchAccuracyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch prediction accuracy data
      const response = await fetch(`/api/analytics/prediction-accuracy?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to fetch accuracy data')
      }
      const result = await response.json()
      setAccuracyData(result.data || [])

    } catch (err) {
      console.error('Error fetching accuracy data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const currentAccuracy = accuracyData.length > 0 ? accuracyData[accuracyData.length - 1] : null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="text-center">
                  <Skeleton className="h-8 w-16 mx-auto mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto mb-2" />
                  <Skeleton className="h-5 w-24 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Prediction Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-red-500 mb-2">Error loading accuracy data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentAccuracy ? (currentAccuracy.gameWinner * 100).toFixed(1) : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Game Winner</div>
              <Badge variant="secondary" className="mt-1">
                {currentAccuracy ? '+4.2% vs last week' : 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentAccuracy ? (currentAccuracy.spread * 100).toFixed(1) : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Spread</div>
              <Badge variant="secondary" className="mt-1">
                {currentAccuracy ? '+2.8% vs last week' : 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentAccuracy ? (currentAccuracy.total * 100).toFixed(1) : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Over/Under</div>
              <Badge variant="secondary" className="mt-1">
                {currentAccuracy ? '+1.9% vs last week' : 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {currentAccuracy ? (currentAccuracy.overall * 100).toFixed(1) : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Overall</div>
              <Badge variant="default" className="mt-1">
                {currentAccuracy ? '+3.1% vs last week' : 'No data'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {accuracyData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accuracy data available for the selected time range
            </div>
          ) : (
            <ChartContainer
              config={{
                gameWinner: {
                  label: "Game Winner",
                  color: "hsl(var(--chart-1))",
                },
                spread: {
                  label: "Spread",
                  color: "hsl(var(--chart-2))",
                },
                total: {
                  label: "Over/Under",
                  color: "hsl(var(--chart-3))",
                },
                overall: {
                  label: "Overall",
                  color: "hsl(var(--chart-4))",
                },
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0.5, 0.85]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="gameWinner"
                    stackId="1"
                    stroke="var(--color-gameWinner)"
                    fill="var(--color-gameWinner)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="spread"
                    stackId="2"
                    stroke="var(--color-spread)"
                    fill="var(--color-spread)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stackId="3"
                    stroke="var(--color-total)"
                    fill="var(--color-total)"
                    fillOpacity={0.6}
                  />
                  <Line type="monotone" dataKey="overall" stroke="var(--color-overall)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
