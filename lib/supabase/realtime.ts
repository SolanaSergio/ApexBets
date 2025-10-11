import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient()
const channels: { [key: string]: RealtimeChannel } = {}

export function subscribeToTable(tableName: string, callback: (payload: any) => void) {
  if (channels[tableName]) {
    return channels[tableName]
  }

  const channel = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
      callback(payload)
    })
    .subscribe()

  channels[tableName] = channel

  return channel
}

export function unsubscribeFromTable(tableName: string) {
  if (channels[tableName]) {
    channels[tableName].unsubscribe()
    delete channels[tableName]
  }
}
