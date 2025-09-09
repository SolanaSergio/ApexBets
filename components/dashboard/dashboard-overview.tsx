"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient, type Game } from "@/lib/api-client"
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { getTeamLogoUrl } from "@/lib/utils/team-utils"

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
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {isConnected ? "Live updates connected" : "Connecting..."}
            </span>
            {isConnected && (
              <Badge variant="default" className="text-xs animate-bounce-gentle">
                Live
              </Badge>
            )}
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchGames} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <Card className="card-hover-enhanced animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <CardTitle className="flex items-center space-x-3">
              <div className="live-indicator h-3 w-3 rounded-full animate-pulse"></div>
              <span className="text-lg">Live Games</span>
              <Badge variant="destructive" className="animate-pulse">
                {liveGames.length} Active
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchGames} className="hover:bg-red-100">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {liveGames.map((game, index) => (
                <div key={game.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <LiveGameCard game={game} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Games */}
      <Card className="card-hover-enhanced animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg">Upcoming Games</span>
            <Badge variant="secondary">
              {upcomingGames.length} Scheduled
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchGames} className="hover:bg-blue-100">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {upcomingGames.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Calendar className="h-8 w-8 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Upcoming Games</h3>
              <p className="text-sm">Check back later for scheduled matches</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingGames.map((game, index) => (
                <div key={game.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <UpcomingGameCard game={game} />
                </div>
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
    <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 transition-all duration-200 group">
      <div className="flex items-center space-x-4">
        <div className="live-indicator h-3 w-3 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src={getTeamLogoUrl(game.away_team?.name || '')} 
              alt={game.away_team?.name}
              className="h-6 w-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {game.away_team?.name}
            </span>
            <span className="text-muted-foreground">@</span>
            <img 
              src={getTeamLogoUrl(game.home_team?.name || '')} 
              alt={game.home_team?.name}
              className="h-6 w-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {game.home_team?.name}
            </span>
          </div>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span>Live</span>
            <Badge variant="destructive" className="text-xs animate-pulse">
              LIVE
            </Badge>
          </div>
        </div>
      </div>
      <div className="text-right">
        {game.home_score !== null && game.away_score !== null ? (
          <div className="font-mono text-2xl font-bold text-primary">
            {game.away_score} - {game.home_score}
          </div>
        ) : (
          <Badge variant="destructive" className="animate-pulse">
            In Progress
          </Badge>
        )}
      </div>
    </div>
  )
}

function UpcomingGameCard({ game }: { game: Game }) {
  const gameDate = new Date(game.game_date)

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group">
      <div className="flex items-center space-x-4">
        <div className="text-center min-w-[60px] p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <div className="text-sm font-medium text-primary">{format(gameDate, "MMM")}</div>
          <div className="text-xl font-bold text-primary">{format(gameDate, "d")}</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src={getTeamLogoUrl(game.away_team?.name || '')} 
              alt={game.away_team?.name}
              className="h-6 w-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {game.away_team?.name}
            </span>
            <span className="text-muted-foreground">@</span>
            <img 
              src={getTeamLogoUrl(game.home_team?.name || '')} 
              alt={game.home_team?.name}
              className="h-6 w-6 object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {game.home_team?.name}
            </span>
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
      <div className="text-right">
        <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {game.status}
        </Badge>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.abs(Math.round((gameDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)))}h away
        </div>
      </div>
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
