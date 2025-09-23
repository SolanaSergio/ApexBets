"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Star, Eye, Heart, Zap, Activity, Target, Trophy, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Team {
  id: string
  name: string
  abbreviation: string
  logo?: string
  score?: number
  color?: string
}

interface GameOdds {
  spread: number
  total: number
  moneyline: {
    home: number
    away: number
  }
}

interface Game {
  id: string
  homeTeam: Team
  awayTeam: Team
  status: "scheduled" | "live" | "final"
  startTime: string
  quarter?: string
  timeRemaining?: string
  sport: string
  venue?: string
  odds?: GameOdds
  predictions?: {
    winner: string
    confidence: number
    spread: number
  }
}

interface ModernGameCardProps {
  game: Game
  showOdds?: boolean
  showPredictions?: boolean
  interactive?: boolean
  onFavorite?: (gameId: string) => void
  onWatch?: (gameId: string) => void
}

export function ModernGameCard({ 
  game, 
  showOdds = true, 
  showPredictions = true, 
  interactive = true,
  onFavorite,
  onWatch 
}: ModernGameCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const [liveUpdate, setLiveUpdate] = useState(false)

  const isLive = game.status === "live"
  const isFinal = game.status === "final"
  // const isScheduled = game.status === "scheduled"

  // Simulate live updates for demo
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setLiveUpdate(prev => !prev)
      }, 3000)
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when not live
  }, [isLive])

  const handleFavorite = () => {
    setIsFavorited(!isFavorited)
    onFavorite?.(game.id)
  }

  const handleWatch = () => {
    setIsWatching(!isWatching)
    onWatch?.(game.id)
  }

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge variant="destructive" className="rounded-md font-bold animate-pulse premium-glow">
          <div className="w-2 h-2 bg-white rounded-sm mr-2 animate-pulse" />
          LIVE
        </Badge>
      )
    }
    if (isFinal) {
      return (
        <Badge variant="secondary" className="rounded-md font-bold">
          FINAL
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="rounded-md font-bold">
        <Clock className="w-3 h-3 mr-1" />
        {new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Badge>
    )
  }

  const getSportIcon = (sport: string) => {
    // Dynamic icon selection based on sport name
    const sportLower = sport.toLowerCase()
    if (sportLower.includes('basketball')) return Zap
    if (sportLower.includes('football')) return Activity
    if (sportLower.includes('baseball')) return Target
    if (sportLower.includes('hockey')) return Gamepad2
    if (sportLower.includes('soccer')) return Trophy
    return Trophy // Default fallback
  }

  const getSportGradient = (sport: string) => {
    // Dynamic gradient selection based on sport name
    const sportLower = sport.toLowerCase()
    if (sportLower.includes('basketball')) return "from-cyan-500 to-blue-500"
    if (sportLower.includes('football')) return "from-purple-500 to-indigo-500"
    if (sportLower.includes('baseball')) return "from-green-500 to-emerald-500"
    if (sportLower.includes('hockey')) return "from-blue-500 to-cyan-500"
    if (sportLower.includes('soccer')) return "from-emerald-500 to-green-500"
    return "from-gray-500 to-gray-600" // Default fallback
  }

  return (
    <div className={cn(
      "glass-card rounded-lg card-hover relative overflow-hidden group",
      liveUpdate && isLive && "animate-pulse"
    )}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getSportGradient(game.sport)} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
      
      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 animate-pulse" />
      )}

      <CardContent className="p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${getSportGradient(game.sport)} rounded-lg flex items-center justify-center premium-glow`}>
              {(() => {
                const SportIcon = getSportIcon(game.sport)
                return <SportIcon className="w-5 h-5 text-white" />
              })()}
            </div>
            <div>
              <p className="font-bold text-slate-800 capitalize">{game.sport}</p>
              {game.venue && (
                <p className="text-sm text-slate-600 font-medium">{game.venue}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {interactive && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className={cn(
                    "w-10 h-10 rounded-md p-0 transition-all duration-300",
                    isFavorited ? "text-red-500 bg-red-50 hover:bg-red-100" : "hover:bg-gray-100"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWatch}
                  className={cn(
                    "w-10 h-10 rounded-md p-0 transition-all duration-300",
                    isWatching ? "text-blue-500 bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"
                  )}
                >
                  <Eye className={cn("w-4 h-4", isWatching && "fill-current")} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Teams and Scores */}
        <div className="space-y-4 mb-6">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                {game.homeTeam.logo ? (
                  <Image src={game.homeTeam.logo} alt={game.homeTeam.name} width={32} height={32} className="w-8 h-8" />
                ) : (
                  <span className="font-bold text-slate-600">{game.homeTeam.abbreviation}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-slate-800">{game.homeTeam.name}</p>
                <p className="text-sm text-slate-600 font-medium">Home</p>
              </div>
            </div>
            {(isLive || isFinal) && (
              <div className="text-3xl font-black text-gradient">
                {game.homeTeam.score || 0}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center">
                {game.awayTeam.logo ? (
                  <Image src={game.awayTeam.logo} alt={game.awayTeam.name} width={32} height={32} className="w-8 h-8" />
                ) : (
                  <span className="font-bold text-slate-600">{game.awayTeam.abbreviation}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-slate-800">{game.awayTeam.name}</p>
                <p className="text-sm text-slate-600 font-medium">Away</p>
              </div>
            </div>
            {(isLive || isFinal) && (
              <div className="text-3xl font-black text-gradient">
                {game.awayTeam.score || 0}
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        {isLive && game.quarter && game.timeRemaining && (
          <div className="flex items-center justify-center gap-4 mb-6 p-3 glass rounded-lg">
            <span className="font-bold text-slate-800">{game.quarter}</span>
            <div className="w-2 h-2 bg-red-500 rounded-sm animate-pulse" />
            <span className="font-bold text-slate-800">{game.timeRemaining}</span>
          </div>
        )}

        {/* Odds */}
        {showOdds && game.odds && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 glass rounded-lg">
              <p className="text-xs font-bold text-slate-600 uppercase">Spread</p>
              <p className="text-lg font-black text-gradient">{game.odds.spread > 0 ? '+' : ''}{game.odds.spread}</p>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <p className="text-xs font-bold text-slate-600 uppercase">Total</p>
              <p className="text-lg font-black text-gradient">{game.odds.total}</p>
            </div>
            <div className="text-center p-3 glass rounded-lg">
              <p className="text-xs font-bold text-slate-600 uppercase">ML</p>
              <p className="text-lg font-black text-gradient">
                {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home}
              </p>
            </div>
          </div>
        )}

        {/* Predictions */}
        {showPredictions && game.predictions && (
          <div className="p-4 glass rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-slate-800">AI Prediction</span>
              </div>
              <Badge variant="secondary" className="rounded-md font-bold">
                {game.predictions.confidence}% Confidence
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Winner: {game.predictions.winner}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-600">
                  {game.predictions.spread > 0 ? '+' : ''}{game.predictions.spread}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  )
}
