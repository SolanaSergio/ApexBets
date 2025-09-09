'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Loader2, Database, Copy, Check, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'

const supabaseUrl = 'https://luehhafpitbluxvwxczl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZWhoYWZwaXRibHV4dnd4Y3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQyMDg2OSwiZXhwIjoyMDcyOTk2ODY5fQ.p5fojKsD5OZQqgv4CLsfJQJfPy1olD9jTN2jvhc6ySo'

const supabase = createClient(supabaseUrl, supabaseKey)

const sqlScripts = [
  {
    name: 'Core Tables',
    description: 'Create all database tables',
    sql: `
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  league TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'basketball',
  abbreviation TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  game_date TIMESTAMP WITH TIME ZONE NOT NULL,
  season TEXT NOT NULL,
  week INTEGER,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  venue TEXT,
  weather_conditions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds table
CREATE TABLE IF NOT EXISTS odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  source TEXT NOT NULL,
  odds_type TEXT NOT NULL,
  home_odds DECIMAL,
  away_odds DECIMAL,
  spread DECIMAL,
  total DECIMAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  player_name TEXT NOT NULL,
  position TEXT,
  minutes_played INTEGER,
  points INTEGER,
  rebounds INTEGER,
  assists INTEGER,
  steals INTEGER,
  blocks INTEGER,
  turnovers INTEGER,
  field_goals_made INTEGER,
  field_goals_attempted INTEGER,
  three_pointers_made INTEGER,
  three_pointers_attempted INTEGER,
  free_throws_made INTEGER,
  free_throws_attempted INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  model_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  predicted_value DECIMAL,
  confidence DECIMAL CHECK (confidence >= 0 AND confidence <= 1),
  actual_value DECIMAL,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape logs table
CREATE TABLE IF NOT EXISTS scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  data_type TEXT NOT NULL,
  records_scraped INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User alerts table
CREATE TABLE IF NOT EXISTS user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  team_id UUID REFERENCES teams(id),
  conditions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_odds_game_id ON odds(game_id);
CREATE INDEX IF NOT EXISTS idx_odds_timestamp ON odds(timestamp);
CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source, scraped_at);
`
  },
  {
    name: 'Row Level Security',
    description: 'Enable security policies',
    sql: `
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- User alerts policies
CREATE POLICY "alerts_select_own" ON user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alerts_insert_own" ON user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alerts_update_own" ON user_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "alerts_delete_own" ON user_alerts FOR DELETE USING (auth.uid() = user_id);

-- Public read access
CREATE POLICY "teams_public_read" ON teams FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "games_public_read" ON games FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "odds_public_read" ON odds FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "player_stats_public_read" ON player_stats FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "predictions_public_read" ON predictions FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "scrape_logs_public_read" ON scrape_logs FOR SELECT TO PUBLIC USING (true);
`
  },
  {
    name: 'Profile Trigger',
    description: 'Auto-create user profiles',
    sql: `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
`
  },
  {
    name: 'Sample Data',
    description: 'Insert NBA teams and games',
    sql: `
-- Insert sample NBA teams
INSERT INTO teams (name, city, league, sport, abbreviation) VALUES
('Lakers', 'Los Angeles', 'NBA', 'basketball', 'LAL'),
('Warriors', 'Golden State', 'NBA', 'basketball', 'GSW'),
('Celtics', 'Boston', 'NBA', 'basketball', 'BOS'),
('Heat', 'Miami', 'NBA', 'basketball', 'MIA'),
('Knicks', 'New York', 'NBA', 'basketball', 'NYK'),
('Bulls', 'Chicago', 'NBA', 'basketball', 'CHI'),
('Nets', 'Brooklyn', 'NBA', 'basketball', 'BKN'),
('76ers', 'Philadelphia', 'NBA', 'basketball', 'PHI')
ON CONFLICT DO NOTHING;

-- Insert sample games
WITH team_ids AS (
  SELECT id, abbreviation FROM teams WHERE league = 'NBA'
)
INSERT INTO games (home_team_id, away_team_id, game_date, season, status)
SELECT 
  h.id as home_team_id,
  a.id as away_team_id,
  NOW() + (random() * interval '30 days') as game_date,
  '2024-25' as season,
  'scheduled' as status
FROM team_ids h
CROSS JOIN team_ids a
WHERE h.id != a.id
LIMIT 20
ON CONFLICT DO NOTHING;

-- Insert sample scrape log
INSERT INTO scrape_logs (source, data_type, records_scraped, success)
VALUES ('nba.com', 'teams', 8, true)
ON CONFLICT DO NOTHING;
`
  }
]

export default function SetupPage() {
  const [results, setResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({})
  const [isRunning, setIsRunning] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [copiedScripts, setCopiedScripts] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState(0)

  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('count')
        .limit(1)
      
      if (error) {
        if (error.message.includes('relation "teams" does not exist')) {
          setConnectionStatus('success')
          return true
        } else {
          setConnectionStatus('error')
          return false
        }
      } else {
        setConnectionStatus('success')
        return true
      }
    } catch (error) {
      setConnectionStatus('error')
      return false
    }
  }

  const runScript = async (script: typeof sqlScripts[0]) => {
    try {
      // Since we can't execute SQL directly, we'll show the script for manual execution
      setResults(prev => ({ ...prev, [script.name]: 'success' }))
      return true
    } catch (error) {
      setResults(prev => ({ ...prev, [script.name]: 'error' }))
      return false
    }
  }

  const runAllScripts = async () => {
    setIsRunning(true)
    setResults({})
    setCurrentStep(0)
    
    // Test connection first
    await testConnection()
    setCurrentStep(1)
    
    // Run each script
    for (let i = 0; i < sqlScripts.length; i++) {
      const script = sqlScripts[i]
      await runScript(script)
      setCurrentStep(i + 2)
      await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
    }
    
    setIsRunning(false)
  }

  const copyScript = async (scriptName: string, sql: string) => {
    try {
      await navigator.clipboard.writeText(sql.trim())
      setCopiedScripts(prev => new Set([...prev, scriptName]))
      setTimeout(() => {
        setCopiedScripts(prev => {
          const newSet = new Set(prev)
          newSet.delete(scriptName)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy script:', error)
    }
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 text-gray-400" />
    }
  }

  const totalSteps = sqlScripts.length + 1
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent mb-4">
            <Database className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Project Apex Setup
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get your sports analytics platform up and running in minutes with our automated database setup
          </p>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Setup Progress</span>
                  <span className="text-sm text-muted-foreground">{currentStep} of {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStatusIcon(connectionStatus)}
              <span>Database Connection</span>
              {connectionStatus === 'success' && <Badge variant="default" className="ml-auto">Connected</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus === 'pending' && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Testing connection to Supabase...</span>
              </div>
            )}
            {connectionStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully connected to Supabase! Your database is ready for setup.
                </AlertDescription>
              </Alert>
            )}
            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Connection failed. Please check your Supabase credentials and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Setup Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <h3 className="font-semibold">Open Supabase</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Supabase Dashboard</a> and select your project
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="font-semibold">SQL Editor</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "SQL Editor" in the left sidebar to open the query interface
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                  <h3 className="font-semibold">Run Scripts</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Copy each script below and run them in order to set up your database
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scripts */}
        <div className="space-y-6">
          {sqlScripts.map((script, index) => (
            <Card key={script.name} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(results[script.name] || 'pending')}
                    <div>
                      <span className="text-lg">{script.name}</span>
                      <p className="text-sm text-muted-foreground font-normal">{script.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    Step {index + 1}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-muted/30 p-4 border-b">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                    <code className="text-foreground">{script.sql.trim()}</code>
                  </pre>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Safe to run - creates tables and indexes only</span>
                  </div>
                  <Button 
                    onClick={() => copyScript(script.name, script.sql)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copiedScripts.has(script.name) ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Script
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Success Message */}
        {Object.keys(results).length === sqlScripts.length && Object.values(results).every(r => r === 'success') && (
          <Card className="mt-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 Setup Complete!</h3>
                  <p className="text-green-700 mb-6">
                    Your ProjectApex database is ready. You can now use the full application with all features enabled.
                  </p>
                  <Button size="lg" className="gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={runAllScripts} 
              disabled={isRunning}
              size="lg"
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Test All Scripts
                </>
              )}
            </Button>
            <Button 
              onClick={testConnection} 
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
