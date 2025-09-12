import { NextResponse } from 'next/server';
import { listTables, getProjectInfo } from '@/lib/supabase/mcp-client';

/**
 * GET /api/mcp-test
 * Test endpoint to verify MCP integration from the Next.js API
 */
export async function GET() {
  try {
    // Get project information
    const projectInfo = await getProjectInfo();
    
    // List tables
    const tables = await listTables();
    
    // Return the results
    return NextResponse.json({
      success: true,
      project: projectInfo,
      tables: tables.tables?.slice(0, 5) || [], // Only return first 5 tables
      message: 'MCP integration working correctly!'
    });
  } catch (error) {
    console.error('MCP Test Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'MCP integration test failed'
      },
      { status: 500 }
    );
  }
}