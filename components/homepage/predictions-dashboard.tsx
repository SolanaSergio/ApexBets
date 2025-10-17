'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { usePredictions, useRealTimeData } from '@/components/data/real-time-provider'
import { SportConfigManager } from '@/lib/services/core/sport-config'
import { Target, TrendingUp, Eye, Calendar, BarChart3, ArrowRight, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export function PredictionsDashboard() {
  const { selectedSport } = useRealTimeData()
  const { predictions, loading, error } = usePredictions()

  const filteredPredictions = useMemo(() => {
    if (selectedSport === 'all') return predictions
    return predictions.filter(pred => pred.sport === selectedSport)
  }, [predictions, selectedSport])

  const topPredictions = useMemo(() => {
    return filteredPredictions.sort((a, b) => b.confidence - a.confidence).slice(0, 4)
  }, [filteredPredictions])

  const overallAccuracy = useMemo(() => {
    const completed = filteredPredictions.filter(p => (p as any).status === 'completed')
    if (completed.length === 0) return 0
    const correct = completed.filter(p => p.is_correct === true).length
    return Math.round((correct / completed.length) * 100)
  }, [filteredPredictions])

  if (loading) {
    return (
      <Card className="border-2 border-primary/10 bg-gray-50/50 text-center py-12">
        <CardContent>
          <Target className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading AI Predictions...</h3>
          <p className="text-sm text-gray-500">Fetching real-time predictions from database</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorState />
  }

  return (
    <div className="space-y-6">
      <Header overallAccuracy={overallAccuracy} />

      {topPredictions.length === 0 ? (
        <EmptyState selectedSport={selectedSport} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPredictions.map(prediction => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
          <StatsSummary 
            totalPredictions={filteredPredictions.length} 
            highConfidenceCount={filteredPredictions.filter(p => p.confidence >= 80).length}
            accuracy={overallAccuracy}
          />
        </>
      )}
    </div>
  )
}

// --- Sub-components ---

function ErrorState() {
  return (
    <Card className="border-destructive/50 bg-destructive/5 text-center py-12">
      <CardContent>
        <Target className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Prediction Engine Error</h3>
        <p className="text-muted-foreground mb-6">
          There was an issue connecting to the AI prediction service.
        </p>
        <Button variant="destructive" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState({ selectedSport }: { selectedSport: string }) {
  return (
    <Card className="text-center py-12 bg-gray-50/70">
      <CardContent>
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Predictions Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {selectedSport === 'all'
            ? 'AI predictions for upcoming games will appear here once available.'
            : `AI predictions for ${selectedSport} will appear here once available.`}
        </p>
        <Button onClick={() => (window.location.href = '/predictions')}>
          Explore All Predictions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

import { AccuracyChart } from './accuracy-chart';

function Header({ overallAccuracy }: { overallAccuracy: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Target className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">AI Predictions</h2>
          {/* Updated {format(lastUpdate, 'h:mm a')} */}
        </div>
      </div>
      <div className="flex items-center gap-4 p-3 bg-gray-100 rounded-lg">
        <AccuracyChart accuracy={overallAccuracy} />
        <div className="text-right">
          <div className="text-sm font-medium text-muted-foreground">Overall Accuracy</div>
          <div className="text-2xl font-bold text-primary">{overallAccuracy}%</div>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/predictions'}>
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';




function PredictionCard({ prediction }: { prediction: any }) {
  const gameDate = new Date(prediction.game?.game_date || prediction.created_at)
  const [sportConfig, setSportConfig] = useState<any>(null)

  useEffect(() => {
    const loadSportConfig = async () => {
      try {
        const config = await SportConfigManager.getSportConfig(prediction.game?.sport as any)
        setSportConfig(config)
      } catch (error) {
        console.error('Failed to load sport config:', error)
        setSportConfig(null)
      }
    }
    loadSportConfig()
  }, [prediction.game?.sport])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-blue-600'
    return 'text-gray-500'
  }

  const getPredictionColor = (predictionType: string) => {
    switch (predictionType) {
      case 'moneyline':
        return 'border-blue-500';
      case 'spread':
        return 'border-green-500';
      case 'totals':
        return 'border-yellow-500';
      default:
        return 'border-gray-200';
    }
  }

  return (
    <Collapsible>
      <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 group border-l-4 ${getPredictionColor(prediction.prediction_type)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold">
                {prediction.game?.away_team?.abbreviation} vs {prediction.game?.home_team?.abbreviation}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {format(gameDate, 'MMM d, h:mm a')}
              </p>
            </div>
            {sportConfig && (
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">
                {sportConfig.icon} {sportConfig.name}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Prediction: <span className="font-bold text-foreground capitalize">{prediction.prediction_type.replace('_', ' ')}</span></p>
            {prediction.predicted_value && (
              <p className="text-2xl font-bold text-primary">
                {prediction.predicted_value}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-muted-foreground">Confidence</span>
              <span className={`font-bold ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence}%
              </span>
            </div>
            <Progress value={prediction.confidence} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 pt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>
          </CollapsibleTrigger>
          <Button variant="ghost" size="sm">
            <TrendingUp className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      <CollapsibleContent>
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-muted-foreground italic border-l-2 pl-3">
            &ldquo;{prediction.reasoning}&rdquo;
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function StatsSummary({ totalPredictions, highConfidenceCount, accuracy }: { totalPredictions: number; highConfidenceCount: number; accuracy: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatItem icon={BarChart3} label="Total Predictions" value={totalPredictions} />
      <StatItem icon={Target} label="High Confidence" value={highConfidenceCount} />
      <StatItem icon={TrendingUp} label="Success Rate" value={`${accuracy}%`} />
    </div>
  )
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}