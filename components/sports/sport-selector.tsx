"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  Activity,
  TrendingUp,
  Star
} from "lucide-react"
import { unifiedApiClient, SupportedSport } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

interface SportSelectorProps {
  selectedSport: SupportedSport
  onSportChange: (sport: SupportedSport) => void
  className?: string
}

export function SportSelector({ selectedSport, onSportChange, className = "" }: SportSelectorProps) {
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [serviceHealth, setServiceHealth] = useState<Record<SupportedSport, boolean>>({} as Record<SupportedSport, boolean>)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSportData()
  }, [])

  const loadSportData = async () => {
    try {
      setLoading(true)
      const sports = unifiedApiClient.getSupportedSports()
      const health = await unifiedApiClient.getHealthStatus()

      setSupportedSports(sports)
      setServiceHealth(health)
    } catch (error) {
      console.error('Error loading sport data:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentSportConfig = SportConfigManager.getSportConfig(selectedSport)
  const isServiceHealthy = serviceHealth[selectedSport] ?? false

  if (loading) {
    return <div className="w-full h-12 bg-muted rounded animate-pulse" />
  }

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-4"
          >
            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${currentSportConfig?.color}`}>{currentSportConfig?.icon}</span>
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {currentSportConfig?.name}
                  {isServiceHealthy ? (
                    <Activity className="h-3 w-3 text-green-500" />
                  ) : (
                    <Activity className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentSportConfig?.leagues.length} leagues
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-2" align="start">
          <div className="space-y-1">
            {supportedSports.map((sport) => {
              const config = SportConfigManager.getSportConfig(sport)
              const isSelected = sport === selectedSport
              const isHealthy = serviceHealth[sport] ?? false

              return (
                <DropdownMenuItem
                  key={sport}
                  onClick={() => onSportChange(sport)}
                  className="p-3 rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`p-2 rounded-lg bg-muted/50 ${isSelected ? 'bg-primary/10' : ''}`}>
                      <span className={`text-xl ${config?.color}`}>{config?.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{config?.name}</span>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            Active
                          </Badge>
                        )}
                        {isHealthy ? (
                          <Activity className="h-3 w-3 text-green-500" />
                        ) : (
                          <Activity className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config?.leagues.join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">
                        {config?.leagues.length}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>

          <div className="p-2 mt-2 border-t">
            <div className="text-xs text-muted-foreground text-center">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {supportedSports.length} sports with real-time data
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Compact version for mobile
export function SportSelectorCompact({ selectedSport, onSportChange, className = "" }: SportSelectorProps) {
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [serviceHealth, setServiceHealth] = useState<Record<SupportedSport, boolean>>({} as Record<SupportedSport, boolean>)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSportData()
  }, [])

  const loadSportData = async () => {
    try {
      setLoading(true)
      const sports = unifiedApiClient.getSupportedSports()
      const health = await unifiedApiClient.getHealthStatus()

      setSupportedSports(sports)
      setServiceHealth(health)
    } catch (error) {
      console.error('Error loading sport data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex space-x-2 overflow-x-auto pb-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse flex-shrink-0" />
      ))}
    </div>
  }

  return (
    <div className={`flex space-x-2 overflow-x-auto pb-2 ${className}`}>
      {supportedSports.map((sport) => {
        const config = SportConfigManager.getSportConfig(sport)
        const isSelected = sport === selectedSport
        const isHealthy = serviceHealth[sport] ?? false

        return (
          <Button
            key={sport}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSportChange(sport)}
            className={`flex-shrink-0 ${isSelected ? 'shadow-md' : ''} ${
              !isHealthy ? 'opacity-50' : ''
            }`}
            disabled={!isHealthy}
          >
            <span className={`text-lg mr-2 ${config?.color}`}>{config?.icon}</span>
            {config?.name}
          </Button>
        )
      })}
    </div>
  )
}

function SportSelectorSkeleton() {
  return (
    <div className="w-full h-12 bg-muted rounded animate-pulse" />
  )
}
