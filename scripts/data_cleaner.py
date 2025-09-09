#!/usr/bin/env python3
"""
Data Cleaning Utilities for Project Apex
Cleans and validates scraped sports data
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from database_utils import DatabaseManager

logger = logging.getLogger(__name__)

class DataCleaner:
    def __init__(self):
        self.db = DatabaseManager()
        
        # Team name mappings for consistency
        self.team_name_mappings = {
            'LA Lakers': 'Lakers',
            'Los Angeles Lakers': 'Lakers',
            'Golden State Warriors': 'Warriors',
            'GS Warriors': 'Warriors',
            'Boston Celtics': 'Celtics',
            'Miami Heat': 'Heat',
            'New York Knicks': 'Knicks',
            'NY Knicks': 'Knicks',
            'Chicago Bulls': 'Bulls',
            'Brooklyn Nets': 'Nets',
            'Philadelphia 76ers': '76ers',
            'Phila 76ers': '76ers'
        }
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names for consistency"""
        if not team_name:
            return ""
        
        # Clean the name
        clean_name = team_name.strip()
        
        # Apply mappings
        if clean_name in self.team_name_mappings:
            return self.team_name_mappings[clean_name]
        
        return clean_name
    
    def validate_odds(self, odds_value: str) -> Optional[float]:
        """Validate and clean odds values"""
        if not odds_value or odds_value.lower() in ['n/a', 'tbd', '']:
            return None
        
        try:
            # Remove common prefixes/suffixes
            clean_odds = re.sub(r'[^\d\-+.]', '', str(odds_value))
            
            # Handle different odds formats
            if clean_odds.startswith('+'):
                return float(clean_odds[1:])
            elif clean_odds.startswith('-'):
                return float(clean_odds)
            else:
                return float(clean_odds)
        except (ValueError, AttributeError):
            logger.warning(f"Invalid odds value: {odds_value}")
            return None
    
    def validate_date(self, date_str: str) -> Optional[datetime]:
        """Validate and parse date strings"""
        if not date_str:
            return None
        
        # Common date formats
        date_formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y %H:%M'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Invalid date format: {date_str}")
        return None
    
    def clean_player_stats(self, stats: Dict) -> Dict:
        """Clean and validate player statistics"""
        cleaned_stats = {}
        
        # Required fields
        required_fields = ['player_name', 'position']
        for field in required_fields:
            if field not in stats or not stats[field]:
                logger.warning(f"Missing required field: {field}")
                return {}
            cleaned_stats[field] = str(stats[field]).strip()
        
        # Numeric stats
        numeric_fields = ['points', 'rebounds', 'assists', 'steals', 'blocks', 
                         'turnovers', 'minutes_played']
        
        for field in numeric_fields:
            if field in stats:
                try:
                    value = float(stats[field]) if stats[field] else 0.0
                    cleaned_stats[field] = max(0, value)  # Ensure non-negative
                except (ValueError, TypeError):
                    cleaned_stats[field] = 0.0
        
        return cleaned_stats
    
    def remove_duplicate_games(self):
        """Remove duplicate games from database"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cur:
                    # Find and remove duplicate games
                    cur.execute("""
                        DELETE FROM games 
                        WHERE id NOT IN (
                            SELECT MIN(id) 
                            FROM games 
                            GROUP BY home_team_id, away_team_id, game_date
                        )
                    """)
                    
                    deleted_count = cur.rowcount
                    conn.commit()
                    
                    logger.info(f"Removed {deleted_count} duplicate games")
                    
        except Exception as e:
            logger.error(f"Error removing duplicate games: {str(e)}")
    
    def clean_old_odds(self, days_old: int = 7):
        """Clean odds data older than specified days"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cur:
                    cutoff_date = datetime.now() - timedelta(days=days_old)
                    
                    cur.execute("""
                        DELETE FROM odds 
                        WHERE timestamp < %s
                    """, (cutoff_date,))
                    
                    deleted_count = cur.rowcount
                    conn.commit()
                    
                    logger.info(f"Cleaned {deleted_count} old odds records")
                    
        except Exception as e:
            logger.error(f"Error cleaning old odds: {str(e)}")
    
    def validate_data_integrity(self):
        """Run data integrity checks"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cur:
                    # Check for games without valid teams
                    cur.execute("""
                        SELECT COUNT(*) FROM games g
                        LEFT JOIN teams ht ON g.home_team_id = ht.id
                        LEFT JOIN teams at ON g.away_team_id = at.id
                        WHERE ht.id IS NULL OR at.id IS NULL
                    """)
                    
                    invalid_games = cur.fetchone()[0]
                    if invalid_games > 0:
                        logger.warning(f"Found {invalid_games} games with invalid team references")
                    
                    # Check for odds without valid games
                    cur.execute("""
                        SELECT COUNT(*) FROM odds o
                        LEFT JOIN games g ON o.game_id = g.id
                        WHERE g.id IS NULL
                    """)
                    
                    orphaned_odds = cur.fetchone()[0]
                    if orphaned_odds > 0:
                        logger.warning(f"Found {orphaned_odds} odds records without valid games")
                    
                    logger.info("Data integrity check completed")
                    
        except Exception as e:
            logger.error(f"Error during data integrity check: {str(e)}")
    
    def run_full_cleanup(self):
        """Run complete data cleaning process"""
        logger.info("Starting full data cleanup...")
        
        self.remove_duplicate_games()
        self.clean_old_odds()
        self.validate_data_integrity()
        
        logger.info("Full data cleanup completed")

if __name__ == "__main__":
    cleaner = DataCleaner()
    cleaner.run_full_cleanup()
