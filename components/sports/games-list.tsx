"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  RefreshCw,
  Clock,
  Calendar,
  Filter,
  Search,
  Zap,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { cachedUnifiedApiClient, SupportedSport } from "@/lib/services/api/cached-unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

// Use UnifiedGameData from the API client
import type { UnifiedGameData } from "@/lib/services/api/unified-api-client"

type GameData = UnifiedGameData

interface GamesListProps {
  sport: SupportedSport
  className?: string
}

export function GamesList({ sport, className = "" }: GamesListProps) {
  const [games, setGames] = useState<GameData[]>([])
  const [filteredGames, setFilteredGames] = useState<GameData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "live" | "finished">("all")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    loadGames()
  }, [sport])

  useEffect(() => {
    filterGames()
  }, [games, searchTerm, statusFilter, dateFilter])

  const loadGames = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (dateFilter) {
        params.date = dateFilter
      } else {
        params.date = new Date().toISOString().split('T')[0] // Today's date
      }

      // Load different types of games
      const [liveGames, scheduledGames, finishedGames] = await Promise.all([
        cachedUnifiedApiClient.getLiveGames(sport),
        cachedUnifiedApiClient.getGames(sport, { ...params, limit: 20 }),
        cachedUnifiedApiClient.getGames(sport, {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'finished',
          limit: 10
        })
      ])

      const allGames = [...liveGames, ...scheduledGames, ...finishedGames]
      setGames(allGames)
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadGames()
    setRefreshing(false)
  }

  const filterGames = () => {
    let filtered = [...games]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.league.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(game => game.status === statusFilter)
    }

    setFilteredGames(filtered)
  }

  const getGamesByStatus = (status: 'live' | 'scheduled' | 'finished') => {
    return filteredGames.filter(game => game.status === status)
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <GamesListSkeleton />
  }

  const liveGames = getGamesByStatus('live')
  const scheduledGames = getGamesByStatus('scheduled')
  const finishedGames = getGamesByStatus('finished')

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={`text-2xl ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              {sportConfig?.name} Games
            </CardTitle>
            <CardDescription>
              Live scores, schedules, and results
            </CardDescription>
          </div>
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

        {/* Filters */}
        <div className="flex flex-col space-y-2 mt-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teams or leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter("")}
              >
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
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Live
              {liveGames.length > 0 && (
                <Badge variant="destructive">{liveGames.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Scheduled
              <Badge variant="outline">{scheduledGames.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="finished" className="flex items-center gap-2">
              Finished
              <Badge variant="secondary">{finishedGames.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-4">
            <GamesGrid games={filteredGames} sport={sport} />
          </TabsContent>

          <TabsContent value="live" className="mt-6 space-y-4">
            <GamesGrid games={liveGames} sport={sport} />
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6 space-y-4">
            <GamesGrid games={scheduledGames} sport={sport} />
          </TabsContent>

          <TabsContent value="finished" className="mt-6 space-y-4">
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
    return (
      <div className="text-center py-6 text-muted-foreground">
        No games in this category
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {games.map((game) => (
        <GameCard key={game.id} game={game} sport={sport} />
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
  const isLive = game.status === 'live'
  const isFinished = game.status === 'finished'

  const getStatusBadge = () => {
    if (isLive) {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
          <Zap className="h-3 w-3 mr-1" />
          LIVE
        </Badge>
      )
    }
    if (isFinished) {
      return (
        <Badge variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          FT
        </Badge>
      )
    }
    return (
      <Badge variant="outline">
        <Clock className="h-3 w-3 mr-1" />
        {game.time ? game.time : 'TBD'}
      </Badge>
    )
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${isLive ? 'ring-2 ring-red-200' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              <span className="text-sm text-muted-foreground">{game.league}</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Teams and Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{game.homeTeam}</span>
              <span className="font-bold">{game.homeScore ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{game.awayTeam}</span>
              <span className="font-bold">{game.awayScore ?? '-'}</span>
            </div>
          </div>

          {/* Date and Venue */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div>{new Date(game.date).toLocaleDateString()}</div>
            {game.venue && <div>{game.venue}</div>}
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
