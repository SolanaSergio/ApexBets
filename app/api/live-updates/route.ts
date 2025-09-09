import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })

  // Create a readable stream for Server-Sent Events
  let heartbeat: NodeJS.Timeout | null = null
  let subscription: any = null

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`)

      // Set up real-time subscription for live games
      subscription = supabase
        .channel("live-games")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "games",
            filter: "status=eq.in_progress",
          },
          (payload) => {
            try {
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: "game_update",
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                })}\n\n`,
              )
            } catch (error) {
              // Controller might be closed, ignore the error
              console.warn("Failed to enqueue game update:", error)
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "predictions",
          },
          (payload) => {
            try {
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: "prediction_update",
                  data: payload.new,
                  timestamp: new Date().toISOString(),
                })}\n\n`,
              )
            } catch (error) {
              // Controller might be closed, ignore the error
              console.warn("Failed to enqueue prediction update:", error)
            }
          },
        )
        .subscribe()

      // Send periodic heartbeat
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`)
        } catch (error) {
          // Controller might be closed, ignore the error
          console.warn("Failed to enqueue heartbeat:", error)
        }
      }, 30000)
    },
    cancel() {
      // Cleanup when the stream is cancelled/closed
      if (heartbeat) {
        clearInterval(heartbeat)
        heartbeat = null
      }
      if (subscription) {
        subscription.unsubscribe()
        subscription = null
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
