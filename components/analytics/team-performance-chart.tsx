"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface TeamPerformanceChartProps {
  team: string
  timeRange: string
  sport?: string
  league?: string
}

export function TeamPerformanceChart({ team, timeRange, sport = 'basketball', league }: TeamPerformanceChartProps) {
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeamPerformance()
  }, [team, timeRange])

  const fetchTeamPerformance = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        team,
        timeRange,
        sport
      })
      if (league) params.set('league', league)
      
      const response = await fetch(`/api/analytics/team-performance?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (!data.performance || data.performance.length === 0) {
          console.warn(`No performance data available for ${team} in ${sport}`)
          setPerformanceData([])
        } else {
          setPerformanceData(data.performance)
        }
      } else {
        console.error('Failed to fetch team performance:', response.statusText)
        setPerformanceData([])
      }
    } catch (error) {
      console.error('Error fetching team performance:', error)
      setPerformanceData([])
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (performanceData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">No performance data available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground">No performance data available</div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
