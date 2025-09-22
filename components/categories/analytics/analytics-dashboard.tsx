"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, Target, DollarSign } from "lucide-react"
import { simpleApiClient } from "@/lib/api-client-simple"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
import TeamPerformanceChart from "./team-performance-chart"
import PredictionAccuracyChart from "./prediction-accuracy-chart"
import OddsAnalysisChart from "./odds-analysis-chart"
import TrendAnalysis from "./trend-analysis"
import PlayerAnalytics from "./player-analytics"
import ValueBettingOpportunities from "./value-betting-opportunities"

interface AnalyticsOverview {
  totalGames: number
  totalPredictions: number
  accuracyRate: number
  totalValueBets: number
  averageValue: number
  profitLoss: number
  winRate: number
  roi: number
}

interface AnalyticsDashboardProps {
  selectedSport?: string
  selectedLeague?: string
  onSportChange?: (sport: string) => void
  onLeagueChange?: (league: string) => void
}

export default function AnalyticsDashboard({ 
  selectedSport: propSelectedSport, 
  selectedLeague: propSelectedLeague,
  onSportChange,
  onLeagueChange
}: AnalyticsDashboardProps = {}) {
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("30d")
  const [selectedSport, setSelectedSport] = useState<string>(propSelectedSport || "")
  const [selectedLeague, setSelectedLeague] = useState<string>(propSelectedLeague || "")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [availableTeams, setAvailableTeams] = useState<any[]>([])
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadSupportedSports = useCallback(() => {
    try {
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
      // Set default sport if none selected
      if (!selectedSport && sports.length > 0) {
        setSelectedSport(sports[0])
      }
    } catch (error) {
      console.error('Error loading supported sports:', error)
    }
  }, [selectedSport])

  const loadAvailableTeams = useCallback(async () => {
    if (!selectedSport) return
    try {
      const teams = await simpleApiClient.getTeams({ sport: selectedSport, league: selectedLeague })
      setAvailableTeams(teams)
    } catch (error) {
      console.error('Error loading available teams:', error)
      setAvailableTeams([])
    }
  }, [selectedSport, selectedLeague])

  const fetchAnalyticsOverview = useCallback(async () => {
    try {
      setLoading(true)
      const data = await simpleApiClient.getAnalyticsStats(selectedSport)
      
      // Transform the API response to match our interface
      setOverview({
        totalGames: data.total_games || 0,
        totalPredictions: data.total_predictions || 0,
        accuracyRate: data.accuracy_rate || 0,
        totalValueBets: 0, // Not in AnalyticsStats
        averageValue: 0, // Not in AnalyticsStats
        profitLoss: 0, // Not in AnalyticsStats
        winRate: data.accuracy_rate || 0,
        roi: 0 // Not in AnalyticsStats
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      // Set empty overview on error
      setOverview({
        totalGames: 0,
        totalPredictions: 0,
        accuracyRate: 0,
        totalValueBets: 0,
        averageValue: 0,
        profitLoss: 0,
        winRate: 0,
        roi: 0
      })
    } finally {
      setLoading(false)
    }
  }, [selectedSport])

  useEffect(() => {
    loadSupportedSports()
  }, [loadSupportedSports])

  useEffect(() => {
    if (selectedSport) {
      fetchAnalyticsOverview()
      loadAvailableTeams()
    }
  }, [selectedSport, selectedLeague, fetchAnalyticsOverview, loadAvailableTeams])

  const refreshData = () => {
    fetchAnalyticsOverview()
  }

  // Show loading state while sports are loading
  if (supportedSports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sports data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show no sport selected state
  if (!selectedSport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Select a Sport</h3>
            <p className="text-muted-foreground">Choose a sport to view analytics</p>
            <div className="mt-4">
              <Select 
                value={selectedSport} 
                onValueChange={(value) => {
                  setSelectedSport(value)
                  onSportChange?.(value)
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a sport..." />
                </SelectTrigger>
                <SelectContent>
                  {supportedSports.map((sport) => {
                    const config = SportConfigManager.getSportConfig(sport)
                    return (
                      <SelectItem key={sport} value={sport}>
                        <div className="flex items-center gap-2">
                          <span className={config?.color}>{config?.icon}</span>
                          {config?.name}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sport and League Selectors */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Sport</label>
          <Select 
            value={selectedSport} 
            onValueChange={(value) => {
              setSelectedSport(value)
              onSportChange?.(value)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedSports.map((sport) => {
                const config = SportConfigManager.getSportConfig(sport)
                return (
                  <SelectItem key={sport} value={sport}>
                    <div className="flex items-center gap-2">
                      <span className={config?.color}>{config?.icon}</span>
                      {config?.name}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        
        <div className="min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">League</label>
          <Select 
            value={selectedLeague} 
            onValueChange={(value) => {
              setSelectedLeague(value)
              onLeagueChange?.(value)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Leagues</SelectItem>
              {(() => {
                const sportConfig = SportConfigManager.getSportConfig(selectedSport as SupportedSport)
                return (sportConfig?.leagues || []).map((league: any) => (
                  <SelectItem key={league.id} value={league.id}>
                    {league.name}
                  </SelectItem>
                )) || []
              })()}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Games</p>
                  <p className="text-2xl font-bold">{overview.totalGames}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p>
                  <p className="text-2xl font-bold">{(overview.accuracyRate * 100).toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Value Bets</p>
                  <p className="text-2xl font-bold">{overview.totalValueBets}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg Value: {(overview.averageValue * 100).toFixed(1)}%
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ROI</p>
                  <p className="text-2xl font-bold">
                    {overview.roi > 0 ? '+' : ''}{(overview.roi * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    P&L: ${overview.profitLoss.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Analytics Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="season">This Season</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="odds">Odds Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="betting">Value Bets</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <TeamPerformanceChart 
            team={selectedTeam} 
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionAccuracyChart 
            team={selectedTeam}
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>

        <TabsContent value="odds" className="space-y-6">
          <OddsAnalysisChart 
            team={selectedTeam} 
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis 
            team={selectedTeam} 
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <PlayerAnalytics 
            team={selectedTeam} 
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>

        <TabsContent value="betting" className="space-y-6">
          <ValueBettingOpportunities 
            timeRange={timeRange} 
            sport={selectedSport}
            league={selectedLeague}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
