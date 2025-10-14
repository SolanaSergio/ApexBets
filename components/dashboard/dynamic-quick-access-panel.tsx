'use client'

import { useState, useEffect } from 'react'
import { Activity, BarChart3, Target, Users } from 'lucide-react'
import { databaseFirstApiClient } from '@/lib/api-client-database-first'
import { SportConfigManager } from '@/lib/services/core/sport-config'

interface QuickAccessStats {
  liveGames: number
  accuracyRate: number
  totalPredictions: number
  teamsTracked: number
}

export function DynamicQuickAccessPanel() {
  const [stats, setStats] = useState<QuickAccessStats>({
    liveGames: 0,
    accuracyRate: 0,
    totalPredictions: 0,
    teamsTracked: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Get supported sports to calculate across all sports
      const supportedSports = await SportConfigManager.getSupportedSports()

      let totalLiveGames = 0
      let totalTeams = 0
      let totalPredictions = 0

      // Aggregate data across all sports using database-first approach
      for (const sport of supportedSports) {
        try {
          const [games, teams] = await Promise.all([
            databaseFirstApiClient.getGames({ sport, status: 'live' }),
            databaseFirstApiClient.getTeams({ sport }),
          ])

          totalLiveGames += games.length
          totalTeams += teams.length
          totalPredictions += games.length * 2 // Rough estimate: 2 predictions per game
        } catch (error) {
          console.error(`Error loading data for ${sport}:`, error)
        }
      }

      // Calculate accuracy rate based on real prediction data
      let accuracyRate = 0
      try {
        const predictionsResponse = await databaseFirstApiClient.getPredictions({ limit: 100 })
        if (predictionsResponse && predictionsResponse.length > 0) {
          const correctPredictions = predictionsResponse.filter(p => p.accuracy === true).length
          accuracyRate = Math.round((correctPredictions / predictionsResponse.length) * 100)
        }
      } catch (error) {
        console.warn('Could not calculate accuracy rate from real data:', error)
        // Keep accuracy rate at 0 if no real data available
      }

      setStats({
        liveGames: totalLiveGames,
        accuracyRate: Math.round(accuracyRate),
        totalPredictions: totalPredictions,
        teamsTracked: totalTeams,
      })
    } catch (error) {
      console.error('Error loading quick access stats:', error)
      // Keep default values on error
    } finally {
      setLoading(false)
    }
  }

  const quickAccessItems = [
    {
      icon: Activity,
      title: 'Live Games',
      subtitle: 'Real-time tracking',
      value: loading ? '...' : stats.liveGames.toString(),
      status: 'Active Now',
      statusColor: 'text-green-600',
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      glowClass: 'premium-glow',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      subtitle: 'Deep insights',
      value: loading ? '...' : `${stats.accuracyRate}%`,
      status: 'Accuracy Rate',
      statusColor: 'text-emerald-600',
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-500/10 to-indigo-500/10',
      glowClass: 'glow-purple',
    },
    {
      icon: Target,
      title: 'Predictions',
      subtitle: 'AI-powered',
      value: loading ? '...' : stats.totalPredictions.toString(),
      status: 'Active Models',
      statusColor: 'text-green-600',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      glowClass: 'glow-green',
    },
    {
      icon: Users,
      title: 'Teams',
      subtitle: 'Live stats',
      value: loading ? '...' : stats.teamsTracked.toLocaleString(),
      status: 'Teams Tracked',
      statusColor: 'text-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      glowClass: 'glow-cyan',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {quickAccessItems.map((item, index) => {
        const IconComponent = item.icon
        return (
          <div
            key={index}
            className="glass-card p-4 sm:p-6 lg:p-8 rounded-lg card-hover group relative overflow-hidden cursor-pointer"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${item.glowClass}`}
                >
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-lg sm:text-xl text-slate-800 truncate">
                    {item.title}
                  </p>
                  <p className="text-slate-600 font-medium text-sm sm:text-base truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gradient mb-2 break-all">
                {item.value}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-sm animate-pulse flex-shrink-0"></div>
                <span className={`${item.statusColor} font-bold text-xs sm:text-sm truncate`}>
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
