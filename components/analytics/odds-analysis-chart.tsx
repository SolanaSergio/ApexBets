"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface OddsAnalysisChartProps {
  team: string
  timeRange: string
}

interface OddsDataPoint {
  date: string
  avgOdds: number
  impliedProb: number
  actualWin: number
  value: number
}

interface ValueOpportunity {
  game: string
  impliedProb: number
  predictedProb: number
  value: number
  odds: string
}

export function OddsAnalysisChart({ team, timeRange }: OddsAnalysisChartProps) {
  const [oddsData, setOddsData] = useState<OddsDataPoint[]>([])
  const [valueOpportunities, setValueOpportunities] = useState<ValueOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOddsData()
  }, [team, timeRange])

  const fetchOddsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch odds analysis data
      const oddsResponse = await fetch(`/api/analytics/odds-analysis?team=${team}&timeRange=${timeRange}`)
      if (!oddsResponse.ok) {
        throw new Error('Failed to fetch odds data')
      }
      const oddsResult = await oddsResponse.json()
      setOddsData(oddsResult.data || [])

      // Fetch value betting opportunities
      const valueResponse = await fetch(`/api/value-bets?team=${team}&min_value=0.1`)
      if (!valueResponse.ok) {
        throw new Error('Failed to fetch value opportunities')
      }
      const valueResult = await valueResponse.json()
      setValueOpportunities(valueResult.opportunities || [])

    } catch (err) {
      console.error('Error fetching odds data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Value Betting Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Implied Probability vs Actual Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
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
            <div className="text-red-500 mb-2">Error loading odds data</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Value Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Current Value Betting Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {valueOpportunities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No value betting opportunities found for {team}
            </div>
          ) : (
            <div className="space-y-4">
              {valueOpportunities.map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-semibold">{opportunity.game}</div>
                    <div className="text-sm text-muted-foreground">
                      Implied: {(opportunity.impliedProb * 100).toFixed(1)}% | Predicted:{" "}
                      {(opportunity.predictedProb * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-1">
                      {(opportunity.value * 100).toFixed(1)}% Value
                    </Badge>
                    <div className="text-sm font-mono">{opportunity.odds}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Odds vs Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Implied Probability vs Actual Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {oddsData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No odds data available for {team}
            </div>
          ) : (
            <ChartContainer
              config={{
                impliedProb: {
                  label: "Implied Probability",
                  color: "hsl(var(--chart-1))",
                },
                actualWin: {
                  label: "Actual Win Rate",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={oddsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0.4, 0.8]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="impliedProb" stroke="var(--color-impliedProb)" strokeWidth={2} />
                  <Line type="monotone" dataKey="actualWin" stroke="var(--color-actualWin)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
