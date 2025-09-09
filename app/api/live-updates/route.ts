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
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`)

      // Set up real-time subscription for live games
      const subscription = supabase
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
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "game_update",
                data: payload.new,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
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
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "prediction_update",
                data: payload.new,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            )
          },
        )
        .subscribe()

      // Send periodic heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`)
      }, 30000)

      // Cleanup on close
      return () => {
        clearInterval(heartbeat)
        subscription.unsubscribe()
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
