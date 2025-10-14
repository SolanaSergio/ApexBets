'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealTimeData } from '@/components/data/real-time-provider'
import { useSportConfigs } from '@/hooks/use-sport-config'
import { Globe, Trophy } from 'lucide-react'

export function SportSelector() {
  const { selectedSport, setSelectedSport } = useRealTimeData()
  const { configs: sportConfigs, loading } = useSportConfigs()

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-full md:w-[240px] bg-white shadow-sm">
          <SelectValue placeholder="Loading sports..." />
        </SelectTrigger>
      </Select>
    )
  }

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
        {sportConfigs.map((config) => (
          <SelectItem key={config.name} value={config.name}>
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5" style={{ color: config.color }} />
              <span className="font-medium">{config.displayName}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}