'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TeamLogo } from '@/components/ui/sports-image'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import type { Team as ApiTeam } from '@/lib/api-client-database-first'
import { cn } from '@/lib/utils'

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

export function TeamCard({ team }: TeamCardProps) {
  const winPercentage =
    team.wins !== null && team.losses !== null && (team.wins! + team.losses! > 0)
      ? Math.round((team.wins! / (team.wins! + team.losses!)) * 100)
      : 0

  const Streak = () => {
    if (!team.streak || team.streak === 0) {
      return <><Minus className="h-4 w-4 text-gray-400" /> No Streak</>
    }
    const Icon = team.streak_type === 'win' ? TrendingUp : TrendingDown
    const color = team.streak_type === 'win' ? 'text-green-600' : 'text-red-600'
    return <><Icon className={`h-4 w-4 ${color}`} /> {team.streak} {team.streak_type === 'win' ? 'Wins' : 'Losses'}</>
  }

  return (
    <Link href={`/teams/${team.id}`} passHref>
      <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col bg-white">
        <CardContent className="p-6 flex-grow">
          <div className="flex items-center gap-4 mb-4">
            <TeamLogo
              teamName={team.name}
              alt={team.abbreviation || team.name}
              width={60}
              height={60}
              className="drop-shadow-lg"
              {...(team.logo_url && { logoUrl: team.logo_url })}
              sport={team.sport}
              league={team.league}
            />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors truncate">{team.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{team.abbreviation}</p>
            </div>
          </div>
          
          <div className="space-y-3 text-center">
              <div className="text-4xl font-bold">{team.wins || 0} - {team.losses || 0}</div>
              <p className="text-sm text-muted-foreground font-semibold">W-L RECORD</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center pt-4 mt-4 border-t">
            <div>
              <p className="text-2xl font-bold">{winPercentage}%</p>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Win Rate</p>
            </div>
            <div>
              <div className={cn('flex items-center justify-center gap-1 text-lg font-bold', team.streak_type === 'win' ? 'text-green-600' : team.streak_type === 'loss' ? 'text-red-600' : 'text-gray-600')}>
                <Streak />
              </div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Current Streak</p>
            </div>
          </div>

          {team.conference && (
            <div className="mt-4 text-center">
              <Badge variant="secondary">{team.conference}</Badge>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t bg-gray-50/50">
          <div className="flex items-center justify-between w-full text-sm font-semibold text-primary group-hover:text-primary-dark">
            <span>View Team</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}