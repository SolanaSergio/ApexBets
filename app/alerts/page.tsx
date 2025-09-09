import { UserAlerts } from "@/components/alerts/user-alerts"

export default function AlertsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Alert Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure personalized alerts for games, predictions, and odds changes
          </p>
        </div>

        <UserAlerts />
      </div>
    </div>
  )
}
