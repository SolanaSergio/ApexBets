'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'

// Mock API fetching
const fetchTrendsData = async (sport: string) => {
  console.log(`Fetching trends for ${sport}...`)
  const random = (min: number, max: number) => Math.random() * (max - min) + min
  return {
    marketVolume: random(1000000, 5000000),
    activeBets: Math.floor(random(5000, 15000)),
    valueOpportunities: Math.floor(random(20, 100)),
    volumeChange: random(-10, 20),
    betsChange: random(-5, 15),
    valueChange: random(-25, 30),
    topTrends: ['Over 2.5 Goals in Soccer', 'Home Team to Win by >7 in NFL', 'Player X to score >25.5 points in NBA'].map(t => ({ trend: t, confidence: random(70, 95) })),
    sharpActions: ['Moneyline', 'Spread', 'Total'].map(betType => ({ game: 'Upcoming Game', betType, movement: random(-2.5, 2.5).toFixed(1) })),
    marketMovements: ['Line Drop', 'Steam Move', 'Reverse Line'].map(movement => ({ game: 'Key Matchup', movement, reason: 'Sharp money' }))
  }
}

export default function TrendsPage() {
  return (
    <RealTimeProvider>
      <AppLayout>
        <TrendsPageContent />
      </AppLayout>
    </RealTimeProvider>
  )
}

function TrendsPageContent() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const trends = await fetchTrendsData(selectedSport)
    setData(trends)
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

  if (loading || !data) {
    return <div className="p-8"><h1 className="text-2xl font-bold">Loading Market Trends...</h1></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <Header onRefresh={loadData} loading={loading} />
      <SportFilters selected={selectedSport} setSelected={setSelectedSport} supported={supportedSports} />
      <KeyMetrics metrics={data} />
      <TrendsTabs trends={data} />
    </div>
  )
}

// --- Sub-components ---

function Header({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Market Trends</h1>
        <p className="mt-2 text-lg text-muted-foreground">Analyze real-time betting market dynamics and opportunities.</p>
      </div>
      <Button variant="outline" onClick={onRefresh} disabled={loading}>
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh Trends
      </Button>
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

function KeyMetrics({ metrics }: { metrics: any }) {
  const formatCurrency = (val: number) => `$${(val / 1000000).toFixed(2)}M`
  const items = [
    { title: 'Market Volume', value: formatCurrency(metrics.marketVolume), change: metrics.volumeChange, icon: DollarSign },
    { title: 'Active Bets', value: metrics.activeBets.toLocaleString(), change: metrics.betsChange, icon: Activity },
    { title: 'Value Opportunities', value: metrics.valueOpportunities, change: metrics.valueChange, icon: Target },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <Card key={item.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{item.value}</p>
            <div className="flex items-center gap-1 text-sm mt-1">
              <span className={item.change >= 0 ? 'text-green-600' : 'text-red-600'}>{item.change.toFixed(1)}%</span>
              <span className="text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TrendsTabs({ trends }: { trends: any }) {
  return (
    <Tabs defaultValue="top_trends">
      <TabsList className="grid w-full grid-cols-3 h-14 shadow-inner bg-gray-100">
        <TabsTrigger value="top_trends"><TrendingUp className="mr-2 h-5 w-5"/>Top Trends</TabsTrigger>
        <TabsTrigger value="sharp_action"><Target className="mr-2 h-5 w-5"/>Sharp Action</TabsTrigger>
        <TabsTrigger value="market_movements"><Activity className="mr-2 h-5 w-5"/>Market Movements</TabsTrigger>
      </TabsList>
      <TabsContent value="top_trends" className="pt-6"><TopTrends trends={trends.topTrends} /></TabsContent>
      <TabsContent value="sharp_action" className="pt-6"><SharpAction actions={trends.sharpActions} /></TabsContent>
      <TabsContent value="market_movements" className="pt-6"><MarketMovements movements={trends.marketMovements} /></TabsContent>
    </Tabs>
  )
}

function TopTrends({ trends }: { trends: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Top Market Trends</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {trends.map((item: any, i: number) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{item.trend}</p>
              <p className="text-sm text-muted-foreground">High-confidence emerging trend</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-green-600">{item.confidence.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SharpAction({ actions }: { actions: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Sharp Action Tracker</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {actions.map((item: any, i: number) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{item.game}: <span className="text-primary">{item.betType}</span></p>
              <p className="text-sm text-muted-foreground">Significant professional money moving the line.</p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${parseFloat(item.movement) > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.movement} pts</p>
              <p className="text-xs text-muted-foreground">Line Movement</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function MarketMovements({ movements }: { movements: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Significant Market Movements</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {movements.map((item: any, i: number) => (
          <div key={i} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold text-gray-800">{item.game}: <span className="text-primary">{item.movement}</span></p>
              <p className="text-sm text-muted-foreground">Reason: {item.reason}</p>
            </div>
            <Button variant="outline" size="sm">Analyze Impact</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}