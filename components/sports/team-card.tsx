
"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TeamLogo } from "@/components/ui/sports-image"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { Team as ApiTeam } from "@/lib/api-client-database-first"

type Team = ApiTeam & {
  logo?: string
  wins?: number
  losses?: number
  conference?: string
  streak?: number
  streak_type?: 'win' | 'loss'
}

interface TeamCardProps {
  team: Team
  variant?: 'default' | 'compact' | 'detailed'
}

export function TeamCard({ team, variant = 'default' }: TeamCardProps) {
  const winPercentage = team.wins && team.losses ? 
    Math.round((team.wins / (team.wins + team.losses)) * 100) : 0

  const getStreakIcon = () => {
    if (!team.streak || team.streak === 0) return <Minus className="h-3 w-3" />
    return team.streak_type === 'win' ? 
      <TrendingUp className="h-3 w-3 text-accent" /> : 
      <TrendingDown className="h-3 w-3 text-destructive" />
  }

  const getStreakColor = () => {
    if (!team.streak || team.streak === 0) return "text-muted-foreground"
    return team.streak_type === 'win' ? "text-accent" : "text-destructive"
  }

  if (variant === 'compact') {
  return (
      <Link href={`/teams/${team.id}`}>
        <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={team.name} 
                alt={team.abbreviation || team.name} 
                width={32}
                height={32}
                {...(team.logo_url && { logoUrl: team.logo_url })}
                sport={team.sport}
                league={team.league}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{team.name}</div>
                <div className="text-sm text-muted-foreground">{team.abbreviation}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{team.wins || 0}-{team.losses || 0}</div>
                <div className="text-xs text-muted-foreground">{winPercentage}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === 'detailed') {
    return (
      <Link href={`/teams/${team.id}`}>
        <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <TeamLogo 
                teamName={team.name} 
                alt={team.abbreviation || team.name} 
                width={40} 
                height={40}
                {...(team.logo_url && { logoUrl: team.logo_url })}
                sport={team.sport}
                league={team.league}
              />
            </div>
      </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Record</div>
                <div className="text-2xl font-bold">{team.wins || 0}-{team.losses || 0}</div>
                <div className="text-sm text-muted-foreground">{winPercentage}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Streak</div>
                <div className="flex items-center gap-1">
                  {getStreakIcon()}
                  <span className={`text-lg font-bold ${getStreakColor()}`}>
                    {team.streak || 0}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {team.streak_type || 'none'}
                </div>
              </div>
            </div>
            
            {team.conference && (
              <div className="pt-3 border-t border-border">
                <Badge variant="outline">{team.conference}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/teams/${team.id}`}>
      <Card className="card-modern hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TeamLogo 
                teamName={team.name} 
                alt={team.abbreviation || team.name} 
                width={36} 
                height={36}
                {...(team.logo_url && { logoUrl: team.logo_url })}
                sport={team.sport}
                league={team.league}
              />
              <div>
                <div className="font-semibold text-lg">{team.name}</div>
                <div className="text-sm text-muted-foreground">{team.abbreviation}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{team.wins || 0}-{team.losses || 0}</div>
              <div className="text-sm text-muted-foreground">{winPercentage}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {team.conference && (
              <Badge variant="outline" className="text-xs">
                {team.conference}
              </Badge>
            )}
            {team.streak && team.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                {getStreakIcon()}
                <span className={getStreakColor()}>
                  {team.streak} {team.streak_type}
                </span>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
    </Link>
  )
}
