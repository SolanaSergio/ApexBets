import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Find duplicate teams (same name and sport)
    const { data: duplicates, error: duplicatesError } = await supabase.rpc('find_duplicate_teams')

    if (duplicatesError) {
      throw duplicatesError
    }

    let cleanedCount = 0
    const errors: string[] = []

    for (const duplicate of duplicates) {
      try {
        // 2. Get all versions of the duplicate team
        const { data: allVersions, error: versionsError } = await supabase
          .from('teams')
          .select('*')
          .eq('name', duplicate.name)
          .eq('sport', duplicate.sport)
          .order('updated_at', { ascending: false })

        if (versionsError) {
          throw versionsError
        }

        if (allVersions.length < 2) {
          continue
        }

        // 3. Keep the most recent version
        const [latest, ...toDelete] = allVersions

        // 4. Update related records to point to the latest version
        for (const oldTeam of toDelete) {
          await supabase.from('games').update({ home_team_id: latest.id }).eq('home_team_id', oldTeam.id)
          await supabase.from('games').update({ away_team_id: latest.id }).eq('away_team_id', oldTeam.id)
          // Add more updates for other related tables here
        }

        // 5. Delete the old versions
        const idsToDelete = toDelete.map(t => t.id)
        const { error: deleteError } = await supabase.from('teams').delete().in('id', idsToDelete)

        if (deleteError) {
          throw deleteError
        }

        cleanedCount += idsToDelete.length
      } catch (error) {
        errors.push(error.message)
      }
    }

    return new Response(
      JSON.stringify({ success: true, cleaned: cleanedCount, errors }),
      { headers: { 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
