
"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Player as ApiPlayer } from "@/lib/api-client-database-first"

type Player = ApiPlayer & {
  avatar?: string
  team?: string
  stats?: {
    points?: number
    rebounds?: number
    assists?: number
  }
}

interface PlayerCardProps {
  player: Player
}

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{player.name}</CardTitle>
        <Image 
          src={player.avatar || player.headshotUrl || "/images/placeholder-player.png"} 
          alt={player.name} 
          width={32}
          height={32}
          className="w-8 h-8 rounded-full" 
        />
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">{player.position || ""}</div>
        <div className="text-xs text-muted-foreground">{player.team || player.teamName || ""}</div>
        <div className="flex justify-between mt-2">
          <div>
            <div className="text-lg font-bold">{player.stats?.points ?? 0}</div>
            <div className="text-xs text-muted-foreground">Points</div>
          </div>
          <div>
            <div className="text-lg font-bold">{player.stats?.rebounds ?? 0}</div>
            <div className="text-xs text-muted-foreground">Rebounds</div>
          </div>
          <div>
            <div className="text-lg font-bold">{player.stats?.assists ?? 0}</div>
            <div className="text-xs text-muted-foreground">Assists</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
