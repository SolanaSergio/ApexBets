"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Search, 
  Star, 
  Users, 
  Trophy, 
  MapPin 
} from "lucide-react"
import { apiClient, type Team } from "@/lib/api-client"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

type TeamData = Team

interface TeamsListProps {
  sport: SupportedSport
  className?: string
}

export function TeamsList({ sport, className = "" }: TeamsListProps) {
  const [teams, setTeams] = useState<TeamData[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [leagueFilter, setLeagueFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "league" | "city">("name")

  useEffect(() => {
    loadTeams()
  }, [sport])

  useEffect(() => {
    filterAndSortTeams()
  }, [teams, searchTerm, leagueFilter, sortBy])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const sportTeams = await apiClient.getTeams({ sport })
      setTeams(sportTeams)
    } catch (error) {
      console.error('Error loading teams:', error)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTeams()
    setRefreshing(false)
  }

  const filterAndSortTeams = () => {
    let filtered = [...teams]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.abbreviation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.league.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // League filter
    if (leagueFilter !== "all") {
      filtered = filtered.filter(team => team.league === leagueFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "league":
          return a.league.localeCompare(b.league) || a.name.localeCompare(b.name)
        case "city":
          return (a.city || '').localeCompare(b.city || '') || a.name.localeCompare(b.name)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredTeams(filtered)
  }

  const getUniqueLeagues = () => {
    const leagues = Array.from(new Set(teams.map(team => team.league)))
    return leagues.sort()
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <TeamsListSkeleton />
  }

  const uniqueLeagues = getUniqueLeagues()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className={`text-2xl ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              {sportConfig?.name} Teams
            </CardTitle>
            <CardDescription>
              Professional and professional teams across all leagues
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
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Leagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {uniqueLeagues.map((league) => (
                  <SelectItem key={league} value={league}>
                    {league}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
          </div>
          {filteredTeams.length > teams.length * 0.5 && (
            <Badge variant="outline">
              <Star className="h-3 w-3 mr-1" />
              Most active
            </Badge>
          )}
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No teams found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.slice(0, 50).map((team) => (
              <TeamCard key={team.id} team={team} sport={sport} />
            ))}
          </div>
        )}

        {filteredTeams.length > 50 && (
          <div className="text-center mt-6">
            <Button variant="outline">
              Load More Teams ({filteredTeams.length - 50} remaining)
            </Button>
          </div>
        )}

        {teams.length === 0 && !loading && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No teams data available</p>
            <p className="text-sm text-muted-foreground">
              Team data may be temporarily unavailable for {sportConfig?.name}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TeamCardProps {
  team: TeamData
  sport: SupportedSport
}

function TeamCard({ team, sport }: TeamCardProps) {
  const sportConfig = SportConfigManager.getSportConfig(sport)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted/50`}>
                <span className={`text-lg ${sportConfig?.color}`}>{sportConfig?.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{team.name}</h3>
                <p className="text-xs text-muted-foreground">#{team.abbreviation || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{team.city || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-3 w-3 text-muted-foreground" />
              <span>{team.league}</span>
            </div>
          </div>

          {/* Stats/Highlights */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Active Roster</span>
              </div>
               <Badge variant="secondary" className="text-xs">
                {team.abbreviation || 'N/A'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-16 bg-muted rounded animate-pulse mt-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
