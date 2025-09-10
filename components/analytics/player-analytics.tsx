"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

interface PlayerAnalyticsProps {
  team: string
  timeRange: string
}

export function PlayerAnalytics({ team, timeRange }: PlayerAnalyticsProps) {
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopPerformers()
  }, [team, timeRange])

  const fetchTopPerformers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/top-performers?team=${team}&timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setTopPerformers(data.players || [])
      }
    } catch (error) {
      console.error('Error fetching top performers:', error)
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex space-x-4 text-sm">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No player data available
            </div>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((player, index) => (
                <div key={player.id || index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {player.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-sm text-muted-foreground">{player.team}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-4 text-sm">
                      <div>
                        <div className="font-semibold">{player.ppg || 0}</div>
                        <div className="text-muted-foreground">PPG</div>
                      </div>
                      <div>
                        <div className="font-semibold">{player.rpg || 0}</div>
                        <div className="text-muted-foreground">RPG</div>
                      </div>
                      <div>
                        <div className="font-semibold">{player.apg || 0}</div>
                        <div className="text-muted-foreground">APG</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {((player.efficiency || 0) * 100).toFixed(1)}% EFF
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
