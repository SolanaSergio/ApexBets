"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { apiClient, type Prediction, type Game } from "@/lib/api-client"
import { Target, TrendingUp, Zap } from "lucide-react"

interface PredictionWithGame extends Prediction {
  game?: Game
}

export function PredictionsPanel() {
  const [predictions, setPredictions] = useState<PredictionWithGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()
  }, [])

  async function fetchPredictions() {
    try {
      setLoading(true)

      // Fetch recent predictions
      const predictionsData = await apiClient.getPredictions({
        limit: 10,
      })

      // Fetch game details for each prediction
      const predictionsWithGames = await Promise.all(
        predictionsData.map(async (prediction) => {
          try {
            const game = await apiClient.getGame(prediction.game_id)
            return { ...prediction, game }
          } catch {
            return prediction
          }
        }),
      )

      setPredictions(predictionsWithGames)
    } catch (error) {
      console.error("Error fetching predictions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PredictionsPanelSkeleton />
  }

  // Group predictions by type
  const winnerPredictions = predictions.filter((p) => p.prediction_type === "winner")
  const spreadPredictions = predictions.filter((p) => p.prediction_type === "spread")
  const totalPredictions = predictions.filter((p) => p.prediction_type === "total")

  return (
    <div className="space-y-6">
      {/* Latest Predictions */}
      <Card className="prediction-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Latest Predictions</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchPredictions}>
            <Zap className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
              <p className="text-sm">Predictions will appear here once games are analyzed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {winnerPredictions.slice(0, 3).map((prediction) => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prediction Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Model Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Winner Predictions</span>
              <span className="stats-highlight">
                {winnerPredictions.filter((p) => p.is_correct).length}/
                {winnerPredictions.filter((p) => p.is_correct !== null).length}
              </span>
            </div>
            <Progress value={calculateAccuracy(winnerPredictions)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Spread Predictions</span>
              <span className="stats-highlight">
                {spreadPredictions.filter((p) => p.is_correct).length}/
                {spreadPredictions.filter((p) => p.is_correct !== null).length}
              </span>
            </div>
            <Progress value={calculateAccuracy(spreadPredictions)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Predictions</span>
              <span className="stats-highlight">
                {totalPredictions.filter((p) => p.is_correct).length}/
                {totalPredictions.filter((p) => p.is_correct !== null).length}
              </span>
            </div>
            <Progress value={calculateAccuracy(totalPredictions)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: PredictionWithGame }) {
  const confidencePercentage = Math.round(prediction.confidence * 100)

  return (
    <div className="p-3 rounded-lg border bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          {prediction.game?.away_team?.name} @ {prediction.game?.home_team?.name}
        </div>
        <Badge
          variant={
            prediction.is_correct === true ? "default" : prediction.is_correct === false ? "destructive" : "secondary"
          }
          className="text-xs"
        >
          {prediction.is_correct === true ? "✓" : prediction.is_correct === false ? "✗" : "Pending"}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {prediction.prediction_type === "winner"
            ? `Home Win: ${Math.round(prediction.predicted_value * 100)}%`
            : prediction.prediction_type === "spread"
              ? `Spread: ${prediction.predicted_value > 0 ? "+" : ""}${prediction.predicted_value.toFixed(1)}`
              : `Total: ${prediction.predicted_value.toFixed(1)}`}
        </div>
        <div className="text-xs text-primary font-medium">{confidencePercentage}% confidence</div>
      </div>
    </div>
  )
}

function calculateAccuracy(predictions: Prediction[]): number {
  const completed = predictions.filter((p) => p.is_correct !== null)
  if (completed.length === 0) return 0

  const correct = completed.filter((p) => p.is_correct).length
  return (correct / completed.length) * 100
}

function PredictionsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex justify-between mb-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-5 bg-muted rounded w-16"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 bg-muted rounded w-24"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
