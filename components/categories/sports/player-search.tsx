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
import { cachedUnifiedApiClient, SupportedSport, UnifiedPlayerData, UnifiedTeamData } from "@/lib/services/api/cached-unified-api-client"
import { cn } from "@/lib/utils"
import { TeamLogo, PlayerPhoto } from "@/components/ui/sports-image"

interface PlayerSearchProps {
  onPlayerSelect?: (player: BallDontLiePlayer | UnifiedPlayerData) => void
  selectedPlayer?: BallDontLiePlayer | UnifiedPlayerData | null
  sport?: string
  league?: string
}

export default function PlayerSearch({ onPlayerSelect, selectedPlayer, sport = "basketball", league }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [players, setPlayers] = useState<(BallDontLiePlayer | UnifiedPlayerData)[]>([])
  const [teams, setTeams] = useState<(BallDontLieTeam | UnifiedTeamData)[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [selectedPosition, setSelectedPosition] = useState<string>("all")
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dynamic positions based on sport
  const getPositionsForSport = (sport: string) => {
    switch (sport) {
      case "basketball":
        return ["PG", "SG", "SF", "PF", "C", "G", "F"]
      case "football":
        return ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P"]
      case "baseball":
        return ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"]
      case "hockey":
        return ["C", "LW", "RW", "D", "G"]
      case "soccer":
        return ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"]
      case "tennis":
        return ["Singles", "Doubles"]
      case "golf":
        return ["Professional", "Amateur"]
      default:
        return []
    }
  }

  const positions = getPositionsForSport(sport)

  // Fetch teams on component mount and when sport changes
  useEffect(() => {
    fetchTeams()
  }, [sport])

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
      let response
      if (sport === "basketball") {
        response = await ballDontLieClient.getTeams({ per_page: 30 })
      } else {
        // For other sports, use the unified API client
        const teams = await cachedUnifiedApiClient.getTeams(sport as SupportedSport, { limit: 30 })
        response = { data: teams }
      }
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
      let filteredPlayers: (BallDontLiePlayer | UnifiedPlayerData)[]

      if (sport === "basketball") {
        const response = await ballDontLieClient.getPlayers({
          search: searchQuery,
          per_page: 20
        })
        filteredPlayers = response.data
      } else {
        // For other sports, use the unified API client
        const players = await cachedUnifiedApiClient.getPlayers(sport as SupportedSport, {
          limit: 20
        })
        // Filter by search query on the client side for non-basketball sports
        filteredPlayers = players.filter(player => 
          player.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Filter by team
      if (selectedTeam !== "all") {
        filteredPlayers = filteredPlayers.filter(player => {
          if ('team' in player && player.team) {
            return player.team.abbreviation === selectedTeam || player.team.name === selectedTeam
          }
          return false
        })
      }

      // Filter by position
      if (selectedPosition !== "all") {
        filteredPlayers = filteredPlayers.filter(player => 
          'position' in player && player.position === selectedPosition
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

  const handlePlayerSelect = (player: BallDontLiePlayer | UnifiedPlayerData) => {
    onPlayerSelect?.(player)
    setIsOpen(false)
    if ('first_name' in player) {
      setSearchQuery(`${player.first_name} ${player.last_name}`)
    } else {
      setSearchQuery(player.name)
    }
  }

  const clearSelection = () => {
    setSearchQuery("")
    setPlayers([])
    onPlayerSelect?.(null)
  }

  const getPlayerInitials = (player: BallDontLiePlayer | UnifiedPlayerData) => {
    if ('first_name' in player) {
      return `${player.first_name[0]}${player.last_name[0]}`.toUpperCase()
    } else {
      return player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    }
  }

  const getPlayerName = (player: BallDontLiePlayer | UnifiedPlayerData) => {
    if ('first_name' in player) {
      return `${player.first_name} ${player.last_name}`
    } else {
      return player.name
    }
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
                        alt={getPlayerName(player)}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium">
                          {getPlayerName(player)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {'position' in player && player.position && (
                            <Badge variant="outline" className="text-xs">
                              {player.position}
                            </Badge>
                          )}
                            {'team' in player && player.team && (
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
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {'height_feet' in player && player.height_feet && player.height_inches && (
                        <div>{player.height_feet}'{player.height_inches}"</div>
                      )}
                      {'weight_pounds' in player && player.weight_pounds && (
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
