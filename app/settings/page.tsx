'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Bell, Shield, Palette, Database, Download, Trash2, Save, RefreshCw, History, BarChart3, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        <Header />
        <SettingsTabs />
      </div>
    </AppLayout>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Manage your account, preferences, and how you experience Project Apex.
      </p>
    </div>
  )
}

function SettingsTabs() {
  const tabItems = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'appearance', label: 'Appearance', icon: Palette },
    { value: 'privacy', label: 'Privacy', icon: Shield },
    { value: 'data', label: 'Data Management', icon: Database },
    { value: 'live-config', label: 'Live Config', icon: Database },
    { value: 'historical', label: 'Historical Data', icon: History },
    { value: 'predictions', label: 'Predictions', icon: BarChart3 },
  ]

  return (
    <Tabs defaultValue="profile" className="lg:grid lg:grid-cols-4 gap-8">
      <TabsList className="lg:col-span-1 flex lg:flex-col lg:h-auto overflow-x-auto p-2 bg-gray-100 rounded-lg">
        {tabItems.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="w-full justify-start text-base p-3 data-[state=active]:bg-white data-[state=active]:shadow-md">
            <Icon className="h-5 w-5 mr-3" /> {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="lg:col-span-3 mt-6 lg:mt-0">
        <TabsContent value="profile"><ProfileSection /></TabsContent>
        <TabsContent value="notifications"><NotificationsSection /></TabsContent>
        <TabsContent value="appearance"><AppearanceSection /></TabsContent>
        <TabsContent value="privacy"><PrivacySection /></TabsContent>
        <TabsContent value="data"><DataSection /></TabsContent>
        <TabsContent value="live-config"><LiveConfigSection /></TabsContent>
        <TabsContent value="historical"><HistoricalDataSection /></TabsContent>
        <TabsContent value="predictions"><PredictionsSection /></TabsContent>
      </div>
    </Tabs>
  )
}

function SettingsCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}

function ProfileSection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Personal Information"
        description="Update your display name, email, and timezone."
        footer={<Button><Save className="mr-2 h-4 w-4" />Save Changes</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" defaultValue="john.doe@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="est">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="est">Eastern Time (EST)</SelectItem>
                <SelectItem value="cst">Central Time (CST)</SelectItem>
                <SelectItem value="pst">Pacific Time (PST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Account Security"
        description="Manage your password and two-factor authentication."
      >
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Password</p>
                <Button variant="outline">Change Password</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Two-Factor Authentication</p>
                <Button variant="outline">Enable 2FA</Button>
            </div>
        </div>
      </SettingsCard>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Email Notifications" 
        description="Choose which emails you want to receive."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Game Summaries" description="Weekly reports on game outcomes and predictions." defaultChecked />
          <SwitchItem label="Platform Updates" description="News, updates, and feature announcements." defaultChecked />
          <SwitchItem label="Security Alerts" description="Important notifications about your account security." />
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Push Notifications" 
        description="Manage real-time alerts on your devices."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Live Game Events" description="Alerts for game start, end, and major plays." defaultChecked />
          <SwitchItem label="High-Confidence Predictions" description="Get notified about top-tier prediction opportunities." />
        </div>
      </SettingsCard>
    </div>
  )
}

function SwitchItem({ label, description, ...props }: { label: string; description: string; [key: string]: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="max-w-sm">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch {...props} />
    </div>
  )
}

function AppearanceSection() {
  return (
    <SettingsCard 
      title="Theme & Layout" 
      description="Customize the look and feel of the application."
      footer={undefined}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Color Scheme</Label>
          <Select defaultValue="light">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System Default</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SwitchItem label="Compact Mode" description="Reduce padding and margins for a denser view." />
        <SwitchItem label="Enable Animations" description="UI animations for a more dynamic experience." defaultChecked />
      </div>
    </SettingsCard>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <SettingsCard 
        title="Privacy Settings" 
        description="Control how your data is used."
        footer={undefined}
      >
        <div className="space-y-4">
          <SwitchItem label="Analytics Tracking" description="Allow us to collect anonymous usage data to improve our service." defaultChecked />
          <SwitchItem label="Personalized Content" description="Tailor content and recommendations based on your activity." />
        </div>
      </SettingsCard>
      <SettingsCard 
        title="Account Deletion"
        description="Permanently delete your account and all associated data. This action is irreversible."
        footer={undefined}
      >
        <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete My Account</Button>
      </SettingsCard>
    </div>
  )
}

function DataSection() {
  return (
    <SettingsCard 
      title="Data Export" 
      description="Download your data in various formats."
      footer={undefined}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select defaultValue="json">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full"><Download className="mr-2 h-4 w-4" /> Export All Data</Button>
      </div>
    </SettingsCard>
  )
}

function LiveConfigSection() {
  const [sports, setSports] = React.useState<Array<{ name: string; display_name: string; grace_window_minutes: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin')
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Failed to load')
        setSports(json.data || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const updateGrace = async (sport: string, minutes: number) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, grace_window_minutes: minutes }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
    } catch (e: any) {
      setError(e?.message || 'Update failed')
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>

  return (
    <SettingsCard
      title="Live Status Configuration"
      description="Per-sport kickoff grace window to treat 0-0 as live after start."
      footer={undefined}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">Manual Verify</div>
            <div className="text-xs text-muted-foreground">Trigger a fast refresh for a sport (5s cache).</div>
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={async value => {
              if (!value) return
              await fetch(`/api/live-updates?sport=${encodeURIComponent(value)}&verify=true`)
            }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Choose sport" /></SelectTrigger>
              <SelectContent>
                {sports.map(s => (
                  <SelectItem key={s.name} value={s.name}>{s.display_name || s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={async () => { await fetch('/api/live-updates/all?verify=true') }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Verify All
            </Button>
          </div>
        </div>
        {sports.map(s => (
          <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">{s.display_name || s.name}</div>
              <div className="text-xs text-muted-foreground">Grace window (minutes)</div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                defaultValue={s.grace_window_minutes}
                min={0}
                className="w-24"
                onBlur={e => {
                  const val = Number(e.currentTarget.value)
                  if (Number.isFinite(val)) updateGrace(s.name, val)
                }}
              />
              <Button
                variant="outline"
                onClick={() => updateGrace(s.name, s.grace_window_minutes)}
              >
                Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}

function HistoricalDataSection() {
  const [loading, setLoading] = useState(false)
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoricalData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/historical-games?days_back=30')
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to fetch historical data')
      setHistoricalData(json.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch historical data')
    } finally {
      setLoading(false)
    }
  }

  const cleanupStaleGames = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/cleanup-stale-games', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Cleanup failed')
      await fetchHistoricalData() // Refresh data
    } catch (e: any) {
      setError(e?.message || 'Cleanup failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistoricalData()
  }, [])

  return (
    <SettingsCard
      title="Historical Game Data"
      description="Manage completed games and historical data for predictions."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">Auto-Cleanup Stale Games</div>
            <div className="text-xs text-muted-foreground">Mark stale live games as completed and preserve for predictions.</div>
          </div>
          <Button 
            onClick={cleanupStaleGames} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Cleanup Now
          </Button>
        </div>

        {historicalData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Total Historical Games</div>
                <div className="text-2xl font-bold">{historicalData.total_games}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Date Range</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(historicalData.date_range.from).toLocaleDateString()} - {new Date(historicalData.date_range.to).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border">
              <div className="text-sm font-medium mb-2">Team Performance Stats</div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Object.entries(historicalData.team_performance).slice(0, 10).map(([team, stats]: [string, any]) => (
                  <div key={team} className="flex justify-between text-xs">
                    <span>{team}</span>
                    <span>{stats.wins}W-{stats.losses}L ({Math.round(stats.win_rate * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </SettingsCard>
  )
}

function PredictionsSection() {
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState('basketball')

  const generatePredictions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport: selectedSport })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to generate predictions')
      setPredictions(json.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate predictions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsCard
      title="Game Predictions"
      description="Generate predictions based on historical game data."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div>
            <div className="font-medium">Generate Predictions</div>
            <div className="text-xs text-muted-foreground">Create predictions for upcoming games using historical data.</div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="soccer">Soccer</SelectItem>
                <SelectItem value="baseball">Baseball</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={generatePredictions} 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </div>

        {predictions && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Predictions Generated</div>
                <div className="text-2xl font-bold">{predictions.predictions.length}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Training Data</div>
                <div className="text-2xl font-bold">{predictions.training_data_count}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Avg Confidence</div>
                <div className="text-2xl font-bold">{Math.round(predictions.prediction_confidence * 100)}%</div>
              </div>
            </div>

            <div className="space-y-2">
              {predictions.predictions.slice(0, 5).map((pred: any) => (
                <div key={pred.game_id} className="p-3 bg-white rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">
                      {pred.home_team} vs {pred.away_team}
                    </div>
                    <Badge variant="outline">
                      {Math.round(pred.prediction.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Predicted Score</div>
                      <div>{pred.prediction.predicted_home_score} - {pred.prediction.predicted_away_score}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Win Probability</div>
                      <div>{Math.round(pred.prediction.home_win_probability * 100)}% - {Math.round(pred.prediction.away_win_probability * 100)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </SettingsCard>
  )
}