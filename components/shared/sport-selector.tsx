"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

interface SportSelectorProps {
  selectedSport: SupportedSport | null
  onSportChange: (sport: SupportedSport) => void
  className?: string
  variant?: 'default' | 'compact'
}

export function SportSelector({ 
  selectedSport, 
  onSportChange, 
  className = "",
  variant = 'default'
}: SportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSportData()
  }, [])

  const loadSportData = async () => {
    try {
      setLoading(true)
      // Initialize sport config manager first
      await SportConfigManager.initialize()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } catch (error) {
      console.error('Error loading sport data:', error)
      // Fallback to synchronous initialization
      SportConfigManager.initializeSync()
      const sports = SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } finally {
      setLoading(false)
    }
  }

  const currentSportConfig = selectedSport ? SportConfigManager.getSportConfig(selectedSport) : null
  const isServiceHealthy = true // Assume healthy

  if (loading) {
    return variant === 'compact' ? (
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse flex-shrink-0" />
        ))}
      </div>
    ) : (
      <div className="w-full h-12 bg-muted rounded animate-pulse" />
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex space-x-2 overflow-x-auto pb-2 ${className}`}>
        {supportedSports.map((sport) => {
          const config = SportConfigManager.getSportConfig(sport)
          const isSelected = sport === selectedSport
          const isHealthy = isServiceHealthy
          
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
              {!isHealthy && <AlertCircle className="h-3 w-3 ml-1 text-red-500" />}
            </Button>
          )
        })}
      </div>
    )
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
              <span className={`text-2xl ${currentSportConfig?.color}`}>
                {currentSportConfig?.icon}
              </span>
              <div className="text-left">
                <div className="font-medium flex items-center gap-2">
                  {currentSportConfig?.name || "Select Sport"}
                  {isServiceHealthy ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-500" />
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
              const isHealthy = isServiceHealthy
              
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
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {config?.leagues.join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3 text-yellow-500" />
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
              <Activity className="h-3 w-3 inline mr-1" />
              {supportedSports.length} sports supported
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Export both variants for backward compatibility
export { SportSelector as SportSelectorCompact }
