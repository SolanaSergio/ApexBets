"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Clock, DollarSign } from "lucide-react"

interface ValueBettingOpportunitiesProps {
  timeRange: string
}

const opportunities = [
  {
    game: "Lakers @ Warriors",
    type: "Moneyline",
    team: "Lakers",
    odds: "+145",
    impliedProb: 0.408,
    modelProb: 0.52,
    value: 0.112,
    confidence: 0.78,
    timeLeft: "2h 15m",
  },
  {
    game: "Celtics vs Heat",
    type: "Spread",
    team: "Heat +6.5",
    odds: "-110",
    impliedProb: 0.524,
    modelProb: 0.61,
    value: 0.086,
    confidence: 0.71,
    timeLeft: "4h 32m",
  },
  {
    game: "Nuggets @ Suns",
    type: "Over/Under",
    team: "Over 225.5",
    odds: "+105",
    impliedProb: 0.488,
    modelProb: 0.58,
    value: 0.092,
    confidence: 0.69,
    timeLeft: "6h 45m",
  },
]

export function ValueBettingOpportunities({ timeRange }: ValueBettingOpportunitiesProps) {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Active Opportunities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">+8.7%</div>
            <div className="text-sm text-muted-foreground">Avg Expected Value</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold">3.2h</div>
            <div className="text-sm text-muted-foreground">Avg Time to Game</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">74%</div>
            <div className="text-sm text-muted-foreground">Win Rate (30d)</div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Value Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {opportunities.map((opp, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="font-semibold">{opp.game}</div>
                    <Badge variant="outline">{opp.type}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {opp.team} @ {opp.odds}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Model: {(opp.modelProb * 100).toFixed(1)}% | Implied: {(opp.impliedProb * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="text-center mx-4">
                  <div className="text-lg font-bold text-green-500">+{(opp.value * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Expected Value</div>
                </div>

                <div className="text-center mx-4">
                  <Badge variant={opp.confidence > 0.75 ? "default" : "secondary"}>
                    {(opp.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {opp.timeLeft}
                  </div>
                </div>

                <Button size="sm" className="ml-4">
                  Track Bet
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
