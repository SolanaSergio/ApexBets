"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Target, Activity } from "lucide-react"
import { usePlayerStats } from "@/components/data/real-time-provider"
import { Player } from "@/lib/api-client-database-first"

interface PlayerTrendsProps {
  selectedPlayer?: Player | null
}

export default function PlayerTrends({ selectedPlayer }: PlayerTrendsProps) {
  const { stats: playerStats, loading } = usePlayerStats(selectedPlayer?.id)

  const trendsData = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return []

    // For simplicity, let's just use the last 10 games for trends
    return playerStats.slice(-10).map((stat, index) => ({
      date: `Game ${index + 1}`,
      points: stat.pts,
      rebounds: stat.reb,
      assists: stat.ast,
    }))
  }, [playerStats])

  const calculateAverages = useCallback((data: any[]) => {
    if (data.length === 0) return { points: 0, rebounds: 0, assists: 0 }

    const totalPoints = data.reduce((sum, d) => sum + d.points, 0)
    const totalRebounds = data.reduce((sum, d) => sum + d.rebounds, 0)
    const totalAssists = data.reduce((sum, d) => sum + d.assists, 0)

    return {
      points: (totalPoints / data.length).toFixed(1),
      rebounds: (totalRebounds / data.length).toFixed(1),
      assists: (totalAssists / data.length).toFixed(1),
    }
  }, [])

  const averages = calculateAverages(trendsData)

  if (!selectedPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
            <p className="text-sm">Choose a player from the search above to view their trends</p>
          </div>
        </CardContent>
      </Card>
    )
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
