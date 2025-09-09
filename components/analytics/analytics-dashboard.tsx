"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamPerformanceChart } from "./team-performance-chart"
import { PredictionAccuracyChart } from "./prediction-accuracy-chart"
import { OddsAnalysisChart } from "./odds-analysis-chart"
import { TrendAnalysis } from "./trend-analysis"
import { PlayerAnalytics } from "./player-analytics"
import { ValueBettingOpportunities } from "./value-betting-opportunities"

export function AnalyticsDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("30d")

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
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
          <TeamPerformanceChart team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <PredictionAccuracyChart timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="odds" className="space-y-6">
          <OddsAnalysisChart team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <PlayerAnalytics team={selectedTeam} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="betting" className="space-y-6">
          <ValueBettingOpportunities timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
