"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  RefreshCw, 
  Play, 
  Pause, 
  TrendingUp, 
  Target, 
  DollarSign,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react"

interface LiveGame {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: string
  time?: string
  league: string
  sport: string
  venue?: string
}

interface LiveOdds {
  id: string
  homeTeam: string
  awayTeam: string
  bookmakers: {
    key: string
    title: string
    last_update: string
    markets: {
      key: string
      outcomes: {
        name: string
        price: number
        point?: number
      }[]
    }[]
  }[]
}

interface ValueBet {
  gameId: string
  homeTeam: string
  awayTeam: string
  betType: string
  side: string
  odds: number
  value: number
  recommendation: 'strong' | 'moderate' | 'weak'
}

export function LiveUpdates() {
  const [activeTab, setActiveTab] = useState("scores")
  const [isLive, setIsLive] = useState(false)
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])
  const [liveOdds, setLiveOdds] = useState<LiveOdds[]>([])
  const [valueBets, setValueBets] = useState<ValueBet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')

  useEffect(() => {
    if (isLive) {
      fetchLiveData()
      const interval = setInterval(fetchLiveData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isLive, activeTab])

  const fetchLiveData = async () => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('connected')

      if (activeTab === 'scores') {
        const response = await fetch('/api/live-scores?sport=basketball')
        const data = await response.json()
        setLiveGames(data.games || [])
      } else if (activeTab === 'odds') {
        const response = await fetch('/api/odds?external=true&sport=basketball_nba')
        const data = await response.json()
        setLiveOdds(data || [])
      } else if (activeTab === 'value-bets') {
        const response = await fetch('/api/value-bets?sport=basketball&min_value=0.1')
        const data = await response.json()
        setValueBets(data.opportunities || [])
      }

      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to fetch live data')
      setConnectionStatus('disconnected')
      console.error('Error fetching live data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLiveUpdates = () => {
    setIsLive(!isLive)
    if (!isLive) {
      fetchLiveData()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'in progress':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'finished':
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'scheduled':
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'weak':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              Live Updates
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              <Badge variant="outline">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
              <Button
                variant={isLive ? "destructive" : "default"}
                size="sm"
                onClick={toggleLiveUpdates}
                disabled={loading}
              >
                {isLive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Live
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLiveData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Live Updates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Live Scores
          </TabsTrigger>
          <TabsTrigger value="odds" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Live Odds
          </TabsTrigger>
          <TabsTrigger value="value-bets" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Value Bets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Game Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && liveGames.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : liveGames.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Live Games</h3>
                  <p className="text-muted-foreground">
                    No games are currently in progress. Check back later or enable live updates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">
                            {game.awayTeam} @ {game.homeTeam}
                          </h3>
                          <Badge className={getStatusColor(game.status)}>
                            {game.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {game.league} • {game.venue || 'TBD'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {game.awayScore !== undefined ? game.awayScore : '-'} - {game.homeScore !== undefined ? game.homeScore : '-'}
                        </div>
                        {game.time && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {game.time}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Betting Odds</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && liveOdds.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : liveOdds.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Live Odds</h3>
                  <p className="text-muted-foreground">
                    No odds data available. Check back later or enable live updates.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveOdds.map((odd) => (
                    <div
                      key={odd.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-semibold mb-3">
                        {odd.homeTeam} vs {odd.awayTeam}
                      </h3>
                      <div className="space-y-2">
                        {odd.bookmakers.slice(0, 3).map((bookmaker) => (
                          <div key={bookmaker.key} className="text-sm">
                            <div className="font-medium text-muted-foreground mb-1">
                              {bookmaker.title}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {bookmaker.markets.map((market) => (
                                <div key={market.key} className="text-xs">
                                  <div className="font-medium capitalize mb-1">
                                    {market.key.replace('_', ' ')}
                                  </div>
                                  <div className="space-y-1">
                                    {market.outcomes.map((outcome, idx) => (
                                      <div key={idx} className="flex justify-between">
                                        <span>{outcome.name}</span>
                                        <span className="font-mono">{outcome.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value-bets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Value Betting Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && valueBets.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : valueBets.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Value Bets</h3>
                  <p className="text-muted-foreground">
                    No value betting opportunities found. Check back later or adjust your filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {valueBets.map((bet) => (
                    <div
                      key={`${bet.gameId}-${bet.betType}-${bet.side}`}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {bet.homeTeam} vs {bet.awayTeam}
                        </h3>
                        <Badge className={getRecommendationColor(bet.recommendation)}>
                          {bet.recommendation.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Bet Type</p>
                          <p className="font-medium">{bet.betType}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Side</p>
                          <p className="font-medium">{bet.side}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Odds</p>
                          <p className="font-medium">{bet.odds}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium text-green-600">
                            +{(bet.value * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
