"use client"

import * as React from "react"
import { TeamCard } from "@/components/sports/team-card"
import { Filter } from "@/components/filters/filter"
import { useApiData } from "@/hooks/use-api-data"
import { databaseFirstApiClient, type Team } from "@/lib/api-client-database-first"

export default function TeamsPage() {
  const { data: teams, loading, error } = useApiData<Team[]>(() => databaseFirstApiClient.getTeams())
  const [filteredTeams, setFilteredTeams] = React.useState<Team[]>(teams || [])

  const handleFilterChange = (filters: any) => {
    let filtered = teams || []

    if (filters.search) {
      filtered = filtered.filter((team: Team) =>
        team.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.conference) {
      filtered = filtered.filter(
        (team: Team) => (team as any).conference && (team as any).conference.toLowerCase() === filters.conference.toLowerCase()
      )
    }

    setFilteredTeams(filtered)
  }

  React.useEffect(() => {
    setFilteredTeams(teams || [])
  }, [teams])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="space-y-8">
      <Filter onFilterChange={handleFilterChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTeams && filteredTeams.map((team: Team) => (
          <TeamCard key={team.id} team={{ ...team, logo: team.logo_url ?? "" }} />
        ))}
      </div>
    </div>
  )
}