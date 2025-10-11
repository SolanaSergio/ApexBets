import { AppLayout } from '@/components/layout/app-layout'
import { UserAlerts } from '@/components/alerts/user-alerts'

export default function AlertsPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Header />
        <UserAlerts />
      </div>
    </AppLayout>
  )
}

function Header() {
  return (
    <div className="text-center border-b pb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Alert Management</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Create and manage custom alerts for games, predictions, and market movements.
      </p>
    </div>
  )
}