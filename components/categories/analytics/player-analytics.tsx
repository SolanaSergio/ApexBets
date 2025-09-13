"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { User, TrendingUp, Target } from "lucide-react"

interface PlayerAnalyticsProps {
  team: string
  timeRange: string
  sport: string
  league: string
}

export default function PlayerAnalytics({ team, timeRange, sport, league }: PlayerAnalyticsProps) {
  const [playerData, setPlayerData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      
      // Fetch real player analytics data from API
      const params = new URLSearchParams({
        sport: sport,
        timeRange: timeRange
      })
      if (league) params.set('league', league)
      if (team && team !== 'all') params.set('team', team)
      
      const response = await fetch(`/api/analytics/player-analytics?${params}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Transform the data for the chart
        const chartData = data.players?.map((player: any) => ({
          id: player.id,
          name: player.name,
          team: player.team,
          position: player.position,
          points: player.points || 0,
          rebounds: player.rebounds || 0,
          assists: player.assists || 0,
          steals: player.steals || 0,
          blocks: player.blocks || 0,
          gamesPlayed: player.gamesPlayed || 0,
          minutesPerGame: player.minutesPerGame || 0,
          efficiency: player.efficiency || 0,
          rank: player.rank || 0
        })) || []
        
        setPlayerData(chartData)
      } else {
        console.error('API returned error:', data.error)
        setPlayerData([])
      }
    } catch (error) {
      console.error('Error fetching player data:', error)
      setPlayerData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerData()
  }, [team, timeRange, sport, league])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Analytics</CardTitle>
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
            <User className="h-5 w-5" />
            Top Performing Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playerData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="#8884d8" name="Points" />
                <Bar dataKey="rebounds" fill="#82ca9d" name="Rebounds" />
                <Bar dataKey="assists" fill="#ffc658" name="Assists" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Scorer</p>
                <p className="text-2xl font-bold">
                  {playerData.length > 0 ? playerData[0]?.name : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {playerData.length > 0 ? playerData[0]?.points + ' PPG' : ''}
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
                <p className="text-sm font-medium text-muted-foreground">Top Rebounder</p>
                <p className="text-2xl font-bold">
                  {playerData.length > 0 ? playerData.sort((a, b) => b.rebounds - a.rebounds)[0]?.name : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {playerData.length > 0 ? playerData.sort((a, b) => b.rebounds - a.rebounds)[0]?.rebounds + ' RPG' : ''}
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
                <p className="text-sm font-medium text-muted-foreground">Top Assister</p>
                <p className="text-2xl font-bold">
                  {playerData.length > 0 ? playerData.sort((a, b) => b.assists - a.assists)[0]?.name : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {playerData.length > 0 ? playerData.sort((a, b) => b.assists - a.assists)[0]?.assists + ' APG' : ''}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
