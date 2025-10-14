'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlayerCard } from '@/components/sports/player-card'
import { Search, Filter, User, Users, BarChart, Shield } from 'lucide-react'
import { databaseFirstApiClient, type Player } from '@/lib/api-client-database-first'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'

export default function PlayersPage() {
  return (
    <AuthGuard>
      <RealTimeProvider>
        <AppLayout>
          <PlayersPageContent />
        </AppLayout>
      </RealTimeProvider>
    </AuthGuard>
  )
}

function PlayersPageContent() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [teams, setTeams] = useState<string[]>([])

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true)
      const params: { sport?: string; team_id?: string; limit?: number; search?: string } = {}
      if (selectedSport !== 'all') params.sport = selectedSport
      if (selectedTeam !== 'all') params.team_id = selectedTeam
      if (searchTerm) params.search = searchTerm
      params.limit = 200
      const fetchedPlayers = await databaseFirstApiClient.getPlayers(params)
      setPlayers(fetchedPlayers || [])
    } catch (error) {
      console.error('Error loading players:', error)
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, selectedTeam, searchTerm])

  useEffect(() => {
    const loadSports = async () => {
      const sports = await SportConfigManager.getSupportedSports();
      setSupportedSports(sports);
    };
    loadSports();
  }, []);

  useEffect(() => {
    async function loadTeams() {
      if (selectedSport !== 'all') {
        const sportTeams = await SportConfigManager.getLeaguesForSport(selectedSport)
        setTeams(sportTeams)
      } else {
        setTeams([]) // Or load all teams across all sports if desired
      }
      setSelectedTeam('all')
    }
    loadTeams()
  }, [selectedSport])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const playerStats = useMemo(() => ({
    total: players.length,
    sports: [...new Set(players.map(p => p.sport))].length,
    teams: [...new Set(players.map(p => p.teamName))].length,
  }), [players])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <Header />
      <StatCards stats={playerStats} />
      <Filters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedSport={selectedSport} setSelectedSport={setSelectedSport}
        supportedSports={supportedSports}
        selectedTeam={selectedTeam} setSelectedTeam={setSelectedTeam}
        teams={teams}
      />
      <PlayerGrid players={players} loading={loading} />
    </div>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="text-center border-b pb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Player Explorer</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Browse and search for players across all supported sports and teams.
      </p>
    </div>
  )
}

function StatCards({ stats }: { stats: { total: number; sports: number; teams: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard icon={Users} label="Total Players" value={stats.total.toLocaleString()} />
      <StatCard icon={BarChart} label="Sports Covered" value={stats.sports} />
      <StatCard icon={Shield} label="Teams Represented" value={stats.teams} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Filters({ searchTerm, setSearchTerm, selectedSport, setSelectedSport, supportedSports, selectedTeam, setSelectedTeam, teams }: { searchTerm: string; setSearchTerm: (term: string) => void; selectedSport: SupportedSport | 'all'; setSelectedSport: (sport: SupportedSport | 'all') => void; supportedSports: SupportedSport[]; selectedTeam: string; setSelectedTeam: (team: string) => void; teams: string[] }) {
  return (
    <Card className="bg-gray-50/70 border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Find Players</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium mb-1 block">Player Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by player name..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Sport</label>
          <Select value={selectedSport} onValueChange={v => setSelectedSport(v as SupportedSport | 'all')}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {supportedSports.map((sport: SupportedSport) => (
                <SportSelectItem key={sport} sport={sport} />
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Team</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam} disabled={selectedSport === 'all'}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team: string) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

function SportSelectItem({ sport }: { sport: string }) {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const sportConfig = await SportConfigManager.getSportConfig(sport);
      setConfig(sportConfig);
    };
    fetchConfig();
  }, [sport]);

  return <SelectItem value={sport}>{config?.icon} {config?.name}</SelectItem>;
}

function PlayerGrid({ players, loading }: { players: Player[]; loading: boolean }) {
  if (loading) {
    return <PlayerGridSkeleton />
  }
  if (players.length === 0) {
    return <EmptyState />
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {players.map((player: Player) => (
        <PlayerCard
          key={player.id}
          player={{
            ...player,
            team: player.teamName || '',
            stats: (player as any).stats,
            recent_form: (player as any).stats?.points > 20 ? 'up' : 'stable',
          }}
          variant="default"
        />
      ))}
    </div>
  )
}

function PlayerGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse h-64 bg-gray-100"><CardContent className="p-4"></CardContent></Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Players Found</h3>
      <p className="text-muted-foreground">Try adjusting your search filters to find players.</p>
    </div>
  )
}