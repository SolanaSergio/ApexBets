import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const vercelCronHeader = request.headers.get('x-vercel-cron')
    
    // Allow if triggered by Vercel Cron, otherwise require bearer secret if configured
    const isVercelCron = Boolean(vercelCronHeader)
    const isAuthorizedBySecret = cronSecret ? authHeader === `Bearer ${cronSecret}` : true
    if (!isVercelCron && !isAuthorizedBySecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered: Calling Supabase Edge Function for data sync')
    
    // Call Supabase Edge Function for data sync
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
      message: 'Cron sync completed via Supabase Edge Function',
      stats: result.stats,
      edgeFunctionResult: result
    })

  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Support POST for webhook-style triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
