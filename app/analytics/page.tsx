'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Target, RefreshCw, Activity, Download } from 'lucide-react'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'

// Mock API fetching functions
const fetchAnalyticsData = async (sport: string) => {
  console.log(`Fetching analytics for ${sport}...`)
  // In a real app, you would fetch data from your API
  // Here we generate mock data for demonstration
  const random = (min: number, max: number) => Math.random() * (max - min) + min
  const accuracy = random(65, 85)
  return {
    overallAccuracy: accuracy,
    totalPredictions: Math.floor(random(500, 2000)),
    winStreak: Math.floor(random(3, 12)),
    avgConfidence: random(70, 90),
    monthlyTrend: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
      month,
      accuracy: random(60, 88),
    })),
    sportBreakdown: ['NBA', 'NFL', 'MLB'].map(s => ({
      sport: s,
      accuracy: random(60, 85),
      predictions: Math.floor(random(100, 500)),
    })),
    recentPerformance: Array.from({ length: 7 }).map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
      accuracy: random(50, 95),
    })).reverse(),
  }
}

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AnalyticsPageWrapper />
    </AuthGuard>
  )
}

async function AnalyticsPageWrapper() {
  const supportedSports = await SportConfigManager.getSupportedSports()

  return (
    <RealTimeProvider supportedSports={supportedSports}>
      <AppLayout>
        <AnalyticsPageContent />
      </AppLayout>
    </RealTimeProvider>
  )
}

function AnalyticsPageContent() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const analytics = await fetchAnalyticsData(selectedSport)
    setData(analytics)
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
    return <div className="p-8"><h1 className="text-2xl font-bold">Loading Analytics...</h1></div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <Header onRefresh={loadData} loading={loading} />
      <SportFilters selected={selectedSport} setSelected={setSelectedSport} supported={supportedSports} />
      <KeyMetrics metrics={data} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><MonthlyTrendChart data={data.monthlyTrend} /></div>
        <div><SportBreakdownChart data={data.sportBreakdown} /></div>
      </div>
      <RecentPerformanceTable data={data.recentPerformance} />
    </div>
  )
}

// --- Sub-components ---

function Header({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Advanced Analytics</h1>
        <p className="mt-2 text-lg text-muted-foreground">In-depth performance metrics and prediction trends.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
    </div>
  )
}

function SportFilters({ selected, setSelected, supported }: { 
  selected: SupportedSport | 'all'; 
  setSelected: (sport: SupportedSport | 'all') => void; 
  supported: SupportedSport[] 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setSelected('all')} variant={selected === 'all' ? 'default' : 'outline'}>All Sports</Button>
      {supported.map(sport => (
        <SportFilterButton key={sport} sport={sport} selected={selected} setSelected={setSelected} />
      ))}
    </div>
  )
}

function SportFilterButton({ sport, selected, setSelected }: { sport: SupportedSport; selected: SupportedSport | 'all'; setSelected: (sport: SupportedSport | 'all') => void; }) {
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
  const items = [
    { title: 'Overall Accuracy', value: `${metrics.overallAccuracy.toFixed(1)}%`, icon: Target, color: 'text-green-600' },
    { title: 'Total Predictions', value: metrics.totalPredictions.toLocaleString(), icon: BarChart3, color: 'text-blue-600' },
    { title: 'Current Win Streak', value: metrics.winStreak, icon: TrendingUp, color: 'text-indigo-600' },
    { title: 'Avg. Confidence', value: `${metrics.avgConfidence.toFixed(1)}%`, icon: Activity, color: 'text-yellow-600' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(item => (
        <Card key={item.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MonthlyTrendChart({ data }: { data: any }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader><CardTitle>Monthly Accuracy Trend</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} />
            <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTrend)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function SportBreakdownChart({ data }: { data: any[] }) {
  const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6'];
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader><CardTitle>Prediction Breakdown by Sport</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="predictions" nameKey="sport" cx="50%" cy="50%" outerRadius={100} label>
              {data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function RecentPerformanceTable({ data }: { data: any[] }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader><CardTitle>Recent Daily Performance</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((day: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">{day.date}</p>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">{day.predictions} preds</p>
                <div className="w-32">
                  <Progress value={day.accuracy} />
                </div>
                <p className="font-bold text-primary w-16 text-right">{day.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}