"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts"

interface TeamPerformanceChartProps {
  team: string
  timeRange: string
}

const performanceData = [
  { date: "2024-01-01", wins: 15, losses: 5, pointsFor: 112.5, pointsAgainst: 108.2, efficiency: 0.75 },
  { date: "2024-01-08", wins: 17, losses: 6, pointsFor: 114.2, pointsAgainst: 107.8, efficiency: 0.78 },
  { date: "2024-01-15", wins: 19, losses: 8, pointsFor: 115.8, pointsAgainst: 109.1, efficiency: 0.76 },
  { date: "2024-01-22", wins: 22, losses: 9, pointsFor: 113.9, pointsAgainst: 106.5, efficiency: 0.81 },
  { date: "2024-01-29", wins: 24, losses: 11, pointsFor: 116.3, pointsAgainst: 108.7, efficiency: 0.79 },
]

export function TeamPerformanceChart({ team, timeRange }: TeamPerformanceChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Win/Loss Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              wins: {
                label: "Wins",
                color: "hsl(var(--chart-1))",
              },
              losses: {
                label: "Losses",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="wins" stroke="var(--color-wins)" strokeWidth={2} />
                <Line type="monotone" dataKey="losses" stroke="var(--color-losses)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scoring Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              pointsFor: {
                label: "Points For",
                color: "hsl(var(--chart-3))",
              },
              pointsAgainst: {
                label: "Points Against",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pointsFor" fill="var(--color-pointsFor)" />
                <Bar dataKey="pointsAgainst" fill="var(--color-pointsAgainst)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
