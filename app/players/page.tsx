"use client"

import { useState } from "react"
import PlayerSearch from "@/components/categories/sports/player-search"
import PlayerStats from "@/components/categories/sports/player-stats"
import PlayerComparison from "@/components/categories/sports/player-comparison"
import PlayerTrends from "@/components/categories/sports/player-trends"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, BarChart3, Target } from "lucide-react"
import { type BallDontLiePlayer } from "@/lib/sports-apis"

export default function PlayersPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<BallDontLiePlayer | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("basketball")
  const [supportedSports, setSupportedSports] = useState<string[]>([])

  useEffect(() => {
    // Load supported sports dynamically
    const sports = ['basketball', 'football', 'soccer', 'hockey', 'baseball', 'tennis', 'golf']
    setSupportedSports(sports)
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
            {supportedSports.map(sport => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Search Section */}
        <PlayerSearch onPlayerSelect={setSelectedPlayer} selectedPlayer={selectedPlayer} sport={selectedSport} />

        {/* Main Content Tabs */}
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
            <PlayerStats selectedPlayer={selectedPlayer} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <PlayerTrends selectedPlayer={selectedPlayer} />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <PlayerComparison selectedPlayer={selectedPlayer} />
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
      </main>
    </div>
  )
}

