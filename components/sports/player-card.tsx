'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import type { Player as ApiPlayer } from '@/lib/api-client-database-first'
import { cn } from '@/lib/utils'

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
    steals?: number
    blocks?: number
    turnovers?: number
    minutes?: number
    games_played?: number
  }
  team_logo?: string
  recent_form?: 'up' | 'down' | 'stable'
}

interface PlayerCardProps {
  player: Player
  variant?: 'default' | 'compact' | 'detailed'
}

export function PlayerCard({ player, variant = 'default' }: PlayerCardProps) {
  const FormIcon = {
    up: <TrendingUp className="h-4 w-4 text-green-500" />,
    down: <TrendingDown className="h-4 w-4 text-red-500" />,
    stable: <Minus className="h-4 w-4 text-gray-400" />,
  }[player.recent_form || 'stable']

  return (
    <Link href={`/players/${player.id}`} passHref>
      <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
            <AvatarImage src={player.headshotUrl || player.avatar} alt={player.name} />
            <AvatarFallback className="font-bold">
              {player.name?.split(' ').map(n => n[0]).join('') || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{player.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{player.position} • {player.teamName || player.team}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <StatItem label="Points" value={player.stats?.points || 0} />
            <StatItem label="Rebounds" value={player.stats?.rebounds || 0} />
            <StatItem label="Assists" value={player.stats?.assists || 0} />
          </div>
          {(variant === 'detailed' && player.stats) && (
            <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
              <StatItem label="FG%" value={player.stats?.field_goal_percentage || 0} isPercentage />
              <StatItem label="3P%" value={player.stats?.three_point_percentage || 0} isPercentage />
              <StatItem label="FT%" value={player.stats?.free_throw_percentage || 0} isPercentage />
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-medium">
            {FormIcon}
            <span className={cn(
              'capitalize',
              player.recent_form === 'up' && 'text-green-600',
              player.recent_form === 'down' && 'text-red-600',
            )}>
              {player.recent_form || 'Stable'} Form
            </span>
          </div>
          <div className="flex items-center text-sm font-semibold text-primary group-hover:text-primary-dark">
            View Profile <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

function StatItem({ label, value, isPercentage = false }: { label: string; value: number | undefined; isPercentage?: boolean }) {
  const displayValue = value !== undefined && value !== null ? `${value}${isPercentage ? '%' : ''}` : 'N/A'
  return (
    <div>
      <p className="text-2xl font-bold text-foreground">{displayValue}</p>
      <p className="text-xs text-muted-foreground uppercase font-semibold">{label}</p>
    </div>
  )
}