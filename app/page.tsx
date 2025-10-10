'use client'

import { AuthGuard } from "@/components/auth/auth-guard"
import { RealTimeProvider } from "@/components/data/real-time-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { LiveGamesHero } from "@/components/homepage/live-games-hero"
import { PredictionsDashboard } from "@/components/homepage/predictions-dashboard"
import { AnalyticsOverview } from "@/components/homepage/analytics-overview"
import { SportsGrid } from "@/components/homepage/sports-grid"

export default function HomePage() {
  return (
    <AuthGuard>
      <RealTimeProvider>
        <AppLayout>
          <div className="space-y-8 p-6">
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
