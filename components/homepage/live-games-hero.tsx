'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TeamLogo } from '@/components/ui/sports-image'
import { useLiveGames, useRealTimeData } from '@/components/data/real-time-provider'
import { ChevronLeft, ChevronRight, Clock, Play, RefreshCw, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export function LiveGamesHero() {
  const { selectedSport, data } = useRealTimeData()
  const { games: liveGames, loading, error } = useLiveGames()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(true)

  const allGames = useMemo(() => {
    if (selectedSport === 'all') return data.games || []
    return (data.games || []).filter(game => game.sport === selectedSport)
  }, [data.games, selectedSport])

  const filteredGames = useMemo(() => {
    if (selectedSport === 'all') return liveGames
    return liveGames.filter(game => game.sport === selectedSport)
  }, [liveGames, selectedSport])

  const upcomingGames = useMemo(() => {
    return allGames.filter(game => game.status === 'scheduled').slice(0, 3)
  }, [allGames])

  useEffect(() => {
    if (!autoAdvance || filteredGames.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % filteredGames.length)
    }, 7000) // Slower auto-advance

    return () => clearInterval(interval)
  }, [autoAdvance, filteredGames.length])

  const nextGame = () => {
    setCurrentIndex(prev => (prev + 1) % Math.max(filteredGames.length, 1))
  }

  const prevGame = () => {
    setCurrentIndex(prev => (prev === 0 ? Math.max(filteredGames.length - 1, 0) : prev - 1))
  }

  const currentGame = filteredGames[currentIndex]

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  if (!currentGame) {
    return <EmptyState selectedSport={selectedSport} upcomingGames={upcomingGames} />
  }

  // const gameDate = new Date(currentGame.game_date)

  return (
    <Card className="relative shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-primary/10 rounded-2xl overflow-hidden">
      <CardContent className="h-96 p-0">
        <Header 
          autoAdvance={autoAdvance} 
          setAutoAdvance={setAutoAdvance} 
        />
        <GameDisplay 
          currentGame={currentGame} 
          nextGame={nextGame} 
          prevGame={prevGame} 
          gameCount={filteredGames.length} 
        />
        <GameCounter count={filteredGames.length} currentIndex={currentIndex} />
      </CardContent>
    </Card>
  )
}

// --- Sub-components for clarity ---

function LoadingSkeleton() {
  return (
    <div className="h-96 rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-md mx-auto"></div>
        <div className="h-4 w-32 bg-gray-200 rounded-md mx-auto"></div>
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <Card className="h-96 rounded-2xl border-destructive/50 bg-destructive/5 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-destructive">⚠️</div>
        <h2 className="text-xl font-semibold text-destructive">Connection Error</h2>
        <p className="text-muted-foreground">Unable to load live games data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </Card>
  )
}

function EmptyState({ selectedSport, upcomingGames }: { selectedSport: string; upcomingGames: any[] }) {
  return (
    <Card className="h-96 rounded-2xl bg-gray-50/50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-lg mx-auto px-6">
        <Clock className="h-12 w-12 text-gray-400 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">No Live Games</h2>
          <p className="text-muted-foreground">
            {selectedSport === 'all'
              ? 'There are no games currently live across any sport.'
              : `There are no games currently live for ${selectedSport}.`}
          </p>
        </div>

        {upcomingGames.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="font-semibold text-foreground">Upcoming Games</h3>
            <div className="space-y-2">
              {upcomingGames.map((game: any) => (
                <div key={game.id} className="flex items-center justify-between text-sm bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="font-semibold text-primary">
                      {format(new Date(game.game_date), 'MMM d')}
                    </div>
                    <div className="font-medium text-foreground">
                      {game.away_team?.abbreviation || game.away_team?.name} vs {' '}
                      {game.home_team?.abbreviation || game.home_team?.name}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {format(new Date(game.game_date), 'h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => (window.location.href = '/games')}>
            View All Games
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Header({ autoAdvance, setAutoAdvance }: { autoAdvance: boolean; setAutoAdvance: (value: boolean) => void }) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="gap-2 px-3 py-1 text-sm font-bold shadow-lg">
          <div className="live-indicator" />
          LIVE
        </Badge>
        {/* Updated {format(lastUpdate, 'h:mm:ss a')} */}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAutoAdvance(!autoAdvance)}
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
        >
          <Play className={`h-4 w-4 ${autoAdvance ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </div>
    </div>
  )
}

function GameDisplay({ currentGame, nextGame, prevGame, gameCount }: { currentGame: any; nextGame: any; prevGame: any; gameCount: number }) {
  return (
    <div className="h-full flex items-center justify-center relative bg-gradient-to-br from-gray-50 to-gray-100">
      {gameCount > 1 && (
        <>
          <Button variant="ghost" size="icon" onClick={prevGame} className="absolute left-4 z-10 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextGame} className="absolute right-4 z-10 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-md">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      <div className="text-center space-y-6 max-w-3xl mx-auto px-8">
        <div className="flex items-center justify-around space-x-4 md:space-x-8">
          <TeamSide team={currentGame.away_team} score={currentGame.away_score} />
          
          <div className="text-center px-4">
            <div className="text-3xl font-bold text-muted-foreground">VS</div>
            <div className="text-sm text-muted-foreground mt-2">
              {currentGame.status === 'live' ? 'Live' : format(new Date(currentGame.game_date), 'h:mm a')}
            </div>
          </div>

          <TeamSide team={currentGame.home_team} score={currentGame.home_score} />
        </div>

        <div className="pt-4">
          <Button variant="default" size="lg" onClick={() => window.location.href = `/games/${currentGame.id}`}>
            View Live Match
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function TeamSide({ team, score }: { team: any; score: number }) {
  return (
    <div className="text-center space-y-3 flex-1">
      <TeamLogo
        teamName={team?.name || ''}
        alt={team?.abbreviation || 'Team'}
        width={64}
        height={64}
        className="mx-auto drop-shadow-lg"
        {...(team?.logo_url && { logoUrl: team.logo_url })}
        sport={team?.sport}
        {...(team?.league && { league: team.league })}
      />
      <div>
        <div className="text-lg md:text-xl font-semibold text-foreground">{team?.name}</div>
        <div className="text-sm text-muted-foreground">{team?.abbreviation}</div>
      </div>
      <div className="text-4xl md:text-5xl font-bold text-primary">
        {score || 0}
      </div>
    </div>
  )
}

function GameCounter({ count, currentIndex }: { count: number; currentIndex: number }) {
  if (count <= 1) return null
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
      <div className="flex space-x-2 p-1 bg-white/50 backdrop-blur-sm rounded-full">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}