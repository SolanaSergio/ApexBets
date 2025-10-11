
import { NextResponse } from 'next/server';
import { edgeFunctionClient } from '@/lib/services/edge-function-client';

export async function GET() {
  try {
    // Use a simple query to test database connectivity
    const result = await edgeFunctionClient.queryGames({ limit: 1 });
    if (result.success) {
      // For now, return empty array as we don't have a specific get-tables function
      return NextResponse.json({ success: true, tables: [] });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to connect to database' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
