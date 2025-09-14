"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Clock, 
  BarChart3,
  RefreshCw
} from "lucide-react"
import { TeamLogo } from "@/components/ui/sports-image"
import { simpleApiClient, type Game, type Team } from "@/lib/api-client-simple"
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config"

interface DynamicSportsWidgetProps {
  sport: SupportedSport
  className?: string
}

export function DynamicSportsWidget({ sport, className }: DynamicSportsWidgetProps) {
  const [liveGames, setLiveGames] = useState<Game[]>([])
  const [topTeams, setTopTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("live")

  const sportConfig = SportConfigManager.getSportConfig(sport)

  useEffect(() => {
    loadSportsData()
  }, [sport])

  const loadSportsData = async () => {
    try {
      setLoading(true)
      
      // Load live games
      const games = await simpleApiClient.getGames({
        sport,
        status: "in_progress"
      })
      setLiveGames(games)

      // Load top teams
      const teams = await simpleApiClient.getTeams({
        sport
      })
      setTopTeams(teams)
    } catch (error) {
      console.error("Error loading sports data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DynamicSportsWidgetSkeleton />
  }

  return (
    <Card className={`glass-premium border-primary/20 shadow-xl ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
            <span className="text-lg">{sportConfig?.icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold premium-text-gradient">{sportConfig?.name}</h3>
            <p className="text-sm text-muted-foreground">Live updates & stats</p>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSportsData} className="ml-auto">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 glass border border-primary/20">
            <TabsTrigger value="live" className="gap-2 text-xs">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Live
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2 text-xs">
              <Users className="h-3 w-3" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2 text-xs">
              <BarChart3 className="h-3 w-3" />
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-3 mt-4">
            {liveGames.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No live games</p>
              </div>
            ) : (
              <div className="space-y-3">
                {liveGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="glass p-3 rounded-xl border border-red-200/50 data-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <TeamLogo 
                            teamName={game.away_team?.name || ''} 
                            alt={game.away_team?.abbreviation || 'Away'} 
                            width={20} 
                            height={20} 
                            className="mb-1" 
                          />
                          <div className="text-xs text-muted-foreground">{game.away_team?.abbreviation}</div>
                          <div className="text-sm font-bold stats-highlight">{game.away_score || 0}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">VS</div>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs text-red-600 font-medium">LIVE</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <TeamLogo 
                            teamName={game.home_team?.name || ''} 
                            alt={game.home_team?.abbreviation || 'Home'} 
                            width={20} 
                            height={20} 
                            className="mb-1" 
                          />
                          <div className="text-xs text-muted-foreground">{game.home_team?.abbreviation}</div>
                          <div className="text-sm font-bold stats-highlight">{game.home_score || 0}</div>
                        </div>
                      </div>
                      
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        LIVE
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              {topTeams.slice(0, 6).map((team, index) => (
                <div key={team.id} className="glass p-2 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                      <TeamLogo 
                        teamName={team.name} 
                        alt={team.abbreviation || team.name} 
                        width={16} 
                        height={16} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{team.abbreviation}</div>
                      <div className="text-xs text-muted-foreground truncate">{team.city}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-3 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Teams</span>
                <span className="text-sm font-bold stats-highlight">{topTeams.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Live Games</span>
                <span className="text-sm font-bold data-highlight">{liveGames.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Season Progress</span>
                <div className="flex items-center gap-2">
                  <Progress value={65} className="w-16 h-2" />
                  <span className="text-xs text-muted-foreground">65%</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function DynamicSportsWidgetSkeleton() {
  return (
    <Card className="glass-premium border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-lg animate-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
            <div className="h-3 w-32 bg-muted rounded animate-shimmer" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-shimmer" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-shimmer" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
