import { Navigation } from "@/components/navigation/navigation"
import { UserAlerts } from "@/components/alerts/user-alerts"

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Alert Management
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Configure personalized alerts for games, predictions, and odds changes
          </p>
        </div>

        <UserAlerts />
      </main>
    </div>
  )
}
