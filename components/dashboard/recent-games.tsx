"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient, type Game } from "@/lib/api-client"
import { Clock, Trophy, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { getTeamLogoUrl } from "@/lib/utils/team-utils"

export function RecentGames() {
  const [recentGames, setRecentGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentGames()
  }, [])

  async function fetchRecentGames() {
    try {
      setLoading(true)

      const response = await apiClient.getGames({
        status: "completed",
        limit: 10,
      })

      // Handle both direct array response and wrapped response
      const games = Array.isArray(response) ? response : response.data || []
      setRecentGames(games)
    } catch (error) {
      console.error("Error fetching recent games:", error)
      setRecentGames([]) // Ensure recentGames is always an array
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <RecentGamesSkeleton />
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span>Recent Results</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchRecentGames} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {recentGames.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent games available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentGames.map((game) => (
              <RecentGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentGameCard({ game }: { game: Game }) {
  const gameDate = new Date(game.game_date)
  const homeWon = game.home_score && game.away_score && game.home_score > game.away_score

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border card-hover hover:shadow-md transition-all duration-200">
      <div className="flex items-center space-x-4">
        <div className="text-center min-w-[60px]">
          <div className="text-xs text-muted-foreground">{format(gameDate, "MMM d")}</div>
          <div className="text-xs text-muted-foreground">{format(gameDate, "h:mm a")}</div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {/* Away Team */}
            <div className="flex items-center space-x-2">
              <img 
                src={getTeamLogoUrl(game.away_team?.name || '')} 
                alt={game.away_team?.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className={`font-medium text-sm ${!homeWon ? "stats-highlight" : ""}`}>
                {game.away_team?.name}
              </span>
            </div>
            
            <span className="text-muted-foreground text-sm">@</span>
            
            {/* Home Team */}
            <div className="flex items-center space-x-2">
              <img 
                src={getTeamLogoUrl(game.home_team?.name || '')} 
                alt={game.home_team?.name}
                className="h-6 w-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className={`font-medium text-sm ${homeWon ? "stats-highlight" : ""}`}>
                {game.home_team?.name}
              </span>
            </div>
          </div>

          {game.venue && <div className="text-xs text-muted-foreground mt-1">{game.venue}</div>}
        </div>
      </div>

      <div className="text-right">
        {game.home_score !== null && game.away_score !== null ? (
          <div className="font-mono text-lg font-bold">
            <span className={!homeWon ? "stats-highlight" : ""}>{game.away_score}</span>
            <span className="text-muted-foreground mx-1">-</span>
            <span className={homeWon ? "stats-highlight" : ""}>{game.home_score}</span>
          </div>
        ) : (
          <Badge variant="secondary">Final</Badge>
        )}
      </div>
    </div>
  )
}

function RecentGamesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-muted rounded w-32"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div className="min-w-[60px] space-y-1">
                  <div className="h-3 bg-muted rounded w-12"></div>
                  <div className="h-3 bg-muted rounded w-10"></div>
                </div>
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
  )
}
