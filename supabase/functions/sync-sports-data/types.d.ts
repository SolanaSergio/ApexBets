/**
 * Type definitions for Supabase Edge Function
 * Provides Deno and Supabase types for TypeScript compilation
 */

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined
    }
  }
}

// Module declarations for Deno imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}

declare module "jsr:@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any
}

// Request type for the serve function
interface Request {
  method: string
  url: string
  headers: Headers
  json(): Promise<any>
}

interface Response {
  status: number
  headers: Headers
  body: string
}

interface Headers {
  get(name: string): string | null
  set(name: string, value: string): void
}

export {}
