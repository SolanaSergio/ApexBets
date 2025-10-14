'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Target, Brain, TrendingUp, CheckCircle, RefreshCw, Lightbulb, ArrowRight } from 'lucide-react'
import { type Prediction } from '@/lib/api-client-database-first'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'
import { format } from 'date-fns'

// Mock API fetching
const fetchPredictions = async (sport: string) => {
  console.log(`Fetching predictions for ${sport}...`)
  const random = (min: number, max: number) => Math.random() * (max - min) + min
  const predictionTypes = ['winner', 'spread', 'total']
  const modelNames = ['AlphaModel', 'BetaModel', 'GammaModel']
  const teams = ['Team A', 'Team B', 'Team C', 'Team D']

  return Array.from({ length: 20 }).map((_, i) => ({
    id: `pred_${i}`,
    game_id: `game_${i}`,
    prediction_type: predictionTypes[i % 3],
    predicted_value: random(0, 1) > 0.5 ? random(40, 80) : -random(1, 10),
    confidence: random(0.5, 0.95),
    is_correct: i < 10 ? (random(0, 1) > 0.3 ? true : false) : null,
    created_at: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
    model_name: modelNames[i % 3],
    game: {
      id: `game_${i}`,
      away_team: { name: teams[i % 4] },
      home_team: { name: teams[(i + 1) % 4] },
      game_date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
    }
  }))
}

export default function PredictionsPage() {
  return (
    <RealTimeProvider>
      <AppLayout>
        <PredictionsPageContent />
      </AppLayout>
    </RealTimeProvider>
  )
}

function PredictionsPageContent() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const preds = await fetchPredictions(selectedSport)
    setPredictions(preds as unknown as Prediction[])
    setLoading(false)
  }, [selectedSport])

  useEffect(() => {
    const loadSports = async () => {
      const sports = await SportConfigManager.getSupportedSports();
      setSupportedSports(sports);
    };
    loadSports();
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = predictions.length
    const completed = predictions.filter(p => p.is_correct !== null)
    const correct = completed.filter(p => p.is_correct === true).length
    const accuracy = completed.length > 0 ? (correct / completed.length) * 100 : 0
    const avgConfidence = total > 0 ? (predictions.reduce((sum, p) => sum + p.confidence, 0) / total) * 100 : 0
    return { accuracy, total, correct, avgConfidence }
  }, [predictions])

  if (loading) {
    return <div className="p-8"><h1 className="text-2xl font-bold">Loading Predictions...</h1></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <Header onRefresh={loadData} loading={loading} />
      <StatCards stats={stats} />
      <SportFilters selected={selectedSport} setSelected={setSelectedSport} supported={supportedSports} />
      <PredictionList predictions={predictions} />
    </div>
  )
}

// --- Sub-components ---

function Header({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">AI Prediction Center</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">Explore data-driven insights for upcoming games.</p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh Predictions
      </Button>
    </div>
  )
}

function StatCards({ stats }: { stats: { accuracy: number; total: number; correct: number; avgConfidence: number } }) {
  const items = [
    { title: 'Overall Accuracy', value: `${stats.accuracy.toFixed(1)}%`, icon: Target },
    { title: 'Total Predictions', value: stats.total.toLocaleString(), icon: Brain },
    { title: 'Correct Picks', value: stats.correct.toLocaleString(), icon: CheckCircle },
    { title: 'Avg. Confidence', value: `${stats.avgConfidence.toFixed(1)}%`, icon: TrendingUp },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(item => (
        <Card key={item.title} className="bg-gray-50 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <item.icon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SportFilters({ selected, setSelected, supported }: { selected: SupportedSport | 'all'; setSelected: (sport: SupportedSport | 'all') => void; supported: SupportedSport[] }) {
  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      <Button onClick={() => setSelected('all')} variant={selected === 'all' ? 'default' : 'outline'}>All Sports</Button>
      {supported.map((sport: SupportedSport) => (
        <SportFilterButton key={sport} sport={sport} selected={selected} setSelected={setSelected} />
      ))}
    </div>
  )
}

function SportFilterButton({ sport, selected, setSelected }: { sport: SupportedSport; selected: SupportedSport | 'all'; setSelected: (sport: SupportedSport | 'all') => void }) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const sportConfig = await SportConfigManager.getSportConfig(sport);
      setConfig(sportConfig);
    };
    fetchConfig();
  }, [sport]);

  return (
    <Button onClick={() => setSelected(sport)} variant={selected === sport ? 'default' : 'outline'}>
      {config?.icon} {config?.name}
    </Button>
  );
}

function PredictionList({ predictions }: { predictions: Prediction[] }) {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-20">
        <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Predictions Available</h3>
        <p className="text-muted-foreground">There are no predictions matching your criteria.</p>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {predictions.map((p: Prediction) => <PredictionCard key={p.id} prediction={p} />)}
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const { game } = prediction
  const gameDate = game ? new Date(game.game_date) : new Date()
  const isPending = prediction.is_correct === null

  const StatusBadge = () => {
    if (isPending) return <Badge variant="secondary">Pending</Badge>
    return prediction.is_correct ? 
      <Badge className="bg-green-100 text-green-800">Correct</Badge> : 
      <Badge variant="destructive">Incorrect</Badge>
  }

  const PredictionValue = () => {
    const { prediction_type, predicted_value } = prediction
    let valueText = ''
    if (prediction_type === 'winner') valueText = `Win Chance: ${Math.round(predicted_value)}%`
    else if (prediction_type === 'spread') valueText = `Spread: ${predicted_value > 0 ? '+' : ''}${predicted_value.toFixed(1)}`
    else valueText = `Total: ${predicted_value.toFixed(1)}`
    return <p className="text-lg font-bold text-primary">{valueText}</p>
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{(game?.away_team as any)?.name || 'Away Team'} @ {(game?.home_team as any)?.name || 'Home Team'}</CardTitle>
            <p className="text-sm text-muted-foreground">{format(gameDate, 'EEE, MMM d, yyyy h:mm a')}</p>
          </div>
          <StatusBadge />
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6 items-center">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Prediction</p>
          <p className="text-lg font-semibold capitalize">{prediction.prediction_type.replace('_', ' ')}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Value</p>
          <PredictionValue />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Confidence</p>
            <p className="text-sm font-bold text-primary">{Math.round(prediction.confidence * 100)}%</p>
          </div>
          <Progress value={prediction.confidence * 100} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Model: <span className="font-semibold">{prediction.model_name}</span></p>
        <Button variant="outline" size="sm" onClick={() => window.location.href = `/games/${(game as any)?.id || 'unknown'}`}>
          Game Details <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}