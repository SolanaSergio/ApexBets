import { Navigation } from "@/components/navigation/navigation"
import { SyncInitializer } from "@/components/sync-initializer"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ModernDashboard } from "@/components/dashboard/modern-dashboard"
import { DynamicQuickAccessPanel } from "@/components/dashboard/dynamic-quick-access-panel"
import { DynamicSportsWidgetGrid } from "@/components/dashboard/dynamic-sports-widget-grid"
import { DynamicAnalyticsCharts } from "@/components/dashboard/dynamic-analytics-charts"

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <Navigation />
        <SyncInitializer />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-12 lg:space-y-16">
          {/* Enhanced Mobile-First Hero Section */}
          <div className="text-center space-y-6 sm:space-y-8 lg:space-y-12 relative py-8 sm:py-12 lg:py-20">
            {/* Optimized Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-lg blur-xl animate-float" />
              <div className="absolute top-20 sm:top-40 right-5 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '1s'}} />
              <div className="absolute bottom-10 sm:bottom-20 left-1/4 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '2s'}} />
              <div className="absolute top-1/3 right-1/4 w-10 sm:w-16 h-10 sm:h-16 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '3s'}} />
            </div>

            <div className="relative z-10 space-y-4 sm:space-y-6 lg:space-y-8 px-4">
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gradient animate-pulse leading-tight">
                  Project Apex
                </h1>
                <div className="relative">
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-slate-600 text-pretty max-w-5xl mx-auto font-semibold text-shimmer leading-relaxed">
                    Advanced Sports Analytics & Prediction Platform
                  </p>
                </div>
              </div>

              {/* Enhanced Mobile Feature Highlights */}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 lg:gap-8 text-sm sm:text-base lg:text-lg">
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-lg card-hover min-h-[48px] touch-manipulation">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-sm animate-pulse premium-glow flex-shrink-0"></div>
                  <span className="font-bold text-slate-800 whitespace-nowrap">Real-time Data</span>
                </div>
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-lg card-hover min-h-[48px] touch-manipulation">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-sm animate-pulse glow-purple flex-shrink-0" style={{animationDelay: '0.5s'}}></div>
                  <span className="font-bold text-slate-800 whitespace-nowrap">AI Predictions</span>
                </div>
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-lg card-hover min-h-[48px] touch-manipulation">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-sm animate-pulse glow-green flex-shrink-0" style={{animationDelay: '1s'}}></div>
                  <span className="font-bold text-slate-800 whitespace-nowrap">Multi-Sport Coverage</span>
                </div>
              </div>

              {/* Enhanced Live Status Indicator */}
              <div className="flex justify-center">
                <div className="glass-card px-4 sm:px-8 lg:px-12 py-3 sm:py-4 lg:py-6 rounded-lg border-2 border-green-500/30 premium-glow max-w-full">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-wrap justify-center">
                    <div className="w-3 sm:w-4 h-3 sm:h-4 bg-green-500 rounded-sm animate-pulse glow-green flex-shrink-0"></div>
                    <span className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 text-center">
                      <span className="hidden sm:inline">System Online • Live Data Streaming</span>
                      <span className="sm:hidden">Live Data Streaming</span>
                    </span>
                    <div className="flex space-x-1 flex-shrink-0">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-sm animate-pulse"></div>
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-sm animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-sm animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Dashboard */}
          <div className="space-y-12 lg:space-y-16">
            {/* Dynamic Quick Access Panel */}
            <DynamicQuickAccessPanel />

            <ModernDashboard />

            {/* Dynamic Sports Widgets Grid */}
            <DynamicSportsWidgetGrid />

            {/* Enhanced Analytics Overview */}
            <DynamicAnalyticsCharts />
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
