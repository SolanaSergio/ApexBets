"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TeamLogo, 
  PlayerPhoto, 
  SportsImageGeneric, 
  SportsImageSkeleton 
} from '@/components/ui/sports-image'
import { type SportsLeague } from '@/lib/services/image-service'
import { dynamicExamplesService, type ExampleTeam, type ExamplePlayer } from '@/lib/services/examples/dynamic-examples-service'
import { serviceFactory, SupportedSport } from '@/lib/services/core/service-factory'

/**
 * Comprehensive examples of how to use the new sports image system
 * This component demonstrates all the different ways to display sports images
 * Uses real data from APIs - NO MOCK DATA
 */
export function SportsImageExamples() {
  const [selectedSport, setSelectedSport] = useState<SupportedSport>('basketball')
  const [teams, setTeams] = useState<ExampleTeam[]>([])
  const [players, setPlayers] = useState<ExamplePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load example data when sport changes
  useEffect(() => {
    loadExampleData()
  }, [selectedSport])

  const loadExampleData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [teamsData, playersData] = await Promise.all([
        dynamicExamplesService.getExampleTeams(selectedSport, 6),
        dynamicExamplesService.getExamplePlayers(selectedSport, 4)
      ])
      
      setTeams(teamsData)
      setPlayers(playersData)
    } catch (err) {
      console.error('Error loading example data:', err)
      setError('Failed to load example data')
    } finally {
      setLoading(false)
    }
  }

  const supportedSports = dynamicExamplesService.getSupportedSports()

  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Sports Image System Examples</h1>
        <p className="text-muted-foreground">
          Professional sports images and logos for all major leagues
        </p>
        
        {/* Sport Selector */}
        <div className="mt-4">
          <select 
            value={selectedSport} 
            onChange={(e) => setSelectedSport(e.target.value as SupportedSport)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            {supportedSports.map(sport => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Logos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Logos - {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Real Team Logo Examples</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Team logos are loaded dynamically from real APIs. 
              No hardcoded or mock data is used.
            </p>
            
            {loading ? (
              <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <SportsImageSkeleton width={80} height={80} className="mx-auto mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading teams: {error}</p>
                <button 
                  onClick={loadExampleData}
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="text-center">
                    <TeamLogo 
                      teamName={team.name}
                      league={team.league as SportsLeague}
                      alt={`${team.name} logo`}
                      width={80}
                      height={80}
                      className="mx-auto mb-2"
                    />
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">{team.abbreviation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Photos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Player Photos - {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Real Player Photo Examples</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Player photos are loaded dynamically from real APIs. 
              No hardcoded or mock data is used.
            </p>
            
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="text-center">
                    <SportsImageSkeleton width={100} height={100} className="mx-auto rounded-full mb-3" />
                    <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3 mx-auto"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading players: {error}</p>
                <button 
                  onClick={loadExampleData}
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {players.map(player => (
                  <div key={player.id} className="text-center">
                    <PlayerPhoto 
                      playerId={player.id}
                      league={player.league as SportsLeague}
                      alt={player.name}
                      width={100}
                      height={100}
                      className="mx-auto rounded-full"
                    />
                    <p className="text-sm font-medium mt-2">{player.name}</p>
                    {player.position && (
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    )}
                    {player.team && (
                      <p className="text-xs text-muted-foreground">{player.team}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sports Category Images */}
      <Card>
        <CardHeader>
          <CardTitle>Sports Category Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { category: 'BASKETBALL', label: 'Basketball' },
              { category: 'FOOTBALL', label: 'Football' },
              { category: 'BASEBALL', label: 'Baseball' },
              { category: 'HOCKEY', label: 'Hockey' },
              { category: 'SOCCER', label: 'Soccer' },
              { category: 'TENNIS', label: 'Tennis' },
              { category: 'GOLF', label: 'Golf' },
              { category: 'STADIUM', label: 'Stadium' }
            ].map(({ category, label }) => (
              <div key={category} className="text-center">
                <SportsImageGeneric 
                  category={category as any}
                  alt={`${label} image`}
                  width={150}
                  height={100}
                  className="mx-auto mb-2 rounded-lg"
                />
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>Loading States & Fallbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Loading Skeletons</h4>
              <div className="flex gap-4">
                <SportsImageSkeleton width={80} height={80} />
                <SportsImageSkeleton width={100} height={100} />
                <SportsImageSkeleton width={120} height={80} />
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Fallback Images</h4>
              <p className="text-sm text-muted-foreground mb-2">
                When images fail to load, fallback images are automatically displayed
              </p>
              <div className="flex gap-4">
                <TeamLogo 
                  teamName="Unknown Team"
                  alt="Unknown team"
                  width={80}
                  height={80}
                  fallbackType="team"
                />
                <PlayerPhoto 
                  playerId="unknown"
                  alt="Unknown player"
                  width={80}
                  height={80}
                  fallbackType="player"
                />
                <SportsImageGeneric 
                  category="SPORTS_GENERIC"
                  alt="Generic sports"
                  width={80}
                  height={80}
                  fallbackType="sports"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Team Logo</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<TeamLogo 
  teamName="Team Name" 
  league="NBA"
  alt="Team logo"
  width={100}
  height={100}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Player Photo with Fallback</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<PlayerPhoto 
  playerId={237}
  league="NBA"
  alt="LeBron James"
  width={150}
  height={150}
  className="rounded-full"
  fallbackType="player"
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Sports Category Image</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`<SportsImageGeneric 
  category="BASKETBALL"
  alt="Basketball court"
  width={300}
  height={200}
  className="rounded-lg"
/>`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
