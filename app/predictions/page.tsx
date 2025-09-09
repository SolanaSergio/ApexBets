import { Suspense } from "react"
import { Navigation } from "@/components/navigation/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Target, Brain, TrendingUp, Calendar, Zap, BarChart3, Clock, CheckCircle, XCircle } from "lucide-react"

export default function PredictionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Predictions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced machine learning predictions for games, spreads, and totals with confidence scores
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                  <p className="text-2xl font-bold text-primary">73.2%</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2">
                <Progress value={73.2} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Predictions Today</p>
                  <p className="text-2xl font-bold text-accent">24</p>
                </div>
                <Brain className="h-8 w-8 text-accent" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                +12% from yesterday
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Streak</p>
                  <p className="text-2xl font-bold text-green-600">7</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Current streak
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confidence Avg</p>
                  <p className="text-2xl font-bold text-blue-600">84%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <Progress value={84} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predictions Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="today" className="gap-2">
              <Calendar className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Brain className="h-4 w-4" />
              Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <Suspense fallback={<TodayPredictionsSkeleton />}>
              <TodayPredictionsSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Suspense fallback={<UpcomingPredictionsSkeleton />}>
              <UpcomingPredictionsSection />
            </Suspense>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Suspense fallback={<HistorySkeleton />}>
              <HistorySection />
            </Suspense>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Suspense fallback={<ModelsSkeleton />}>
              <ModelsSection />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Today's Predictions Section
function TodayPredictionsSection() {
  const todayPredictions = [
    {
      id: "1",
      game: "Lakers vs Warriors",
      type: "Winner",
      prediction: "Lakers",
      confidence: 0.87,
      odds: "+120",
      status: "pending",
      gameTime: "8:00 PM",
      model: "Neural Network v3.2"
    },
    {
      id: "2",
      game: "Celtics vs Heat",
      type: "Spread",
      prediction: "Celtics -6.5",
      confidence: 0.82,
      odds: "-110",
      status: "pending",
      gameTime: "7:30 PM",
      model: "Ensemble v2.1"
    },
    {
      id: "3",
      game: "Knicks vs Nets",
      type: "Total",
      prediction: "Over 225.5",
      confidence: 0.79,
      odds: "+105",
      status: "pending",
      gameTime: "8:30 PM",
      model: "Random Forest v1.8"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Today's Predictions</h2>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          {todayPredictions.length} Active
        </Badge>
      </div>

      <div className="grid gap-6">
        {todayPredictions.map((prediction) => (
          <Card key={prediction.id} className="card-hover-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prediction.game}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{prediction.status}</Badge>
                  <span className="text-sm text-muted-foreground">{prediction.gameTime}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Prediction Type</div>
                  <div className="font-semibold">{prediction.type}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Prediction</div>
                  <div className="font-semibold text-primary">{prediction.prediction}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Odds</div>
                  <div className="font-semibold text-accent">{prediction.odds}</div>
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

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Model: {prediction.model}
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
        ))}
      </div>
    </div>
  )
}

// Upcoming Predictions Section
function UpcomingPredictionsSection() {
  const upcomingPredictions = [
    {
      id: "4",
      game: "Bulls vs 76ers",
      type: "Winner",
      prediction: "76ers",
      confidence: 0.85,
      gameDate: "Jan 16, 2024",
      gameTime: "8:00 PM",
      model: "Neural Network v3.2"
    },
    {
      id: "5",
      game: "Nuggets vs Jazz",
      type: "Spread",
      prediction: "Nuggets -4.5",
      confidence: 0.78,
      gameDate: "Jan 17, 2024",
      gameTime: "9:00 PM",
      model: "Ensemble v2.1"
    }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upcoming Predictions</h2>

      <div className="grid gap-6">
        {upcomingPredictions.map((prediction) => (
          <Card key={prediction.id} className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prediction.game}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {prediction.gameDate} at {prediction.gameTime}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Prediction</div>
                  <div className="font-semibold text-primary">{prediction.prediction}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Confidence</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                    <Progress value={prediction.confidence * 100} className="flex-1 h-2" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Model: {prediction.model}
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// History Section
function HistorySection() {
  const historyPredictions = [
    {
      id: "6",
      game: "Lakers vs Warriors",
      type: "Winner",
      prediction: "Lakers",
      actual: "Lakers",
      confidence: 0.89,
      result: "correct",
      date: "Jan 14, 2024"
    },
    {
      id: "7",
      game: "Celtics vs Heat",
      type: "Spread",
      prediction: "Celtics -5.5",
      actual: "Celtics -8",
      confidence: 0.76,
      result: "correct",
      date: "Jan 13, 2024"
    },
    {
      id: "8",
      game: "Knicks vs Nets",
      type: "Total",
      prediction: "Under 220.5",
      actual: "Over 220.5",
      confidence: 0.71,
      result: "incorrect",
      date: "Jan 12, 2024"
    }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prediction History</h2>

      <div className="grid gap-4">
        {historyPredictions.map((prediction) => (
          <Card key={prediction.id} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    prediction.result === "correct" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {prediction.result === "correct" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{prediction.game}</div>
                    <div className="text-sm text-muted-foreground">{prediction.date}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-primary">{prediction.prediction}</div>
                  <div className="text-sm text-muted-foreground">
                    Actual: {prediction.actual}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <span className="font-semibold">{Math.round(prediction.confidence * 100)}%</span>
                </div>
                <Badge variant={prediction.result === "correct" ? "default" : "destructive"}>
                  {prediction.result === "correct" ? "Correct" : "Incorrect"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Models Section
function ModelsSection() {
  const models = [
    {
      name: "Neural Network v3.2",
      accuracy: 0.78,
      predictions: 1247,
      lastUpdated: "2 days ago",
      status: "active",
      description: "Deep learning model with advanced feature engineering"
    },
    {
      name: "Ensemble v2.1",
      accuracy: 0.75,
      predictions: 892,
      lastUpdated: "1 week ago",
      status: "active",
      description: "Combines multiple algorithms for robust predictions"
    },
    {
      name: "Random Forest v1.8",
      accuracy: 0.72,
      predictions: 2156,
      lastUpdated: "2 weeks ago",
      status: "deprecated",
      description: "Classic ensemble method with good baseline performance"
    }
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Prediction Models</h2>

      <div className="grid gap-6">
        {models.map((model) => (
          <Card key={model.name} className="card-hover">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{model.name}</CardTitle>
                <Badge variant={model.status === "active" ? "default" : "secondary"}>
                  {model.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{model.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(model.accuracy * 100)}%
                  </div>
                  <Progress value={model.accuracy * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Total Predictions</div>
                  <div className="text-2xl font-bold text-accent">
                    {model.predictions.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-lg font-semibold">{model.lastUpdated}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Performance
                </Button>
                {model.status === "active" && (
                  <Button size="sm">
                    Retrain Model
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Loading Skeletons
function TodayPredictionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-8 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-12 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-2 w-full bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function UpcomingPredictionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ModelsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-muted rounded animate-pulse" />
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-full bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
