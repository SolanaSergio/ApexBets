'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Search, Filter, Calendar, Zap, Clock, CheckCircle } from 'lucide-react'
import { databaseFirstApiClient, type Game } from '@/lib/api-client-database-first'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'
import { TeamLogo } from '@/components/ui/team-logo'
import { cn } from '@/lib/utils'
import { normalizeGameData, deduplicateGames, isGameActuallyLive } from '@/lib/utils/data-utils'

type GameData = Game

interface GamesListProps {
  sport: SupportedSport
  className?: string
}

export function GamesList({ sport, className = '' }: GamesListProps) {
  const [games, setGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'scheduled' | 'in_progress' | 'completed'
  >('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [activeTab, setActiveTab] = useState('all')

  const loadGames = useCallback(async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const params: any = { sport, date: dateFilter || today }

      // Use Promise.all for parallel data fetching with database-first approach
      const [liveGames, scheduledGames, finishedGames] = await Promise.all([
        databaseFirstApiClient.getGames({ sport, status: 'in_progress' }).catch(() => []),
        databaseFirstApiClient
          .getGames({ sport, dateFrom: params.date, status: 'scheduled', limit: 20 })
          .catch(() => []),
        databaseFirstApiClient
          .getGames({ sport, dateTo: params.date, status: 'completed', limit: 10 })
          .catch(() => []),
      ])

      // Normalize and filter out games that don't meet live criteria
      const normalizedLiveGames = liveGames.map(game => normalizeGameData(game, sport))
      const trulyLiveGames = normalizedLiveGames.filter(game => {
        try {
          return isGameActuallyLive(game)
        } catch (error) {
          console.warn('Error checking if game is live:', error, game)
          return false
        }
      })

      // Normalize other games
      const normalizedScheduledGames = scheduledGames.map(game => normalizeGameData(game, sport))
      const normalizedFinishedGames = finishedGames.map(game => normalizeGameData(game, sport))

      // Combine all games and remove duplicates based on game ID
      const allGames = [...trulyLiveGames, ...normalizedScheduledGames, ...normalizedFinishedGames]

      // Remove duplicates by game ID while preserving the first occurrence
      const uniqueGames = deduplicateGames(allGames)

      setGames(uniqueGames)
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }, [sport, dateFilter])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGames()
    setRefreshing(false)
  }

  // Memoize filtered games to improve performance
  const filteredGames = useMemo(() => {
    let filtered = [...games]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        game =>
          game.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          game.league?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(game => game.status === statusFilter)
    }

    return filtered
  }, [games, searchTerm, statusFilter])

  // Memoize games by status to improve performance
  const liveGames = useMemo(
    () => filteredGames.filter(game => game.status === 'live'),
    [filteredGames]
  )

  const scheduledGames = useMemo(
    () => filteredGames.filter(game => game.status === 'scheduled'),
    [filteredGames]
  )

  const finishedGames = useMemo(
    () => filteredGames.filter(game => game.status === 'completed'),
    [filteredGames]
  )

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <GamesListSkeleton />
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={`text-2xl ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              {sportConfig?.name} Games
            </CardTitle>
            <CardDescription>Live scores, schedules, and results</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-2 mt-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teams or leagues..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in_progress">Live</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-40"
            />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => setDateFilter('')}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="outline">{filteredGames.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Live
              {liveGames.length > 0 && <Badge variant="destructive">{liveGames.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Scheduled
              <Badge variant="outline">{scheduledGames.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Finished
              <Badge variant="secondary">{finishedGames.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            <GamesGrid games={filteredGames} sport={sport} />
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6 space-y-4">
            <GamesGrid games={liveGames} sport={sport} />
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6 space-y-4">
            <GamesGrid games={scheduledGames} sport={sport} />
          </TabsContent>

          <TabsContent value="completed" className="mt-6 space-y-4">
            <GamesGrid games={finishedGames} sport={sport} />
          </TabsContent>
        </Tabs>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No games found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or refreshing the data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface GamesGridProps {
  games: GameData[]
  sport: SupportedSport
}

function GamesGrid({ games, sport }: GamesGridProps) {
  if (games.length === 0) {
    return <div className="text-center py-6 text-muted-foreground">No games in this category</div>
  }

  // Create unique keys for games to prevent React key conflicts
  const createUniqueKey = (game: GameData, index: number): string => {
    // Primary: use game ID if available
    if (game.id) {
      return game.id
    }

    // Fallback: create composite key from game details
    const homeTeam = game.home_team?.name || 'home'
    const awayTeam = game.away_team?.name || 'away'
    const gameDate = game.game_date || new Date().toISOString()

    return `${homeTeam}-${awayTeam}-${gameDate}-${index}`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {games.map((game, index) => (
        <GameCard key={createUniqueKey(game, index)} game={game} sport={sport} />
      ))}
    </div>
  )
}

interface GameCardProps {
  game: GameData
  sport: SupportedSport
}

function GameCard({ game, sport }: GameCardProps) {
  const sportConfig = SportConfigManager.getSportConfig(sport)
  const isLive = (() => {
    try {
      return isGameActuallyLive(game)
    } catch (error) {
      console.warn('Error checking if game is live in GameCard:', error, game)
      return false
    }
  })()
  const isFinished = game.status === 'completed'

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 animate-pulse font-bold">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
          LIVE
        </Badge>
      )
    }
    if (isFinished) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          FINAL
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-blue-300 text-blue-700">
        <Clock className="h-3 w-3 mr-1" />
        {game.game_time
          ? game.game_time
          : new Date(game.game_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Badge>
    )
  }

  const cardClassName = cn(
    'hover:shadow-md transition-all duration-200',
    isLive && 'ring-2 ring-red-200 bg-gradient-to-r from-red-50 to-pink-50',
    isFinished && 'bg-gradient-to-r from-gray-50 to-slate-50',
    !isLive && !isFinished && 'bg-gradient-to-r from-blue-50 to-sky-50'
  )

  return (
    <Card className={cardClassName}>
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              <span className="text-sm font-medium text-muted-foreground">{game.league}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Teams and Score */}
          <div className="space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo
                  logoUrl={game.away_team?.logo_url}
                  teamName={game.away_team?.name || 'Visiting Team'}
                  abbreviation={game.away_team?.abbreviation}
                  size="md"
                />
                <div>
                  <span className="font-semibold text-base">
                    {game.away_team?.name || 'Visiting Team'}
                  </span>
                  <div className="text-xs text-muted-foreground">Away</div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'font-bold text-2xl',
                    isLive && 'text-green-600',
                    isFinished && 'text-gray-700',
                    !isLive && !isFinished && 'text-muted-foreground'
                  )}
                >
                  {game.away_score !== null && game.away_score !== undefined
                    ? game.away_score
                    : '-'}
                </span>
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TeamLogo
                  logoUrl={game.home_team?.logo_url}
                  teamName={game.home_team?.name || 'Home Team'}
                  abbreviation={game.home_team?.abbreviation}
                  size="md"
                />
                <div>
                  <span className="font-semibold text-base">
                    {game.home_team?.name || 'Home Team'}
                  </span>
                  <div className="text-xs text-muted-foreground">Home</div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'font-bold text-2xl',
                    isLive && 'text-green-600',
                    isFinished && 'text-gray-700',
                    !isLive && !isFinished && 'text-muted-foreground'
                  )}
                >
                  {game.home_score !== null && game.home_score !== undefined
                    ? game.home_score
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(game.game_date).toLocaleDateString()}</span>
                {isLive && game.time_remaining && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {game.time_remaining}
                    </Badge>
                  </>
                )}
              </div>
              {game.venue && (
                <span className="truncate max-w-32" title={game.venue}>
                  {game.venue}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GamesListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
