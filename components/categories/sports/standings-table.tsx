'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, RefreshCw } from 'lucide-react'
import { unifiedApiClient, SupportedSport } from '@/lib/services/api/unified-api-client'
import { SportConfigManager } from '@/lib/services/core/sport-config'
import { SportsImage } from '@/components/ui/sports-image'

interface StandingsTableProps {
  sport: SupportedSport
  className?: string
}

interface StandingsData {
  rank: number
  team: string
  wins: number
  losses: number
  ties?: number
  winRate: number
  gamesBehind: number
  conference?: string
  division?: string
}

export default function StandingsTable({ sport, className = '' }: StandingsTableProps) {
  const [standings, setStandings] = useState<StandingsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConference, setSelectedConference] = useState<string>('all')
  const [sportConfig, setSportConfig] = useState<any>(null)

  const loadStandings = useCallback(async () => {
    try {
      setLoading(true)
      const standingsData = await unifiedApiClient.getStandings(sport)

      // Transform the data to match our interface
      const transformedStandings = standingsData.map((team: any, index: number) => {
        const teamName = team.team_name || team.name || team.full_name || team.team?.name
        const wins = team.wins || 0
        const losses = team.losses || 0
        const ties = team.ties || team.draws || 0
        const totalGames = wins + losses + ties

        // Calculate win percentage - handle both decimal and percentage formats
        let winPercentage = 0
        if (team.win_percentage !== undefined && team.win_percentage !== null) {
          // If it's already a percentage (0-1), convert to 0-1 for display
          winPercentage =
            typeof team.win_percentage === 'string'
              ? parseFloat(team.win_percentage)
              : team.win_percentage
        } else if (totalGames > 0) {
          // Calculate from wins/losses
          winPercentage = wins / (wins + losses)
        }

        return {
          rank: team.position || team.rank || team.standing || index + 1,
          team: teamName || 'Unknown Team',
          wins,
          losses,
          ties,
          winRate: winPercentage,
          gamesBehind: team.games_back || team.gb || 0,
          conference: team.conference || team.league,
          division: team.division,
        }
      })

      // Filter by conference if specified
      let filteredStandings = transformedStandings
      if (selectedConference !== 'all') {
        filteredStandings = transformedStandings.filter(
          team => team.conference === selectedConference
        )
      }

      setStandings(filteredStandings)
    } catch (error) {
      console.error('Error loading standings:', error)
      setStandings([])
    } finally {
      setLoading(false)
    }
  }, [sport, selectedConference])

  useEffect(() => {
    loadStandings()
  }, [loadStandings])

  // Load sport config
  useEffect(() => {
    const loadSportConfig = async () => {
      try {
        const config = await SportConfigManager.getSportConfig(sport)
        setSportConfig(config)
      } catch (error) {
        console.error('Failed to load sport config:', error)
        setSportConfig(null)
      }
    }
    loadSportConfig()
  }, [sport])

  // Check if we're in off-season or have insufficient data
  const isOffSeason = useMemo(() => {
    if (!standings.length) return true

    // Check if all teams have very few games (likely off-season or early season)
    const totalGames = standings.reduce(
      (sum, team) => sum + team.wins + team.losses + (team.ties || 0),
      0
    )
    const avgGamesPerTeam = totalGames / standings.length

    // If average games per team is less than 10, consider it off-season or early season
    return avgGamesPerTeam < 10
  }, [standings])

  // Check if we have valid standings data
  const hasValidData = useMemo(() => {
    return (
      standings.length > 0 &&
      standings.some(team => team.wins > 0 || team.losses > 0 || (team.ties || 0) > 0)
    )
  }, [standings])

  if (loading) {
    return <StandingsSkeleton />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className={sportConfig?.color}>{sportConfig?.icon}</span>
            {sportConfig?.name} Standings
          </h2>
          <p className="text-muted-foreground">
            Current {sportConfig?.name.toLowerCase()} league standings
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStandings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Conference Filter */}
      {standings.some(team => team.conference) && (
        <div className="flex gap-2">
          <Button
            variant={selectedConference === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedConference('all')}
          >
            All
          </Button>
          {Array.from(new Set(standings.map(team => team.conference).filter(Boolean))).map(
            conference => (
              <Button
                key={conference}
                variant={selectedConference === conference ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedConference(conference!)}
              >
                {conference}
              </Button>
            )
          )}
        </div>
      )}

      {/* Off-season or insufficient data display */}
      {!hasValidData || isOffSeason ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isOffSeason ? 'Early Season / Off-Season' : 'No Standings Available'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isOffSeason
                    ? 'Standings will be available once teams have played more games. Check back soon for updated league standings.'
                    : 'Standings data is not currently available. This may be due to off-season or data synchronization issues.'}
                </p>
                {isOffSeason && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      💡 <strong>Tip:</strong> Standings become more meaningful after teams have
                      played 10+ games
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Rank</th>
                      <th className="p-4 font-medium">Team</th>
                      <th className="p-4 font-medium text-center">W</th>
                      <th className="p-4 font-medium text-center">L</th>
                      {standings[0]?.ties !== undefined && (
                        <th className="p-4 font-medium text-center">T</th>
                      )}
                      <th className="p-4 font-medium text-center">Win%</th>
                      <th className="p-4 font-medium text-center">GB</th>
                      {standings[0]?.conference && (
                        <th className="p-4 font-medium text-center">Conf</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map(team => (
                      <tr key={team.rank} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">#{team.rank}</span>
                            {team.rank <= 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <SportsImage
                              type="team"
                              league={(sportConfig?.leagues && sportConfig.leagues[0]) || sport}
                              teamName={team.team}
                              alt={`${team.team} logo`}
                              className="h-8 w-8 rounded-full"
                            />
                            <span className="font-medium">{team.team}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold text-primary">{team.wins}</td>
                        <td className="p-4 text-center">{team.losses}</td>
                        {team.ties !== undefined && (
                          <td className="p-4 text-center">{team.ties}</td>
                        )}
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{Math.round(team.winRate * 100)}%</span>
                            <Progress value={team.winRate * 100} className="w-16 h-2" />
                          </div>
                        </td>
                        <td className="p-4 text-center text-muted-foreground">
                          {team.gamesBehind === 0 ? '-' : `${team.gamesBehind}`}
                        </td>
                        {team.conference && (
                          <td className="p-4 text-center">
                            <Badge variant="outline" className="text-xs">
                              {team.conference}
                            </Badge>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Standings Available</h3>
                <p className="text-sm">Standings data will be available soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>

      <div className="h-10 w-64 bg-muted rounded animate-pulse" />

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
