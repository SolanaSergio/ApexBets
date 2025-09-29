/**
 * Schema Audit API Route
 * Database schema validation and migration
 */

import { NextRequest, NextResponse } from 'next/server'
import { schemaAuditService } from '@/lib/services/schema-audit-service'
import { structuredLogger } from '@/lib/services/structured-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'audit'

    if (action === 'audit') {
      structuredLogger.info('Starting schema audit via API')
      
      const report = await schemaAuditService.runSchemaAudit()
      
      return NextResponse.json({
        success: true,
        action: 'audit',
        report,
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'migration-plan') {
      const report = await schemaAuditService.runSchemaAudit()
      
      return NextResponse.json({
        success: true,
        action: 'migration-plan',
        migrationPlan: report.migrationPlan,
        totalSteps: report.migrationPlan.length,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: audit, migration-plan',
      availableActions: ['audit', 'migration-plan']
    }, { status: 400 })

  } catch (error) {
    structuredLogger.error('Schema audit API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { schemaAuditService } from '@/lib/services/schema-audit-service'
import { structuredLogger } from '@/lib/services/structured-logger'
import { clearCache } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'apply-migrations') {
      structuredLogger.info('Applying schema migrations via API')
      
      // First run audit to get migration plan
      const report = await schemaAuditService.runSchemaAudit()
      
      if (report.migrationPlan.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No migrations needed - schema is up to date',
          applied: 0,
          errors: []
        })
      }

      // Apply migrations
      const result = await schemaAuditService.applyMigrationPlan(report.migrationPlan)

      // Clear Redis cache
      await clearCache();
      console.log('✅ Cleared Redis cache');
      
      return NextResponse.json({
        success: result.success,
        action: 'apply-migrations',
        applied: result.applied,
        totalSteps: report.migrationPlan.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'create-missing-tables') {
      structuredLogger.info('Creating missing tables via API')
      
      const report = await schemaAuditService.runSchemaAudit()
      const tableSteps = report.migrationPlan.filter(step => step.type === 'create_table')
      
      if (tableSteps.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No missing tables to create',
          applied: 0
        })
      }

      const result = await schemaAuditService.applyMigrationPlan(tableSteps)
      
      return NextResponse.json({
        success: result.success,
        action: 'create-missing-tables',
        applied: result.applied,
        totalSteps: tableSteps.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'add-constraints') {
      structuredLogger.info('Adding missing constraints via API')
      
      const report = await schemaAuditService.runSchemaAudit()
      const constraintSteps = report.migrationPlan.filter(step => step.type === 'add_constraint')
      
      if (constraintSteps.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No missing constraints to add',
          applied: 0
        })
      }

      const result = await schemaAuditService.applyMigrationPlan(constraintSteps)
      
      return NextResponse.json({
        success: result.success,
        action: 'add-constraints',
        applied: result.applied,
        totalSteps: constraintSteps.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      })
    }

    if (action === 'create-indexes') {
      structuredLogger.info('Creating missing indexes via API')
      
      const report = await schemaAuditService.runSchemaAudit()
      const indexSteps = report.migrationPlan.filter(step => step.type === 'create_index')
      
      if (indexSteps.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No missing indexes to create',
          applied: 0
        })
      }

      const result = await schemaAuditService.applyMigrationPlan(indexSteps)
      
      return NextResponse.json({
        success: result.success,
        action: 'create-indexes',
        applied: result.applied,
        totalSteps: indexSteps.length,
        errors: result.errors,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: apply-migrations, create-missing-tables, add-constraints, create-indexes',
      availableActions: ['apply-migrations', 'create-missing-tables', 'add-constraints', 'create-indexes']
    }, { status: 400 })

  } catch (error) {
    structuredLogger.error('Schema migration API error', {
      error: error instanceof Error ? error.message : String(error)
    })
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
