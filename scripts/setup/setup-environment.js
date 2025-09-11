#!/usr/bin/env node
/**
 * Environment Setup Script
 * Validates and helps configure environment variables
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

const ENV_TEMPLATE = `# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Sports APIs
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key_here

# TheSportsDB (Free API - uses '123' as default key)
# For free tier: leave as '123' (no registration needed)
# For premium ($9/month): replace with your premium key
NEXT_PUBLIC_SPORTSDB_API_KEY=123

# Optional: Additional API Keys (no keys needed)
# BALLDONTLIE is completely free, no API key required

# App Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=ApexBets
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=true
NEXT_PUBLIC_ENABLE_VALUE_BETTING=true
NEXT_PUBLIC_ENABLE_ML_PREDICTIONS=true`

const API_INFO = {
  rapidapi: {
    name: 'RapidAPI (API-SPORTS)',
    url: 'https://rapidapi.com/api-sports/api/api-sports',
    description: 'Fast real-time sports data with 15-second updates',
    required: false,
    limits: '100 requests/minute, 10,000 requests/day'
  },
  odds: {
    name: 'The Odds API',
    url: 'https://the-odds-api.com/',
    description: 'Betting odds and live sports data',
    required: false,
    limits: '10 requests/minute, 100 requests/day (free tier)'
  },
  sportsdb: {
    name: 'TheSportsDB',
    url: 'https://www.thesportsdb.com/',
    description: 'Free multi-sport API with generous rate limits',
    required: false,
    limits: '30 requests/minute, 10,000 requests/day'
  },
  balldontlie: {
    name: 'BALLDONTLIE',
    url: 'https://www.balldontlie.io/',
    description: 'Free NBA-focused API with comprehensive historical data',
    required: false,
    limits: '60 requests/minute, 10,000 requests/day'
  }
}

async function main() {
  console.log('🚀 ApexBets Environment Setup')
  console.log('================================\n')

  const envPath = path.join(process.cwd(), '.env.local')
  const envExists = fs.existsSync(envPath)

  if (envExists) {
    console.log('✅ .env.local file already exists')
    const overwrite = await question('Do you want to overwrite it? (y/N): ')
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  console.log('\n📋 Required Environment Variables:')
  console.log('==================================')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const envVars = {}

  for (const varName of requiredVars) {
    const value = await question(`${varName}: `)
    envVars[varName] = value || `your_${varName.toLowerCase()}`
  }

  console.log('\n🔑 Optional API Keys:')
  console.log('====================')
  console.log('These APIs enhance functionality but are not required:')

  for (const [key, info] of Object.entries(API_INFO)) {
    console.log(`\n${info.name}:`)
    console.log(`  Description: ${info.description}`)
    console.log(`  URL: ${info.url}`)
    console.log(`  Limits: ${info.limits}`)
    
    const addKey = await question(`  Add ${info.name} key? (y/N): `)
    if (addKey.toLowerCase() === 'y') {
      const apiKey = await question(`  ${key.toUpperCase()}_KEY: `)
      if (apiKey) {
        envVars[`NEXT_PUBLIC_${key.toUpperCase()}_KEY`] = apiKey
      }
    }
  }

  console.log('\n⚙️  App Configuration:')
  console.log('=====================')
  
  const appName = await question('App Name (ApexBets): ') || 'ApexBets'
  const appVersion = await question('App Version (1.0.0): ') || '1.0.0'
  const enableLiveUpdates = await question('Enable Live Updates? (Y/n): ') || 'y'
  const enableValueBetting = await question('Enable Value Betting? (Y/n): ') || 'y'
  const enableMlPredictions = await question('Enable ML Predictions? (Y/n): ') || 'y'

  // Build environment file content
  let envContent = `# Database
NEXT_PUBLIC_SUPABASE_URL=${envVars.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY}

# Sports APIs
NEXT_PUBLIC_RAPIDAPI_KEY=${envVars.NEXT_PUBLIC_RAPIDAPI_KEY || 'your_rapidapi_key'}
NEXT_PUBLIC_ODDS_API_KEY=${envVars.NEXT_PUBLIC_ODDS_API_KEY || 'your_odds_api_key_here'}

# TheSportsDB (Free API - uses '123' as default key)
NEXT_PUBLIC_SPORTSDB_API_KEY=123

# App Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_NAME=${appName}
NEXT_PUBLIC_APP_VERSION=${appVersion}

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_UPDATES=${enableLiveUpdates.toLowerCase() === 'y'}
NEXT_PUBLIC_ENABLE_VALUE_BETTING=${enableValueBetting.toLowerCase() === 'y'}
NEXT_PUBLIC_ENABLE_ML_PREDICTIONS=${enableMlPredictions.toLowerCase() === 'y'}`

  // Write environment file
  fs.writeFileSync(envPath, envContent)
  console.log(`\n✅ Environment file created: ${envPath}`)

  // Validate configuration
  console.log('\n🔍 Validating Configuration:')
  console.log('============================')

  const missingRequired = requiredVars.filter(varName => 
    envVars[varName]?.includes('your_') || !envVars[varName]
  )

  if (missingRequired.length > 0) {
    console.log('❌ Missing required variables:')
    missingRequired.forEach(varName => console.log(`   - ${varName}`))
  } else {
    console.log('✅ All required variables configured')
  }

  const configuredApis = Object.entries(API_INFO).filter(([key]) => 
    envVars[`NEXT_PUBLIC_${key.toUpperCase()}_KEY`] && 
    !envVars[`NEXT_PUBLIC_${key.toUpperCase()}_KEY`].includes('your_')
  )

  if (configuredApis.length > 0) {
    console.log('✅ Configured APIs:')
    configuredApis.forEach(([key, info]) => console.log(`   - ${info.name}`))
  }

  console.log('\n📚 Next Steps:')
  console.log('==============')
  console.log('1. Start the development server: npm run dev')
  console.log('2. Visit /setup to monitor your API configuration')
  console.log('3. Check /api/health for detailed system status')
  console.log('4. Review the README.md for additional setup instructions')

  if (missingRequired.length > 0) {
    console.log('\n⚠️  Warning: Some required variables are missing.')
    console.log('   The application may not function properly until these are configured.')
  }

  rl.close()
}

main().catch(console.error)
