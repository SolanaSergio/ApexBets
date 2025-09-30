"use client"

import * as React from "react"
import { PlayerCard } from "@/components/sports/player-card"
import { Filter } from "@/components/filters/filter"
import { useApiData } from "@/hooks/use-api-data"
import { databaseFirstApiClient, type Player } from "@/lib/api-client-database-first"

export default function PlayersPage() {
  const { data: players, loading, error } = useApiData<Player[]>(() => databaseFirstApiClient.getPlayers({ limit: 200 }))
  const [filteredPlayers, setFilteredPlayers] = React.useState<Player[]>(players || [])

  const handleFilterChange = (filters: any) => {
    let filtered = players || []

    if (filters.search) {
      filtered = filtered.filter((player: Player) =>
        player.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.team) {
      filtered = filtered.filter(
        (player: Player) => (player.teamName || '').toLowerCase() === filters.team.toLowerCase()
      )
    }

    setFilteredPlayers(filtered)
  }

  React.useEffect(() => {
    setFilteredPlayers(players || [])
  }, [players])

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
        {filteredPlayers && filteredPlayers.map((player: Player) => (
          <PlayerCard
            key={player.id}
            player={{
              ...player,
              team: player.teamName ?? ""
            }}
          />
        ))}
      </div>
    </div>
  )
}