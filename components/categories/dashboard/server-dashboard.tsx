import { Suspense } from "react"
import { ServerSportConfigManager } from "@/lib/services/core/server-sport-config"
import { CleanDashboard } from "./clean-dashboard"
import { DashboardSkeleton } from "./dashboard-skeleton"

interface ServerDashboardProps {
  className?: string
}

export async function ServerDashboard({ className = "" }: ServerDashboardProps) {
  try {
    // Initialize sport configuration on the server side
    await ServerSportConfigManager.initialize()
    
    // Get the first available sport as default
    const supportedSports = ServerSportConfigManager.getSupportedSports()
    const defaultSport = supportedSports.length > 0 ? supportedSports[0] : null

    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <CleanDashboard 
          className={className}
          defaultSport={defaultSport}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Error initializing server dashboard:', error)
    // Fallback to client-side initialization with dynamic sport selection
    // The CleanDashboard component will use dynamic sport selection
    // when defaultSport is null and no supported sports are available
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <CleanDashboard 
          className={className}
          defaultSport={null}
        />
      </Suspense>
    )
  }
}
