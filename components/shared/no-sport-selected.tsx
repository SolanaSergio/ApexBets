"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Settings, RefreshCw } from "lucide-react"
import { SupportedSport } from "@/lib/services/core/service-factory"
import { SportConfigManager } from "@/lib/services/core/sport-config"

interface NoSportSelectedProps {
  onSportSelect?: (sport: SupportedSport) => void
  className?: string
  title?: string
  description?: string
  showSportSelector?: boolean
}

export function NoSportSelected({ 
  onSportSelect,
  className = "",
  title = "No Sport Selected",
  description = "Please select a sport to view data",
  showSportSelector = true
}: NoSportSelectedProps) {
  const supportedSports = cachedUnifiedApiClient.getSupportedSports()

  const handleSportSelect = (sport: SupportedSport) => {
    if (onSportSelect) {
      onSportSelect(sport)
    }
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showSportSelector && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Choose a sport to get started:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {supportedSports.map((sport) => {
                const config = SportConfigManager.getSportConfig(sport)
                return (
                  <Button
                    key={sport}
                    variant="outline"
                    onClick={() => handleSportSelect(sport)}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <span className={`text-2xl ${config?.color}`}>
                      {config?.icon}
                    </span>
                    <span className="text-sm font-medium">
                      {config?.name}
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Having trouble? Try refreshing the page or check your settings.
          </p>
          <div className="flex justify-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/settings'}
              className="text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Import the cached client
import { cachedUnifiedApiClient } from "@/lib/services/api/cached-unified-api-client"
