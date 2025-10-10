"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { databaseFirstApiClient } from "@/lib/api-client-database-first"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { Target, TrendingUp, Eye, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Prediction {
  id: string
  game_id: string
  prediction_type: string
  predicted_value: number
  confidence: number
  reasoning: string
  created_at: string
  game?: {
    home_team: { name: string; abbreviation: string }
    away_team: { name: string; abbreviation: string }
    game_date: string
    sport: string
  }
}

export function PredictionsDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [overallAccuracy, setOverallAccuracy] = useState(0)

  useEffect(() => {
    loadPredictions()
  }, [])

  const loadPredictions = async () => {
    try {
      setLoading(true)
      
      // Load recent predictions
      const recentPredictions = await databaseFirstApiClient.getPredictions({ 
        limit: 6
      })
      
      setPredictions(recentPredictions || [])
      
      // Calculate overall accuracy
      const allPredictions = await databaseFirstApiClient.getPredictions({ limit: 100 })
      if (allPredictions && allPredictions.length > 0) {
        const correctPredictions = allPredictions.filter(p => p.accuracy === true).length
        const accuracy = Math.round((correctPredictions / allPredictions.length) * 100)
        setOverallAccuracy(accuracy)
      }
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-accent"
    if (confidence >= 60) return "text-primary"
    return "text-muted-foreground"
  }

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 80) return "default"
    if (confidence >= 60) return "secondary"
    return "outline"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">AI Predictions</h2>
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-muted rounded"></div>
                  <div className="h-3 w-1/2 bg-muted rounded"></div>
                  <div className="h-2 w-full bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Predictions</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            <div className="text-2xl font-bold text-accent">{overallAccuracy}%</div>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </div>

      {/* Predictions Grid */}
      {predictions.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
            <p className="text-muted-foreground">
              AI predictions will appear here as games are analyzed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((prediction) => {
            const gameDate = new Date(prediction.game?.game_date || prediction.created_at)
            const sportConfig = SportConfigManager.getSportConfig(prediction.game?.sport as any)
            
            return (
              <Card key={prediction.id} className="card-modern hover:border-primary transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {prediction.game?.away_team?.abbreviation} vs {prediction.game?.home_team?.abbreviation}
                    </CardTitle>
                    <Badge variant={getConfidenceBadgeVariant(prediction.confidence)}>
                      {prediction.confidence}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(gameDate, "MMM d, h:mm a")}
                    {sportConfig && (
                      <>
                        <span>•</span>
                        <span>{sportConfig.icon} {sportConfig.name}</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Prediction Type */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Prediction</div>
                    <div className="font-medium capitalize">
                      {prediction.prediction_type.replace('_', ' ')}
                    </div>
                    {prediction.predicted_value && (
                      <div className="text-lg font-bold text-primary">
                        {prediction.predicted_value}
                      </div>
                    )}
                  </div>

                  {/* Confidence Meter */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                        {prediction.confidence}%
                      </span>
                    </div>
                    <Progress 
                      value={prediction.confidence} 
                      className="h-2"
                    />
                  </div>

                  {/* Reasoning */}
                  {prediction.reasoning && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reasoning</div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {prediction.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
