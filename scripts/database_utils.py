#!/usr/bin/env python3
"""
Database utilities for Project Apex
Handles database connections and data insertion for scraped data
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from typing import Dict, List, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        # Use Supabase connection string from environment
        self.connection_string = os.getenv('SUPABASE_URL') or os.getenv('NEON_DATABASE_URL')
        if not self.connection_string:
            raise ValueError("No database connection string found in environment variables")
    
    def get_connection(self):
        """Get database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            raise
    
    def insert_teams(self, teams: List[Dict]):
        """Insert team data into database"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    for team in teams:
                        cur.execute("""
                            INSERT INTO teams (name, city, league, sport, abbreviation)
                            VALUES (%(name)s, %(city)s, %(league)s, %(sport)s, %(abbreviation)s)
                            ON CONFLICT (abbreviation) DO UPDATE SET
                                name = EXCLUDED.name,
                                city = EXCLUDED.city,
                                updated_at = NOW()
                        """, team)
                    conn.commit()
            logger.info(f"Successfully inserted {len(teams)} teams")
        except Exception as e:
            logger.error(f"Error inserting teams: {str(e)}")
    
    def insert_games(self, games: List[Dict]):
        """Insert game data into database"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    for game in games:
                        # First, get team IDs
                        cur.execute("SELECT id FROM teams WHERE name = %s", (game['home_team'],))
                        home_team_result = cur.fetchone()
                        
                        cur.execute("SELECT id FROM teams WHERE name = %s", (game['away_team'],))
                        away_team_result = cur.fetchone()
                        
                        if home_team_result and away_team_result:
                            cur.execute("""
                                INSERT INTO games (home_team_id, away_team_id, game_date, season, status)
                                VALUES (%s, %s, %s, %s, %s)
                                ON CONFLICT DO NOTHING
                            """, (
                                home_team_result[0],
                                away_team_result[0],
                                game['game_date'],
                                game['season'],
                                game['status']
                            ))
                    conn.commit()
            logger.info(f"Successfully processed {len(games)} games")
        except Exception as e:
            logger.error(f"Error inserting games: {str(e)}")
    
    def insert_odds(self, odds_data: List[Dict]):
        """Insert odds data into database"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    for odds in odds_data:
                        # Find matching game
                        cur.execute("""
                            SELECT g.id FROM games g
                            JOIN teams ht ON g.home_team_id = ht.id
                            JOIN teams at ON g.away_team_id = at.id
                            WHERE ht.name = %s AND at.name = %s
                            AND g.game_date >= CURRENT_DATE
                            ORDER BY g.game_date ASC
                            LIMIT 1
                        """, (odds['home_team'], odds['away_team']))
                        
                        game_result = cur.fetchone()
                        if game_result:
                            cur.execute("""
                                INSERT INTO odds (game_id, source, odds_type, home_odds, away_odds, spread, total, timestamp)
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            """, (
                                game_result[0],
                                odds['source'],
                                'combined',
                                odds.get('home_ml'),
                                odds.get('away_ml'),
                                odds.get('spread'),
                                odds.get('total'),
                                odds['timestamp']
                            ))
                    conn.commit()
            logger.info(f"Successfully inserted {len(odds_data)} odds entries")
        except Exception as e:
            logger.error(f"Error inserting odds: {str(e)}")
    
    def log_scrape_activity(self, source: str, data_type: str, records_count: int, success: bool, error_message: str = None):
        """Log scraping activity"""
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO scrape_logs (source, data_type, records_scraped, success, error_message)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (source, data_type, records_count, success, error_message))
                    conn.commit()
        except Exception as e:
            logger.error(f"Error logging scrape activity: {str(e)}")
