'use client'

import { Card, CardContent } from '@/components/ui/card';
import { useDashboardStats } from '@/components/data/real-time-provider';
import { BarChart3, Target, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalyticsOverview() {
  const { stats, loading, error, isConnected } = useDashboardStats()

  if (loading) {
    return (
      <Card className="border-2 border-primary/10 bg-gray-50/50 text-center py-12">
        <CardContent>
          <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Loading Analytics...</h3>
          <p className="text-sm text-gray-500">Fetching real-time analytics from database</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorState />
  }

  return (
    <div className="space-y-6">
      <Header isConnected={isConnected} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Activity} title="Live Games" value={stats.liveGames} gradient="bg-gradient-to-br from-red-500 to-orange-400" />
        <StatCard icon={Target} title="Accuracy Rate" value={`${stats.accuracy}%`} gradient="bg-gradient-to-br from-green-500 to-teal-400" />
        <StatCard icon={BarChart3} title="Predictions" value={stats.dataPoints.toLocaleString()} gradient="bg-gradient-to-br from-blue-500 to-indigo-400" />
        <StatCard icon={TrendingUp} title="Success Trend" value={stats.accuracy > 75 ? 'Rising' : 'Stable'} gradient="bg-gradient-to-br from-indigo-500 to-purple-400" />
      </div>
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
      <div className="flex items-center gap-4">
        <Select defaultValue="last-7-days">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last-24-hours">Last 24 hours</SelectItem>
            <SelectItem value="last-7-days">Last 7 days</SelectItem>
            <SelectItem value="last-30-days">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-xs font-medium p-2 bg-gray-100 rounded-lg">
          <div className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-muted-foreground">{isConnected ? 'Real-time connection active' : 'Disconnected'}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, title, value, gradient }: { icon: any; title: string; value: string | number; gradient: string }) {
  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 text-white ${gradient}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">{title}</p>
          <Icon className="h-6 w-6" />
        </div>
        <p className={`text-3xl font-bold`}>{value}</p>
      </CardContent>
    </Card>
  )
}

