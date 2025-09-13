"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Play, Pause, Activity, Clock, AlertCircle } from 'lucide-react'

interface SyncStatus {
  isRunning: boolean
  stats: {
    lastSync: string
    totalSynced: number
    errors: number
    successRate: number
    nextSync: string
  }
  config: {
    enabled: boolean
    interval: number
    batchSize: number
  }
}

export function SyncMonitor() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/sync?action=status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startSync = async () => {
    try {
      await fetch('/api/sync?action=start', { method: 'GET' })
      fetchStatus()
    } catch (error) {
      console.error('Failed to start sync:', error)
    }
  }

  const stopSync = async () => {
    try {
      await fetch('/api/sync?action=stop', { method: 'GET' })
      fetchStatus()
    } catch (error) {
      console.error('Failed to stop sync:', error)
    }
  }

  const triggerSync = async () => {
    try {
      await fetch('/api/sync?action=sync', { method: 'GET' })
      fetchStatus()
    } catch (error) {
      console.error('Failed to trigger sync:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Data Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load sync status</p>
        </CardContent>
      </Card>
    )
  }

  const lastSync = new Date(status.stats.lastSync)
  const nextSync = new Date(status.stats.nextSync)
  const isStale = Date.now() - lastSync.getTime() > 10 * 60 * 1000 // 10 minutes

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Data Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={status.isRunning ? "default" : "secondary"}>
            {status.isRunning ? "Running" : "Stopped"}
          </Badge>
          {isStale && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Stale Data
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Last Sync</p>
            <p className="font-medium">
              {lastSync.toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Synced</p>
            <p className="font-medium">{status.stats.totalSynced}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-medium">{status.stats.successRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Errors</p>
            <p className="font-medium text-red-600">{status.stats.errors}</p>
          </div>
        </div>

        {/* Next Sync */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Next sync:</span>
          <span className="font-medium">
            {nextSync.toLocaleTimeString()}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {status.isRunning ? (
            <Button variant="outline" size="sm" onClick={stopSync}>
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startSync}>
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={triggerSync}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>

        {/* Config Info */}
        <div className="text-xs text-muted-foreground">
          <p>Interval: {Math.round(status.config.interval / 1000 / 60)} minutes</p>
          <p>Batch Size: {status.config.batchSize}</p>
        </div>
      </CardContent>
    </Card>
  )
}
