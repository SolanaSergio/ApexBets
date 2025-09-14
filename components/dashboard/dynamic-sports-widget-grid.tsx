"use client"

import { useState, useEffect } from "react"
import { DynamicSportsWidget } from "@/components/sports/dynamic-sports-widget"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

export function DynamicSportsWidgetGrid() {
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSupportedSports()
  }, [])

  const loadSupportedSports = async () => {
    try {
      setLoading(true)
      await SportConfigManager.initialize()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports.slice(0, 3)) // Show first 3 sports
    } catch (error) {
      console.error('Error loading supported sports:', error)
      // Fallback to sync initialization
      SportConfigManager.initializeSync()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports.slice(0, 3))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-card p-6 sm:p-8 rounded-lg animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (supportedSports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No sports data available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
      {supportedSports.map((sport) => (
        <div key={sport} className="glass-card p-6 sm:p-8 rounded-lg card-hover">
          <DynamicSportsWidget sport={sport} />
        </div>
      ))}
    </div>
  )
}
