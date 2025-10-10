"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { usePredictions, useRealTimeData } from "@/components/data/real-time-provider"
import { SportConfigManager } from "@/lib/services/core/sport-config"
import { Target, TrendingUp, Eye, Calendar, BarChart3 } from "lucide-react"
import { format } from "date-fns"

export function PredictionsDashboard() {
  const { selectedSport } = useRealTimeData()
  const { predictions, loading, error, lastUpdate } = usePredictions()

  // Filter predictions based on selected sport
  const filteredPredictions = useMemo(() => {
    if (selectedSport === "all") return predictions
    return predictions.filter(pred => pred.sport === selectedSport)
  }, [predictions, selectedSport])

  // Sort by confidence and take top 6
  const topPredictions = useMemo(() => {
    return filteredPredictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6)
  }, [filteredPredictions])

  // Calculate overall accuracy
  const overallAccuracy = useMemo(() => {
    if (filteredPredictions.length === 0) return 0
    const correctPredictions = filteredPredictions.filter(p => p.accuracy === true).length
    return Math.round((correctPredictions / filteredPredictions.length) * 100)
  }, [filteredPredictions])

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">AI Predictions</h2>
        </div>
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <div className="text-destructive text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground">
              Unable to load predictions. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
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
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {format(lastUpdate, "h:mm a")}
            </span>
          )}
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
      {topPredictions.length === 0 ? (
        <Card className="card-modern">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
            <p className="text-muted-foreground">
              {selectedSport === "all" 
                ? "AI predictions will appear here as games are analyzed across all sports"
                : `AI predictions will appear here as ${selectedSport} games are analyzed`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topPredictions.map((prediction) => {
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

      {/* Stats Summary */}
      {topPredictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Predictions</div>
                  <div className="text-lg font-bold">{filteredPredictions.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">High Confidence</div>
                  <div className="text-lg font-bold">
                    {filteredPredictions.filter(p => p.confidence >= 80).length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                  <div className="text-lg font-bold">{overallAccuracy}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
