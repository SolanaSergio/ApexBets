
"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Player as ApiPlayer } from "@/lib/api-client-database-first"

type Player = ApiPlayer & {
  avatar?: string
  team?: string
  stats?: {
    points?: number
    rebounds?: number
    assists?: number
    field_goal_percentage?: number
    three_point_percentage?: number
    free_throw_percentage?: number
  }
  team_logo?: string
  recent_form?: 'up' | 'down' | 'stable'
}

interface PlayerCardProps {
  player: Player
  variant?: 'default' | 'compact' | 'detailed'
}

export function PlayerCard({ player, variant = 'default' }: PlayerCardProps) {
  const getFormIcon = () => {
    switch (player.recent_form) {
      case 'up': return <TrendingUp className="h-3 w-3 text-accent" />
      case 'down': return <TrendingDown className="h-3 w-3 text-destructive" />
      default: return <Minus className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getFormColor = () => {
    switch (player.recent_form) {
      case 'up': return "text-accent"
      case 'down': return "text-destructive"
      default: return "text-muted-foreground"
    }
  }

  if (variant === 'compact') {
    return (
      <Link href={`/players/${player.id}`}>
        <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={player.headshotUrl || player.avatar} alt={player.name} />
                <AvatarFallback className="text-xs">
                  {player.name?.split(' ').map(n => n[0]).join('') || 'P'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{player.name}</div>
                <div className="text-sm text-muted-foreground">
                  {player.position} • {player.teamName || player.team}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{player.stats?.points || 0}</div>
                <div className="text-xs text-muted-foreground">PTS</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === 'detailed') {
    return (
      <Link href={`/players/${player.id}`}>
        <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={player.headshotUrl || player.avatar} alt={player.name} />
                  <AvatarFallback>
                    {player.name?.split(' ').map(n => n[0]).join('') || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {player.position} • {player.teamName || player.team}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getFormIcon()}
                <span className={`text-sm ${getFormColor()}`}>
                  {player.recent_form || 'stable'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">{player.stats?.points || 0}</div>
                <div className="text-xs text-muted-foreground">Points</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{player.stats?.rebounds || 0}</div>
                <div className="text-xs text-muted-foreground">Rebounds</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{player.stats?.assists || 0}</div>
                <div className="text-xs text-muted-foreground">Assists</div>
              </div>
            </div>

            {/* Shooting Percentages */}
            {(player.stats?.field_goal_percentage || player.stats?.three_point_percentage || player.stats?.free_throw_percentage) && (
              <div className="pt-3 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {player.stats?.field_goal_percentage && (
                    <div className="text-center">
                      <div className="font-medium">{player.stats.field_goal_percentage}%</div>
                      <div className="text-muted-foreground">FG%</div>
                    </div>
                  )}
                  {player.stats?.three_point_percentage && (
                    <div className="text-center">
                      <div className="font-medium">{player.stats.three_point_percentage}%</div>
                      <div className="text-muted-foreground">3P%</div>
                    </div>
                  )}
                  {player.stats?.free_throw_percentage && (
                    <div className="text-center">
                      <div className="font-medium">{player.stats.free_throw_percentage}%</div>
                      <div className="text-muted-foreground">FT%</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/players/${player.id}`}>
      <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={player.headshotUrl || player.avatar} alt={player.name} />
                <AvatarFallback>
                  {player.name?.split(' ').map(n => n[0]).join('') || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-lg">{player.name}</div>
                <div className="text-sm text-muted-foreground">
                  {player.position} • {player.teamName || player.team}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getFormIcon()}
              <span className={`text-sm ${getFormColor()}`}>
                {player.recent_form || 'stable'}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">{player.stats?.points || 0}</div>
              <div className="text-xs text-muted-foreground">Points</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{player.stats?.rebounds || 0}</div>
              <div className="text-xs text-muted-foreground">Rebounds</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{player.stats?.assists || 0}</div>
              <div className="text-xs text-muted-foreground">Assists</div>
            </div>
          </div>

          {/* Position Badge */}
          {player.position && (
            <div className="flex justify-center mt-4 pt-4 border-t border-border">
              <Badge variant="outline" className="text-xs">
                {player.position}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
