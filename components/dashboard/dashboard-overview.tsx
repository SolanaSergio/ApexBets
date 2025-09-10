"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiClient, type Game } from "@/lib/api-client"
import { Calendar, Clock, MapPin, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { TeamLogo } from "@/components/ui/sports-image"
import { SportsLeague } from "@/lib/services/image-service"

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
  const formatQuarter = (quarter?: number, timeRemaining?: string) => {
    if (!quarter) return "Q1"
    if (quarter > 4) return `OT${quarter - 4}`
    return `Q${quarter}`
  }

  const getPossessionIcon = (possession?: string) => {
    if (!possession) return null
    if (possession === game.home_team?.abbreviation) return "🏠"
    if (possession === game.away_team?.abbreviation) return "✈️"
    return "🏀"
  }

  const getScoreDifferential = () => {
    if (!game.away_score || !game.home_score) return 0
    return game.away_score - game.home_score
  }

  const isAwayWinning = getScoreDifferential() > 0
  const isHomeWinning = getScoreDifferential() < 0
  const isTied = getScoreDifferential() === 0

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/50 dark:to-orange-950/50">
      <CardContent className="p-3 md:p-6">
        {/* Mobile Layout - Stacked */}
        <div className="block md:hidden space-y-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></div>
              </div>
              <Badge variant="destructive" className="animate-pulse text-xs">
                LIVE
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {game.league?.toUpperCase()} • {game.sport?.toUpperCase()}
            </div>
          </div>

          {/* Game Time and Possession */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {game.quarter && game.time_remaining && (
                <Badge variant="outline" className="text-xs">
                  {formatQuarter(game.quarter)} - {game.time_remaining}
                </Badge>
              )}
              {game.possession && game.quarter && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{getPossessionIcon(game.possession)}</span>
                  <span>{game.possession}</span>
                </div>
              )}
            </div>
          </div>

          {/* Teams Section */}
          <div className="space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <TeamLogo
                    teamName={game.away_team?.name || ''}
                    league={game.sport || 'NBA'}
                    alt={`${game.away_team?.name || 'Away Team'} logo`}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg shadow-sm"
                  />
                  {game.possession === game.away_team?.abbreviation && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">⚡</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate group-hover:text-primary transition-colors duration-200 ${isAwayWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {game.away_team?.city ? `${game.away_team.city} ` : ''}{game.away_team?.name}
                  </div>
                  {game.away_team?.record && (
                    <div className="text-xs text-muted-foreground">
                      Record: {game.away_team.record}
                    </div>
                  )}
                </div>
                <div className={`text-2xl font-bold font-mono tabular-nums ${isAwayWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {game.away_score ?? 0}
                </div>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <TeamLogo
                    teamName={game.home_team?.name || ''}
                    league={game.sport || 'NBA'}
                    alt={`${game.home_team?.name || 'Home Team'} logo`}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg shadow-sm"
                  />
                  {game.possession === game.home_team?.abbreviation && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">⚡</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold truncate group-hover:text-primary transition-colors duration-200 ${isHomeWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {game.home_team?.city ? `${game.home_team.city} ` : ''}{game.home_team?.name}
                  </div>
                  {game.home_team?.record && (
                    <div className="text-xs text-muted-foreground">
                      Record: {game.home_team.record}
                    </div>
                  )}
                </div>
                <div className={`text-2xl font-bold font-mono tabular-nums ${isHomeWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {game.home_score ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Score Differential */}
          {!isTied && (
            <div className={`text-xs text-center px-2 py-1 rounded ${isAwayWinning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isAwayWinning ? game.away_team?.name : game.home_team?.name} leads by {Math.abs(getScoreDifferential())}
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute -inset-1 bg-red-500/20 rounded-full animate-ping"></div>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
              {game.quarter && game.time_remaining && (
                <Badge variant="outline" className="text-xs">
                  {formatQuarter(game.quarter)} - {game.time_remaining}
                </Badge>
              )}
              {game.possession && game.quarter && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Poss:</span>
                  <span className="font-semibold">{getPossessionIcon(game.possession)}</span>
                  <span>{game.possession}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {game.league?.toUpperCase()} • {game.sport?.toUpperCase()}
            </div>
          </div>

          {/* Main Game Content for Desktop */}
          <div className="flex items-center justify-between">
            {/* Away Team */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <TeamLogo
                  teamName={game.away_team?.name || ''}
                  league={game.sport as SportsLeague || 'NBA'}
                  alt={`${game.away_team?.name || 'Away Team'} logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200"
                />
                {game.possession === game.away_team?.abbreviation && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">⚡</span>
                  </div>
                )}
              </div>
                <div>
                  <div className={`text-xl font-bold group-hover:text-primary transition-colors duration-200 ${isAwayWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {game.away_team?.city ? `${game.away_team.city} ` : ''}{game.away_team?.name}
                  </div>
                  {game.away_team?.record && (
                    <div className="text-xs text-muted-foreground">
                      Record: {game.away_team.record}
                    </div>
                  )}
                  {game.away_team?.abbreviation && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {game.away_team.abbreviation}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Away Team Stats */}
              {game.away_team_stats && (
                <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 rounded-lg p-2">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.away_team_stats.points || 0}</div>
                    <div className="text-muted-foreground">PTS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.away_team_stats.rebounds || 0}</div>
                    <div className="text-muted-foreground">REB</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.away_team_stats.assists || 0}</div>
                    <div className="text-muted-foreground">AST</div>
                  </div>
                </div>
              )}
            </div>

            {/* Score Display */}
            <div className="px-6 text-center">
              <div className={`text-4xl font-bold font-mono mb-1 ${isTied ? 'text-muted-foreground' : 'text-primary'} group-hover:scale-110 transition-transform duration-200`}>
                {game.away_score ?? 0}
              </div>
              <div className="text-xs text-muted-foreground font-medium">vs</div>
              <div className={`text-4xl font-bold font-mono mt-1 ${isTied ? 'text-muted-foreground' : 'text-primary'} group-hover:scale-110 transition-transform duration-200`}>
                {game.home_score ?? 0}
              </div>

              {/* Score Differential */}
              {!isTied && (
                <div className={`text-xs mt-2 ${isAwayWinning ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(getScoreDifferential()) > 0 && `+${Math.abs(getScoreDifferential())}`}
                </div>
              )}
            </div>

            {/* Home Team */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3 justify-end">
                <div>
                  <div className={`text-xl font-bold text-right group-hover:text-primary transition-colors duration-200 ${isHomeWinning ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {game.home_team?.city ? `${game.home_team.city} ` : ''}{game.home_team?.name}
                  </div>
                  {game.home_team?.record && (
                    <div className="text-xs text-muted-foreground text-right">
                    Record: {game.home_team.record}
                  </div>
                )}
                {game.home_team?.abbreviation && (
                  <Badge variant="secondary" className="text-xs mt-1 ml-auto">
                    {game.home_team.abbreviation}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <TeamLogo
                  teamName={game.home_team?.name || ''}
                  league={game.sport || 'NBA'}
                  alt={`${game.home_team?.name || 'Home Team'} logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-200"
                />
                {game.possession === game.home_team?.abbreviation && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white">⚡</span>
                  </div>
                )}
              </div>
            </div>

              {/* Home Team Stats */}
              {game.home_team_stats && (
                <div className="grid grid-cols-3 gap-2 text-xs bg-muted/30 rounded-lg p-2">
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.home_team_stats.points || 0}</div>
                    <div className="text-muted-foreground">PTS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.home_team_stats.rebounds || 0}</div>
                    <div className="text-muted-foreground">REB</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-primary">{game.home_team_stats.assists || 0}</div>
                    <div className="text-muted-foreground">AST</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Game Info - Same for both layouts */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {game.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {game.venue}
              </div>
            )}
            {game.broadcast && (
              <div className="flex items-center gap-1">
                <span>📺 {game.broadcast}</span>
              </div>
            )}
            {game.attendance && (
              <div className="flex items-center gap-1">
                <span>👥 {game.attendance.toLocaleString()} fans</span>
              </div>
            )}
          </div>

          {/* Last Play */}
          {game.last_play && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="text-xs font-medium text-amber-800 dark:text-amber-200">
                🔄 Last Play: {game.last_play}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
            <TeamLogo 
              teamName={game.away_team?.name || ''} 
              alt={game.away_team?.name || 'Away Team'}
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="font-semibold text-lg group-hover:text-primary transition-colors">
              {game.away_team?.name}
            </span>
            <span className="text-muted-foreground">@</span>
            <TeamLogo 
              teamName={game.home_team?.name || ''} 
              alt={game.home_team?.name || 'Home Team'}
              width={24}
              height={24}
              className="h-6 w-6"
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
