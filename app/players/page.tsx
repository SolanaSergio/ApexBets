"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, BarChart3, Target } from "lucide-react"
import { type BallDontLiePlayer } from "@/lib/sports-apis"
import { SupportedSport, SportConfigManager } from "@/lib/services/core/sport-config"
import { Player } from "@/lib/api-client-database-first"

// Lazy load heavy components
const PlayerSearch = lazy(() => import("@/components/categories/sports/player-search"))
const PlayerStats = lazy(() => import("@/components/categories/sports/player-stats"))
const PlayerComparison = lazy(() => import("@/components/categories/sports/player-comparison"))
const PlayerTrends = lazy(() => import("@/components/categories/sports/player-trends"))

export default function PlayersPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<BallDontLiePlayer | Player | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [supportedSports, setSupportedSports] = useState<string[]>([])

  useEffect(() => {
    // Load supported sports from config
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    // Don't set default sport - let user choose
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Player Analytics
          </h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Comprehensive player statistics, trends, and performance analysis
          </p>
        </div>

        {/* Sport Selector */}
        <div className="flex justify-center mb-6">
          <select 
            value={selectedSport} 
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            {supportedSports.map(sport => {
              const config = require("@/lib/services/core/sport-config").SportConfigManager.getSportConfig(sport as SupportedSport)
              return (
                <option key={sport} value={sport}>
                  {config?.name || sport.charAt(0).toUpperCase() + sport.slice(1)}
                </option>
              )
            })}
          </select>
        </div>

        {/* Search Section */}
        {selectedSport ? (
          <Suspense fallback={
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <h3 className="text-lg font-semibold mb-2">Loading Player Search...</h3>
                  <p className="text-sm">Please wait while we load the search interface</p>
                </div>
              </CardContent>
            </Card>
          }>
            <PlayerSearch onPlayerSelect={(p) => setSelectedPlayer(p as any)} selectedPlayer={selectedPlayer as any} sport={selectedSport} />
          </Suspense>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a Sport</h3>
                <p className="text-sm">Choose a sport above to search for players</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs - Only show when sport is selected */}
        {selectedSport && (
          <Tabs defaultValue="stats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Statistics</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Trends</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="space-y-6">
              <Suspense fallback={
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <h3 className="text-lg font-semibold mb-2">Loading Statistics...</h3>
                      <p className="text-sm">Please wait while we load player statistics</p>
                    </div>
                  </CardContent>
                </Card>
              }>
                <PlayerStats selectedPlayer={selectedPlayer} />
              </Suspense>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Suspense fallback={
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <h3 className="text-lg font-semibold mb-2">Loading Trends...</h3>
                      <p className="text-sm">Please wait while we load player trends</p>
                    </div>
                  </CardContent>
                </Card>
              }>
                <PlayerTrends 
                  playerName={selectedPlayer ? ('first_name' in selectedPlayer ? `${selectedPlayer.first_name} ${selectedPlayer.last_name}` : selectedPlayer.name) : ''}
                  timeRange="30d"
                  sport={selectedSport}
                  league=""
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <Suspense fallback={
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                      <h3 className="text-lg font-semibold mb-2">Loading Comparison...</h3>
                      <p className="text-sm">Please wait while we load comparison tools</p>
                    </div>
                  </CardContent>
                </Card>
              }>
                <PlayerComparison selectedPlayer={selectedPlayer as BallDontLiePlayer | null} />
              </Suspense>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Player Performance Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                    <p className="text-sm">AI-powered player performance predictions will be available here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

