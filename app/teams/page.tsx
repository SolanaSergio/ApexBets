'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TeamCard } from '@/components/sports/team-card'
import { Search, Filter, Users, BarChart, Shield } from 'lucide-react'
import { databaseFirstApiClient, type Team } from '@/lib/api-client-database-first'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'

export default function TeamsPage() {
  return (
    <RealTimeProvider>
      <AppLayout>
        <TeamsPageContent />
      </AppLayout>
    </RealTimeProvider>
  )
}

function TeamsPageContent() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [selectedConference, setSelectedConference] = useState<string>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [conferences, setConferences] = useState<string[]>([])

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true)
      const params: { league?: string; sport?: string } = {}
      if (selectedSport !== 'all') params.sport = selectedSport
      if (selectedConference !== 'all') params.league = selectedConference
      const fetchedTeams = await databaseFirstApiClient.getTeams(params)
      setTeams(fetchedTeams || [])
    } catch (error) {
      console.error('Error loading teams:', error)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, selectedConference])

  useEffect(() => {
    const loadSports = async () => {
      const sports = await SportConfigManager.getSupportedSports();
      setSupportedSports(sports);
    };
    loadSports();
  }, []);

  useEffect(() => {
    async function loadConferences() {
      if (selectedSport !== 'all') {
        const sportConferences = await SportConfigManager.getLeaguesForSport(selectedSport)
        setConferences(sportConferences)
      } else {
        setConferences([])
      }
      setSelectedConference('all')
    }
    loadConferences()
  }, [selectedSport])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const teamStats = useMemo(() => ({
    total: teams.length,
    sports: [...new Set(teams.map(t => t.sport))].length,
    conferences: [...new Set(teams.map(t => (t as any).conference))].length,
  }), [teams])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <Header />
      <StatCards stats={teamStats} />
      <Filters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedSport={selectedSport} setSelectedSport={setSelectedSport}
        supportedSports={supportedSports}
        selectedConference={selectedConference} setSelectedConference={setSelectedConference}
        conferences={conferences}
      />
      <TeamGrid teams={teams} loading={loading} />
    </div>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="text-center border-b pb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Team Explorer</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Analyze team performance, standings, and statistics across leagues.
      </p>
    </div>
  )
}

function StatCards({ stats }: { stats: { total: number; sports: number; conferences: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard icon={Users} label="Total Teams" value={stats.total.toLocaleString()} />
      <StatCard icon={BarChart} label="Sports Covered" value={stats.sports} />
      <StatCard icon={Shield} label="Conferences" value={stats.conferences} />
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

function Filters({ searchTerm, setSearchTerm, selectedSport, setSelectedSport, supportedSports, selectedConference, setSelectedConference, conferences }: { searchTerm: string; setSearchTerm: (term: string) => void; selectedSport: SupportedSport | 'all'; setSelectedSport: (sport: SupportedSport | 'all') => void; supportedSports: SupportedSport[]; selectedConference: string; setSelectedConference: (conf: string) => void; conferences: string[] }) {
  return (
    <Card className="bg-gray-50/70 border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Find Teams</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div className="lg:col-span-1">
          <label className="text-sm font-medium mb-1 block">Team Name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by team name..."
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
          <label className="text-sm font-medium mb-1 block">Conference</label>
          <Select value={selectedConference} onValueChange={setSelectedConference} disabled={selectedSport === 'all'}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select Conference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conferences</SelectItem>
              {conferences.map((conf: string) => <SelectItem key={conf} value={conf}>{conf}</SelectItem>)}
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

function TeamGrid({ teams, loading }: { teams: Team[]; loading: boolean }) {
  if (loading) {
    return <TeamGridSkeleton />
  }
  if (teams.length === 0) {
    return <EmptyState />
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {teams.map((team: Team) => (
        <TeamCard
          key={team.id}
          team={{
            ...team,
            logo: team.logo_url || '',
            wins: (team as any).wins,
            losses: (team as any).losses,
            conference: (team as any).conference,
            streak: (team as any).streak,
            streak_type: (team as any).streak_type,
          }}
        />
      ))}
    </div>
  )
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse h-72 bg-gray-100"><CardContent className="p-4"></CardContent></Card>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Teams Found</h3>
      <p className="text-muted-foreground">Try adjusting your search filters to find teams.</p>
    </div>
  )
}