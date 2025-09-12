"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { unifiedApiClient, SupportedSport } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { SportsImage } from "@/components/ui/sports-image"

interface LiveUpdatesProps {
  sport: SupportedSport
  className?: string
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
  bookmakers: string[]
  analysis: string
}

export default function LiveUpdates({ sport, className = "" }: LiveUpdatesProps) {
  const [activeTab, setActiveTab] = useState("live-scores")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Data states
  const [liveGames, setLiveGames] = useState<any[]>([])
  const [valueBets, setValueBets] = useState<ValueBet[]>([])
  const [oddsUpdates, setOddsUpdates] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadLiveData()
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadLiveData, 30000)
    return () => clearInterval(interval)
  }, [sport])

  const loadLiveData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadLiveGames(),
        loadValueBets(),
        loadOddsUpdates()
      ])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading live data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLiveGames = async () => {
    try {
      const games = await unifiedApiClient.getLiveGames(sport)
      setLiveGames(games)
    } catch (error) {
      console.error('Error loading live games:', error)
    }
  }

  const loadValueBets = async () => {
    try {
      const response = await fetch(`/api/value-bets?sport=${sport}&min_value=0.05`)
      const data = await response.json()
      setValueBets(data.opportunities || [])
    } catch (error) {
      console.error('Error loading value bets:', error)
    }
  }

  const loadOddsUpdates = async () => {
    try {
      const response = await fetch(`/api/odds?sport=${sport}`)
      const data = await response.json()
      setOddsUpdates(data.data || [])
    } catch (error) {
      console.error('Error loading odds updates:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLiveData()
    setRefreshing(false)
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <LiveUpdatesSkeleton />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className={sportConfig?.color}>{sportConfig?.icon}</span>
            Live Updates
          </h2>
          <p className="text-muted-foreground">
            Real-time {sportConfig?.name.toLowerCase()} data and value betting opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Live Updates Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="live-scores" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Scores ({liveGames.length})
          </TabsTrigger>
          <TabsTrigger value="value-bets" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Value Bets ({valueBets.length})
          </TabsTrigger>
          <TabsTrigger value="odds" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Odds Updates ({oddsUpdates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Live Game Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveGames.length > 0 ? (
                <div className="space-y-4">
                  {liveGames.map((game) => (
                    <div key={game.id} className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <SportsImage
                            type="team"
                            league={game.league}
                            teamName={game.home_team?.name || 'Home Team'}
                            alt={`${game.home_team?.name || 'Home Team'} logo`}
                            className="h-10 w-10"
                          />
                          <div>
                            <div className="font-bold text-lg">
                              {game.home_team?.name || 'Home Team'} vs {game.away_team?.name || 'Visiting Team'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {game.venue} • {game.time}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {game.homeScore} - {game.awayScore}
                          </div>
                          <Badge className="bg-green-500">
                            LIVE
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No live games at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value-bets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Value Betting Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {valueBets.length > 0 ? (
                <div className="space-y-4">
                  {valueBets.map((bet) => (
                    <div key={bet.gameId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-lg">
                            {bet.homeTeam} vs {bet.awayTeam}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {bet.betType} • {bet.side}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </div>
                          <Badge 
                            variant={
                              bet.recommendation === 'strong' ? 'default' :
                              bet.recommendation === 'moderate' ? 'secondary' : 'outline'
                            }
                          >
                            {bet.recommendation.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Value:</span>
                          <span className="text-sm font-bold text-green-600">
                            +{Math.round(bet.value * 100)}%
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {bet.analysis}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Available at:</span>
                          <div className="flex gap-1">
                            {bet.bookmakers.map((bookmaker, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {bookmaker}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No value betting opportunities at the moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="odds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Odds Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {oddsUpdates.length > 0 ? (
                <div className="space-y-3">
                  {oddsUpdates.map((odds, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <SportsImage
                          type="team"
                          league={odds.league}
                          teamName={odds.home_team?.name || 'Home Team'}
                          alt={`${odds.home_team?.name || 'Home Team'} logo`}
                          className="h-8 w-8"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {odds.home_team?.name || 'Home Team'} vs {odds.away_team?.name || 'Visiting Team'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {odds.betType} • {odds.side}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {odds.odds > 0 ? '+' : ''}{odds.odds}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {odds.bookmaker}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No odds updates available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LiveUpdatesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="space-y-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}
