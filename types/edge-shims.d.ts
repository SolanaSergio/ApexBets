// Ambient declarations to satisfy TypeScript in Node/Next workspace for Deno Edge code

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
} | undefined

declare module 'jsr:@supabase/supabase-js@2' {
  export function createClient(url: string, key: string): any
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}


