import { Navigation } from "@/components/navigation/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { RealTimeProvider } from "@/components/data/real-time-provider"
import { ComprehensiveSportsDashboardWithErrorBoundary } from "@/components/dashboard/comprehensive-sports-dashboard"
import { useEffect } from "react"
import { autoStartupService } from "@/lib/services/auto-startup-service"

function SyncInitializer() {
  useEffect(() => {
    autoStartupService.initialize().catch(() => {})
  }, [])
  return null
}

export default function HomePage() {
  return (
    <AuthGuard>
      <RealTimeProvider>
        <div className="min-h-screen relative bg-gradient-to-br from-background via-background to-muted/20">
          <Navigation />
          <SyncInitializer />

          {/* Optimized Layout for Better Space Utilization */}
          <main className="w-full max-w-none">
            {/* Compact Hero Section - Reduced Padding for Desktop */}
            <section className="relative px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 lg:py-8 xl:py-10">
              {/* Subtle Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-4 left-8 w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-primary/15 to-primary/5 rounded-lg blur-xl animate-float" />
                <div className="absolute top-8 right-12 w-12 h-12 lg:w-20 lg:h-20 bg-gradient-to-br from-accent/15 to-accent/5 rounded-lg blur-xl animate-float" style={{animationDelay: '1s'}} />
                <div className="absolute bottom-4 left-1/3 w-10 h-10 lg:w-16 lg:h-16 bg-gradient-to-br from-secondary/15 to-secondary/5 rounded-lg blur-xl animate-float" style={{animationDelay: '2s'}} />
              </div>

              <div className="relative z-10 text-center space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gradient leading-tight">
                    Project Apex
                  </h1>
                  <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto font-medium leading-relaxed">
                    Advanced Sports Analytics & Prediction Platform
                  </p>
                </div>

                {/* Compact Feature Highlights */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm lg:text-base">
                  <div className="flex items-center gap-2 glass-card px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg card-hover min-h-[40px] touch-manipulation">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-primary rounded-sm animate-pulse flex-shrink-0"></div>
                    <span className="font-semibold text-foreground whitespace-nowrap">Real-time Data</span>
                  </div>
                  <div className="flex items-center gap-2 glass-card px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg card-hover min-h-[40px] touch-manipulation">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-secondary rounded-sm animate-pulse flex-shrink-0" style={{animationDelay: '0.5s'}}></div>
                    <span className="font-semibold text-foreground whitespace-nowrap">AI Predictions</span>
                  </div>
                  <div className="flex items-center gap-2 glass-card px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg card-hover min-h-[40px] touch-manipulation">
                    <div className="w-3 h-3 lg:w-4 lg:h-4 bg-accent rounded-sm animate-pulse flex-shrink-0" style={{animationDelay: '1s'}}></div>
                    <span className="font-semibold text-foreground whitespace-nowrap">Multi-Sport Coverage</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Full-Width Dashboard Section */}
            <section className="px-2 sm:px-4 lg:px-6 xl:px-8 pb-4 sm:pb-6 lg:pb-8">
              <ComprehensiveSportsDashboardWithErrorBoundary />
            </section>
          </main>
        </div>
      </RealTimeProvider>
    </AuthGuard>
  )
}
