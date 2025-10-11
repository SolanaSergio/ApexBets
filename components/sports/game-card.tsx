'use client'

import * as React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TeamLogo } from '@/components/ui/sports-image'
import { MapPin, ArrowRight, Tv } from 'lucide-react'
import { format } from 'date-fns'
import { type Game } from '@/lib/api-client-database-first'
import { cn } from '@/lib/utils'

interface GameCardProps {
  game: Game
  variant?: 'default' | 'compact' | 'detailed'
}

export function GameCard({ game, variant = 'default' }: GameCardProps) {
  const isLive = game.status === 'live'
  const isCompleted = game.status === 'completed'
  const gameDate = new Date(game.game_date)

  const cardClasses = cn(
    'shadow-md hover:shadow-lg transition-all duration-300 border-l-4',
    {
      'border-red-500': isLive,
      'border-gray-300': isCompleted,
      'border-blue-500': !isLive && !isCompleted,
    }
  )

  return (
    <Card className={cardClasses}>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <TeamColumn team={game.away_team} score={game.away_score || null} />
          <GameInfo game={game} gameDate={gameDate} isLive={isLive} isCompleted={isCompleted} />
          <TeamColumn team={game.home_team} score={game.home_score || null} alignment="right" />
        </div>
        {variant === 'detailed' && <CardFooter className="mt-4 pt-4 border-t flex justify-between items-center">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {game.venue && <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {game.venue}</p>}
            {(game as any).broadcast_channel && <p className="flex items-center gap-1.5"><Tv className="h-4 w-4" /> {(game as any).broadcast_channel}</p>}
          </div>
          <Button size="sm" variant="outline" onClick={() => window.location.href = `/games/${game.id}`}>
            Match Details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>}
      </CardContent>
    </Card>
  )
}

function TeamColumn({ team, score, alignment = 'left' }: { team: any; score: number | null; alignment?: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col items-${alignment === 'left' ? 'start' : 'end'} gap-2`}>
      <div className={`flex items-center gap-3 ${alignment === 'right' ? 'flex-row-reverse' : ''}`}>
        <TeamLogo
          teamName={team?.name || ''}
          alt={team?.abbreviation || 'Team'}
          width={40}
          height={40}
          className="drop-shadow-md"
          {...(team?.logo_url && { logoUrl: team.logo_url })}
          sport={team?.sport}
          {...(team?.league && { league: team.league })}
        />
        <div className={`text-${alignment}`}>
          <p className="font-bold text-lg text-foreground">{team?.name}</p>
          <p className="text-sm text-muted-foreground">{team?.abbreviation}</p>
        </div>
      </div>
      <p className="font-bold text-3xl text-primary">{score || 0}</p>
    </div>
  )
}

function GameInfo({ gameDate, isLive, isCompleted }: { game: any; gameDate: Date; isLive: boolean; isCompleted: boolean }) {
  return (
    <div className="text-center space-y-2">
      {isLive ? (
        <Badge variant="destructive" className="animate-pulse text-sm font-bold">LIVE</Badge>
      ) : (
        <p className="font-semibold text-lg">
          {format(gameDate, 'h:mm a')}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {isCompleted ? 'Final' : format(gameDate, 'EEE, MMM d')}
      </p>
      {!isLive && !isCompleted && (
        <Badge variant="outline">Upcoming</Badge>
      )}
    </div>
  )
}