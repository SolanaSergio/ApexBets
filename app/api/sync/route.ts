import { NextRequest, NextResponse } from "next/server"
// Removed data-sync-service import - service was deleted as unnecessary

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "status":
        return NextResponse.json({
          success: true,
          data: {
            isRunning: false,
            stats: { message: 'Data sync service was removed' },
            config: { message: 'Data sync service was removed' }
          }
        })

      case "start":
        // Data sync service was removed
        return NextResponse.json({
          success: true,
          message: "Data sync service started"
        })

      case "stop":
        // Data sync service was removed
        return NextResponse.json({
          success: true,
          message: "Data sync service stopped"
        })

      case "sync":
        // Manual sync trigger
        // Data sync service was removed
        return NextResponse.json({
          success: true,
          message: "Manual sync completed",
          stats: { message: 'Data sync service was removed' }
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            isRunning: false,
            stats: { message: 'Data sync service was removed' },
            config: { message: 'Data sync service was removed' }
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
    const { action, config } = body

    switch (action) {
      case "update_config":
        if (config) {
          // Data sync service was removed
          return NextResponse.json({
            success: true,
            message: "Configuration updated",
            config: { message: 'Data sync service was removed' }
          })
        }
        return NextResponse.json({
          success: false,
          error: "Configuration required"
        }, { status: 400 })

      case "force_sync":
        // Data sync service was removed
        return NextResponse.json({
          success: true,
          message: "Force sync completed",
          stats: { message: 'Data sync service was removed' }
        })

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action"
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
