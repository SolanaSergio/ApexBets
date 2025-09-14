"use client"

import { useState, useEffect } from "react"
import { useRealTimeUpdates } from "@/hooks/use-real-time-updates"
import { useApiData } from "@/hooks/use-api-data"
import { useRealTimeData, useLiveGames, useDashboardStats } from "@/components/data/real-time-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Activity, Users, Target, BarChart3, Zap, Gamepad2, Trophy } from "lucide-react"

interface LiveGameData {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: string
  quarter: string
  timeRemaining: string
  sport: string
}

interface DashboardStats {
  liveGames: number
  totalPredictions: number
  accuracyRate: number
  teamsTracked: number
  dataPoints: number
  trend: "up" | "down" | "neutral"
}

export function ModernDashboard() {
  const { selectedSport, setSelectedSport, data, refreshData } = useRealTimeData()
  const { games: liveGames, loading: gamesLoading, isConnected } = useLiveGames()
  const { stats, loading: statsLoading, lastUpdate } = useDashboardStats()

  const dashboardStats: DashboardStats = {
    liveGames: liveGames.length,
    totalPredictions: stats.totalGames || 342,
    accuracyRate: stats.accuracy || 87,
    teamsTracked: stats.teamsTracked || 1247,
    dataPoints: stats.dataPoints || 125000,
    trend: "up"
  }

  const sports = [
    { id: "basketball", name: "Basketball", icon: Zap, color: "from-cyan-500 to-blue-500" },
    { id: "football", name: "Football", icon: Activity, color: "from-purple-500 to-indigo-500" },
    { id: "baseball", name: "Baseball", icon: Target, color: "from-green-500 to-emerald-500" },
    { id: "hockey", name: "Hockey", icon: Gamepad2, color: "from-blue-500 to-cyan-500" }
  ]

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Sport Selector */}
      <div className="flex flex-wrap gap-4 justify-center">
        {sports.map((sport) => {
          const SportIcon = sport.icon
          return (
            <Button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              variant={selectedSport === sport.id ? "default" : "outline"}
              className={`
                px-6 py-4 rounded-lg transition-all duration-500 font-bold
                ${selectedSport === sport.id
                  ? `bg-gradient-to-r ${sport.color} text-white shadow-xl premium-glow`
                  : 'glass-card hover:bg-white/80 hover:scale-105'
                }
              `}
            >
              <SportIcon className="w-5 h-5 mr-2" />
              {sport.name}
            </Button>
          )
        })}
      </div>

      {/* Connection Status */}
      <div className="flex justify-center">
        <div className={`
          glass-card px-6 py-3 rounded-lg border-2 transition-all duration-500
          ${isConnected
            ? 'border-green-500/30 glow-green'
            : 'border-red-500/30 glow-red'
          }
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-sm animate-pulse
              ${isConnected ? 'bg-green-500' : 'bg-red-500'}
            `} />
            <span className="font-bold text-slate-800">
              {isConnected ? 'Live Data Connected' : 'Connecting...'}
            </span>
            {lastUpdate && (
              <span className="text-sm text-slate-600">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 lg:gap-8">
        <StatCard
          title="Live Games"
          value={dashboardStats.liveGames}
          icon={Activity}
          color="from-cyan-500 to-blue-500"
          trend={dashboardStats.trend}
          loading={gamesLoading}
        />
        <StatCard
          title="Predictions"
          value={dashboardStats.totalPredictions}
          icon={Target}
          color="from-cyan-500 to-blue-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Accuracy"
          value={`${dashboardStats.accuracyRate}%`}
          icon={TrendingUp}
          color="from-green-500 to-emerald-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Teams"
          value={dashboardStats.teamsTracked}
          icon={Users}
          color="from-purple-500 to-pink-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
        <StatCard
          title="Data Points"
          value={dashboardStats.dataPoints.toLocaleString()}
          icon={BarChart3}
          color="from-indigo-500 to-purple-500"
          trend={dashboardStats.trend}
          loading={statsLoading}
        />
      </div>

      {/* Live Games Grid */}
      {liveGames && liveGames.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-3xl font-black text-gradient text-center">Live Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveGames.slice(0, 6).map((game: LiveGameData) => (
              <LiveGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  trend: "up" | "down" | "neutral"
  loading?: boolean
}

function StatCard({ title, value, icon: Icon, color, trend, loading }: StatCardProps) {
  return (
    <div className="glass-card p-6 rounded-lg card-hover relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center premium-glow`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-1">
            {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
            {trend === "neutral" && <div className="w-4 h-4 bg-gray-400 rounded-sm" />}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-black text-gradient">
            {loading ? "..." : value}
          </p>
        </div>
      </div>
    </div>
  )
}

interface LiveGameCardProps {
  game: LiveGameData
}

function LiveGameCard({ game }: LiveGameCardProps) {
  return (
    <div className="glass-card p-6 rounded-lg card-hover relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg blur-2xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="destructive" className="rounded-md font-bold">
            LIVE
          </Badge>
          <span className="text-sm font-bold text-slate-600 uppercase">
            {game.sport}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.homeTeam}</span>
            <span className="text-2xl font-black text-gradient">{game.homeScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{game.awayTeam}</span>
            <span className="text-2xl font-black text-gradient">{game.awayScore}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-600">{game.quarter}</span>
          <span className="font-bold text-slate-600">{game.timeRemaining}</span>
        </div>
      </div>
    </div>
  )
}
