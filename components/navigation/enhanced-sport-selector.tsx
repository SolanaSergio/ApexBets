"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  ChevronDown,
  Star,
  TrendingUp,
  Activity,
  Zap
} from "lucide-react"
import { unifiedApiClient, SupportedSport } from "@/lib/services/api/unified-api-client"
import { SportConfigManager } from "@/lib/services/core/sport-config"

interface EnhancedSportSelectorProps {
  selectedSport: SupportedSport
  onSportChange: (sport: SupportedSport) => void
  className?: string
}

// Remove hardcoded sport data - now using SportConfigManager

export function EnhancedSportSelector({ selectedSport, onSportChange, className = "" }: EnhancedSportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
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
    return <SportSelectorSkeleton />
  }

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 px-4"
            aria-label="Select sport"
          >
            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${currentSportConfig?.color}`}>{currentSportConfig?.icon}</span>
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {currentSportConfig?.name || "Select Sport"}
                  {isServiceHealthy ? (
                    <Activity className="h-3 w-3 text-green-500" />
                  ) : (
                    <Activity className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentSportConfig?.leagues.length || 0} leagues available
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
                  onClick={() => {
                    onSportChange(sport)
                    setIsOpen(false)
                  }}
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
          
          <DropdownMenuSeparator className="my-2" />
          
          <div className="p-2">
            <div className="text-xs text-muted-foreground text-center">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              {supportedSports.length} sports supported
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Compact version for mobile
export function EnhancedSportSelectorCompact({ selectedSport, onSportChange, className = "" }: EnhancedSportSelectorProps) {
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
            {!isHealthy && <Zap className="h-3 w-3 ml-1 text-red-500" />}
          </Button>
        )
      })}
    </div>
  )
}

// League selector for a specific sport
interface EnhancedLeagueSelectorProps {
  sport: SupportedSport
  selectedLeague: string
  onLeagueChange: (league: string) => void
  className?: string
}

export function EnhancedLeagueSelector({ sport, selectedLeague, onLeagueChange, className = "" }: EnhancedLeagueSelectorProps) {
  const [leagues, setLeagues] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeagues()
  }, [sport])

  const loadLeagues = async () => {
    try {
      setLoading(true)
      const sportLeagues = SportConfigManager.getLeaguesForSport(sport)
      setLeagues(sportLeagues)
    } catch (error) {
      console.error('Error loading leagues:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex space-x-2 overflow-x-auto pb-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="h-8 w-16 bg-muted rounded animate-pulse flex-shrink-0" />
      ))}
    </div>
  }

  if (leagues.length <= 1) {
    return null
  }

  return (
    <div className={`flex space-x-2 overflow-x-auto pb-2 ${className}`}>
      {leagues.map((league) => {
        const isSelected = league === selectedLeague
        
        return (
          <Button
            key={league}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onLeagueChange(league)}
            className={`flex-shrink-0 ${isSelected ? 'shadow-md' : ''}`}
          >
            {league}
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
