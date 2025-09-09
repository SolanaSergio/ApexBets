"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"

interface OddsAnalysisChartProps {
  team: string
  timeRange: string
}

const oddsData = [
  { date: "2024-01-01", avgOdds: -110, impliedProb: 0.524, actualWin: 0.65, value: 0.126 },
  { date: "2024-01-08", avgOdds: -105, impliedProb: 0.512, actualWin: 0.68, value: 0.168 },
  { date: "2024-01-15", avgOdds: -115, impliedProb: 0.535, actualWin: 0.71, value: 0.175 },
  { date: "2024-01-22", avgOdds: -108, impliedProb: 0.519, actualWin: 0.69, value: 0.171 },
  { date: "2024-01-29", avgOdds: -112, impliedProb: 0.528, actualWin: 0.73, value: 0.202 },
]

const valueOpportunities = [
  { game: "Lakers vs Warriors", impliedProb: 0.45, predictedProb: 0.62, value: 0.17, odds: "+120" },
  { game: "Celtics vs Heat", impliedProb: 0.38, predictedProb: 0.51, value: 0.13, odds: "+165" },
  { game: "Nuggets vs Suns", impliedProb: 0.52, predictedProb: 0.68, value: 0.16, odds: "-108" },
]

export function OddsAnalysisChart({ team, timeRange }: OddsAnalysisChartProps) {
  return (
    <div className="space-y-6">
      {/* Value Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Current Value Betting Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Odds vs Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Implied Probability vs Actual Performance</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
