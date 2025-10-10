"use client"

import { useState, useEffect } from "react"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TeamLogo } from "@/components/ui/sports-image"
import { databaseFirstApiClient, type Game } from "@/lib/api-client-database-first"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { format } from "date-fns"

export function LiveGamesHero() {
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [featuredGames, setFeaturedGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      const supportedSports = SportConfigManager.getSupportedSports()
      
      let allLiveGames: Game[] = []
      let allUpcomingGames: Game[] = []
      
      // Load games from all sports
      for (const sport of supportedSports) {
        try {
          const [live, upcoming] = await Promise.all([
            databaseFirstApiClient.getGames({ sport, status: 'in_progress', limit: 5 }),
            databaseFirstApiClient.getGames({ sport, status: 'scheduled', limit: 5 })
          ])
          
          allLiveGames = [...allLiveGames, ...live]
          allUpcomingGames = [...allUpcomingGames, ...upcoming]
        } catch (error) {
          console.error(`Error loading games for ${sport}:`, error)
        }
      }
      
      setLiveGames(allLiveGames)
      setFeaturedGames(allUpcomingGames.slice(0, 3)) // Show top 3 upcoming games
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextGame = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(liveGames.length, featuredGames.length))
  }

  const prevGame = () => {
    setCurrentIndex((prev) => prev === 0 ? Math.max(liveGames.length, featuredGames.length) - 1 : prev - 1)
  }

  const displayGames = liveGames.length > 0 ? liveGames : featuredGames
  const currentGame = displayGames[currentIndex]

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

  if (!currentGame) {
    return (
      <div className="h-80 card-modern">
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">No Games Available</h2>
            <p className="text-muted-foreground">Check back later for live games and upcoming matches</p>
          </div>
        </div>
      </div>
    )
  }

  const isLive = liveGames.length > 0 && liveGames.includes(currentGame)
  const gameDate = new Date(currentGame.game_date)

  return (
    <div className="relative">
      <div className="h-80 card-modern overflow-hidden">
        <CardContent className="h-full p-0">
          {/* Game Display */}
          <div className="h-full flex items-center justify-center relative">
            {/* Navigation Arrows */}
            {displayGames.length > 1 && (
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
              {/* Status Badge */}
              <div className="flex justify-center">
                {isLive ? (
                  <Badge variant="destructive" className="gap-2 px-4 py-2">
                    <div className="live-indicator" />
                    LIVE NOW
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-2 px-4 py-2">
                    <Clock className="h-3 w-3" />
                    UPCOMING
                  </Badge>
                )}
              </div>

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
                    logoUrl={currentGame.away_team?.logo_url}
                    sport={currentGame.sport}
                    league={currentGame.league}
                  />
                  <div>
                    <div className="text-sm text-muted-foreground">{currentGame.away_team?.abbreviation}</div>
                    <div className="font-semibold text-lg">{currentGame.away_team?.name}</div>
                  </div>
                  {isLive && (
                    <div className="text-3xl font-bold text-foreground">
                      {currentGame.away_score || 0}
                    </div>
                  )}
                </div>

                {/* VS */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  {isLive && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {currentGame.venue || 'Live'}
                    </div>
                  )}
                </div>

                {/* Home Team */}
                <div className="text-center space-y-3">
                  <TeamLogo 
                    teamName={currentGame.home_team?.name || ''} 
                    alt={currentGame.home_team?.abbreviation || 'Home'} 
                    width={48} 
                    height={48} 
                    className="mx-auto"
                    logoUrl={currentGame.home_team?.logo_url}
                    sport={currentGame.sport}
                    league={currentGame.league}
                  />
                  <div>
                    <div className="text-sm text-muted-foreground">{currentGame.home_team?.abbreviation}</div>
                    <div className="font-semibold text-lg">{currentGame.home_team?.name}</div>
                  </div>
                  {isLive && (
                    <div className="text-3xl font-bold text-foreground">
                      {currentGame.home_score || 0}
                    </div>
                  )}
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
                {isLive ? 'View Live Stats' : 'View Details'}
              </Button>
            </div>
          </div>

          {/* Game Counter */}
          {displayGames.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {displayGames.map((_, index) => (
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
