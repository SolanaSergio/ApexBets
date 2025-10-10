"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Target, Brain, TrendingUp, Calendar, Zap, BarChart3, Clock, CheckCircle, XCircle, RefreshCw, Lightbulb } from "lucide-react"
import { databaseFirstApiClient, type Game, type Prediction } from "@/lib/api-client-database-first"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"
import { format } from "date-fns"

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [games, setGames] = useState<Record<string, Game>>({})
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<SupportedSport | null>(null)
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])

  const loadPredictions = useCallback(async () => {
    try {
      setLoading(true)
      const predictionsData = await databaseFirstApiClient.getPredictions({
        ...(selectedSport && { sport: selectedSport }),
        limit: 20
      })

      // Fetch game details for each prediction
      const gamePromises = predictionsData.map(async (prediction) => {
        try {
          const game = await databaseFirstApiClient.getGame(prediction.game_id)
          return { predictionId: prediction.id, game }
        } catch {
          return { predictionId: prediction.id, game: null }
        }
      })

      const gameResults = await Promise.all(gamePromises)
      const gamesMap = gameResults.reduce((acc, { predictionId, game }) => {
        if (game) acc[predictionId] = game
        return acc
      }, {} as Record<string, Game>)

      setPredictions(predictionsData)
      setGames(gamesMap)
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setPredictions([])
      setGames({})
    } finally {
      setLoading(false)
    }
  }, [selectedSport])

  const loadSupportedSports = async () => {
    const sports = SportConfigManager.getSupportedSports()
    setSupportedSports(sports)
    if (sports.length > 0) {
      setSelectedSport(sports[0])
    }
  }

  useEffect(() => {
    loadSupportedSports()
  }, [])

  useEffect(() => {
    if (selectedSport) {
      loadPredictions()
    }
  }, [selectedSport, loadPredictions])

  const predictionStats = useMemo(() => {
    const totalPredictions = predictions.length
    const correctPredictions = predictions.filter(p => p.is_correct === true).length
    const pendingPredictions = predictions.filter(p => p.is_correct === null).length
    const accuracy = totalPredictions > 0 ? (correctPredictions / (totalPredictions - pendingPredictions)) * 100 : 0
    const avgConfidence = predictions.length > 0 ? 
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 0

    return { totalPredictions, correctPredictions, pendingPredictions, accuracy, avgConfidence }
  }, [predictions])

  const recentPredictions = useMemo(() => {
    return predictions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
  }, [predictions])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold">
            AI Predictions
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Advanced machine learning predictions for games, spreads, and totals with confidence scores
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{predictionStats.accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-accent/5">
                  <Brain className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{predictionStats.totalPredictions}</div>
                  <div className="text-sm text-muted-foreground">Total Predictions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary/5">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{predictionStats.correctPredictions}</div>
                  <div className="text-sm text-muted-foreground">Correct Predictions</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/5">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{(predictionStats.avgConfidence * 100).toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        {/* Sport Filter */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Filter by Sport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {supportedSports.map((sport) => {
                const config = SportConfigManager.getSportConfig(sport)
                return (
                  <Button
                    key={sport}
                    variant={selectedSport === sport ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSport(sport)}
                    className="gap-2"
                  >
                    <span>{config?.icon}</span>
                    {config?.name}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Predictions Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Calendar className="h-4 w-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Predictions</h2>
                <Button variant="ghost" size="sm" onClick={loadPredictions} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {recentPredictions.length === 0 ? (
                <Card className="card-modern">
          <CardContent className="py-12 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Predictions</h3>
            <p className="text-muted-foreground">Check back later for new predictions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
                  {recentPredictions.map((prediction) => {
            const game = games[prediction.id]
            const gameDate = game ? new Date(game.game_date) : new Date()
            
            return (
                      <Card key={prediction.id} className="card-modern">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {game ? `${game.away_team?.name || 'Away'} @ ${game.home_team?.name || 'Home'}` : 'Game Details Loading...'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                              <Badge variant={
                                prediction.is_correct === true ? "default" : 
                                prediction.is_correct === false ? "destructive" : 
                                "secondary"
                              }>
                                {prediction.is_correct === true ? 'Correct' : 
                                 prediction.is_correct === false ? 'Incorrect' : 
                                 'Pending'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(gameDate, "h:mm a")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Prediction Type</div>
                      <div className="font-semibold capitalize">{prediction.prediction_type}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Prediction</div>
                      <div className="font-semibold text-primary">
                        {prediction.prediction_type === "winner" 
                          ? `Home Win: ${Math.round(prediction.predicted_value * 100)}%`
                          : prediction.prediction_type === "spread"
                          ? `Spread: ${prediction.predicted_value > 0 ? "+" : ""}${prediction.predicted_value.toFixed(1)}`
                          : `Total: ${prediction.predicted_value.toFixed(1)}`}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Model</div>
                      <div className="font-semibold text-accent">{prediction.model_name}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Level</span>
                      <span className="text-sm font-bold text-primary">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                    <Progress value={prediction.confidence * 100} className="h-2" />
                  </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Created: {format(new Date(prediction.created_at), "MMM d, h:mm a")}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Analysis
                      </Button>
                      <Button size="sm">
                        Track Prediction
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pending Predictions</h2>
              <div className="grid gap-6">
                {predictions.filter(p => p.is_correct === null).map((prediction) => {
                  const game = games[prediction.id]
  return (
                    <Card key={prediction.id} className="card-modern">
                      <CardContent className="p-6">
              <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-semibold">
                                {game ? `${game.away_team?.name || 'Away'} @ ${game.home_team?.name || 'Home'}` : 'Game Details Loading...'}
                              </div>
                <div className="text-sm text-muted-foreground">
                                {game ? format(new Date(game.game_date), "MMM d, yyyy") : 'Loading...'}
                              </div>
                </div>
              </div>

                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {prediction.prediction_type === "winner" 
                                ? `Home Win: ${Math.round(prediction.predicted_value * 100)}%`
                                : prediction.prediction_type === "spread"
                                ? `Spread: ${prediction.predicted_value > 0 ? "+" : ""}${prediction.predicted_value.toFixed(1)}`
                                : `Total: ${prediction.predicted_value.toFixed(1)}`}
                </div>
                            <div className="text-sm text-muted-foreground">
                              Model: {prediction.model_name}
                  </div>
                </div>
              </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Confidence:</span>
                            <span className="font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                </div>
                          <Badge variant="secondary">Pending</Badge>
              </div>
            </CardContent>
          </Card>
                  )
                })}
        </div>
    </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Prediction History</h2>
              <div className="grid gap-4">
                {predictions.filter(p => p.is_correct !== null).map((prediction) => {
                  const game = games[prediction.id]
  return (
                    <Card key={prediction.id} className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              prediction.is_correct === true ? "bg-accent/10" : "bg-destructive/10"
                    }`}>
                      {prediction.is_correct === true ? (
                                <CheckCircle className="h-4 w-4 text-accent" />
                      ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                              <div className="font-semibold">
                                {game ? `${game.away_team?.name || 'Away'} @ ${game.home_team?.name || 'Home'}` : 'Game Details Loading...'}
                              </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(prediction.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {prediction.prediction_type === "winner" 
                        ? `Home Win: ${Math.round(prediction.predicted_value * 100)}%`
                        : prediction.prediction_type === "spread"
                        ? `Spread: ${prediction.predicted_value > 0 ? "+" : ""}${prediction.predicted_value.toFixed(1)}`
                        : `Total: ${prediction.predicted_value.toFixed(1)}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Model: {prediction.model_name}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <span className="font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                  </div>
                  <Badge variant={
                            prediction.is_correct === true ? "default" : "destructive"
                  }>
                            {prediction.is_correct === true ? "Correct" : "Incorrect"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
          </div>
    </AppLayout>
  )
}