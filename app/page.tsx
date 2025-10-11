import { AuthGuard } from '@/components/auth/auth-guard'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { LiveGamesHero } from '@/components/homepage/live-games-hero'
import { PredictionsDashboard } from '@/components/homepage/predictions-dashboard'
import { AnalyticsOverview } from '@/components/homepage/analytics-overview'
import { SportsGrid } from '@/components/homepage/sports-grid'
import { SportSelector } from '@/components/homepage/sport-selector'
import { fetchServerInitialData } from '@/lib/data/server-data-fetcher'


export default async function HomePage() {
  // Check authentication server-side before fetching data
  
  
  // Only fetch data if user is authenticated
  const initialData = await fetchServerInitialData()

  return (
    <AuthGuard>
      <RealTimeProvider 
        supportedSports={initialData.supportedSports}
        initialData={initialData}
      >
        <AppLayout>
          <div className="bg-gray-50/50 min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome to Project Apex</h1>
                  <p className="text-lg text-muted-foreground">
                    Your all-in-one hub for sports analytics and predictions.
                  </p>
                </div>
                <div className="w-full md:w-auto">
                  <SportSelector />
                </div>
              </div>

              <div className="space-y-12">
                <LiveGamesHero />
                <PredictionsDashboard />
                <AnalyticsOverview />
                <SportsGrid />
              </div>
            </div>
          </div>
        </AppLayout>
      </RealTimeProvider>
    </AuthGuard>
  )
}