"use client"

import { useState, useEffect, useMemo } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TeamCard } from "@/components/sports/team-card"
import { Search, Filter, Users, Trophy, TrendingUp } from "lucide-react"
import { databaseFirstApiClient, type Team } from "@/lib/api-client-database-first"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [selectedConference, setSelectedConference] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [conferences, setConferences] = useState<string[]>([])

  useEffect(() => {
    loadTeams()
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadConferencesForSport(selectedSport)
    }
  }, [selectedSport])

  const loadTeams = async () => {
    try {
      setLoading(true)
      const allTeams = await databaseFirstApiClient.getTeams()
      setTeams(allTeams || [])
    } catch (error) {
      console.error('Error loading teams:', error)
      setTeams([])
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

  const loadConferencesForSport = async (sport: SupportedSport) => {
    try {
      const teams = await databaseFirstApiClient.getTeams({ sport })
      const uniqueConferences = [...new Set(teams.map(team => (team as any).conference).filter(Boolean))]
      setConferences(uniqueConferences)
    } catch (error) {
      console.error('Error loading conferences:', error)
      setConferences([])
    }
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSport = !selectedSport || team.sport === selectedSport
      
      const matchesConference = !selectedConference || (team as any).conference === selectedConference
      
      return matchesSearch && matchesSport && matchesConference
    })
  }, [teams, searchTerm, selectedSport, selectedConference])

  const teamStats = useMemo(() => {
    const totalTeams = teams.length
    const activeTeams = teams.filter(team => (team as any).wins !== undefined).length
    const sportsCovered = [...new Set(teams.map(team => team.sport))].length
    
    return { totalTeams, activeTeams, sportsCovered }
  }, [teams])

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
            Teams
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore teams across all major sports leagues with detailed statistics and performance metrics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{teamStats.totalTeams}</div>
                  <div className="text-sm text-muted-foreground">Total Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/5">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{teamStats.activeTeams}</div>
                  <div className="text-sm text-muted-foreground">Active Teams</div>
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
                  <div className="text-2xl font-bold">{teamStats.sportsCovered}</div>
                  <div className="text-sm text-muted-foreground">Sports Covered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
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

              {/* Conference Selector */}
              <Select value={selectedConference} onValueChange={setSelectedConference}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Conference" />
                </SelectTrigger>
                <SelectContent>
                  {conferences.map((conference) => (
                    <SelectItem key={conference} value={conference}>
                      {conference}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Teams ({filteredTeams.length})
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline">
                {filteredTeams.length} teams
              </Badge>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <Card className="card-modern">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Teams Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={{
                    ...team,
                    ...(team.logo_url && { logo: team.logo_url }),
                    ...((team as any).wins !== undefined && { wins: (team as any).wins }),
                    ...((team as any).losses !== undefined && { losses: (team as any).losses }),
                    ...((team as any).conference && { conference: (team as any).conference }),
                    ...((team as any).streak !== undefined && { streak: (team as any).streak }),
                    ...((team as any).streak_type && { streak_type: (team as any).streak_type })
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