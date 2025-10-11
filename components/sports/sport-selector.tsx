'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useSports, Sport } from '@/hooks/use-sports'
import { Trophy } from 'lucide-react'

interface SportSelectorProps {
  selectedSport: string
  onSportChange: (sport: string) => void
}

export function SportSelector({ selectedSport, onSportChange }: SportSelectorProps) {
  const { sports, loading, error } = useSports()

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">Failed to load sports.</div>
  }

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
      {sports.map((sport: Sport) => {
        const isSelected = selectedSport === sport.name
        const sportColor = sport.color_primary
          ? `from-[${sport.color_primary}] to-[${sport.color_primary}]/80`
          : 'from-primary to-primary/80'

        return (
          <Button
            key={sport.id}
            onClick={() => onSportChange(sport.name)}
            variant={isSelected ? 'default' : 'outline'}
            className={`px-3 sm:px-4 py-2 text-sm transition-colors ${
              isSelected ? `bg-gradient-to-r ${sportColor} text-white` : ''
            }`}
          >
            {sport.icon_url ? (
              <Image
                src={sport.icon_url}
                alt={sport.display_name}
                width={16}
                height={16}
                className="w-4 h-4 mr-1 sm:mr-2"
              />
            ) : (
              <Trophy className="w-4 h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden sm:inline">{sport.display_name}</span>
            <span className="sm:hidden">{sport.display_name.slice(0, 3)}</span>
          </Button>
        )
      })}
    </div>
  )
}
