
import { NextResponse } from 'next/server';
import { productionSupabaseClient } from '@/lib/supabase/production-client';

export async function GET() {
  try {
    const tables = await productionSupabaseClient.getAllTables();
    return NextResponse.json({ success: true, tables });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
