"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Target,
  Trophy,
  Zap,
  Award,
  TrendingUp,
  BarChart3,
  X
} from "lucide-react"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts"
import { TeamLogo, PlayerPhoto } from "@/components/ui/sports-image"
import { usePlayers, usePlayerStats } from "@/components/data/real-time-provider"
import type { Player, PlayerStats } from "@/lib/api-client-database-first"

interface PlayerComparisonProps {
  selectedPlayer?: Player | null
}

export default function PlayerComparison({ selectedPlayer }: PlayerComparisonProps) {
  const [comparisonPlayer, setComparisonPlayer] = useState<Player | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { players: allPlayers } = usePlayers(selectedPlayer?.sport)
  const { stats: player1AllStats } = usePlayerStats(selectedPlayer?.id)
  const { stats: player2AllStats } = usePlayerStats(comparisonPlayer?.id)

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || !allPlayers) return []
    return allPlayers.filter(player =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      player.id !== selectedPlayer?.id
    ).slice(0, 10)
  }, [searchQuery, allPlayers, selectedPlayer])

  const getPlayerStatsForSeason = useCallback((playerStats: PlayerStats[], season: number) => {
    return playerStats.filter(stat => stat.season === season)
  }, [])

  const calculateAverages = useCallback((stats: PlayerStats[]) => {
    if (stats.length === 0) return null

    const totals = stats.reduce((acc, stat) => ({
      pts: acc.pts + stat.pts,
      reb: acc.reb + stat.reb,
      ast: acc.ast + stat.ast,
      stl: acc.stl + stat.stl,
      blk: acc.blk + stat.blk,
      fgm: acc.fgm + stat.fgm,
      fga: acc.fga + stat.fga,
      fg3m: acc.fg3m + stat.fg3m,
      fg3a: acc.fg3a + stat.fg3a,
      ftm: acc.ftm + stat.ftm,
      fta: acc.fta + stat.fta,
      turnover: acc.turnover + stat.turnover,
      pf: acc.pf + stat.pf,
      games: acc.games + 1
    }), {
      pts: 0, reb: 0, ast: 0, stl: 0, blk: 0,
      fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0,
      turnover: 0, pf: 0, games: 0
    })

    return {
      pts: (totals.pts / totals.games).toFixed(1),
      reb: (totals.reb / totals.games).toFixed(1),
      ast: (totals.ast / totals.games).toFixed(1),
      stl: (totals.stl / totals.games).toFixed(1),
      blk: (totals.blk / totals.games).toFixed(1),
      fg_pct: totals.fga > 0 ? ((totals.fgm / totals.fga) * 100).toFixed(1) : 0,
      fg3_pct: totals.fg3a > 0 ? ((totals.fg3m / totals.fg3a) * 100).toFixed(1) : 0,
      ft_pct: totals.fta > 0 ? ((totals.ftm / totals.fta) * 100).toFixed(1) : 0,
      games: totals.games
    }
  }, [])

  const currentSeason = new Date().getFullYear()

  const player1Avg = useMemo(() => {
    if (!selectedPlayer || !player1AllStats) return null
    const statsForSeason = getPlayerStatsForSeason(player1AllStats, currentSeason)
    return calculateAverages(statsForSeason)
  }, [selectedPlayer, player1AllStats, currentSeason, getPlayerStatsForSeason, calculateAverages])

  const player2Avg = useMemo(() => {
    if (!comparisonPlayer || !player2AllStats) return null
    const statsForSeason = getPlayerStatsForSeason(player2AllStats, currentSeason)
    return calculateAverages(statsForSeason)
  }, [comparisonPlayer, player2AllStats, currentSeason, getPlayerStatsForSeason, calculateAverages])

  const radarData = useMemo(() => {
    if (!player1Avg || !player2Avg) return []

    return [
      { category: 'Points', player1: Number(player1Avg.pts), player2: Number(player2Avg.pts) },
      { category: 'Rebounds', player1: Number(player1Avg.reb), player2: Number(player2Avg.reb) },
      { category: 'Assists', player1: Number(player1Avg.ast), player2: Number(player2Avg.ast) },
      { category: 'Steals', player1: Number(player1Avg.stl), player2: Number(player2Avg.stl) },
      { category: 'Blocks', player1: Number(player1Avg.blk), player2: Number(player2Avg.blk) },
      { category: 'FG%', player1: Number(player1Avg.fg_pct), player2: Number(player2Avg.fg_pct) }
    ]
  }, [player1Avg, player2Avg])

  if (!selectedPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
            <p className="text-sm">Choose a player to start comparing</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Player Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Player 1 (Selected) */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center space-x-3">
              <PlayerPhoto
                playerId={selectedPlayer.id}
                alt={`${selectedPlayer.name}`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full"
              />
              <div>
                <div className="font-semibold">
                  {selectedPlayer.name}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge variant="secondary">{selectedPlayer.position}</Badge>
                    <span className="flex items-center gap-1">
                      <TeamLogo
                        teamName={selectedPlayer.teamName || ''}
                        alt={selectedPlayer.teamName || ''}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                      {selectedPlayer.teamName}
                    </span>
                </div>
              </div>
            </div>
            <Badge variant="outline">Player 1</Badge>
          </div>

          {/* Player 2 Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare with:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a player to compare..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchQuery("")
                    setComparisonPlayer(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                {searchResults.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer rounded"
                    onClick={() => {
                      setComparisonPlayer(player)
                      setSearchQuery("")
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <PlayerPhoto
                        playerId={player.id}
                        alt={`${player.name}`}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {player.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {player.position} • {player.teamName}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Player 2 */}
            {comparisonPlayer && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-3">
                  <PlayerPhoto
                    playerId={comparisonPlayer.id}
                    alt={`${comparisonPlayer.name}`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">
                      {comparisonPlayer.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="secondary">{comparisonPlayer.position}</Badge>
                      <span className="flex items-center gap-1">
                        <TeamLogo
                          teamName={comparisonPlayer.teamName || ''}
                          alt={comparisonPlayer.teamName || ''}
                          width={16}
                          height={16}
                          className="h-4 w-4"
                        />
                        {comparisonPlayer.teamName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Player 2</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setComparisonPlayer(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonPlayer && player1Avg && player2Avg && (
        <div className="space-y-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 30]} />
                    <Radar
                      name="Player 1"
                      dataKey="player1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Player 2"
                      dataKey="player2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stats Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Statistical Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: 'pts', label: 'Points', icon: Target },
                  { key: 'reb', label: 'Rebounds', icon: Trophy },
                  { key: 'ast', label: 'Assists', icon: Zap },
                  { key: 'stl', label: 'Steals', icon: Award },
                  { key: 'blk', label: 'Blocks', icon: TrendingUp },
                  { key: 'fg_pct', label: 'FG%', icon: BarChart3 }
                ].map(({ key, label, icon: Icon }) => {
                  const player1Value = Number((player1Avg as any)[key])
                  const player2Value = Number((player2Avg as any)[key])
                  const maxValue = Math.max(player1Value, player2Value)
                  const player1Percentage = maxValue > 0 ? (player1Value / maxValue) * 100 : 0
                  const player2Percentage = maxValue > 0 ? (player2Value / maxValue) * 100 : 0

                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="font-semibold text-primary">
                            {player1Value.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-semibold text-green-600">
                            {player2Value.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Player 1</span>
                            <span>{player1Value.toFixed(1)}</span>
                          </div>
                          <Progress value={player1Percentage} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Player 2</span>
                            <span>{player2Value.toFixed(1)}</span>
                          </div>
                          <Progress value={player2Percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!comparisonPlayer && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Select a Player to Compare</h3>
              <p className="text-sm">Search for another player to see detailed comparison</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}