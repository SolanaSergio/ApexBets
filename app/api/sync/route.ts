import { NextRequest, NextResponse } from "next/server"
import { dataSyncService } from "@/lib/services/data-sync-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "status":
        return NextResponse.json({
          success: true,
          data: {
            isRunning: dataSyncService.isServiceRunning(),
            stats: dataSyncService.getStats(),
            config: dataSyncService.getConfig()
          }
        })

      case "start":
        dataSyncService.start()
        return NextResponse.json({
          success: true,
          message: "Data sync service started"
        })

      case "stop":
        dataSyncService.stop()
        return NextResponse.json({
          success: true,
          message: "Data sync service stopped"
        })

      case "sync":
        // Manual sync trigger
        await dataSyncService.performSync()
        return NextResponse.json({
          success: true,
          message: "Manual sync completed",
          stats: dataSyncService.getStats()
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            isRunning: dataSyncService.isServiceRunning(),
            stats: dataSyncService.getStats(),
            config: dataSyncService.getConfig()
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
          dataSyncService.updateConfig(config)
          return NextResponse.json({
            success: true,
            message: "Configuration updated",
            config: dataSyncService.getConfig()
          })
        }
        return NextResponse.json({
          success: false,
          error: "Configuration required"
        }, { status: 400 })

      case "force_sync":
        await dataSyncService.performSync()
        return NextResponse.json({
          success: true,
          message: "Force sync completed",
          stats: dataSyncService.getStats()
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
