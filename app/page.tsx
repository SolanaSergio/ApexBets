import { AuthGuard } from "@/components/auth/auth-guard"
import { RealTimeProvider } from "@/components/data/real-time-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { LiveGamesHero } from "@/components/homepage/live-games-hero"
import { PredictionsDashboard } from "@/components/homepage/predictions-dashboard"
import { AnalyticsOverview } from "@/components/homepage/analytics-overview"
import { SportsGrid } from "@/components/homepage/sports-grid"
import { SportSelector } from "@/components/homepage/sport-selector"
import { databaseFirstApiClient } from "@/lib/api-client-database-first"
import { SportConfigManager } from "@/lib/services/core/sport-config"

// Server-side data prefetching for initial page load
async function getInitialData() {
  try {
    const supportedSports = SportConfigManager.getSupportedSports()
    
    // Fetch data for all sports in parallel
    const dataPromises = supportedSports.map(async (sport) => {
      try {
        const [games, predictions, odds, standings, players] = await Promise.all([
          databaseFirstApiClient.getGames({ sport, limit: 200 }),
          databaseFirstApiClient.getPredictions({ sport, limit: 100 }),
          databaseFirstApiClient.getOdds({ sport, limit: 500 }),
          databaseFirstApiClient.getStandings({ sport }),
          databaseFirstApiClient.getPlayers({ sport, limit: 1000 })
        ])
        
        return {
          sport,
          games: games,
          predictions: predictions,
          odds: odds,
          standings: standings,
          players: players
        }
      } catch (error) {
        console.warn(`Failed to fetch data for ${sport}:`, error)
        return {
          sport,
          games: [],
          predictions: [],
          odds: [],
          standings: [],
          players: []
        }
      }
    })

    const sportsData = await Promise.all(dataPromises)
    
    // Combine all data
    const allGames = sportsData.flatMap(s => s.games)
    const allPredictions = sportsData.flatMap(s => s.predictions)
    const allOdds = sportsData.flatMap(s => s.odds)
    const allStandings = sportsData.flatMap(s => s.standings)
    const allPlayers = sportsData.flatMap(s => s.players)

    return {
      games: allGames,
      predictions: allPredictions,
      odds: allOdds,
      standings: allStandings,
      players: allPlayers,
      sportsData: Object.fromEntries(sportsData.map(s => [s.sport, s]))
    }
  } catch (error) {
    console.error('Failed to fetch initial data:', error)
    return {
      games: [],
      predictions: [],
      odds: [],
      standings: [],
      players: [],
      sportsData: {}
    }
  }
}

export default async function HomePage() {
  // Prefetch data on server
  const initialData = await getInitialData()

  return (
    <AuthGuard>
      <RealTimeProvider initialData={initialData}>
        <AppLayout>
          <div className="space-y-6 p-4 md:p-6">
            {/* Sport Selector */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">ApexBets Dashboard</h1>
                <p className="text-muted-foreground">Real-time sports analytics and predictions</p>
              </div>
              <div className="w-full md:w-auto">
                <SportSelector />
              </div>
            </div>

            {/* Hero Section - Live Games Showcase */}
            <LiveGamesHero />

            {/* Predictions Dashboard */}
            <PredictionsDashboard />

            {/* Analytics Overview */}
            <AnalyticsOverview />

            {/* Quick Access Sports Grid */}
            <SportsGrid />
          </div>
        </AppLayout>
      </RealTimeProvider>
    </AuthGuard>
  )
}
