"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from "lucide-react"

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  environment: {
    configured: boolean
    missingKeys: string[]
    invalidKeys: string[]
    recommendations: string[]
  }
  services: Record<string, any>
  cache: any
  rateLimits: any
  apiTests: Record<string, any>
}

export default function SetupPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealthStatus()
  }, [])

  const fetchHealthStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/health?detailed=true')
      const data = await response.json()
      setHealthStatus(data)
    } catch (err) {
      setError('Failed to fetch health status')
      console.error('Error fetching health status:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading system status...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !healthStatus) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Failed to load system status. Please check your configuration.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">ApexBets Setup & Status</h1>
        <p className="text-gray-600">
          Monitor your API configuration, rate limits, and system health
        </p>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthStatus.status)}
            System Status
            <Badge className={getStatusColor(healthStatus.status)}>
              {healthStatus.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Overall system health and configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {healthStatus.environment.configured ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">Environment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(healthStatus.services).length}
              </div>
              <div className="text-sm text-gray-600">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {Math.round(healthStatus.cache.hitRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            API keys and environment variables status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!healthStatus.environment.configured ? (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Environment is not fully configured. Please set up the missing variables.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Environment is properly configured!
              </AlertDescription>
            </Alert>
          )}

          {healthStatus.environment.missingKeys.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-600 mb-2">Missing Required Variables:</h4>
              <ul className="list-disc list-inside space-y-1">
                {healthStatus.environment.missingKeys.map((key) => (
                  <li key={key} className="text-sm text-red-600">{key}</li>
                ))}
              </ul>
            </div>
          )}

          {healthStatus.environment.invalidKeys.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-yellow-600 mb-2">Invalid Variables:</h4>
              <ul className="list-disc list-inside space-y-1">
                {healthStatus.environment.invalidKeys.map((key) => (
                  <li key={key} className="text-sm text-yellow-600">{key}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Recommendations:</h4>
            <ul className="list-disc list-inside space-y-1">
              {healthStatus.environment.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600">{rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Services Status */}
      <Card>
        <CardHeader>
          <CardTitle>API Services Status</CardTitle>
          <CardDescription>
            Real-time status of all integrated APIs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(healthStatus.services).map(([service, status]) => (
              <div key={service} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">{service}</h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <Badge className={getStatusColor(status.status)}>
                      {status.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Requests Today: {status.usage?.requestsToday || 0}</div>
                  <div>Requests This Hour: {status.usage?.requestsThisHour || 0}</div>
                  <div>Average Response Time: {Math.round(status.usage?.averageResponseTime || 0)}ms</div>
                  <div>Error Rate: {Math.round((status.usage?.errorRate || 0) * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Tests */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Tests</CardTitle>
          <CardDescription>
            Real-time testing of API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(healthStatus.apiTests).map(([endpoint, test]) => (
              <div key={endpoint} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">{endpoint}</h4>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                </div>
                {test.responseTime && (
                  <div className="text-sm text-gray-600">
                    Response Time: {test.responseTime}ms
                  </div>
                )}
                {test.fromCache && (
                  <div className="text-sm text-blue-600">
                    Served from cache
                  </div>
                )}
                {test.error && (
                  <div className="text-sm text-red-600">
                    Error: {test.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
          <CardDescription>
            Performance and usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {healthStatus.cache.totalEntries}
              </div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(healthStatus.cache.hitRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {healthStatus.cache.sizeInfo?.sizeFormatted || '0 B'}
              </div>
              <div className="text-sm text-gray-600">Cache Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {healthStatus.cache.evictionCount}
              </div>
              <div className="text-sm text-gray-600">Evictions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage your system configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={fetchHealthStatus} variant="outline">
              Refresh Status
            </Button>
            <Button 
              onClick={() => window.open('/api/health?detailed=true', '_blank')}
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Raw Data
            </Button>
            <Button 
              onClick={() => {
                fetch('/api/health/clear-cache', { method: 'POST' })
                  .then(() => fetchHealthStatus())
              }}
              variant="outline"
            >
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}