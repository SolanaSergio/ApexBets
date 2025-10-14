'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Activity, CheckCircle, AlertCircle } from 'lucide-react'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'

interface SportSelectorProps {
  selectedSport: SupportedSport | null
  onSportChange: (sport: SupportedSport) => void
  className?: string
  variant?: 'default' | 'compact' | 'responsive'
}

export function SportSelector({
  selectedSport,
  onSportChange,
  className = '',
  variant = 'default',
}: SportSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSportConfig, setCurrentSportConfig] = useState<any>(null)

  useEffect(() => {
    loadSportData()
  }, [])

  const loadSportData = async () => {
    try {
      setLoading(true)
      // Initialize sport config manager first
      await SportConfigManager.initialize()
      const sports = await SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } catch (error) {
      console.error('Error loading sport data:', error)
      // Fallback to synchronous initialization
      SportConfigManager.initializeSync()
      const sports = await SportConfigManager.getSupportedSports()
      setSupportedSports(sports)
    } finally {
      setLoading(false)
    }
  }

  // Load current sport config
  useEffect(() => {
    const loadCurrentConfig = async () => {
      if (selectedSport) {
        try {
          const config = await SportConfigManager.getSportConfig(selectedSport)
          setCurrentSportConfig(config)
        } catch (error) {
          console.error('Failed to load current sport config:', error)
          setCurrentSportConfig(null)
        }
      } else {
        setCurrentSportConfig(null)
      }
    }
    loadCurrentConfig()
  }, [selectedSport])

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
        {supportedSports.map(sport => (
          <SportItem
            key={sport}
            sport={sport}
            selectedSport={selectedSport}
            onSportChange={onSportChange}
            isServiceHealthy={isServiceHealthy}
            variant="button"
          />
        ))}
      </div>
    )
  }

  // Responsive variant: compact on mobile, dropdown on desktop
  if (variant === 'responsive') {
    return (
      <div className={className}>
        {/* Mobile: Horizontal scrollable buttons */}
        <div className="flex space-x-2 overflow-x-auto pb-2 lg:hidden">
          {supportedSports.map(sport => (
            <SportItem
              key={sport}
              sport={sport}
              selectedSport={selectedSport}
              onSportChange={onSportChange}
              isServiceHealthy={isServiceHealthy}
              variant="button"
            />
          ))}
        </div>

        {/* Desktop: Dropdown */}
        <div className="hidden lg:block">
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
                      {currentSportConfig?.name || 'Select Sport'}
                      {isServiceHealthy ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {currentSportConfig?.leagues?.length || 0} leagues available
                    </div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 p-2" align="start">
              <div className="space-y-1">
                {supportedSports.map(sport => (
                  <SportItem
                    key={sport}
                    sport={sport}
                    selectedSport={selectedSport}
                    onSportChange={(sport) => {
                      onSportChange(sport)
                      setIsOpen(false)
                    }}
                    isServiceHealthy={isServiceHealthy}
                    variant="dropdown"
                  />
                ))}
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
                  {currentSportConfig?.name || 'Select Sport'}
                  {isServiceHealthy ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentSportConfig?.leagues?.length || 0} leagues available
                </div>
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-2" align="start">
          <div className="space-y-1">
            {supportedSports.map(sport => (
              <SportItem
                key={sport}
                sport={sport}
                selectedSport={selectedSport}
                onSportChange={(sport) => {
                  onSportChange(sport)
                  setIsOpen(false)
                }}
                isServiceHealthy={isServiceHealthy}
                variant="dropdown"
              />
            ))}
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

function SportItem({ 
  sport, 
  selectedSport, 
  onSportChange, 
  isServiceHealthy, 
  variant 
}: { 
  sport: SupportedSport
  selectedSport: SupportedSport | null
  onSportChange: (sport: SupportedSport) => void
  isServiceHealthy: boolean
  variant: 'button' | 'dropdown'
}) {
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const sportConfig = await SportConfigManager.getSportConfig(sport)
        setConfig(sportConfig)
      } catch (error) {
        console.error('Failed to load sport config:', error)
        setConfig(null)
      }
    }
    loadConfig()
  }, [sport])

  const isSelected = sport === selectedSport
  const isHealthy = isServiceHealthy

  if (variant === 'button') {
    return (
      <Button
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSportChange(sport)}
        className={`flex-shrink-0 min-w-fit px-3 py-2 ${isSelected ? 'shadow-md' : ''} ${
          !isHealthy ? 'opacity-50' : ''
        } transition-all duration-200 hover:scale-105`}
        disabled={!isHealthy}
      >
        <span className={`text-lg mr-2 ${config?.color}`}>{config?.icon}</span>
        <span className="font-medium whitespace-nowrap">{config?.name}</span>
        {!isHealthy && <AlertCircle className="h-3 w-3 ml-1 text-red-500" />}
      </Button>
    )
  }

  return (
    <DropdownMenuItem
      onClick={() => onSportChange(sport)}
      className="p-3 rounded-lg cursor-pointer hover:bg-muted/50"
    >
      <div className="flex items-center space-x-3 w-full">
        <div
          className={`p-2 rounded-lg bg-muted/50 ${isSelected ? 'bg-primary/10' : ''}`}
        >
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
            {(config?.leagues || []).join(', ')}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Activity className="h-3 w-3 text-yellow-500" />
          <span className="text-xs text-muted-foreground">
            {config?.leagues?.length || 0}
          </span>
        </div>
      </div>
    </DropdownMenuItem>
  )
}

// Export both variants for backward compatibility
export { SportSelector as SportSelectorCompact }
