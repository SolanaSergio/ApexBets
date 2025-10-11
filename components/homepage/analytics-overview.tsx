'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRealTimeData, useDashboardStats } from '@/components/data/real-time-provider'
import { BarChart3, Target, TrendingUp, Activity, AlertCircle } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

export function AnalyticsOverview() {
  const { selectedSport } = useRealTimeData()
  const { stats, loading, error, isConnected } = useDashboardStats()

  // Mock historical data for the chart
  const chartData = useMemo(() => {
    return [
      { name: 'Jan', accuracy: 68 },
      { name: 'Feb', accuracy: 72 },
      { name: 'Mar', accuracy: 75 },
      { name: 'Apr', accuracy: 71 },
      { name: 'May', accuracy: 78 },
      { name: 'Jun', accuracy: stats.accuracy || 78 }, // Current accuracy
    ]
  }, [stats.accuracy])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorState />
  }

  return (
    <div className="space-y-6">
      <Header isConnected={isConnected} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Activity} title="Live Games" value={stats.liveGames} color="text-red-600" />
        <StatCard icon={Target} title="Accuracy Rate" value={`${stats.accuracy}%`} color="text-green-600" />
        <StatCard icon={BarChart3} title="Predictions" value={stats.dataPoints.toLocaleString()} color="text-blue-600" />
        <StatCard icon={TrendingUp} title="Success Trend" value={stats.accuracy > 75 ? 'Rising' : 'Stable'} color="text-indigo-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <PerformanceChart data={chartData} />
        </div>
        <div className="lg:col-span-2">
          <QuickStats stats={stats} selectedSport={selectedSport} />
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-gray-100 animate-pulse h-32">
            <CardContent className="p-6"></CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-gray-100 animate-pulse h-64">
        <CardContent className="p-6"></CardContent>
      </Card>
    </div>
  )
}

function ErrorState() {
  return (
    <Card className="border-destructive/50 bg-destructive/5 text-center py-12">
      <CardContent>
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Analytics Engine Error</h3>
        <p className="text-muted-foreground">
          Could not load the analytics dashboard data.
        </p>
      </CardContent>
    </Card>
  )
}

function Header({ isConnected }: { isConnected: boolean }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        <p className="text-sm text-muted-foreground">
          A high-level view of the platform's performance.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium p-2 bg-gray-100 rounded-lg">
        <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-muted-foreground">{isConnected ? 'Real-time connection active' : 'Disconnected'}</span>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, color }: { icon: any; title: string; value: string | number; color: string }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function PerformanceChart({ data }: { data: any[] }) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
      <CardHeader>
        <CardTitle>Prediction Accuracy Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              }}
            />
            <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} fill="url(#colorAccuracy)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function QuickStats({ stats, selectedSport }: { stats: any; selectedSport: string }) {
  const { supportedSports } = useRealTimeData()

  const items = [
    { label: 'Games Tracked', value: stats.totalGames },
    { label: 'Sports Covered', value: selectedSport === 'all' ? supportedSports.length : 1 },
    { label: 'Teams Analyzed', value: stats.teamsTracked },
    { label: 'Correct Predictions', value: stats.correctPredictions },
  ]

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">{item.label}</p>
              <p className="font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}