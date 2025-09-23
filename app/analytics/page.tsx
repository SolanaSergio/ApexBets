import { Suspense, lazy } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Lazy load the analytics dashboard
const AnalyticsDashboard = lazy(() => import("@/components/categories/analytics/analytics-dashboard"))

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

        <Suspense fallback={
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">Loading Analytics Dashboard...</h3>
                <p className="text-sm">Please wait while we load the analytics interface</p>
              </div>
            </CardContent>
          </Card>
        }>
          <AnalyticsDashboard />
        </Suspense>
      </main>
    </div>
  )
}
