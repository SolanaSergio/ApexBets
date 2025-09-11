import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dynamicTeamServiceClient } from '@/lib/services/dynamic-team-service-client'

/**
 * GET /api/teams/logo?teamName=...&league=...
 * Get team logo with full metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get('teamName')
    const league = searchParams.get('league') || 'NBA'

    if (!teamName) {
      return NextResponse.json({ error: 'teamName is required' }, { status: 400 })
    }

    const result = await dynamicTeamServiceClient.getTeamLogo(teamName, league as any)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error fetching team logo:', error)
    return NextResponse.json({ error: 'Failed to fetch team logo' }, { status: 500 })
  }
}

/**
 * POST /api/teams/logo
 * Update team logo in database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { teamName, league, logoUrl, teamData } = body

    if (!teamName || !league || !logoUrl) {
      return NextResponse.json({ 
        error: 'teamName, league, and logoUrl are required' 
      }, { status: 400 })
    }

    const success = await dynamicTeamServiceClient.updateTeamLogo(
      teamName, 
      league, 
      logoUrl, 
      teamData
    )

    if (!success) {
      return NextResponse.json({ error: 'Failed to update team logo' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Team logo updated successfully' 
    })
  } catch (error) {
    console.error('Error updating team logo:', error)
    return NextResponse.json({ error: 'Failed to update team logo' }, { status: 500 })
  }
}

/**
 * DELETE /api/teams/logo?teamName=...&league=...
 * Clear team logo cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamName = searchParams.get('teamName')
    const league = searchParams.get('league')

    if (teamName && league) {
      // Clear specific team cache
      dynamicTeamServiceClient.clearCache()
    } else {
      // Clear all cache
      dynamicTeamServiceClient.clearCache()
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Logo cache cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing logo cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}
