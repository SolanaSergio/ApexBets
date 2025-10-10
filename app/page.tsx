'use client'

import { AuthGuard } from "@/components/auth/auth-guard"
import { RealTimeProvider } from "@/components/data/real-time-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { LiveGamesHero } from "@/components/homepage/live-games-hero"
import { PredictionsDashboard } from "@/components/homepage/predictions-dashboard"
import { AnalyticsOverview } from "@/components/homepage/analytics-overview"
import { SportsGrid } from "@/components/homepage/sports-grid"
import { SportSelector } from "@/components/homepage/sport-selector"
import { useIsMobile } from "@/hooks/use-mobile"

export default function HomePage() {
  const isMobile = useIsMobile()

  return (
    <AuthGuard>
      <RealTimeProvider>
        <AppLayout>
          <div className={`space-y-6 ${isMobile ? 'p-4' : 'p-6'}`}>
            {/* Sport Selector */}
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'}`}>
              <div>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold`}>ApexBets Dashboard</h1>
                <p className="text-muted-foreground">Real-time sports analytics and predictions</p>
              </div>
              <div className={isMobile ? 'w-full' : ''}>
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
