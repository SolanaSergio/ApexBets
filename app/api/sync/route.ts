import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const sport = searchParams.get('sport') || undefined
    const dataTypesParam = searchParams.get('dataTypes') || undefined
    const dataTypes = dataTypesParam ? dataTypesParam.split(',').map(s => s.trim()).filter(Boolean) : undefined

    switch (action) {
      case "status":
        return NextResponse.json({
          success: true,
          data: {
            isRunning: true,
            message: 'Using Supabase Edge Functions for data sync',
            stats: { message: 'Data sync handled by Supabase Edge Functions' },
            config: { message: 'No local sync service - using Supabase Edge Functions' }
          }
        })

      case "sync":
        // Manual sync trigger - call Supabase Edge Function with optional targeting
        {
          const params: { sport?: string; dataTypes?: string[] } = {}
          if (sport) params.sport = sport
          if (dataTypes && dataTypes.length > 0) params.dataTypes = dataTypes
          return await triggerSupabaseSync(params)
        }

      default:
        return NextResponse.json({
          success: true,
          data: {
            isRunning: true,
            message: 'Using Supabase Edge Functions for data sync',
            stats: { message: 'Data sync handled by Supabase Edge Functions' },
            config: { message: 'No local sync service - using Supabase Edge Functions' }
          }
        })
    }
  } catch (error) {
    console.error("Sync API error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const actionFromQuery = url.searchParams.get('action') || undefined
    const sportFromQuery = url.searchParams.get('sport') || undefined
    const dataTypesFromQuery = url.searchParams.get('dataTypes') || undefined

    let action: string | undefined = actionFromQuery
    let sport: string | undefined = sportFromQuery
    let dataTypes: string[] | undefined = dataTypesFromQuery ? dataTypesFromQuery.split(',').map(s => s.trim()).filter(Boolean) : undefined

    // Parse JSON body only when content-type is JSON
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const raw = await request.text()
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw) as { action?: string; sport?: string; dataTypes?: string[] }
          action = parsed.action || action
          sport = parsed.sport || sport
          dataTypes = Array.isArray(parsed.dataTypes) && parsed.dataTypes.length > 0 ? parsed.dataTypes : dataTypes
        }
      } catch (parseError) {
        return NextResponse.json({
          success: false,
          error: 'Invalid JSON body',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }, { status: 400 })
      }
    }

    // Default action when none provided
    action = action || 'force_sync'

    // Validate action
    const allowedActions = new Set(['force_sync'])
    if (!allowedActions.has(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "force_sync" to trigger manual sync.'
      }, { status: 400 })
    }

    switch (action) {
      case "force_sync":
        // Manual sync trigger - call Supabase Edge Function
        {
          const params: { sport?: string; dataTypes?: string[] } = {}
          if (sport) params.sport = sport
          if (dataTypes && dataTypes.length > 0) params.dataTypes = dataTypes
          return await triggerSupabaseSync(params)
        }

      default:
        // Should never hit due to validation above
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync API error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

async function triggerSupabaseSync(params?: { sport?: string; dataTypes?: string[] }) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration')
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/sync-sports-data`
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        ...(params?.sport ? { sport: params.sport } : {}),
        dataTypes: params?.dataTypes && params.dataTypes.length > 0 ? params.dataTypes : ['games', 'teams', 'players', 'standings']
      })
    })

    if (!response.ok) {
      throw new Error(`Edge Function failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: result.success,
      message: 'Manual sync completed via Supabase Edge Function',
      stats: result.stats,
      edgeFunctionResult: result
    })

  } catch (error) {
    console.error('Manual sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Manual sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
