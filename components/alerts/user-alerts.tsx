'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Bell } from 'lucide-react'

interface UserAlert {
  id: string
  type: 'game_start' | 'score_change' | 'prediction_update' | 'odds_change'
  team_id?: string
  threshold?: number
  enabled: boolean
  created_at: string
}

// Mock API functions
const fetchAlerts = async (): Promise<UserAlert[]> => [
  { id: '1', type: 'game_start', team_id: '1', enabled: true, created_at: new Date().toISOString() },
  { id: '2', type: 'odds_change', team_id: '2', threshold: 5, enabled: true, created_at: new Date().toISOString() },
  { id: '3', type: 'prediction_update', enabled: false, created_at: new Date().toISOString() },
]
const fetchTeams = async () => [
  { id: '1', name: 'Golden State Warriors' },
  { id: '2', name: 'Los Angeles Lakers' },
]

export function UserAlerts() {
  const [alerts, setAlerts] = useState<UserAlert[]>([])
  const [teams, setTeams] = useState<any[]>([])
  
  useEffect(() => {
    const loadData = async () => {
      const [alertsData, teamsData] = await Promise.all([fetchAlerts(), fetchTeams()])
      setAlerts(alertsData)
      setTeams(teamsData)
    }
    loadData()
  }, [])

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const toggleAlert = (id: string, enabled: boolean) => {
    setAlerts(prev => prev.map(alert => (alert.id === id ? { ...alert, enabled } : alert)))
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <CreateAlertForm teams={teams} setAlerts={setAlerts} />
      </div>
      <div className="lg:col-span-2">
        <AlertList alerts={alerts} teams={teams} onToggle={toggleAlert} onDelete={deleteAlert} />
      </div>
    </div>
  )
}

function CreateAlertForm({ teams, setAlerts }: { teams: any[]; setAlerts: (alerts: UserAlert[] | ((prev: UserAlert[]) => UserAlert[])) => void }) {
  const [type, setType] = useState('game_start')
  const [teamId, setTeamId] = useState('')
  const [threshold, setThreshold] = useState(5)

  const addAlert = () => {
    const newAlert: UserAlert = {
      id: new Date().getTime().toString(),
      type: type as UserAlert['type'],
      ...(teamId && { team_id: teamId }),
      ...(type === 'odds_change' && { threshold }),
      enabled: true,
      created_at: new Date().toISOString(),
    }
    setAlerts((prev: UserAlert[]) => [newAlert, ...prev])
  }

  return (
    <Card className="shadow-lg border-primary/20 sticky top-6">
      <CardHeader>
        <CardTitle>Create New Alert</CardTitle>
        <CardDescription>Get notified about what matters to you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="alert-type">Alert Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="game_start">Game Start</SelectItem>
              <SelectItem value="score_change">Score Change</SelectItem>
              <SelectItem value="prediction_update">New Prediction</SelectItem>
              <SelectItem value="odds_change">Odds Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="team">Team (Optional)</Label>
          <Select value={teamId} onValueChange={setTeamId}>
            <SelectTrigger><SelectValue placeholder="Any Team" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Team</SelectItem>
              {teams.map((team: any) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {type === 'odds_change' && (
          <div className="space-y-2">
            <Label htmlFor="threshold">Odds Change Threshold (%)</Label>
            <Input id="threshold" type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={addAlert} className="w-full"><Plus className="mr-2 h-4 w-4" /> Create Alert</Button>
      </CardFooter>
    </Card>
  )
}

function AlertList({ alerts, teams, onToggle, onDelete }: { alerts: UserAlert[]; teams: any[]; onToggle: (id: string, enabled: boolean) => void; onDelete: (id: string) => void }) {
  const getAlertDescription = (alert: UserAlert) => {
    const teamName = teams.find((t: any) => t.id === alert.team_id)?.name || 'Any Team'
    switch (alert.type) {
      case 'game_start': return `Game Start for ${teamName}`
      case 'score_change': return `Score Change in ${teamName} games`
      case 'prediction_update': return `New Prediction for ${teamName}`
      case 'odds_change': return `Odds for ${teamName} change by > ${alert.threshold}%`
      default: return 'Custom Alert'
    }
  }

  if (alerts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center text-center py-20">
        <Bell className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-800">No Alerts Configured</h3>
        <p className="text-muted-foreground">Use the form to create your first alert.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Active Alerts</CardTitle>
        <CardDescription>Manage your personalized notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert: UserAlert) => (
          <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border">
            <div>
              <p className="font-semibold">{getAlertDescription(alert)}</p>
              <p className="text-sm text-muted-foreground">Created: {new Date(alert.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={alert.enabled} onCheckedChange={enabled => onToggle(alert.id, enabled)} />
              <Button variant="ghost" size="icon" onClick={() => onDelete(alert.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}