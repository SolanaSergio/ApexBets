"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient, type Game } from "@/lib/api-client"
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"

export function DashboardOverview() {
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  const { isConnected, lastUpdate, gameUpdates } = useRealTimeUpdates()

  useEffect(() => {
    fetchGames()
  }, [])

  useEffect(() => {
    if (gameUpdates.length > 0) {
      setLiveGames((prev) => {
        const updated = [...prev]
        gameUpdates.forEach((update) => {
          const index = updated.findIndex((game) => game.id === update.id)
          if (index >= 0) {
            updated[index] = update
          }
        })
        return updated
      })
    }
  }, [gameUpdates])

  async function fetchGames() {
    try {
      setLoading(true)

      // Fetch upcoming games
      const upcoming = await apiClient.getGames({
        status: "scheduled",
        limit: 10,
      })

      // Fetch live games
      const live = await apiClient.getGames({
        status: "in_progress",
        limit: 5,
      })

      setUpcomingGames(upcoming)
      setLiveGames(live)
    } catch (error) {
      console.error("Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardOverviewSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Live updates connected" : "Connecting..."}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">Last update: {lastUpdate.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="live-indicator h-2 w-2 rounded-full"></div>
              <span>Live Games</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchGames}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveGames.map((game) => (
                <LiveGameCard key={game.id} game={game} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Games */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Upcoming Games</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchGames}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming games scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingGames.map((game) => (
                <UpcomingGameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LiveGameCard({ game }: { game: Game }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
      <div className="flex items-center space-x-4">
        <div className="live-indicator h-3 w-3 rounded-full"></div>
        <div>
          <div className="font-semibold">
            {game.away_team?.name} @ {game.home_team?.name}
          </div>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>Live</span>
          </div>
        </div>
      </div>
      <div className="text-right">
        {game.home_score !== null && game.away_score !== null ? (
          <div className="font-mono text-lg font-bold">
            {game.away_score} - {game.home_score}
          </div>
        ) : (
          <Badge variant="secondary">In Progress</Badge>
        )}
      </div>
    </div>
  )
}

function UpcomingGameCard({ game }: { game: Game }) {
  const gameDate = new Date(game.game_date)

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border card-hover">
      <div className="flex items-center space-x-4">
        <div className="text-center min-w-[60px]">
          <div className="text-sm font-medium">{format(gameDate, "MMM")}</div>
          <div className="text-lg font-bold text-primary">{format(gameDate, "d")}</div>
        </div>
        <div>
          <div className="font-semibold">
            {game.away_team?.name} @ {game.home_team?.name}
          </div>
          <div className="text-sm text-muted-foreground flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{format(gameDate, "h:mm a")}</span>
            </span>
            {game.venue && (
              <span className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{game.venue}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      <Badge variant="outline">{game.status}</Badge>
    </div>
  )
}

function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
