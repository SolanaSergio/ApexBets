"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface PlayerAnalyticsProps {
  team: string
  timeRange: string
}

const topPerformers = [
  {
    name: "LeBron James",
    team: "Lakers",
    ppg: 25.8,
    rpg: 8.2,
    apg: 6.9,
    efficiency: 0.847,
    trend: "up",
  },
  {
    name: "Stephen Curry",
    team: "Warriors",
    ppg: 29.1,
    rpg: 4.5,
    apg: 6.3,
    efficiency: 0.892,
    trend: "up",
  },
  {
    name: "Jayson Tatum",
    team: "Celtics",
    ppg: 27.3,
    rpg: 7.8,
    apg: 4.2,
    efficiency: 0.823,
    trend: "neutral",
  },
]

export function PlayerAnalytics({ team, timeRange }: PlayerAnalyticsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((player, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {player.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.team}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <div className="font-semibold">{player.ppg}</div>
                      <div className="text-muted-foreground">PPG</div>
                    </div>
                    <div>
                      <div className="font-semibold">{player.rpg}</div>
                      <div className="text-muted-foreground">RPG</div>
                    </div>
                    <div>
                      <div className="font-semibold">{player.apg}</div>
                      <div className="text-muted-foreground">APG</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {(player.efficiency * 100).toFixed(1)}% EFF
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
