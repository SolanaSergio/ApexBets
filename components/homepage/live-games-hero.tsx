"use client"

import { useState, useEffect, useMemo } from "react"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TeamLogo } from "@/components/ui/sports-image"
import { useLiveGames, useRealTimeData } from "@/components/data/real-time-provider"
import { ChevronLeft, ChevronRight, Clock, Play } from "lucide-react"
import { format } from "date-fns"

export function LiveGamesHero() {
  const { selectedSport } = useRealTimeData()
  const { games: liveGames, loading, error, lastUpdate } = useLiveGames()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)

  // Filter games based on selected sport
  const filteredGames = useMemo(() => {
    if (selectedSport === "all") return liveGames
    return liveGames.filter(game => game.sport === selectedSport)
  }, [liveGames, selectedSport])

  // Auto-advance through games
  useEffect(() => {
    if (!autoAdvance || filteredGames.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredGames.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(interval)
  }, [autoAdvance, filteredGames.length])

  const nextGame = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(filteredGames.length, 1))
  }

  const prevGame = () => {
    setCurrentIndex((prev) => prev === 0 ? Math.max(filteredGames.length - 1, 0) : prev - 1)
  }

  const currentGame = filteredGames[currentIndex]

  if (loading) {
    return (
      <div className="h-80 card-modern animate-pulse">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-48 bg-muted rounded mx-auto"></div>
            <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-80 card-modern">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-destructive">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground">Connection Error</h2>
            <p className="text-muted-foreground">Unable to load live games</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentGame) {
    return (
      <div className="h-80 card-modern">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">No Live Games</h2>
            <p className="text-muted-foreground">
              {selectedSport === "all" 
                ? "No games are currently live across all sports" 
                : `No games are currently live for ${selectedSport}`}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const gameDate = new Date(currentGame.game_date)

  return (
    <div className="relative">
      <div className="h-80 card-modern overflow-hidden">
        <CardContent className="h-full p-0">
          {/* Header with live indicator and controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-2 px-3 py-1">
                <div className="live-indicator" />
                LIVE NOW
              </Badge>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Updated {format(lastUpdate, "h:mm a")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoAdvance(!autoAdvance)}
                className="h-8 w-8 p-0"
              >
                <Play className={`h-4 w-4 ${autoAdvance ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>

          {/* Game Display */}
          <div className="h-full flex items-center justify-center relative">
            {/* Navigation Arrows */}
            {filteredGames.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevGame}
                  className="absolute left-4 z-10 h-10 w-10 p-0 bg-card/80 hover:bg-card"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextGame}
                  className="absolute right-4 z-10 h-10 w-10 p-0 bg-card/80 hover:bg-card"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Game Content */}
            <div className="text-center space-y-6 max-w-2xl mx-auto px-8">
              {/* Teams */}
              <div className="flex items-center justify-center space-x-8">
                {/* Away Team */}
                <div className="text-center space-y-3">
                  <TeamLogo 
                    teamName={currentGame.away_team?.name || ''} 
                    alt={currentGame.away_team?.abbreviation || 'Away'} 
                    width={48} 
                    height={48} 
                    className="mx-auto"
                    {...(currentGame.away_team?.logo_url && { logoUrl: currentGame.away_team.logo_url })}
                    sport={currentGame.sport}
                    {...(currentGame.league && { league: currentGame.league })}
                  />
                  <div>
                    <div className="text-sm text-muted-foreground">{currentGame.away_team?.abbreviation}</div>
                    <div className="font-semibold text-lg">{currentGame.away_team?.name}</div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {currentGame.away_score || 0}
                  </div>
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {currentGame.venue || 'Live'}
                  </div>
                </div>

                {/* Home Team */}
                <div className="text-center space-y-3">
                  <TeamLogo 
                    teamName={currentGame.home_team?.name || ''} 
                    alt={currentGame.home_team?.abbreviation || 'Home'} 
                    width={48} 
                    height={48} 
                    className="mx-auto"
                    {...(currentGame.home_team?.logo_url && { logoUrl: currentGame.home_team.logo_url })}
                    sport={currentGame.sport}
                    {...(currentGame.league && { league: currentGame.league })}
                  />
                  <div>
                    <div className="text-sm text-muted-foreground">{currentGame.home_team?.abbreviation}</div>
                    <div className="font-semibold text-lg">{currentGame.home_team?.name}</div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">
                    {currentGame.home_score || 0}
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {format(gameDate, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="text-lg font-medium">
                  {format(gameDate, "h:mm a")}
                </div>
                {currentGame.venue && (
                  <div className="text-sm text-muted-foreground">
                    {currentGame.venue}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button variant="outline" className="mt-4">
                View Live Stats
              </Button>
            </div>
          </div>

          {/* Game Counter */}
          {filteredGames.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {filteredGames.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  )
}
