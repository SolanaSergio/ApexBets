import { ServerDashboard } from "@/components/categories/dashboard/server-dashboard"
import { Navigation } from "@/components/navigation/navigation"
import { SyncInitializer } from "@/components/sync-initializer"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DynamicSportsWidget } from "@/components/sports/dynamic-sports-widget"
import { MobileChart } from "@/components/ui/mobile-chart"
import { ModernDashboard } from "@/components/dashboard/modern-dashboard"
import { ModernChart } from "@/components/charts/modern-chart"
import { Activity, BarChart3, Target, Users } from "lucide-react"

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen relative">
        <Navigation />
        <SyncInitializer />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-12 lg:space-y-16">
          {/* Modern Hero Section */}
          <div className="text-center space-y-8 lg:space-y-12 relative py-12 lg:py-20">
            {/* Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/30 to-blue-400/30 rounded-lg blur-xl animate-float" />
              <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '1s'}} />
              <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '2s'}} />
              <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-lg blur-xl animate-float" style={{animationDelay: '3s'}} />
            </div>

            <div className="relative z-10 space-y-6 lg:space-y-8">
              <div className="space-y-4 lg:space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-gradient animate-pulse">
                  Project Apex
                </h1>
                <div className="relative">
                  <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-slate-600 text-pretty max-w-5xl mx-auto font-semibold px-2 text-shimmer">
                    Advanced Sports Analytics & Prediction Platform
                  </p>
                </div>
              </div>

              {/* Modern Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-4 lg:gap-8 text-base lg:text-lg px-2">
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-6 lg:px-8 py-4 lg:py-5 rounded-lg card-hover">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-sm animate-pulse premium-glow"></div>
                  <span className="font-bold text-slate-800">Real-time Data</span>
                </div>
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-6 lg:px-8 py-4 lg:py-5 rounded-lg card-hover">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-sm animate-pulse glow-purple" style={{animationDelay: '0.5s'}}></div>
                  <span className="font-bold text-slate-800">AI Predictions</span>
                </div>
                <div className="flex items-center gap-3 lg:gap-4 glass-card px-6 lg:px-8 py-4 lg:py-5 rounded-lg card-hover">
                  <div className="w-4 lg:w-5 h-4 lg:h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-sm animate-pulse glow-green" style={{animationDelay: '1s'}}></div>
                  <span className="font-bold text-slate-800">Multi-Sport Coverage</span>
                </div>
              </div>

              {/* Live Status Indicator */}
              <div className="flex justify-center px-2">
                <div className="glass-card px-8 lg:px-12 py-4 lg:py-6 rounded-lg border-2 border-green-500/30 premium-glow">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-4 h-4 bg-green-500 rounded-sm animate-pulse glow-green"></div>
                    <span className="text-base lg:text-lg font-bold text-slate-800">System Online • Live Data Streaming</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Dashboard */}
          <div className="space-y-12 lg:space-y-16">
            {/* Quick Access Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="glass-card p-8 rounded-lg card-hover group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform premium-glow">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-800">Live Games</p>
                      <p className="text-slate-600 font-medium">Real-time tracking</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gradient mb-2">24</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                    <span className="text-green-600 font-bold text-sm">Active Now</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-lg card-hover group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform glow-purple">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-800">Analytics</p>
                      <p className="text-slate-600 font-medium">Deep insights</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gradient mb-2">87%</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-sm animate-pulse"></div>
                    <span className="text-emerald-600 font-bold text-sm">Accuracy Rate</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-lg card-hover group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform glow-green">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-800">Predictions</p>
                      <p className="text-slate-600 font-medium">AI-powered</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gradient mb-2">342</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse"></div>
                    <span className="text-green-600 font-bold text-sm">Active Models</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-lg card-hover group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform glow-cyan">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-800">Teams</p>
                      <p className="text-slate-600 font-medium">Live stats</p>
                    </div>
                  </div>
                  <div className="text-3xl font-black text-gradient mb-2">1,247</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-sm animate-pulse"></div>
                    <span className="text-blue-600 font-bold text-sm">Teams Tracked</span>
                  </div>
                </div>
              </div>
            </div>

            <ModernDashboard />

            {/* Modern Sports Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
              <div className="glass-card p-8 rounded-lg card-hover">
                <DynamicSportsWidget sport="basketball" />
              </div>
              <div className="glass-card p-8 rounded-lg card-hover">
                <DynamicSportsWidget sport="football" />
              </div>
              <div className="glass-card p-8 rounded-lg card-hover">
                <DynamicSportsWidget sport="baseball" />
              </div>
            </div>

            {/* Enhanced Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              <ModernChart
                title="Performance Trends"
                type="area"
                showTrends={true}
                realTime={true}
                gradient={true}
                animated={true}
                data={[
                  { label: "Accuracy", value: 87, trend: "up" },
                  { label: "Live Games", value: 156, trend: "up" },
                  { label: "Teams", value: 342, trend: "neutral" },
                  { label: "Predictions", value: 1250, trend: "up" }
                ]}
              />

              <ModernChart
                title="Sports Distribution"
                type="donut"
                gradient={true}
                animated={true}
                data={[
                  { label: "Basketball", value: 45, color: "#06b6d4" },
                  { label: "Football", value: 30, color: "#8b5cf6" },
                  { label: "Baseball", value: 15, color: "#10b981" },
                  { label: "Other", value: 10, color: "#3b82f6" }
                ]}
              />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
