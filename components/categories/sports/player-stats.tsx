"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Target, 
  Calendar,
  RefreshCw,
  User,
  Trophy,
  Zap
} from "lucide-react"
import { usePlayerStats } from "@/components/data/real-time-provider";
import type { SupportedSport } from "@/lib/services/core/sport-config";
import type { Player } from "@/lib/api-client-database-first";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TeamLogo, PlayerPhoto } from "@/components/ui/sports-image";
import { BallDontLiePlayer } from "@/lib/sports-apis";
import { UnifiedPlayerData } from "@/lib/services/api/unified-api-client";

type PlayerUnion = Player | BallDontLiePlayer | UnifiedPlayerData;

// Helper functions to safely access properties across different player types
function getPlayerName(player: PlayerUnion | null): string | null {
  if (!player) return null;
  if ('name' in player) {
    return player.name;
  }
  if ('first_name' in player && 'last_name' in player) {
    return `${player.first_name} ${player.last_name}`;
  }
  return null;
}

function getPlayerTeamName(player: PlayerUnion | null): string | undefined {
  if (!player) return undefined;
  if ('teamName' in player) {
    return player.teamName;
  }
  if ('team' in player && typeof player.team === 'object' && player.team !== null) {
    return (player.team as any).name || (player.team as any).full_name;
  }
  return undefined;
}

function getPlayerId(player: PlayerUnion | null): string {
  if (!player) return '';
  if ('id' in player) {
    return String(player.id);
  }
  return '';
}

function getPlayerHeight(player: PlayerUnion | null): string | undefined {
  if (!player) return undefined;
  if ('height' in player) {
    return typeof player.height === 'number' ? String(player.height) : player.height;
  }
  if ('height_feet' in player && 'height_inches' in player) {
    const feet = player.height_feet;
    const inches = player.height_inches;
    if (feet !== null && inches !== null) {
      return `${feet}'${inches}"`;
    }
  }
  return undefined;
}

interface PlayerStatsProps {
  selectedPlayer?: PlayerUnion | null;
  sport?: SupportedSport;
}

export default function PlayerStats({ selectedPlayer }: PlayerStatsProps) {
  const { stats, loading } = usePlayerStats(getPlayerId(selectedPlayer ?? null));
  const [selectedSeason, setSelectedSeason] = useState<number>(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("season");

  const seasons = useMemo(() => {
    if (!stats) return [];
    const allSeasons = stats.map(stat => stat.season);
    return [...new Set(allSeasons)].sort((a, b) => b - a);
  }, [stats]);

  const filteredStats = useMemo(() => {
    if (!stats) return [];
    let periodStats = stats.filter(stat => stat.season === selectedSeason);
    if (selectedPeriod === "last5") {
      periodStats = periodStats.slice(-5);
    }
    if (selectedPeriod === "last10") {
      periodStats = periodStats.slice(-10);
    }
    if (selectedPeriod === "last20") {
      periodStats = periodStats.slice(-20);
    }
    return periodStats;
  }, [stats, selectedSeason, selectedPeriod]);

  const calculateAverages = () => {
    if (filteredStats.length === 0) return null

    const totals = filteredStats.reduce((acc, stat) => ({
      pts: acc.pts + stat.pts,
      reb: acc.reb + stat.reb,
      ast: acc.ast + stat.ast,
      stl: acc.stl + stat.stl,
      blk: acc.blk + stat.blk,
      fgm: acc.fgm + stat.fgm,
      fga: acc.fga + stat.fga,
      fg3m: acc.fg3m + stat.fg3a,
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
  }

  const prepareChartData = () => {
    return filteredStats.map((stat, index) => ({
      game: `G${index + 1}`,
      pts: stat.pts,
      reb: stat.reb,
      ast: stat.ast,
      fg_pct: stat.fg_pct * 100
    }))
  }

  const averages = calculateAverages()
  const chartData = prepareChartData()

  if (!selectedPlayer) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
            <p className="text-sm">Choose a player from the search above to view their statistics</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PlayerPhoto 
                playerId={getPlayerId(selectedPlayer)}
                alt={getPlayerName(selectedPlayer) || 'Player'}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
              <div>
                <h2 className="text-2xl font-bold">
                  {getPlayerName(selectedPlayer)}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {selectedPlayer.position && (
                    <Badge variant="secondary">{selectedPlayer.position}</Badge>
                  )}
                  {getPlayerTeamName(selectedPlayer) && (
                    <span className="flex items-center gap-1">
                      <TeamLogo 
                        teamName={getPlayerTeamName(selectedPlayer)!} 
                        alt={getPlayerTeamName(selectedPlayer)!}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                      {getPlayerTeamName(selectedPlayer)}
                    </span>
                  )}
                  {getPlayerHeight(selectedPlayer) && (
                    <span>{getPlayerHeight(selectedPlayer)}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Season Averages</div>
              {averages && (
                <div className="text-2xl font-bold text-primary">
                  {averages.pts} PTS
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <Select value={selectedSeason.toString()} onValueChange={(value) => setSelectedSeason(Number(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(season => (
                  <SelectItem key={season} value={season.toString()}>{season}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last5">Last 5 Games</SelectItem>
                <SelectItem value="last10">Last 10 Games</SelectItem>
                <SelectItem value="last20">Last 20 Games</SelectItem>
                <SelectItem value="season">Full Season</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={() => {}} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {averages && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold">{averages.pts}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rebounds</p>
                  <p className="text-2xl font-bold">{averages.reb}</p>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assists</p>
                  <p className="text-2xl font-bold">{averages.ast}</p>
                </div>
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Games</p>
                  <p className="text-2xl font-bold">{averages.games}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Stats */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="shooting">Shooting</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Per Game Averages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Points</span>
                  <span className="font-semibold">{averages?.pts || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rebounds</span>
                  <span className="font-semibold">{averages?.reb || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assists</span>
                  <span className="font-semibold">{averages?.ast || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Steals</span>
                  <span className="font-semibold">{averages?.stl || '0.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blocks</span>
                  <span className="font-semibold">{averages?.blk || '0.0'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shooting Percentages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Field Goal %</span>
                    <span className="font-semibold">{averages?.fg_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.fg_pct) || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>3-Point %</span>
                    <span className="font-semibold">{averages?.fg3_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.fg3_pct) || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Free Throw %</span>
                    <span className="font-semibold">{averages?.ft_pct || '0.0'}%</span>
                  </div>
                  <Progress value={Number(averages?.ft_pct) || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shooting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shooting Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.fg_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">FG%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.fg3_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">3P%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.ft_pct || '0.0'}%</div>
                  <div className="text-sm text-muted-foreground">FT%</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{averages?.pts || '0.0'}</div>
                  <div className="text-sm text-muted-foreground">PPG</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="game" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="pts" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="reb" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="ast" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
