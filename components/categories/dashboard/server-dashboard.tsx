'use client'

import { Suspense, useEffect, useState } from "react"
import { ServerSportConfigManager } from "@/lib/services/core/server-sport-config"
import { CleanDashboard } from "./clean-dashboard"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { SupportedSport } from "@/lib/services/core/sport-config"

interface ServerDashboardProps {
  className?: string
}

export function ServerDashboard({ className = "" }: ServerDashboardProps) {
  const [defaultSport, setDefaultSport] = useState<SupportedSport | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeSportConfig = async () => {
      try {
        // Initialize sport configuration on the client side
        await ServerSportConfigManager.initialize()
        
        // Get the first available sport as default (no hardcoded priority)
        const supportedSports = ServerSportConfigManager.getSupportedSports()
        const sport: SupportedSport | null = supportedSports.length > 0 ? supportedSports[0] as SupportedSport : null
        setDefaultSport(sport)
      } catch (error) {
        console.error('Error initializing server dashboard:', error)
        // Fallback to null - CleanDashboard will handle dynamic sport selection
        setDefaultSport(null)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeSportConfig()
  }, [])

  if (!isInitialized) {
    return <DashboardSkeleton />
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <CleanDashboard 
        className={className}
        defaultSport={defaultSport}
      />
    </Suspense>
  )
}
