'use client'

import { useState, useEffect, useCallback } from 'react'
import { dynamicClientConfig } from '@/lib/config/dynamic-client-config'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
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
  WifiOff,
} from 'lucide-react'

interface LiveGame {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  status: string
  period?: string
  timeRemaining?: string
  time?: string
  league: string
  sport?: string
  venue?: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  dataSource?: string
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

interface LiveUpdatesProps {
  sport?: string
}

export function LiveUpdates({ sport }: LiveUpdatesProps) {
  const [activeTab, setActiveTab] = useState('scores')
  const [isLive, setIsLive] = useState(false)
  const [liveGames, setLiveGames] = useState<LiveGame[]>([])
  const [liveOdds, setLiveOdds] = useState<LiveOdds[]>([])
  const [valueBets, setValueBets] = useState<ValueBet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>(
    'connected'
  )

  const fetchLiveData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('connected')

      if (activeTab === 'scores') {
        // Use real-time data for live scores - ONLY fetch truly live games
        const response = await fetch(`/api/live-updates?sport=${sport}&real=true`)
        const data = await response.json()

        // ONLY show games that are actually live (in progress) with real scores
        const trulyLiveGames = (data.live || []).filter((game: any) => {
          const status = game.status?.toLowerCase() || ''
          const hasLiveStatus =
            status === 'live' ||
            status === 'in_progress' ||
            status === 'in progress' ||
            status.includes('live') ||
            status.includes('progress') ||
            status.includes('quarter') ||
            status.includes('period') ||
            status.includes('inning') ||
            status.includes('half')

          // Must have real scores (not 0-0) to be considered truly live
          const hasRealScores = game.homeScore > 0 || game.awayScore > 0

          return hasLiveStatus && hasRealScores
        })

        console.log(
          `Fetched ${data.live?.length || 0} live games, filtered to ${trulyLiveGames.length} truly live games`
        )
        setLiveGames(trulyLiveGames)
      } else if (activeTab === 'odds') {
        const response = await fetch(`/api/odds?sport=${sport}`)
        const data = await response.json()
        setLiveOdds(data || [])
      } else if (activeTab === 'value-bets') {
        const response = await fetch(`/api/value-bets?sport=${sport}&min_value=0.1`)
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
  }, [sport, activeTab])

  useEffect(() => {
    if (isLive) {
      fetchLiveData()

      // Dynamic polling with sport-specific intervals
      const setupPolling = async () => {
        try {
          const config = await dynamicClientConfig.getConfig()
          const sportInterval = await dynamicClientConfig.getSportRefreshInterval(
            sport || 'basketball',
            'games'
          )

          let pollInterval = Math.min(sportInterval, config.ui.refreshInterval)
          let consecutiveNoChanges = 0
          const maxInterval = Math.min(sportInterval * 10, 300000) // Max 5 minutes
          const minInterval = Math.max(sportInterval / 3, 10000) // Min 10 seconds

          const poll = () => {
            const previousData = {
              games: liveGames.length,
              odds: liveOdds.length,
              valueBets: valueBets.length,
            }

            fetchLiveData().then(() => {
              const currentData = {
                games: liveGames.length,
                odds: liveOdds.length,
                valueBets: valueBets.length,
              }

              // Check if data changed
              const hasChanges = Object.keys(previousData).some(
                key =>
                  previousData[key as keyof typeof previousData] !==
                  currentData[key as keyof typeof currentData]
              )

              if (hasChanges) {
                consecutiveNoChanges = 0
                pollInterval = Math.max(minInterval, pollInterval * 0.8) // Decrease interval
              } else {
                consecutiveNoChanges++
                pollInterval = Math.min(maxInterval, pollInterval * 1.2) // Increase interval
              }

              if (isLive) {
                setTimeout(poll, pollInterval)
              }
            })
          }

          const timeoutId = setTimeout(poll, pollInterval)
          return () => clearTimeout(timeoutId)
        } catch (error) {
          console.error('Failed to setup dynamic polling:', error)
          // Fallback to static polling
          const pollInterval = 30000
          const timeoutId = setTimeout(() => {
            if (isLive) {
              fetchLiveData()
              setTimeout(arguments.callee, pollInterval)
            }
          }, pollInterval)
          return () => clearTimeout(timeoutId)
        }
      }

      setupPolling()

      return () => {
        // Cleanup will be handled by the timeout clearing in setupPolling
      }
    }
    return undefined
  }, [isLive, fetchLiveData, sport, liveGames.length, liveOdds.length, valueBets.length])

  const toggleLiveUpdates = (): void => {
    setIsLive(!isLive)
    if (!isLive) {
      fetchLiveData()
    }
  }

  const getRecommendationColor = (recommendation: string): string => {
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}
              />
              Live Updates
              {liveGames.length > 0 && (
                <Badge className="bg-red-500 text-white ml-2 animate-pulse">
                  {liveGames.length} Live
                </Badge>
              )}
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
              <Badge variant="outline">Last updated: {lastUpdated.toLocaleTimeString()}</Badge>
              <Button
                variant={isLive ? 'destructive' : 'default'}
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
              <Button variant="outline" size="sm" onClick={fetchLiveData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Live Scores
            {liveGames.length > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {liveGames.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="odds" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Live Odds
            {liveOdds.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {liveOdds.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="value-bets" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Value Bets
            {valueBets.length > 0 && (
              <Badge
                variant="default"
                className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {valueBets.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                Live Game Scores
                <Badge className="bg-red-500 text-white">{liveGames.length} Games Live</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : liveGames.length === 0 ? (
                <div className="text-center py-12">
                  <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Live Games</h3>
                    <p className="text-muted-foreground mb-4">
                      {sport
                        ? `No ${sport} games are currently in progress.`
                        : 'No games are currently in progress.'}
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Check back later for live action</p>
                      <p>• Switch to a different sport</p>
                      <p>• Enable live updates to get real-time notifications</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-muted">
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveGames.map((game: LiveGame) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-6 border-2 border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            {game.awayTeamLogo && (
                              <Image
                                src={game.awayTeamLogo}
                                alt={`${game.awayTeam} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-contain"
                                onError={e => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <span className="font-semibold text-lg">{game.awayTeam}</span>
                          </div>
                          <span className="text-2xl font-bold text-muted-foreground mx-2">@</span>
                          <div className="flex items-center gap-2">
                            {game.homeTeamLogo && (
                              <Image
                                src={game.homeTeamLogo}
                                alt={`${game.homeTeam} logo`}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-contain"
                                onError={e => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <span className="font-semibold text-lg">{game.homeTeam}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge className="bg-red-500 text-white animate-pulse font-bold px-3 py-1">
                            🔴 LIVE
                          </Badge>

                          {game.period && (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {game.period}
                            </Badge>
                          )}

                          {game.timeRemaining && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {game.timeRemaining}
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground mt-2">
                          {game.league}
                          {game.venue && ` • ${game.venue}`}
                          {game.dataSource && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {game.dataSource}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-center ml-6">
                        <div className="text-4xl font-bold text-green-600 mb-1">
                          {game.awayScore !== undefined && game.homeScore !== undefined ? (
                            `${game.awayScore} - ${game.homeScore}`
                          ) : (
                            <span className="text-muted-foreground text-2xl">0 - 0</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {game.awayScore !== undefined && game.homeScore !== undefined
                            ? 'LIVE SCORE'
                            : 'STARTING SOON'}
                        </div>
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
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : liveOdds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
                    <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Live Odds</h3>
                    <p className="text-muted-foreground mb-4">
                      {sport
                        ? `No ${sport} odds data available at the moment.`
                        : 'No odds data available at the moment.'}
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Odds update frequently during games</p>
                      <p>• Check back when games are live</p>
                      <p>• Try switching to a different sport</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-muted">
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveOdds.map((odd: LiveOdds) => (
                    <div
                      key={odd.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-semibold mb-3">
                        {odd.homeTeam} vs {odd.awayTeam}
                      </h3>
                      <div className="space-y-2">
                        {odd.bookmakers.slice(0, 3).map((bookmaker: any) => (
                          <div key={bookmaker.key} className="text-sm">
                            <div className="font-medium text-muted-foreground mb-1">
                              {bookmaker.title}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {bookmaker.markets.map((market: any) => (
                                <div key={market.key} className="text-xs">
                                  <div className="font-medium capitalize mb-1">
                                    {market.key.replace('_', ' ')}
                                  </div>
                                  <div className="space-y-1">
                                    {market.outcomes.map((outcome: any, idx: number) => (
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
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border rounded-lg">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : valueBets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
                    <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Value Bets</h3>
                    <p className="text-muted-foreground mb-4">
                      {sport
                        ? `No ${sport} value betting opportunities found.`
                        : 'No value betting opportunities found.'}
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Value bets appear when odds are favorable</p>
                      <p>• Check back during live games</p>
                      <p>• Adjust your filters for more opportunities</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-muted">
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {valueBets.map((bet: ValueBet) => (
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
