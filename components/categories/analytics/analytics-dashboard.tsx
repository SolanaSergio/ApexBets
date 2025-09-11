"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, Target, DollarSign } from "lucide-react"
import { cachedUnifiedApiClient, SupportedSport } from "@/lib/services/api/cached-unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"
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
  const [selectedSport, setSelectedSport] = useState<string>(propSelectedSport || "basketball")
  const [selectedLeague, setSelectedLeague] = useState<string>(propSelectedLeague || "")
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadSupportedSports()
  }, [])

  useEffect(() => {
    fetchAnalyticsOverview()
  }, [timeRange, selectedSport, selectedLeague])

  const loadSupportedSports = async () => {
    try {
      const sports = cachedUnifiedApiClient.getSupportedSports()
      setSupportedSports(sports)
    } catch (error) {
      console.error('Error loading supported sports:', error)
    }
  }

  const fetchAnalyticsOverview = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        sport: selectedSport
      })
      if (selectedLeague) params.set('league', selectedLeague)
      
      const response = await fetch(`/api/analytics/stats?${params}`)
      const data = await response.json()
      
      // Transform the API response to match our interface
      setOverview({
        totalGames: data.total_games || 0,
        totalPredictions: data.total_predictions || 0,
        accuracyRate: data.accuracy_rate || 0,
        totalValueBets: data.total_value_bets || 0,
        averageValue: data.average_value || 0,
        profitLoss: data.profit_loss || 0,
        winRate: data.accuracy_rate || 0,
        roi: data.roi || 0
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchAnalyticsOverview()
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
                return sportConfig?.leagues.map((league) => (
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
                  <SelectItem value="lakers">Los Angeles Lakers</SelectItem>
                  <SelectItem value="warriors">Golden State Warriors</SelectItem>
                  <SelectItem value="celtics">Boston Celtics</SelectItem>
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
