import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, User, Users, TrendingUp } from "lucide-react";
import { simpleApiClient, type Player, type Team } from "@/lib/api-client-simple";
import { SportConfigManager, SupportedSport } from "@/lib/services/core/sport-config";
import { cn } from "@/lib/utils";
import { TeamLogo, PlayerPhoto } from "@/components/ui/sports-image";
import { BallDontLiePlayer } from "@/lib/sports-apis";
import { UnifiedPlayerData } from "@/lib/services/api/unified-api-client";

type PlayerUnion = Player | BallDontLiePlayer | UnifiedPlayerData;

// Helper functions to safely access properties across different player types
function getPlayerName(player: PlayerUnion | null): string {
  if (!player) return 'Unknown Player';
  if ('name' in player) {
    return player.name;
  }
  if ('first_name' in player && 'last_name' in player) {
    return `${player.first_name} ${player.last_name}`;
  }
  return 'Unknown Player';
}

function getPlayerTeamName(player: PlayerUnion | null): string | undefined {
  if (!player) return undefined;
  if ('teamName' in player) {
    return player.teamName;
  }
  if ('team' in player && typeof player.team === 'object' && player.team !== null) {
    return (player.team as any).name || (player.team as any).full_name;
  }
  return undefined;
}

function getPlayerId(player: PlayerUnion | null): string {
  if (!player) return '';
  if ('id' in player) {
    return String(player.id);
  }
  return '';
}

interface PlayerSearchProps {
  onPlayerSelect?: (player: PlayerUnion | null) => void;
  selectedPlayer?: PlayerUnion | null;
  sport?: string;
  league?: string;
}

export default function PlayerSearch({ onPlayerSelect, selectedPlayer, sport, league }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic positions based on sport
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    const loadPositions = async () => {
      if (sport) {
        const sportPositions = await SportConfigManager.getPositionsForSport(sport);
        setPositions(sportPositions);
      } else {
        setPositions([]);
      }
    };
    loadPositions();
  }, [sport]);

  // Fetch teams on component mount and when sport changes
  useEffect(() => {
    if (sport) {
      fetchTeams();
    }
  }, [sport, fetchTeams]);

  // Search players when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchPlayers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setPlayers([]);
    }
  }, [searchQuery, selectedTeam, selectedPosition, searchPlayers]);

  const fetchTeams = async () => {
    if (!sport) return;

    try {
      const teamsData = await simpleApiClient.getTeams({ sport: sport as SupportedSport });
      setTeams(teamsData);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setError("Failed to load teams");
    }
  };

  const searchPlayers = async () => {
    if (!searchQuery.trim() || !sport) {
      setPlayers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const playersData = await simpleApiClient.getPlayers({
        sport: sport as SupportedSport,
        limit: 20,
      });

      let filteredPlayers = playersData;

      // Filter by search query
      if (searchQuery.trim()) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter by team
      if (selectedTeam !== "all") {
        filteredPlayers = filteredPlayers.filter(player => player.teamId === selectedTeam);
      }

      // Filter by position
      if (selectedPosition !== "all") {
        filteredPlayers = filteredPlayers.filter(player => player.position === selectedPosition);
      }

      setPlayers(filteredPlayers);
    } catch (error) {
      console.error("Error searching players:", error);
      setError("Failed to search players");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    onPlayerSelect?.(player);
    setIsOpen(false);
    setSearchQuery(player.name);
  };

  const clearSelection = () => {
    setSearchQuery("");
    setPlayers([]);
    onPlayerSelect?.(null);
  };

  const getPlayerInitials = (player: PlayerUnion | null) => {
    if (!player) return '??';
    const name = getPlayerName(player);
    return name ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '??';
  };

  const getPlayerPosition = (player: PlayerUnion | null) => {
    if (!player) return 'Unknown';
    if ('position' in player) {
      return player.position || 'Unknown';
    }
    return 'Unknown';
  };

  const getPlayerTeam = (player: PlayerUnion | null) => {
    if (!player) return 'Unknown Team';
    const teamName = getPlayerTeamName(player);
    return teamName || 'Unknown Team';
  };


  // Show no sport selected state
  if (!sport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Player Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Please select a sport to search for players</p>
          </div>
        </CardContent>
      </Card>
    )
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
                <SelectItem key={team.id} value={team.abbreviation || team.id}>
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
                {positions.map((position: string) => (
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
                          {player.position && (
                            <Badge variant="outline" className="text-xs">
                              {player.position}
                            </Badge>
                          )}
                          {player.teamName && (
                              <span className="flex items-center gap-1">
                                <TeamLogo 
                                  teamName={player.teamName} 
                                  alt={player.teamName}
                                  width={16}
                                  height={16}
                                  className="h-4 w-4"
                                />
                                {player.teamName}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {player.height && (
                        <div>{player.height}</div>
                      )}
                      {player.weight && (
                        <div>{player.weight} lbs</div>
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
                  playerId={getPlayerId(selectedPlayer)}
                  alt={getPlayerName(selectedPlayer)}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-lg">
                    {getPlayerName(selectedPlayer)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary">
                      {selectedPlayer.position}
                    </Badge>
                    {getPlayerTeamName(selectedPlayer) && (
                    <span className="flex items-center gap-1">
                      <TeamLogo 
                        teamName={getPlayerTeamName(selectedPlayer)!} 
                        alt={getPlayerTeamName(selectedPlayer)!}
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                      {getPlayerTeamName(selectedPlayer)}
                    </span>
                    )}
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
