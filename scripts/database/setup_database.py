#!/usr/bin/env python3
"""
Project Apex Database Setup Script
Runs all SQL scripts and tests database connection
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import time
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('../.env.local')

# Database connection details from environment variables
def get_db_connection():
    """Get database connection using environment variables"""
    try:
        # Try Supabase connection first
        supabase_url = os.getenv('POSTGRES_URL')
        if not supabase_url:
            print("❌ POSTGRES_URL not found in environment variables")
            return None
            
        print(f"🔗 Connecting to Supabase database...")
        conn = psycopg2.connect(supabase_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("✅ Successfully connected to Supabase database!")
        return conn
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return None

def run_sql_file(conn, file_path, description):
    """Run a SQL file and report results"""
    try:
        print(f"\n📄 Running {description}...")
        
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        cursor.close()
        
        print(f"✅ {description} completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Error running {description}: {e}")
        return False

def test_database_setup(conn):
    """Test that all tables were created successfully"""
    try:
        print(f"\n🔍 Testing database setup...")
        
        cursor = conn.cursor()
        
        # Check if tables exist
        tables_to_check = [
            'teams', 'games', 'odds', 'player_stats', 
            'predictions', 'scrape_logs', 'profiles', 'user_alerts'
        ]
        
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY(%s)
        """, (tables_to_check,))
        
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print(f"📊 Found {len(existing_tables)} tables:")
        for table in existing_tables:
            print(f"   ✅ {table}")
        
        missing_tables = set(tables_to_check) - set(existing_tables)
        if missing_tables:
            print(f"⚠️  Missing tables: {missing_tables}")
        else:
            print("🎉 All required tables are present!")
        
        # Check sample data
        cursor.execute("SELECT COUNT(*) FROM teams")
        team_count = cursor.fetchone()[0]
        print(f"📈 Teams in database: {team_count}")
        
        cursor.execute("SELECT COUNT(*) FROM games")
        game_count = cursor.fetchone()[0]
        print(f"🏀 Games in database: {game_count}")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Error testing database: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Project Apex Database Setup")
    print("=" * 50)
    
    # Test database connection
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot proceed without database connection")
        sys.exit(1)
    
    # Get script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define scripts to run in order
    scripts = [
        ("001_create_core_tables.sql", "Core Tables Creation"),
        ("002_enable_rls.sql", "Row Level Security Setup"),
        ("003_create_profile_trigger.sql", "Profile Trigger Creation"),
        ("004_seed_sample_data.sql", "Sample Data Seeding")
    ]
    
    success_count = 0
    total_scripts = len(scripts)
    
    # Run each script
    for script_file, description in scripts:
        script_path = os.path.join(script_dir, script_file)
        if os.path.exists(script_path):
            if run_sql_file(conn, script_path, description):
                success_count += 1
        else:
            print(f"⚠️  Script not found: {script_file}")
    
    # Test the setup
    if success_count == total_scripts:
        test_database_setup(conn)
        print(f"\n🎉 Database setup completed successfully!")
        print(f"✅ {success_count}/{total_scripts} scripts executed successfully")
    else:
        print(f"\n⚠️  Database setup completed with warnings")
        print(f"✅ {success_count}/{total_scripts} scripts executed successfully")
    
    conn.close()
    print("\n🔗 Database connection closed")

if __name__ == "__main__":
    main()
