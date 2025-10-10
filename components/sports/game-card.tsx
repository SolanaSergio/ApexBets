
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/ui/sports-image"
import { Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { type Game } from "@/lib/api-client-database-first"

interface GameCardProps {
  game: Game
  variant?: 'default' | 'compact' | 'detailed'
}

export function GameCard({ game, variant = 'default' }: GameCardProps) {
  const isLive = game.status === 'in_progress'
  const isCompleted = game.status === 'completed'
  const gameDate = new Date(game.game_date)

  if (variant === 'compact') {
    return (
      <Card className="card-modern hover:border-primary transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={game.away_team?.name || ''} 
                alt={game.away_team?.abbreviation || 'Away'} 
                width={24} 
                height={24}
                {...(game.away_team?.logo_url && { logoUrl: game.away_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div className="text-sm">
                <div className="font-medium">{game.away_team?.abbreviation}</div>
                <div className="text-xs text-muted-foreground">{game.away_team?.name}</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold">{game.away_score || 0}</div>
              <div className="text-xs text-muted-foreground">VS</div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-lg font-bold">{game.home_score || 0}</div>
                <div className="text-xs text-muted-foreground">VS</div>
              </div>
              <TeamLogo 
                teamName={game.home_team?.name || ''} 
                alt={game.home_team?.abbreviation || 'Home'} 
                width={24} 
                height={24}
                {...(game.home_team?.logo_url && { logoUrl: game.home_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div className="text-sm">
                <div className="font-medium">{game.home_team?.abbreviation}</div>
                <div className="text-xs text-muted-foreground">{game.home_team?.name}</div>
              </div>
            </div>
          </div>
          
          {isLive && (
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border">
              <Badge variant="destructive" className="gap-1">
                <div className="live-indicator" />
                LIVE
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(gameDate, "h:mm a")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === 'detailed') {
    return (
      <Card className={`card-modern ${isLive ? 'card-live' : isCompleted ? 'card-completed' : 'card-upcoming'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant={isLive ? 'destructive' : isCompleted ? 'secondary' : 'outline'}>
              {isLive ? 'LIVE' : isCompleted ? 'FINAL' : 'UPCOMING'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(gameDate, "MMM d, h:mm a")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Teams */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={game.away_team?.name || ''} 
                alt={game.away_team?.abbreviation || 'Away'} 
                width={32} 
                height={32}
                {...(game.away_team?.logo_url && { logoUrl: game.away_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div>
                <div className="font-medium">{game.away_team?.name}</div>
                <div className="text-sm text-muted-foreground">{game.away_team?.abbreviation}</div>
              </div>
            </div>
            <div className="text-2xl font-bold">{game.away_score || 0}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={game.home_team?.name || ''} 
                alt={game.home_team?.abbreviation || 'Home'} 
                width={32} 
                height={32}
                {...(game.home_team?.logo_url && { logoUrl: game.home_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div>
                <div className="font-medium">{game.home_team?.name}</div>
                <div className="text-sm text-muted-foreground">{game.home_team?.abbreviation}</div>
              </div>
            </div>
            <div className="text-2xl font-bold">{game.home_score || 0}</div>
          </div>

          {/* Game Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border">
            {game.venue && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {game.venue}
              </div>
            )}
            <div className="text-right">
              {format(gameDate, "EEEE, MMMM d")}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`card-modern ${isLive ? 'card-live' : isCompleted ? 'card-completed' : 'card-upcoming'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={isLive ? 'destructive' : isCompleted ? 'secondary' : 'outline'}>
            {isLive ? 'LIVE' : isCompleted ? 'FINAL' : 'UPCOMING'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {format(gameDate, "h:mm a")}
          </div>
        </div>

        <div className="space-y-4">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={game.away_team?.name || ''} 
                alt={game.away_team?.abbreviation || 'Away'} 
                width={28} 
                height={28}
                {...(game.away_team?.logo_url && { logoUrl: game.away_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div>
                <div className="font-medium">{game.away_team?.abbreviation}</div>
                <div className="text-sm text-muted-foreground">{game.away_team?.name}</div>
              </div>
            </div>
            <div className="text-xl font-bold">{game.away_score || 0}</div>
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={game.home_team?.name || ''} 
                alt={game.home_team?.abbreviation || 'Home'} 
                width={28} 
                height={28}
                {...(game.home_team?.logo_url && { logoUrl: game.home_team.logo_url })}
                sport={game.sport}
                {...(game.league && { league: game.league })}
              />
              <div>
                <div className="font-medium">{game.home_team?.abbreviation}</div>
                <div className="text-sm text-muted-foreground">{game.home_team?.name}</div>
              </div>
            </div>
            <div className="text-xl font-bold">{game.home_score || 0}</div>
          </div>
        </div>

        {game.venue && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-4 pt-4 border-t border-border">
            <MapPin className="h-4 w-4" />
            {game.venue}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
