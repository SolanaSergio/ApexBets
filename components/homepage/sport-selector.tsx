'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealTimeData } from '@/components/data/real-time-provider'
import { SportConfigManager } from '@/lib/services/core/sport-config'
import { Globe } from 'lucide-react'

export function SportSelector() {
  const { selectedSport, setSelectedSport, supportedSports } = useRealTimeData()

  const sportConfigs = supportedSports
    .map(sport => ({
      sport,
      config: SportConfigManager.getSportConfig(sport),
    }))
    .filter(item => item.config)

  return (
    <Select value={selectedSport} onValueChange={setSelectedSport}>
      <SelectTrigger className="w-full md:w-[240px] bg-white shadow-sm hover:shadow-md transition-shadow">
        <SelectValue placeholder="Filter by sport..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">All Sports</span>
          </div>
        </SelectItem>
        {sportConfigs.map(({ sport, config }) => (
          <SelectItem key={sport} value={sport}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{config?.icon}</span>
              <span className="font-medium">{config?.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}