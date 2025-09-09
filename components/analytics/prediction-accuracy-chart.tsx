"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Badge } from "@/components/ui/badge"

interface PredictionAccuracyChartProps {
  timeRange: string
}

const accuracyData = [
  { date: "2024-01-01", gameWinner: 0.72, spread: 0.65, total: 0.58, overall: 0.65 },
  { date: "2024-01-08", gameWinner: 0.75, spread: 0.68, total: 0.61, overall: 0.68 },
  { date: "2024-01-15", gameWinner: 0.78, spread: 0.71, total: 0.64, overall: 0.71 },
  { date: "2024-01-22", gameWinner: 0.76, spread: 0.69, total: 0.62, overall: 0.69 },
  { date: "2024-01-29", gameWinner: 0.79, spread: 0.73, total: 0.66, overall: 0.73 },
]

export function PredictionAccuracyChart({ timeRange }: PredictionAccuracyChartProps) {
  const currentAccuracy = accuracyData[accuracyData.length - 1]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(currentAccuracy.gameWinner * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Game Winner</div>
              <Badge variant="secondary" className="mt-1">
                +4.2% vs last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(currentAccuracy.spread * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Spread</div>
              <Badge variant="secondary" className="mt-1">
                +2.8% vs last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(currentAccuracy.total * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Over/Under</div>
              <Badge variant="secondary" className="mt-1">
                +1.9% vs last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(currentAccuracy.overall * 100).toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Overall</div>
              <Badge variant="default" className="mt-1">
                +3.1% vs last week
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
        </CardContent>
      </Card>
    </div>
  )
}
