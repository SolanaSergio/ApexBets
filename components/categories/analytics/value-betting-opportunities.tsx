"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Target } from "lucide-react"

interface ValueBettingOpportunitiesProps {
  timeRange: string
  sport: string
  league: string
}

interface ValueBet {
  gameId: string
  homeTeam: string
  awayTeam: string
  betType: string
  side: string
  odds: number
  value: number
  recommendation: 'strong' | 'moderate' | 'weak'
  bookmakers: string[]
  analysis: string
}

export default function ValueBettingOpportunities({ timeRange, sport, league }: ValueBettingOpportunitiesProps) {
  const [valueBets, setValueBets] = useState<ValueBet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchValueBets()
  }, [timeRange, sport, league, fetchValueBets])

  const fetchValueBets = async () => {
    try {
      setLoading(true)
      
      // Fetch real value betting opportunities from API
      const response = await fetch(`/api/value-bets?sport=${sport}&league=${league}&timeRange=${timeRange}`)
      const data = await response.json()
      
      setValueBets(data.opportunities || [])
    } catch (error) {
      console.error('Error fetching value bets:', error)
      setValueBets([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Value Betting Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Value Betting Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {valueBets.length > 0 ? (
            <div className="space-y-4">
              {valueBets.map((bet) => (
                <div key={bet.gameId} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-lg">
                        {bet.homeTeam} vs {bet.awayTeam}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {bet.betType} • {bet.side}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {bet.odds > 0 ? '+' : ''}{bet.odds}
                      </div>
                      <Badge 
                        variant={
                          bet.recommendation === 'strong' ? 'default' :
                          bet.recommendation === 'moderate' ? 'secondary' : 'outline'
                        }
                      >
                        {bet.recommendation.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Value:</span>
                      <span className="text-sm font-bold text-green-600">
                        +{Math.round(bet.value * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bet.analysis}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Available at:</span>
                      <div className="flex gap-1">
                        {bet.bookmakers.map((bookmaker, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {bookmaker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No value betting opportunities at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Opportunities</p>
                <p className="text-2xl font-bold">{valueBets.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Strong Recommendations</p>
                <p className="text-2xl font-bold">
                  {valueBets.filter(bet => bet.recommendation === 'strong').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Value</p>
                <p className="text-2xl font-bold">
                  {valueBets.length > 0 ? 
                    (valueBets.reduce((acc, bet) => acc + bet.value, 0) / valueBets.length * 100).toFixed(1) + '%' : 
                    '0%'
                  }
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
