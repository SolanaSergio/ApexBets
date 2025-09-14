import { Navigation } from "@/components/navigation/navigation"
import AnalyticsDashboard from "@/components/categories/analytics/analytics-dashboard"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6 mb-8 relative">
          <div className="absolute inset-0 gradient-bg-soft opacity-20 rounded-3xl blur-3xl"></div>
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-balance premium-text-gradient animate-slide-in-down">
              Advanced Analytics
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in px-2">
              Deep insights into team performance, predictions, and betting trends
            </p>
            <div className="flex justify-center animate-scale-in">
              <div className="glass-premium px-4 py-2 rounded-full border border-accent/30">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium text-muted-foreground">Real-time Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnalyticsDashboard />
      </main>
    </div>
  )
}
