"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useRealTimeData } from "@/components/data/real-time-provider"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { Filter, Globe } from "lucide-react"

export function SportSelector() {
  const { selectedSport, setSelectedSport, supportedSports, data } = useRealTimeData()

  const sportConfigs = supportedSports.map(sport => ({
    sport,
    config: SportConfigManager.getSportConfig(sport)
  })).filter(item => item.config)

  const totalLiveGames = data.games.filter(game => game.status === 'in_progress').length

  return (
    <div className="flex items-center gap-4">
      {/* Live Games Counter */}
      {totalLiveGames > 0 && (
        <Badge variant="destructive" className="gap-2 px-3 py-1">
          <div className="live-indicator" />
          {totalLiveGames} Live
        </Badge>
      )}

      {/* Sport Selector */}
      <Select value={selectedSport} onValueChange={setSelectedSport}>
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Select Sport" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              All Sports
            </div>
          </SelectItem>
          {sportConfigs.map(({ sport, config }) => (
            <SelectItem key={sport} value={sport}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{config?.icon}</span>
                <span>{config?.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
