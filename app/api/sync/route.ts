import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

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
        // Manual sync trigger - call Supabase Edge Function
        return await triggerSupabaseSync()

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
    const body = await request.json()
    const { action } = body

    switch (action) {
      case "force_sync":
        // Manual sync trigger - call Supabase Edge Function
        return await triggerSupabaseSync()

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Use 'force_sync' to trigger manual sync."
        }, { status: 400 })
    }
  } catch (error) {
    console.error("Sync API error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

async function triggerSupabaseSync() {
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
        dataTypes: ['games', 'teams', 'players', 'standings']
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
