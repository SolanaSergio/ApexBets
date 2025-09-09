import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Deep insights into team performance, predictions, and betting trends
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
