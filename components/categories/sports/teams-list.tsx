"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Star,
  TrendingUp,
  Users
} from "lucide-react"
import { unifiedApiClient, SupportedSport, UnifiedTeamData } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

type TeamData = UnifiedTeamData
import { SportsImage } from "@/components/ui/sports-image"

interface TeamsListProps {
  sport: SupportedSport
  className?: string
}

export default function TeamsList({ sport, className = "" }: TeamsListProps) {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [teams, setTeams] = useState<TeamData[]>([])
  const [filteredTeams, setFilteredTeams] = useState<TeamData[]>([])

  useEffect(() => {
    loadTeams()
  }, [sport])

  useEffect(() => {
    filterTeams()
  }, [teams, searchTerm])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const teamsData = await unifiedApiClient.getTeams(sport, {})
      setTeams(teamsData)
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTeams = () => {
    if (!searchTerm) {
      setFilteredTeams(teams)
      return
    }

    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.city.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTeams(filtered)
  }

  const sportConfig = SportConfigManager.getSportConfig(sport)

  if (loading) {
    return <TeamsListSkeleton />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className={sportConfig?.color}>{sportConfig?.icon}</span>
            {sportConfig?.name} Teams
          </h2>
          <p className="text-muted-foreground">
            {teams.length} teams in {sportConfig?.name.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${sportConfig?.name.toLowerCase()} teams...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <SportsImage
                  type="team"
                  league={team.league}
                  teamName={team.name}
                  className="h-12 w-12"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg truncate">{team.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {team.city} • {team.abbreviation}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {team.league}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {team.sport}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTeams.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No teams found matching "{searchTerm}"</p>
        </div>
      )}

      {/* Empty State */}
      {teams.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No teams available for {sportConfig?.name.toLowerCase()}</p>
        </div>
      )}
    </div>
  )
}

function TeamsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="h-10 w-full bg-muted rounded animate-pulse" />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
