"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X, User, Users, TrendingUp } from "lucide-react"
import { ballDontLieClient, type BallDontLiePlayer, type BallDontLieTeam } from "@/lib/sports-apis"
import { cn } from "@/lib/utils"
import { TeamLogo, PlayerPhoto } from "@/components/ui/sports-image"

interface PlayerSearchProps {
  onPlayerSelect?: (player: BallDontLiePlayer) => void
  selectedPlayer?: BallDontLiePlayer | null
}

export default function PlayerSearch({ onPlayerSelect, selectedPlayer }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [players, setPlayers] = useState<BallDontLiePlayer[]>([])
  const [teams, setTeams] = useState<BallDontLieTeam[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const positions = ["PG", "SG", "SF", "PF", "C", "G", "F"]

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams()
  }, [])

  // Search players when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPlayers()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setPlayers([])
    }
  }, [searchQuery, selectedTeam, selectedPosition])

  const fetchTeams = async () => {
    try {
      const response = await ballDontLieClient.getTeams({ per_page: 30 })
      setTeams(response.data)
    } catch (error) {
      console.error("Error fetching teams:", error)
      setError("Failed to load teams")
    }
  }

  const searchPlayers = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await ballDontLieClient.getPlayers({
        search: searchQuery,
        per_page: 20
      })

      let filteredPlayers = response.data

      // Filter by team
      if (selectedTeam !== "all") {
        filteredPlayers = filteredPlayers.filter(player => 
          player.team.abbreviation === selectedTeam
        )
      }

      // Filter by position
      if (selectedPosition !== "all") {
        filteredPlayers = filteredPlayers.filter(player => 
          player.position === selectedPosition
        )
      }

      setPlayers(filteredPlayers)
    } catch (error) {
      console.error("Error searching players:", error)
      setError("Failed to search players")
    } finally {
      setLoading(false)
    }
  }

  const handlePlayerSelect = (player: BallDontLiePlayer) => {
    onPlayerSelect?.(player)
    setIsOpen(false)
    setSearchQuery(`${player.first_name} ${player.last_name}`)
  }

  const clearSelection = () => {
    setSearchQuery("")
    setPlayers([])
    onPlayerSelect?.(null)
  }

  const getPlayerInitials = (player: BallDontLiePlayer) => {
    return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase()
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Player Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.abbreviation}>
                  {team.abbreviation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position} value={position}>
                  {position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching players...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4 text-destructive">
                <p className="text-sm">{error}</p>
              </div>
            ) : players.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handlePlayerSelect(player)}
                  >
                    <div className="flex items-center space-x-3">
                      <PlayerPhoto 
                        playerId={player.id}
                        alt={`${player.first_name} ${player.last_name}`}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">
                          {player.first_name} {player.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {player.position}
                          </Badge>
                            <span className="flex items-center gap-1">
                              <TeamLogo 
                                teamName={player.team.name} 
                                alt={player.team.name}
                                width={16}
                                height={16}
                                className="h-4 w-4"
                              />
                              {player.team.name}
                            </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {player.height_feet && player.height_inches && (
                        <div>{player.height_feet}'{player.height_inches}"</div>
                      )}
                      {player.weight_pounds && (
                        <div>{player.weight_pounds} lbs</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No players found</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Player Display */}
        {selectedPlayer && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PlayerPhoto 
                  playerId={selectedPlayer.id}
                  alt={`${selectedPlayer.first_name} ${selectedPlayer.last_name}`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-lg">
                    {selectedPlayer.first_name} {selectedPlayer.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedPlayer.position}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <TeamLogo 
                        teamName={selectedPlayer.team.name} 
                        alt={selectedPlayer.team.name}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                      {selectedPlayer.team.name}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
