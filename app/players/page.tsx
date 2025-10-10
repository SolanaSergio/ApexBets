"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PlayerCard } from "@/components/sports/player-card"
import { Search, Filter, User, Target, TrendingUp, Users } from "lucide-react"
import { databaseFirstApiClient, type Player } from "@/lib/api-client-database-first"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [selectedPosition, setSelectedPosition] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])

  useEffect(() => {
    loadPlayers()
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadTeamsAndPositionsForSport(selectedSport)
    }
  }, [selectedSport])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      const allPlayers = await databaseFirstApiClient.getPlayers({ limit: 200 })
      setPlayers(allPlayers || [])
    } catch (error) {
      console.error('Error loading players:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }

  const loadSupportedSports = async () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    if (sports.length > 0) {
      setSelectedSport(sports[0])
    }
  }

  const loadTeamsAndPositionsForSport = async (sport: SupportedSport) => {
    try {
      const players = await databaseFirstApiClient.getPlayers({ sport, limit: 100 })
      const uniqueTeams = [...new Set(players.map(player => player.teamName).filter(Boolean))] as string[]
      const uniquePositions = [...new Set(players.map(player => player.position).filter(Boolean))] as string[]
      
      setTeams(uniqueTeams)
      setPositions(uniquePositions)
    } catch (error) {
      console.error('Error loading teams and positions:', error)
      setTeams([])
      setPositions([])
    }
  }

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.position?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSport = !selectedSport || player.sport === selectedSport
      
      const matchesTeam = !selectedTeam || player.teamName === selectedTeam
      
      const matchesPosition = !selectedPosition || player.position === selectedPosition
      
      return matchesSearch && matchesSport && matchesTeam && matchesPosition
    })
  }, [players, searchTerm, selectedSport, selectedTeam, selectedPosition])

  const playerStats = useMemo(() => {
    const totalPlayers = players.length
    const activePlayers = players.filter(player => (player as any).stats?.points !== undefined).length
    const sportsCovered = [...new Set(players.map(player => player.sport))].length
    const avgPoints = players.length > 0 ? 
      Math.round(players.reduce((sum, player) => sum + ((player as any).stats?.points || 0), 0) / players.length) : 0
    
    return { totalPlayers, activePlayers, sportsCovered, avgPoints }
  }, [players])

  const topPlayers = useMemo(() => {
    return players
      .filter(player => (player as any).stats?.points !== undefined)
      .sort((a, b) => ((b as any).stats?.points || 0) - ((a as any).stats?.points || 0))
      .slice(0, 6)
  }, [players])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold">
            Players
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Discover players across all major sports with detailed statistics, performance metrics, and team information
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{playerStats.totalPlayers}</div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/5">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{playerStats.activePlayers}</div>
                  <div className="text-sm text-muted-foreground">Active Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/5">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{playerStats.sportsCovered}</div>
                  <div className="text-sm text-muted-foreground">Sports Covered</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{playerStats.avgPoints}</div>
                  <div className="text-sm text-muted-foreground">Avg Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Players */}
        {topPlayers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={{
              ...player,
                    team: player.teamName || "",
                    recent_form: 'up' // Top performers are trending up
            }}
                  variant="detailed"
          />
        ))}
      </div>
    </div>
        )}

        {/* Filters */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sport Selector */}
              <Select value={selectedSport || ""} onValueChange={(value) => setSelectedSport(value as SupportedSport)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Sport" />
                </SelectTrigger>
                <SelectContent>
                  {supportedSports.map((sport) => {
                    const config = SportConfigManager.getSportConfig(sport)
                    return (
                      <SelectItem key={sport} value={sport}>
                        <span className="flex items-center gap-2">
                          <span>{config?.icon}</span>
                          {config?.name}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              {/* Team Selector */}
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Position Selector */}
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              All Players ({filteredPlayers.length})
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline">
                {filteredPlayers.length} players
              </Badge>
            </div>
          </div>

          {filteredPlayers.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Players Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlayers.map((player) => (
                <PlayerCard 
                  key={player.id} 
                  player={{
                    ...player,
                    team: player.teamName || "",
                    stats: (player as any).stats,
                    recent_form: (player as any).stats?.points && (player as any).stats.points > 20 ? 'up' : 'stable'
                  }} 
                  variant="default"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}