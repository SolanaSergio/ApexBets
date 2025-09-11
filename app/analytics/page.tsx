import { Navigation } from "@/components/navigation/navigation"
import AnalyticsDashboard from "@/components/categories/analytics/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deep insights into team performance, predictions, and betting trends
          </p>
        </div>

        <AnalyticsDashboard />
      </main>
    </div>
  )
}
