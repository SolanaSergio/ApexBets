'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { RealTimeProvider } from '@/components/data/real-time-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameCard } from '@/components/sports/game-card'
import { Calendar, Clock, Search, Trophy, RefreshCw } from 'lucide-react'
import { databaseFirstApiClient, type Game } from '@/lib/api-client-database-first'
import { format } from 'date-fns'
import { SportConfigManager, SupportedSport } from '@/lib/services/core/sport-config'
import { subscribeToTable, unsubscribeFromTable } from '@/lib/supabase/realtime'

export default function GamesPage() {
  return (
    // This outer provider is for any data needed by the layout itself.
    // The inner provider in GamesPageContent will be keyed to reset state on sport change.
    <RealTimeProvider>
      <AppLayout>
        <GamesPageContent />
      </AppLayout>
    </RealTimeProvider>
  )
}

function GamesPageContent() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSport, setSelectedSport] = useState<SupportedSport | 'all'>('all')
  const [supportedSports, setSupportedSports] = useState<SupportedSport[]>([])
  const [date, setDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true)
      const formattedDate = format(date, 'yyyy-MM-dd')
      const fetchedGames = await databaseFirstApiClient.getGames({
        ...(selectedSport !== 'all' && { sport: selectedSport }),
        dateFrom: formattedDate,
        dateTo: formattedDate,
        limit: 100,
      })
      setGames(fetchedGames)
    } catch (error) {
      console.error('Error fetching games:', error)
      setGames([])
    } finally {
      setLoading(false)
    }
  }, [selectedSport, date])

  useEffect(() => {
    const loadSports = async () => {
      const sports = await SportConfigManager.getSupportedSports();
      setSupportedSports(sports);
      if (sports.length > 0 && selectedSport === 'all') {
        // Default to the first sport if 'all' is not desired as default
        // setSelectedSport(sports[0]);
      }
    };
    loadSports();
  }, [selectedSport]);

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  useEffect(() => {
    const handleRealtimeUpdate = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload
      setGames(currentGames => {
        if (eventType === 'INSERT') return [...currentGames, newRecord]
        if (eventType === 'UPDATE') return currentGames.map(g => g.id === newRecord.id ? newRecord : g)
        if (eventType === 'DELETE') return currentGames.filter(g => g.id !== oldRecord.id)
        return currentGames
      })
    }
    subscribeToTable('games', handleRealtimeUpdate)
    return () => unsubscribeFromTable('games')
  }, [])

  const filteredGames = useMemo(() => {
    return games.filter(
      game =>
        game.home_team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.away_team?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [games, searchTerm])

  const liveGames = useMemo(() => filteredGames.filter(g => g.status === 'live'), [filteredGames])
  const upcomingGames = useMemo(() => filteredGames.filter(g => g.status === 'scheduled'), [filteredGames])
  const completedGames = useMemo(() => filteredGames.filter(g => g.status === 'completed'), [filteredGames])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <Header />
      <Filters 
        selectedSport={selectedSport}
        setSelectedSport={setSelectedSport}
        supportedSports={supportedSports}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        date={date}
        setDate={setDate}
        onRefresh={fetchGames}
        loading={loading}
      />
      <GameTabs 
        liveGames={liveGames}
        upcomingGames={upcomingGames}
        completedGames={completedGames}
        loading={loading}
      />
    </div>
  )
}

// --- Sub-components ---

function Header() {
  return (
    <div className="text-center border-b pb-6">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Games & Matches</h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
        Follow live scores, view upcoming schedules, and check past results.
      </p>
    </div>
  )
}

function Filters({ selectedSport, setSelectedSport, supportedSports, searchTerm, setSearchTerm, date, setDate, onRefresh, loading }: { selectedSport: string; setSelectedSport: (sport: string) => void; supportedSports: string[]; searchTerm: string; setSearchTerm: (term: string) => void; date: Date; setDate: (date: Date) => void; onRefresh: () => void; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by team..."
          className="pl-10 h-12 text-base"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Sport</label>
        <Select value={selectedSport} onValueChange={v => setSelectedSport(v as SupportedSport | 'all')}>
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select Sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {supportedSports.map(sport => (
              <SportSelectItem key={sport} sport={sport} />
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Date</label>
        <Input
          type="date"
          className="h-12 text-base"
          value={format(date, 'yyyy-MM-dd')}
          onChange={e => setDate(new Date(e.target.value))}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="h-12 w-full" onClick={() => setDate(new Date())}>Today</Button>
        <Button variant="outline" size="icon" className="h-12 w-12" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
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

function GameTabs({ liveGames, upcomingGames, completedGames, loading }: { liveGames: any[]; upcomingGames: any[]; completedGames: any[]; loading: boolean }) {
  return (
    <Tabs defaultValue="live">
      <TabsList className="grid w-full grid-cols-3 h-14 shadow-inner bg-gray-100">
        <TabTrigger value="live" count={liveGames.length} icon={Clock}>Live</TabTrigger>
        <TabTrigger value="upcoming" count={upcomingGames.length} icon={Calendar}>Upcoming</TabTrigger>
        <TabTrigger value="completed" count={completedGames.length} icon={Trophy}>Results</TabTrigger>
      </TabsList>
      <TabsContent value="live"><GameList games={liveGames} loading={loading} status="live" /></TabsContent>
      <TabsContent value="upcoming"><GameList games={upcomingGames} loading={loading} status="upcoming" /></TabsContent>
      <TabsContent value="completed"><GameList games={completedGames} loading={loading} status="completed" /></TabsContent>
    </Tabs>
  )
}

function TabTrigger({ value, count, icon: Icon, children }: { value: string; count: number; icon: any; children: React.ReactNode }) {
  return (
    <TabsTrigger value={value} className="text-base font-semibold gap-2 h-full data-[state=active]:bg-white data-[state=active]:shadow-md">
      <Icon className="h-5 w-5" />
      {children}
      {count > 0 && <Badge className="ml-2">{count}</Badge>}
    </TabsTrigger>
  )
}

function GameList({ games, loading, status }: { games: any[]; loading: boolean; status: string }) {
  if (loading) {
    return <GameListSkeleton />
  }
  if (games.length === 0) {
    return <EmptyState status={status} />
  }
  return (
    <div className="space-y-4 pt-6">
      {games.map(game => <GameCard key={game.id} game={game} variant="detailed" />)}
    </div>
  )
}

function GameListSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse h-36 bg-gray-100"><CardContent className="p-4"></CardContent></Card>
      ))}
    </div>
  )
}

function EmptyState({ status }: { status: string }) {
  const messages = {
    live: { icon: Clock, title: 'No Live Games', text: 'There are no games currently in progress for the selected criteria.' },
    upcoming: { icon: Calendar, title: 'No Upcoming Games', text: 'No games are scheduled for the selected date.' },
    completed: { icon: Trophy, title: 'No Completed Games', text: 'No results found for the selected date.' },
  }
  const { icon: Icon, title, text } = messages[status as keyof typeof messages]

  return (
    <div className="text-center py-20">
      <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-muted-foreground">{text}</p>
    </div>
  )
}