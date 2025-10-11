'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, TrendingDown, Activity, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  label: string
  value: number
  color?: string
  trend?: 'up' | 'down' | 'neutral'
}

interface MobileChartProps {
  data: ChartDataPoint[]
  title?: string
  type?: 'bar' | 'line' | 'pie' | 'stats'
  className?: string
  showTrends?: boolean
  compact?: boolean
}

export function MobileChart({
  data,
  title,
  type = 'bar',
  className,
  showTrends = false,
  compact = false,
}: MobileChartProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('chart')

  const maxValue = Math.max(...data.map(d => d.value))
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  const getBarWidth = (value: number) => {
    return (value / maxValue) * 100
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      default:
        return <Activity className="h-3 w-3 text-muted-foreground" />
    }
  }

  const renderBarChart = () => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-2">{item.label}</span>
            <div className="flex items-center gap-2">
              {showTrends && getTrendIcon(item.trend)}
              <span className="font-medium stats-highlight">{item.value}</span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${getBarWidth(item.value)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )

  const renderPieChart = () => (
    <div className="space-y-2">
      {data.map((item, index) => {
        const percentage = ((item.value / totalValue) * 100).toFixed(1)
        return (
          <div key={index} className="flex items-center justify-between p-2 glass rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 60%)` }}
              />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{percentage}%</span>
              <span className="text-xs text-muted-foreground">({item.value})</span>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderStatsGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {data.map((item, index) => (
        <div key={index} className="glass p-3 rounded-xl border border-border/50 text-center">
          <div className="text-2xl font-bold stats-highlight mb-1">{item.value}</div>
          <div className="text-xs text-muted-foreground">{item.label}</div>
          {showTrends && <div className="flex justify-center mt-1">{getTrendIcon(item.trend)}</div>}
        </div>
      ))}
    </div>
  )

  const renderChart = () => {
    switch (type) {
      case 'pie':
        return renderPieChart()
      case 'stats':
        return renderStatsGrid()
      case 'bar':
      case 'line':
      default:
        return renderBarChart()
    }
  }

  if (compact) {
    return (
      <div className={cn('space-y-3', className)}>
        {title && <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>}
        {renderChart()}
      </div>
    )
  }

  return (
    <Card className={cn('glass-premium border-primary/20 shadow-xl', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          {title && <CardTitle className="text-lg premium-text-gradient">{title}</CardTitle>}
          <div className="flex items-center gap-2">
            {data.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {data.length} items
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Mobile Tabs */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 glass border border-primary/20 mb-4">
              <TabsTrigger value="chart" className="gap-2 text-xs">
                <BarChart3 className="h-3 w-3" />
                Chart
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2 text-xs">
                <Activity className="h-3 w-3" />
                Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart">{renderChart()}</TabsContent>

            <TabsContent value="data">
              <div className="space-y-2">
                {data.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 glass rounded-lg"
                  >
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {showTrends && getTrendIcon(item.trend)}
                      <span className="text-sm font-medium stats-highlight">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block">{renderChart()}</div>

        {data.length === 0 && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
