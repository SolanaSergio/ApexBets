"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, DollarSign, Target, AlertCircle, RefreshCw, Clock } from "lucide-react"

interface ValueBettingOpportunitiesProps {
  timeRange: string
  sport?: string
  league?: string
}

interface ValueBettingOpportunity {
  gameId: string
  homeTeam: string
  awayTeam: string
  betType: string
  side: string
  odds: number
  probability: number
  value: number
  recommendation: 'strong' | 'moderate' | 'weak'
  expectedValue: number
  kellyPercentage: number
}

export function ValueBettingOpportunities({ timeRange, sport = 'basketball', league }: ValueBettingOpportunitiesProps) {
  const [opportunities, setOpportunities] = useState<ValueBettingOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [minValue, setMinValue] = useState<string>("0.1")

  useEffect(() => {
    fetchValueBets()
  }, [timeRange, filter, minValue, sport, league])

  const fetchValueBets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        sport,
        min_value: minValue
      })
      
      if (filter !== 'all') {
        params.set('recommendation', filter)
      }
      
      if (league) {
        params.set('league', league)
      }

      const response = await fetch(`/api/value-bets?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        if (!data.opportunities || data.opportunities.length === 0) {
          console.warn(`No value betting opportunities found for ${sport}${league ? ` in ${league}` : ''}`)
          setOpportunities([])
        } else {
          setOpportunities(data.opportunities)
        }
      } else {
        setError(data.error || 'Failed to fetch value betting opportunities')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching value bets:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "strong":
        return "bg-green-100 text-green-800 border-green-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "weak":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBetTypeIcon = (betType: string) => {
    switch (betType.toLowerCase()) {
      case 'moneyline':
        return '💰'
      case 'spread':
        return '📊'
      case 'total':
        return '📈'
      default:
        return '🎯'
    }
  }

  if (loading) {
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{opportunities.length}</div>
            <div className="text-sm text-muted-foreground">Active Opportunities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">
              {opportunities.length > 0 
                ? `+${(opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Value Betting Opportunities
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchValueBets}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Recommendation</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="strong">Strong Only</SelectItem>
                  <SelectItem value="moderate">Moderate+</SelectItem>
                  <SelectItem value="weak">All Including Weak</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium mb-2 block">Min Value</label>
              <Select value={minValue} onValueChange={setMinValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.05">5%+</SelectItem>
                  <SelectItem value="0.1">10%+</SelectItem>
                  <SelectItem value="0.15">15%+</SelectItem>
                  <SelectItem value="0.2">20%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {opportunities.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Value Bets Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later for new opportunities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opportunity) => (
                <div
                  key={`${opportunity.gameId}-${opportunity.betType}-${opportunity.side}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="font-semibold">
                        {opportunity.homeTeam} vs {opportunity.awayTeam}
                      </div>
                      <Badge className={getRecommendationColor(opportunity.recommendation)}>
                        {opportunity.recommendation.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {getBetTypeIcon(opportunity.betType)} {opportunity.betType}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {opportunity.side} @ {opportunity.odds}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Model: {(opportunity.probability * 100).toFixed(1)}% | 
                      Kelly: {(opportunity.kellyPercentage * 100).toFixed(1)}% | 
                      EV: +{(opportunity.expectedValue * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="text-center mx-4">
                    <div className="text-lg font-bold text-green-500">
                      +{(opportunity.value * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Expected Value</div>
                  </div>

                  <div className="text-center mx-4">
                    <Badge variant={opportunity.recommendation === 'strong' ? "default" : "secondary"}>
                      {(opportunity.probability * 100).toFixed(0)}% confidence
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      2h 15m
                    </div>
                  </div>

                  <Button size="sm" className="ml-4">
                    Track Bet
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}