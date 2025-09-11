"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TeamLogo, 
  PlayerPhoto, 
  SportsImageGeneric, 
  SportsImageSkeleton 
} from '@/components/ui/sports-image'
import { type SportsLeague } from '@/lib/services/image-service'

/**
 * Comprehensive examples of how to use the new sports image system
 * This component demonstrates all the different ways to display sports images
 */
export function SportsImageExamples() {
  return (
    <div className="space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Sports Image System Examples</h1>
        <p className="text-muted-foreground">
          Professional sports images and logos for all major leagues
        </p>
      </div>

      {/* Team Logos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Logos - All Major Sports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dynamic Team Examples - No Hardcoded Data */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Team Logo Examples</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Team logos are loaded dynamically based on the team name and league. 
              No hardcoded team data is used in the actual application.
            </p>
            <div className="grid grid-cols-6 gap-4">
              {['Sample Team 1', 'Sample Team 2', 'Sample Team 3', 'Sample Team 4', 'Sample Team 5', 'Sample Team 6'].map(team => (
                <div key={team} className="text-center">
                  <TeamLogo 
                    teamName={team}
                    league="NBA"
                    alt={`${team} logo`}
                    width={80}
                    height={80}
                    className="mx-auto mb-2"
                  />
                  <p className="text-sm font-medium">{team}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Photos Section */}
      <Card>
        <CardHeader>
          <CardTitle>Player Photos - All Major Sports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Dynamic Player Examples - No Hardcoded Data */}
            <div className="text-center">
              <h4 className="font-semibold mb-3">Sample Players</h4>
              <div className="space-y-3">
                <PlayerPhoto 
                  playerId={999999}
                  league="NBA"
                  alt="Sample Player"
                  width={100}
                  height={100}
                  className="mx-auto rounded-full"
                />
                <p className="text-sm">Sample Player (ID: 999999)</p>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-3">Sample Players</h4>
              <div className="space-y-3">
                <PlayerPhoto 
                  playerId={999998}
                  league="NFL"
                  alt="Sample Player"
                  width={100}
                  height={100}
                  className="mx-auto rounded-full"
                />
                <p className="text-sm">Sample Player (ID: 999998)</p>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-3">Sample Players</h4>
              <div className="space-y-3">
                <PlayerPhoto 
                  playerId={999997}
                  league="MLB"
                  alt="Sample Player"
                  width={100}
                  height={100}
                  className="mx-auto rounded-full"
                />
                <p className="text-sm">Sample Player (ID: 999997)</p>
              </div>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-3">Sample Players</h4>
              <div className="space-y-3">
                <PlayerPhoto 
                  playerId={999996}
                  league="NHL"
                  alt="Sample Player"
                  width={100}
                  height={100}
                  className="mx-auto rounded-full"
                />
                <p className="text-sm">Sample Player (ID: 999996)</p>
              </div>
            </div>
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
                  playerId={999999}
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
  teamName="Lakers" 
  league="NBA"
  alt="Lakers logo"
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
