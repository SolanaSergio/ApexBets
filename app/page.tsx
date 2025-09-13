import { Suspense } from "react"
import { ServerDashboard } from "@/components/categories/dashboard/server-dashboard"
import { Navigation } from "@/components/navigation/navigation"
import { SyncInitializer } from "@/components/sync-initializer"
import { DashboardSkeleton } from "@/components/categories/dashboard/dashboard-skeleton"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <SyncInitializer />

        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Project Apex
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Advanced Sports Analytics & Prediction Platform
            </p>
          </div>

          {/* Server Dashboard */}
          <ServerDashboard />
        </main>
      </div>
    </AuthGuard>
  )
}
