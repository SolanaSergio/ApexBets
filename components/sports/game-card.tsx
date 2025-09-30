
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: string
  quarter: string
  timeRemaining: string
  sport: string
}

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant={game.status === 'Live' ? 'destructive' : 'secondary'}>
            {game.status}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {game.sport}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{game.homeTeam}</span>
            <span className="text-xl font-bold text-primary">{game.homeScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{game.awayTeam}</span>
            <span className="text-xl font-bold text-primary">{game.awayScore}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{game.quarter}</span>
          <span>{game.timeRemaining}</span>
        </div>
      </CardContent>
    </Card>
  )
}
