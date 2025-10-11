import { NextRequest, NextResponse } from 'next/server'
import { logoPopulationService } from '@/lib/services/logo-population-service'
import { databaseService } from '@/lib/services/database-service'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { sport, teamName, forceUpdate = false } = body

    structuredLogger.info('Logo population request received', {
      sport,
      teamName,
      forceUpdate,
      timestamp: new Date().toISOString(),
    })

    let result

    if (teamName && sport) {
      // Populate logo for specific team
      const teamsQuery = `
        SELECT id, name, sport, abbreviation, league_name 
        FROM teams 
        WHERE name = $1 AND sport = $2 AND is_active = true
        LIMIT 1
      `

      const teamsResult = await databaseService.executeSQL(teamsQuery, [teamName, sport])

      if (!teamsResult.success || teamsResult.data.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Team '${teamName}' not found in sport '${sport}'`,
          },
          { status: 404 }
        )
      }

      const team = teamsResult.data[0]
      result = await logoPopulationService.populateTeamLogo(team)
    } else if (sport) {
      // Populate logos for specific sport
      const teamsQuery = `
        SELECT id, name, sport, abbreviation, league_name 
        FROM teams 
        WHERE sport = $1 AND (logo_url IS NULL OR $2 = true) AND is_active = true
        ORDER BY name
      `

      const teamsResult = await databaseService.executeSQL(teamsQuery, [sport, forceUpdate])

      if (!teamsResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch teams',
          },
          { status: 500 }
        )
      }

      const teams = teamsResult.data
      const results: any[] = []
      let successful = 0
      let failed = 0

      // Process teams in batches
      const batchSize = 5
      for (let i = 0; i < teams.length; i += batchSize) {
        const batch = teams.slice(i, i + batchSize)
        const batchPromises = batch.map(team => logoPopulationService.populateTeamLogo(team))
        const batchResults = await Promise.allSettled(batchPromises)

        batchResults.forEach((batchResult, index) => {
          if (batchResult.status === 'fulfilled') {
            results.push(batchResult.value)
            if (batchResult.value.success) {
              successful++
            } else {
              failed++
            }
          } else {
            const team = batch[index]
            results.push({
              teamId: team.id,
              teamName: team.name,
              sport: team.sport,
              logoUrl: null,
              source: 'error',
              success: false,
              error: batchResult.reason?.message || 'Unknown error',
            })
            failed++
          }
        })

        // Rate limiting
        if (i + batchSize < teams.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      result = {
        totalProcessed: teams.length,
        successful,
        failed,
        results,
      }
    } else {
      // Populate all logos
      result = await logoPopulationService.populateAllLogos()
    }

    structuredLogger.info('Logo population completed', {
      success: true,
      result: {
        totalProcessed: (result as any).totalProcessed || 1,
        successful: (result as any).successful || ((result as any).success ? 1 : 0),
        failed: (result as any).failed || ((result as any).success ? 0 : 1),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Logo population completed successfully',
      data: result,
    })
  } catch (error) {
    structuredLogger.error('Logo population failed', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to populate logos',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      const stats = await logoPopulationService.getLogoStats()
      return NextResponse.json({
        success: true,
        data: stats,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Logo population service is running',
      endpoints: {
        'POST /api/admin/populate-logos': 'Populate team logos',
        'GET /api/admin/populate-logos?action=stats': 'Get logo statistics',
      },
    })
  } catch (error) {
    structuredLogger.error('Failed to get logo stats', {
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get logo statistics',
      },
      { status: 500 }
    )
  }
}
