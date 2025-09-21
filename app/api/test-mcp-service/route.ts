import { NextResponse } from 'next/server'
import { mcpDatabaseService } from '@/lib/services/mcp-database-service'

export async function GET() {
  try {
    // Test MCP database service with simple operations
    const healthCheck = await mcpDatabaseService.healthCheck()
    
    // Test a simple select query
    const sports = await mcpDatabaseService.select({
      table: 'sports',
      select: ['name', 'display_name', 'is_active'],
      filters: { is_active: true },
      limit: 5
    })

    // Test getting all tables
    const tables = await mcpDatabaseService.getAllTables()

    return NextResponse.json({
      success: true,
      data: {
        healthCheck,
        sports: sports || [],
        tablesCount: tables.length,
        message: 'MCP Database Service is working correctly'
      }
    })
  } catch (error) {
    console.error('MCP Service Test Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'MCP Database Service test failed'
    }, { status: 500 })
  }
}
