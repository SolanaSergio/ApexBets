'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealTimeData } from '@/components/data/real-time-provider'
import { useSportConfigs } from '@/hooks/use-sport-config'
import { SupportedSport } from '@/lib/services/core/sport-config'
import { Users, ChevronRight, Activity, ShieldCheck } from 'lucide-react'

interface SportData {
  sport: SupportedSport
  name: string
  icon: string
  liveGames: number
  totalGames: number
  teams: number
}

export function SportsGrid() {
  const { supportedSports, data } = useRealTimeData()
  const { configs: sportConfigs, loading } = useSportConfigs()

  const sportsData: SportData[] = useMemo(() => {
    if (loading) return []
    
    return supportedSports
      .map(sport => {
        const config = sportConfigs.find(c => c.name === sport)
        if (!config) return null

        const sportGames = data.games.filter(game => game.sport === sport)
        const liveGames = sportGames.filter(game => game.status === 'live')
        const sportTeams = new Set(sportGames.flatMap(g => [g.home_team_id, g.away_team_id])).size

        return {
          sport,
          name: config.name,
          icon: config.icon,
          liveGames: liveGames.length,
          totalGames: sportGames.length,
          teams: sportTeams,
        }
      })
      .filter(Boolean) as SportData[]
  }, [supportedSports, data.games, sportConfigs, loading])

  const totalLiveGames = sportsData.reduce((sum, sport) => sum + sport.liveGames, 0)

  return (
    <div className="space-y-6">
      <Header totalLiveGames={totalLiveGames} />

      {sportsData.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sportsData.map(sport => (
              <SportCard key={sport.sport} sport={sport} />
            ))}
          </div>
          <SummaryStats sportsData={sportsData} totalLiveGames={totalLiveGames} />
        </>
      )}
    </div>
  )
}

// --- Sub-components ---

function EmptyState() {
  return (
    <Card className="text-center py-12 bg-gray-50/70">
      <CardContent>
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Sports Configured</h3>
        <p className="text-muted-foreground">Please check the system configuration.</p>
      </CardContent>
    </Card>
  )
}

function Header({ totalLiveGames }: { totalLiveGames: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold">Sports Coverage</h2>
        <p className="text-sm text-muted-foreground">Explore analytics by sport.</p>
      </div>
      <Badge variant="outline" className="text-sm p-2">
        <Activity className="h-4 w-4 mr-2 text-red-500" />
        {totalLiveGames} Games Live Now
      </Badge>
    </div>
  )
}

function SportCard({ sport }: { sport: SportData }) {
  return (
    <Link href={`/games?sport=${sport.sport}`} passHref>
      <Card className="shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <CardHeader className="flex-row items-center gap-4">
          <div className="text-4xl">{sport.icon}</div>
          <div>
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
              {sport.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{sport.teams} teams</p>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Games Today</span>
            <span className="font-semibold">{sport.totalGames}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Live Now</span>
            <span className={`font-semibold ${sport.liveGames > 0 ? 'text-red-600' : 'text-foreground'}`}>
              {sport.liveGames}
            </span>
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t mt-auto">
          <div className="flex items-center justify-between w-full text-sm font-medium text-primary">
            <span>Explore</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

function SummaryStats({ sportsData, totalLiveGames }: { sportsData: any[]; totalLiveGames: number }) {
  const totalTeams = sportsData.reduce((sum: number, sport: any) => sum + sport.teams, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatItem icon={ShieldCheck} label="Sports Covered" value={sportsData.length} />
      <StatItem icon={Activity} label="Total Live Games" value={totalLiveGames} />
      <StatItem icon={Users} label="Total Teams" value={totalTeams.toLocaleString()} />
    </div>
  )
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="bg-gray-50">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}