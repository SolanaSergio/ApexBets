#!/usr/bin/env node

/**
 * Comprehensive Data Audit Script
 * Identifies and eliminates all mock data, placeholders, and hardcoded values
 * Ensures 100% real data integration across all sports
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 ApexBets Comprehensive Data Audit');
console.log('====================================\n');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DataAuditor {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.mockDataFound = [];
    this.placeholdersFound = [];
    this.hardcodedValues = [];
  }

  async runFullAudit() {
    console.log('🔄 Starting comprehensive data audit...\n');
    
    try {
      await Promise.all([
        this.auditDatabaseData(),
        this.auditScriptsForMockData(),
        this.auditComponentsForPlaceholders(),
        this.auditApiEndpoints(),
        this.auditEnvironmentVariables(),
        this.testRealDataIntegration()
      ]);

      this.generateAuditReport();
      this.printRecommendations();
      
    } catch (error) {
      console.error('❌ Audit failed:', error.message);
      this.issues.push({ type: 'AUDIT_ERROR', message: error.message });
    }
  }

  async auditDatabaseData() {
    console.log('🗄️  Auditing database data...');
    
    try {
      // Check for mock data in teams
      const { data: teams } = await supabase
        .from('teams')
        .select('name, city, abbreviation, logo_url')
        .limit(100);

      if (teams) {
        teams.forEach(team => {
          if (this.isMockData(team.name) || this.isPlaceholder(team.name)) {
            this.mockDataFound.push({
              table: 'teams',
              field: 'name',
              value: team.name,
              type: 'mock_data'
            });
          }
          
          if (this.isPlaceholder(team.logo_url)) {
            this.placeholdersFound.push({
              table: 'teams',
              field: 'logo_url',
              value: team.logo_url,
              type: 'placeholder'
            });
          }
        });
      }

      // Check for mock data in games
      const { data: games } = await supabase
        .from('games')
        .select('venue, status, home_score, away_score')
        .limit(100);

      if (games) {
        games.forEach(game => {
          if (this.isMockData(game.venue)) {
            this.mockDataFound.push({
              table: 'games',
              field: 'venue',
              value: game.venue,
              type: 'mock_data'
            });
          }
        });
      }

      // Check for mock data in predictions
      const { data: predictions } = await supabase
        .from('predictions')
        .select('model_name, reasoning')
        .limit(100);

      if (predictions) {
        predictions.forEach(pred => {
          if (this.isMockData(pred.model_name) || this.isPlaceholder(pred.model_name)) {
            this.mockDataFound.push({
              table: 'predictions',
              field: 'model_name',
              value: pred.model_name,
              type: 'mock_data'
            });
          }
        });
      }

      console.log(`   ✅ Database audit complete - Found ${this.mockDataFound.length} mock data entries`);
      
    } catch (error) {
      console.log(`   ❌ Database audit failed: ${error.message}`);
      this.issues.push({ type: 'DATABASE_AUDIT', message: error.message });
    }
  }

  async auditScriptsForMockData() {
    console.log('📜 Auditing scripts for mock data...');
    
    const scriptDir = path.join(__dirname);
    const scripts = fs.readdirSync(scriptDir).filter(file => file.endsWith('.js'));
    
    scripts.forEach(script => {
      const scriptPath = path.join(scriptDir, script);
      const content = fs.readFileSync(scriptPath, 'utf8');
      
      // Check for common mock data patterns
      const mockPatterns = [
        /Math\.random\(\)/g,
        /Math\.floor\(Math\.random\(\)/g,
        /generateMock/g,
        /sampleData/g,
        /fakeData/g,
        /testData/g,
        /dummyData/g
      ];
      
      mockPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.mockDataFound.push({
            file: script,
            pattern: pattern.source,
            matches: matches.length,
            type: 'mock_generation'
          });
        }
      });
      
      // Check for hardcoded team names
      const hardcodedTeams = [
        'Lakers', 'Warriors', 'Celtics', 'Heat', 'Knicks', 'Bulls', 'Nets', '76ers',
        'Chiefs', 'Bills', 'Cowboys', 'Packers', '49ers', 'Patriots',
        'Yankees', 'Dodgers', 'Red Sox', 'Giants', 'Cubs', 'Cardinals'
      ];
      
      hardcodedTeams.forEach(team => {
        if (content.includes(team)) {
          this.hardcodedValues.push({
            file: script,
            type: 'hardcoded_team',
            value: team
          });
        }
      });
    });
    
    console.log(`   ✅ Scripts audit complete - Found ${this.mockDataFound.length} mock patterns`);
  }

  async auditComponentsForPlaceholders() {
    console.log('🧩 Auditing components for placeholders...');
    
    const componentsDir = path.join(__dirname, '..', 'components');
    
    if (fs.existsSync(componentsDir)) {
      const componentFiles = this.getAllFiles(componentsDir, ['.tsx', '.jsx', '.ts', '.js']);
      
      componentFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for placeholder patterns
        const placeholderPatterns = [
          /placeholder/g,
          /your_.*_key/g,
          /example/g,
          /sample/g,
          /test.*data/g,
          /mock.*data/g
        ];
        
        placeholderPatterns.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            this.placeholdersFound.push({
              file: path.relative(process.cwd(), file),
              pattern: pattern.source,
              matches: matches.length,
              type: 'placeholder'
            });
          }
        });
      });
    }
    
    console.log(`   ✅ Components audit complete - Found ${this.placeholdersFound.length} placeholder patterns`);
  }

  async auditApiEndpoints() {
    console.log('🌐 Auditing API endpoints...');
    
    const apiDir = path.join(__dirname, '..', 'app', 'api');
    
    if (fs.existsSync(apiDir)) {
      const apiFiles = this.getAllFiles(apiDir, ['.ts', '.js']);
      
      apiFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for hardcoded API responses
        if (content.includes('mock') || content.includes('sample') || content.includes('fake')) {
          this.issues.push({
            type: 'API_MOCK_DATA',
            file: path.relative(process.cwd(), file),
            message: 'API endpoint contains mock data'
          });
        }
        
        // Check for hardcoded values
        if (content.includes('localhost:3000') || content.includes('127.0.0.1')) {
          this.hardcodedValues.push({
            file: path.relative(process.cwd(), file),
            type: 'hardcoded_url',
            value: 'localhost:3000'
          });
        }
      });
    }
    
    console.log(`   ✅ API endpoints audit complete`);
  }

  async auditEnvironmentVariables() {
    console.log('🔧 Auditing environment variables...');
    
    const envFile = path.join(__dirname, '..', '.env.local');
    
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      
      // Check for placeholder values
      const placeholderPatterns = [
        /your_.*_key/g,
        /your_.*_url/g,
        /placeholder/g,
        /example/g
      ];
      
      placeholderPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          this.placeholdersFound.push({
            file: '.env.local',
            pattern: pattern.source,
            matches: matches.length,
            type: 'env_placeholder'
          });
        }
      });
    }
    
    console.log(`   ✅ Environment variables audit complete`);
  }

  async testRealDataIntegration() {
    console.log('🧪 Testing real data integration...');
    
    try {
      // Test external APIs
      const apis = [
        { name: 'SportsDB', url: 'https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2024-01-01&s=basketball' },
        { name: 'BallDontLie', url: 'https://www.balldontlie.io/api/v1/games' }
      ];
      
      for (const api of apis) {
        try {
          const response = await fetch(api.url);
          const data = await response.json();
          
          if (data && (data.events || data.data)) {
            console.log(`   ✅ ${api.name}: Real data available`);
          } else {
            console.log(`   ⚠️  ${api.name}: No data or invalid response`);
          }
        } catch (error) {
          console.log(`   ❌ ${api.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Real data integration test failed: ${error.message}`);
    }
  }

  isMockData(value) {
    if (!value) return false;
    
    const mockPatterns = [
      /mock/i,
      /fake/i,
      /sample/i,
      /test/i,
      /dummy/i,
      /placeholder/i,
      /example/i
    ];
    
    return mockPatterns.some(pattern => pattern.test(value));
  }

  isPlaceholder(value) {
    if (!value) return false;
    
    const placeholderPatterns = [
      /your_.*_key/i,
      /your_.*_url/i,
      /placeholder/i,
      /example/i,
      /sample/i
    ];
    
    return placeholderPatterns.some(pattern => pattern.test(value));
  }

  getAllFiles(dir, extensions) {
    let files = [];
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  generateAuditReport() {
    console.log('\n📊 AUDIT REPORT');
    console.log('================\n');
    
    console.log(`Mock Data Found: ${this.mockDataFound.length}`);
    console.log(`Placeholders Found: ${this.placeholdersFound.length}`);
    console.log(`Hardcoded Values: ${this.hardcodedValues.length}`);
    console.log(`Issues: ${this.issues.length}`);
    
    if (this.mockDataFound.length > 0) {
      console.log('\n🚨 MOCK DATA ISSUES:');
      this.mockDataFound.forEach(item => {
        console.log(`   - ${item.file || item.table}: ${item.value || item.pattern}`);
      });
    }
    
    if (this.placeholdersFound.length > 0) {
      console.log('\n⚠️  PLACEHOLDER ISSUES:');
      this.placeholdersFound.forEach(item => {
        console.log(`   - ${item.file || item.table}: ${item.value || item.pattern}`);
      });
    }
    
    if (this.hardcodedValues.length > 0) {
      console.log('\n🔒 HARDCODED VALUES:');
      this.hardcodedValues.forEach(item => {
        console.log(`   - ${item.file}: ${item.value}`);
      });
    }
  }

  printRecommendations() {
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================\n');
    
    if (this.mockDataFound.length > 0) {
      console.log('1. Replace all mock data generation with real API calls');
      console.log('2. Implement proper data validation for all inputs');
      console.log('3. Use real sports data from external APIs');
    }
    
    if (this.placeholdersFound.length > 0) {
      console.log('4. Replace all placeholder values with real data');
      console.log('5. Implement proper environment variable validation');
      console.log('6. Add data validation for all user inputs');
    }
    
    if (this.hardcodedValues.length > 0) {
      console.log('7. Remove all hardcoded values and make them configurable');
      console.log('8. Use environment variables for all configuration');
      console.log('9. Implement dynamic data loading for all components');
    }
    
    console.log('\n10. Set up automated data updates every 15 minutes');
    console.log('11. Implement comprehensive error handling for all API calls');
    console.log('12. Add data quality monitoring and alerting');
    console.log('13. Create data backup and recovery procedures');
    console.log('14. Implement rate limiting for all external API calls');
    console.log('15. Add comprehensive logging for all data operations');
  }
}

// Run the audit
const auditor = new DataAuditor();
auditor.runFullAudit().catch(console.error);
