import { NextRequest, NextResponse } from "next/server"
import { dataSyncService } from "@/lib/services/data-sync-service"

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered: Data sync')
    
    // Perform sync
    await dataSyncService.performSync()
    
    const stats = dataSyncService.getStats()
    
    return NextResponse.json({
      success: true,
      message: 'Cron sync completed',
      stats
    })

  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron sync failed'
    }, { status: 500 })
  }
}

// Support POST for webhook-style triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
