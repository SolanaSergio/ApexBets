#!/usr/bin/env node

/**
 * Fix Import Issues Script
 * Removes or replaces broken imports from deleted files
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Fixing import issues...')

// Files that need import fixes
const filesToFix = [
  'app/api/admin/api-status/route.ts',
  'app/api/admin/database-audit/route.ts',
  'app/api/analytics/data-audit/route.ts',
  'app/api/cron/sync/route.ts',
  'app/api/debug/schema/route.ts',
  'app/api/games/route.ts',
  'app/api/health/route.ts',
  'app/api/live-updates/all/route.ts',
  'app/api/populate-data/route.ts',
  'app/api/startup/route.ts',
  'app/api/sync/route.ts',
  'app/api/teams/logo/route.ts',
  'app/page.tsx',
  'components/categories/dashboard/clean-dashboard.tsx',
  'components/ui/sports-image.tsx',
  'hooks/use-api-data.ts',
  'lib/security/webhook-processor.ts',
  'lib/services/api-key-rotation.ts',
  'lib/services/api-specific-error-handlers.ts',
  'lib/services/core/base-service.ts',
  'lib/startup.ts',
  'lib/utils/team-utils.ts',
  'lib/workers/sync-worker.ts',
  'tests/database/comprehensive-database-test.ts',
  'tests/database/simple-database-test.ts'
]

// Import replacements
const importReplacements = {
  '@/lib/services/intelligent-rate-limiter': '@/lib/services/enhanced-rate-limiter',
  '@/lib/services/database-audit-service': '@/lib/services/database-audit-service',
  '@/lib/services/database-cleanup-service': '@/lib/services/database-cleanup-service',
  '@/lib/services/enhanced-api-client': '@/lib/services/enhanced-api-client',
  '@/lib/services/automated-monitoring-service': '@/lib/services/automated-monitoring-service',
  '@/lib/services/data-integrity-service': '@/lib/services/data-integrity-service',
  '@/lib/services/data-validation-service': '@/lib/services/data-validation-service',
  '@/lib/services/data-sync-service': '@/lib/services/data-sync-service',
  '@/lib/services/game-status-validator': '@/lib/services/game-status-validator',
  '@/lib/services/comprehensive-data-population-service': '@/lib/services/comprehensive-data-population-service',
  '@/lib/services/auto-startup-service': '@/lib/services/auto-startup-service',
  '@/lib/services/dynamic-team-service-client': '@/lib/services/dynamic-team-service-client',
  '@/components/sync-initializer': '@/components/sync-initializer',
  '@/components/error-boundary': '@/components/error-boundary',
  '@/components/loading-states': '@/components/loading-states',
  '@/lib/services/image-service': '@/lib/services/image-service',
  '@/lib/services/structured-logger': '@/lib/services/structured-logger',
  '@/lib/services/error-handling-service': '@/lib/services/error-handling-service',
  '@/lib/services/automated-update-service': '@/lib/services/automated-update-service'
}

// Files to completely remove or disable
const filesToDisable = [
  'app/api/admin/database-audit/route.ts',
  'app/api/analytics/data-audit/route.ts',
  'app/api/cron/sync/route.ts',
  'app/api/populate-data/route.ts',
  'app/api/startup/route.ts',
  'app/api/sync/route.ts',
  'app/api/teams/logo/route.ts',
  'tests/database/comprehensive-database-test.ts',
  'tests/database/simple-database-test.ts'
]

function fixImports(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`)
    return
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    // Replace imports
    for (const [oldImport, newImport] of Object.entries(importReplacements)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport)
        modified = true
      }
    }

    // Remove unused imports
    const unusedImports = [
      'import { gameStatusValidator }',
      'import { dataValidationService }',
      'import { dataSyncService }',
      'import { comprehensiveDataPopulationService }',
      'import { autoStartupService }',
      'import { automatedMonitoringService }',
      'import { dataIntegrityService }',
      'import { enhancedApiClient }',
      'import { databaseService }',
      'import { dynamicTeamServiceClient }',
      'import { SyncInitializer }',
      'import { ErrorBoundary }',
      'import { LoadingCard, LoadingSpinner }',
      'import { getTeamLogoUrl, getPlayerPhotoUrl }',
      'import { useErrorHandler }',
      'import { structuredLogger }',
      'import { errorHandlingService }',
      'import { automatedUpdateService }'
    ]

    for (const unusedImport of unusedImports) {
      if (content.includes(unusedImport)) {
        // Remove the entire import line
        content = content.replace(new RegExp(`import\\s+.*?from\\s+['"][^'"]*['"];?\\s*`, 'g'), (match) => {
          if (match.includes(unusedImport.split(' ')[2])) {
            return ''
          }
          return match
        })
        modified = true
      }
    }

    // Remove unused variables
    content = content.replace(/const\s+\w+\s*=\s*.*?;\s*/g, (match) => {
      const varName = match.match(/const\s+(\w+)/)?.[1]
      if (varName && !content.includes(varName + '.') && !content.includes(varName + '(')) {
        return ''
      }
      return match
    })

    if (modified) {
      fs.writeFileSync(filePath, content)
      console.log(`  ✅ Fixed: ${filePath}`)
    } else {
      console.log(`  ℹ️  No changes needed: ${filePath}`)
    }

  } catch (error) {
    console.log(`  ❌ Error fixing ${filePath}: ${error.message}`)
  }
}

function disableFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`)
    return
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Add disable comment at the top
    const disableComment = `// DISABLED: This file has been disabled due to missing dependencies
// TODO: Re-enable when dependencies are restored
`
    
    if (!content.includes('DISABLED:')) {
      content = disableComment + content
      fs.writeFileSync(filePath, content)
      console.log(`  🚫 Disabled: ${filePath}`)
    } else {
      console.log(`  ℹ️  Already disabled: ${filePath}`)
    }

  } catch (error) {
    console.log(`  ❌ Error disabling ${filePath}: ${error.message}`)
  }
}

// Fix imports for regular files
console.log('\n📝 Fixing import statements...')
for (const file of filesToFix) {
  if (!filesToDisable.includes(file)) {
    fixImports(file)
  }
}

// Disable problematic files
console.log('\n🚫 Disabling problematic files...')
for (const file of filesToDisable) {
  disableFile(file)
}

console.log('\n✅ Import fixes completed!')
console.log('\nNext steps:')
console.log('1. Run TypeScript type checking: npx tsc --noEmit')
console.log('2. Fix any remaining errors manually')
console.log('3. Test the application')
