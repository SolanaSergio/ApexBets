"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Bell } from "lucide-react"
import { simpleApiClient } from "@/lib/api-client-simple"

interface UserAlert {
  id: string
  type: "game_start" | "score_change" | "prediction_update" | "odds_change"
  team_id?: string
  threshold?: number
  enabled: boolean
  created_at: string
}

export function UserAlerts() {
  const [alerts, setAlerts] = useState<UserAlert[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [newAlert, setNewAlert] = useState({
    type: "game_start" as const,
    team_id: "",
    threshold: 0,
    enabled: true,
  })

  useEffect(() => {
    fetchAlerts()
    fetchTeams()
  }, [])

  async function fetchAlerts() {
    try {
      // Fetch real user alerts from API
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      } else {
        console.error('Failed to fetch alerts:', response.statusText)
        setAlerts([])
      }
    } catch (error) {
      console.error("Error fetching alerts:", error)
      setAlerts([])
    }
  }

  async function fetchTeams() {
    try {
      const teamsData = await apiClient.getTeams()
      setTeams(teamsData)
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const addAlert = async () => {
    try {
      // Create new alert via API
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAlert),
      })
      
      if (response.ok) {
        const data = await response.json()
        setAlerts((prev) => [...prev, data.alert])
        setNewAlert({
          type: "game_start",
          team_id: "",
          threshold: 0,
          enabled: true,
        })
      } else {
        console.error('Failed to create alert:', response.statusText)
      }
    } catch (error) {
      console.error("Error creating alert:", error)
    }
  }

  const toggleAlert = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      })
      
      if (response.ok) {
        setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, enabled } : alert)))
      } else {
        console.error('Failed to update alert:', response.statusText)
      }
    } catch (error) {
      console.error('Error updating alert:', error)
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id))
      } else {
        console.error('Failed to delete alert:', response.statusText)
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const getAlertDescription = (alert: UserAlert) => {
    const team = teams.find((t) => t.id === alert.team_id)
    const teamName = team?.name || "Any team"

    switch (alert.type) {
      case "game_start":
        return `Notify when ${teamName} games start`
      case "score_change":
        return `Notify on ${teamName} score changes`
      case "prediction_update":
        return `Notify on ${teamName} prediction updates`
      case "odds_change":
        return `Notify when ${teamName} odds change by ${alert.threshold}%`
      default:
        return "Custom alert"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Create New Alert</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alert-type">Alert Type</Label>
              <Select
                value={newAlert.type}
                onValueChange={(value: any) => setNewAlert((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game_start">Game Start</SelectItem>
                  <SelectItem value="score_change">Score Change</SelectItem>
                  <SelectItem value="prediction_update">Prediction Update</SelectItem>
                  <SelectItem value="odds_change">Odds Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="team">Team (Optional)</Label>
              <Select
                value={newAlert.team_id}
                onValueChange={(value) => setNewAlert((prev) => ({ ...prev, team_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_team">Any team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {newAlert.type === "game_start" && (
            <div>
              <Label htmlFor="threshold">Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert((prev) => ({ ...prev, threshold: Number(e.target.value) }))}
                placeholder="5"
              />
            </div>
          )}

          <Button onClick={addAlert} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts configured</p>
              <p className="text-sm">Create your first alert above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{getAlertDescription(alert)}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={alert.enabled ? "default" : "secondary"}>
                      {alert.enabled ? "Active" : "Disabled"}
                    </Badge>
                    <Switch checked={alert.enabled} onCheckedChange={(enabled) => toggleAlert(alert.id, enabled)} />
                    <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
