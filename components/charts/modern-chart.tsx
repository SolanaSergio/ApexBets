'use client'

import { useState, useEffect } from 'react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface ChartDataPoint {
  label: string
  value: number
  trend?: 'up' | 'down' | 'neutral'
  color?: string
  timestamp?: string
  [key: string]: any // Add index signature for Recharts compatibility
}

interface ModernChartProps {
  title: string
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut'
  data: ChartDataPoint[]
  showTrends?: boolean
  realTime?: boolean
  height?: number
  gradient?: boolean
  animated?: boolean
}

export function ModernChart({
  title,
  type,
  data,
  showTrends = false,
  realTime = false,
  height = 300,
  gradient = true,
  animated = true,
}: ModernChartProps) {
  const [chartData, setChartData] = useState(data)
  const [isUpdating, setIsUpdating] = useState(false)

  // Simulate real-time updates
  useEffect(() => {
    if (realTime) {
      const interval = setInterval(() => {
        setIsUpdating(true)
        setChartData(prevData =>
          prevData.map(point => ({
            ...point,
            value: point.value + (Math.random() - 0.5) * 10,
            timestamp: new Date().toISOString(),
          }))
        )
        setTimeout(() => setIsUpdating(false), 500)
      }, 5000)
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when realTime is false
  }, [realTime])

  const colors = [
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
    '#10b981', // Green
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ]

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      height,
      className: animated ? 'animate-fade-in' : '',
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" {...commonProps}>
            <LineChart data={chartData}>
              <defs>
                {gradient && (
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={gradient ? 'url(#lineGradient)' : '#06b6d4'}
                strokeWidth={3}
                dot={{ fill: '#06b6d4', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#06b6d4', stroke: '#fff', strokeWidth: 2 }}
                animationDuration={animated ? 1000 : 0}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" {...commonProps}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={3}
                fill={gradient ? 'url(#areaGradient)' : '#06b6d4'}
                animationDuration={animated ? 1000 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" {...commonProps}>
            <BarChart data={chartData}>
              <defs>
                {gradient && (
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.4} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={12} fontWeight="bold" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              />
              <Bar
                dataKey="value"
                fill={gradient ? 'url(#barGradient)' : '#06b6d4'}
                radius={[4, 4, 0, 0]}
                animationDuration={animated ? 1000 : 0}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" {...commonProps}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={type === 'donut' ? 60 : 0}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
                animationDuration={animated ? 1000 : 0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  backdropFilter: 'blur(20px)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="glass-card rounded-lg card-hover relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-500" />

      {/* Update Indicator */}
      {isUpdating && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500 animate-pulse" />
      )}

      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center premium-glow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {title}
          </CardTitle>

          <div className="flex items-center gap-2">
            {realTime && (
              <Badge variant="destructive" className="rounded-md font-bold animate-pulse">
                <div className="w-2 h-2 bg-white rounded-sm mr-2 animate-pulse" />
                LIVE
              </Badge>
            )}
            {showTrends && chartData.length > 0 && chartData[0].trend && (
              <div className="flex items-center gap-1">{getTrendIcon(chartData[0].trend)}</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pb-8">
        {renderChart()}

        {/* Data Summary */}
        {type === 'pie' || type === 'donut' ? (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {chartData.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 glass rounded-lg">
                <div
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: item.color || colors[index % colors.length] }}
                />
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.label}</p>
                  <p className="text-lg font-black text-gradient">{item.value}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <div className="glass px-6 py-3 rounded-lg">
              <p className="text-sm font-bold text-slate-600 text-center">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </div>
  )
}
