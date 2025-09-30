
"use client"

import * as React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { Team as ApiTeam } from "@/lib/api-client-database-first"

type Team = ApiTeam & {
  logo?: string
  wins?: number
  losses?: number
  conference?: string
}

interface TeamCardProps {
  team: Team
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{team.name}</CardTitle>
        <Image 
          src={team.logo || team.logo_url || "/images/placeholder-team.png"} 
          alt={team.name} 
          width={32}
          height={32}
          className="w-8 h-8" 
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {(team.wins ?? 0)} - {(team.losses ?? 0)}
        </div>
        <p className="text-xs text-muted-foreground">{team.conference || ""}</p>
      </CardContent>
    </Card>
  )
}
