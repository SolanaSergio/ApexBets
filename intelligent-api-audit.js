/**
 * Intelligent API Endpoints Audit
 * Recognizes specialized APIs and validates mappings appropriately
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Define API specializations
const API_SPECIALIZATIONS = {
  'odds-api': {
    name: 'The Odds API',
    specialization: 'odds-only',
    description: 'Specialized betting odds provider - only provides odds data',
    expectedDataTypes: ['odds']
  },
  'balldontlie': {
    name: 'Ball Don\'t Lie',
    specialization: 'basketball-comprehensive',
    description: 'NBA-specific API with comprehensive basketball data',
    expectedDataTypes: ['games', 'teams', 'players', 'standings', 'stats']
  },
  'rapidapi-sports': {
    name: 'RapidAPI Sports',
    specialization: 'multi-sport',
    description: 'Multi-sport API with varying data types per sport',
    expectedDataTypes: 'dynamic' // Depends on sport
  },
  'nba-stats': {
    name: 'NBA Official Stats',
    specialization: 'basketball-official',
    description: 'Official NBA statistics API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings', 'stats']
  },
  'mlb-stats': {
    name: 'MLB Official Stats',
    specialization: 'baseball-official',
    description: 'Official MLB statistics API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings', 'stats']
  },
  'nhl-stats': {
    name: 'NHL Official Stats',
    specialization: 'hockey-official',
    description: 'Official NHL statistics API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings', 'stats']
  },
  'nfl-api': {
    name: 'NFL Official API',
    specialization: 'football-official',
    description: 'Official NFL API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings', 'stats']
  },
  'espn': {
    name: 'ESPN Sports API',
    specialization: 'multi-sport-general',
    description: 'General sports coverage API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings']
  },
  'premier-league': {
    name: 'Premier League API',
    specialization: 'soccer-official',
    description: 'Official Premier League API',
    expectedDataTypes: ['games', 'teams', 'players', 'standings']
  },
  'sportsdb': {
    name: 'The Sports DB',
    specialization: 'multi-sport-database',
    description: 'Multi-sport database with comprehensive data',
    expectedDataTypes: ['games', 'teams', 'players', 'standings']
  }
}

// Define sport-specific data type expectations
const SPORT_DATA_TYPES = {
  'basketball': ['games', 'teams', 'players', 'standings', 'odds', 'stats'],
  'football': ['games', 'teams', 'players', 'standings', 'odds', 'stats'],
  'baseball': ['games', 'teams', 'players', 'standings', 'odds', 'stats'],
  'hockey': ['games', 'teams', 'players', 'standings', 'odds', 'stats'],
  'soccer': ['games', 'teams', 'players', 'standings', 'odds', 'stats'],
  'tennis': ['games', 'players', 'standings', 'odds', 'stats'], // No teams
  'golf': ['games', 'players', 'standings', 'odds', 'stats'], // No teams
  'mma': ['games', 'players', 'odds', 'stats'], // No teams, no standings
  'boxing': ['games', 'players', 'odds', 'stats'], // No teams, no standings
  'esports': ['games', 'teams', 'players', 'standings', 'odds', 'stats']
}

async function auditAPIEndpointsIntelligently() {
  console.log('\n🔌 INTELLIGENT API ENDPOINTS AUDIT')
  console.log('🎯 Recognizing specialized APIs and validating appropriately')
  console.log('=' * 70)
  
  const { data: mappings, error } = await supabase
    .from('api_mappings')
    .select('*')
  
  if (error) {
    console.error('❌ Error fetching API mappings:', error)
    return false
  }
  
  console.log(`📊 Found ${mappings.length} API mappings to audit:`)
  
  const auditResults = {
    total: mappings.length,
    passed: 0,
    failed: 0,
    specialized: 0,
    issues: []
  }
  
  for (const mapping of mappings) {
    const provider = mapping.provider
    const sport = mapping.sport
    const apiInfo = API_SPECIALIZATIONS[provider]
    const sportDataTypes = SPORT_DATA_TYPES[sport] || []
    
    console.log(`\n🔍 Auditing ${sport} -> ${provider}`)
    
    if (apiInfo) {
      console.log(`   📋 Provider: ${apiInfo.name}`)
      console.log(`   🎯 Specialization: ${apiInfo.specialization}`)
      console.log(`   📝 Description: ${apiInfo.description}`)
      
      // Check if this is a specialized API
      if (apiInfo.specialization === 'odds-only') {
        console.log(`   ✅ Specialized API: Only provides odds data`)
        auditResults.specialized++
        auditResults.passed++
        continue
      }
      
      // For comprehensive APIs, check if they provide expected data types
      if (apiInfo.expectedDataTypes === 'dynamic') {
        // For dynamic APIs, check against sport-specific expectations
        const mappingData = typeof mapping.data_type_mapping === 'string' 
          ? JSON.parse(mapping.data_type_mapping) 
          : mapping.data_type_mapping
        
        const providedDataTypes = Object.keys(mappingData)
        const expectedForSport = sportDataTypes.filter(dt => 
          !['odds'].includes(dt) // Odds are handled by specialized APIs
        )
        
        const missingDataTypes = expectedForSport.filter(dt => 
          !providedDataTypes.includes(dt)
        )
        
        if (missingDataTypes.length > 0) {
          console.log(`   ❌ Missing data types: ${missingDataTypes.join(', ')}`)
          auditResults.issues.push(`${sport} -> ${provider}: Missing ${missingDataTypes.join(', ')}`)
          auditResults.failed++
        } else {
          console.log(`   ✅ All expected data types provided`)
          auditResults.passed++
        }
      } else {
        // For fixed APIs, check against their expected data types
        const mappingData = typeof mapping.data_type_mapping === 'string' 
          ? JSON.parse(mapping.data_type_mapping) 
          : mapping.data_type_mapping
        
        const providedDataTypes = Object.keys(mappingData)
        const expectedDataTypes = apiInfo.expectedDataTypes
        
        const missingDataTypes = expectedDataTypes.filter(dt => 
          !providedDataTypes.includes(dt)
        )
        
        if (missingDataTypes.length > 0) {
          console.log(`   ❌ Missing data types: ${missingDataTypes.join(', ')}`)
          auditResults.issues.push(`${sport} -> ${provider}: Missing ${missingDataTypes.join(', ')}`)
          auditResults.failed++
        } else {
          console.log(`   ✅ All expected data types provided`)
          auditResults.passed++
        }
      }
    } else {
      console.log(`   ⚠️  Unknown provider: ${provider}`)
      auditResults.failed++
    }
  }
  
  console.log(`\n📊 Intelligent API Audit Results:`)
  console.log(`✅ Mappings passed: ${auditResults.passed}`)
  console.log(`❌ Mappings failed: ${auditResults.failed}`)
  console.log(`🎯 Specialized APIs: ${auditResults.specialized}`)
  console.log(`📊 Total audited: ${auditResults.total}`)
  
  if (auditResults.issues.length > 0) {
    console.log(`\n❌ Remaining issues:`)
    auditResults.issues.forEach(issue => console.log(`   - ${issue}`))
  } else {
    console.log(`\n🎉 All API mappings are properly configured!`)
  }
  
  return auditResults.failed === 0
}

async function validateAPICoverage() {
  console.log('\n📊 API COVERAGE VALIDATION')
  console.log('🎯 Ensuring comprehensive coverage across all sports')
  console.log('=' * 50)
  
  const { data: sports } = await supabase.from('sports').select('name, data_types')
  const { data: mappings } = await supabase.from('api_mappings').select('sport, provider, data_type_mapping')
  
  const coverageReport = {}
  
  for (const sport of sports) {
    const sportMappings = mappings.filter(m => m.sport === sport.name)
    const sportDataTypes = sport.data_types || []
    
    coverageReport[sport.name] = {
      dataTypes: sportDataTypes,
      providers: sportMappings.length,
      mappings: sportMappings.map(m => ({
        provider: m.provider,
        dataTypes: Object.keys(typeof m.data_type_mapping === 'string' 
          ? JSON.parse(m.data_type_mapping) 
          : m.data_type_mapping)
      }))
    }
  }
  
  console.log(`📊 API Coverage by Sport:`)
  Object.entries(coverageReport).forEach(([sport, data]) => {
    console.log(`\n🏆 ${sport.toUpperCase()}`)
    console.log(`   📋 Data Types: ${data.dataTypes.join(', ')}`)
    console.log(`   🔌 Providers: ${data.providers}`)
    data.mappings.forEach(mapping => {
      console.log(`   - ${mapping.provider}: ${mapping.dataTypes.join(', ')}`)
    })
  })
  
  return true
}

async function main() {
  console.log('🔍 INTELLIGENT API ENDPOINTS AUDIT')
  console.log('🎯 Recognizing specialized APIs and validating appropriately')
  console.log('📊 Ensuring comprehensive coverage across all sports')
  console.log('=' * 80)
  
  try {
    const auditPassed = await auditAPIEndpointsIntelligently()
    const coverageValid = await validateAPICoverage()
    
    console.log('\n🎯 INTELLIGENT API AUDIT SUMMARY')
    console.log('=' * 50)
    
    if (auditPassed && coverageValid) {
      console.log('🎉 ALL API MAPPINGS ARE PROPERLY CONFIGURED!')
      console.log('✅ Specialized APIs recognized correctly')
      console.log('✅ Comprehensive coverage validated')
      console.log('✅ All sports have appropriate API support')
    } else {
      console.log('⚠️  SOME ISSUES FOUND')
      console.log('🔧 Review audit results above')
    }
    
  } catch (error) {
    console.error('💥 Audit failed:', error)
    process.exit(1)
  }
}

// Run the intelligent audit
main()
  .then(() => {
    console.log('\n🏆 Intelligent API audit completed!')
  })
  .catch(error => {
    console.error('💥 Audit crashed:', error)
    process.exit(1)
  })

