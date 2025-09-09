#!/usr/bin/env python3
"""
Feature Engineering for Project Apex ML Models
Prepares sports data for machine learning predictions
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_utils import DatabaseManager

logger = logging.getLogger(__name__)

class FeatureEngineer:
    def __init__(self):
        self.db = DatabaseManager()
    
    def get_team_stats(self, team_id: str, games_back: int = 10) -> Dict:
        """Calculate team statistics over recent games"""
        try:
            with self.db.get_connection() as conn:
                # Get recent games for the team
                query = """
                    SELECT 
                        g.id,
                        g.home_team_id,
                        g.away_team_id,
                        g.home_score,
                        g.away_score,
                        g.game_date,
                        CASE 
                            WHEN g.home_team_id = %s THEN 'home'
                            ELSE 'away'
                        END as venue
                    FROM games g
                    WHERE (g.home_team_id = %s OR g.away_team_id = %s)
                        AND g.status = 'completed'
                        AND g.home_score IS NOT NULL
                        AND g.away_score IS NOT NULL
                    ORDER BY g.game_date DESC
                    LIMIT %s
                """
                
                df = pd.read_sql(query, conn, params=[team_id, team_id, team_id, games_back])
                
                if df.empty:
                    return self._get_default_stats()
                
                # Calculate team performance metrics
                stats = {}
                
                # Points scored and allowed
                team_scores = []
                opponent_scores = []
                
                for _, row in df.iterrows():
                    if row['venue'] == 'home':
                        team_scores.append(row['home_score'])
                        opponent_scores.append(row['away_score'])
                    else:
                        team_scores.append(row['away_score'])
                        opponent_scores.append(row['home_score'])
                
                stats['avg_points_scored'] = np.mean(team_scores)
                stats['avg_points_allowed'] = np.mean(opponent_scores)
                stats['avg_point_differential'] = stats['avg_points_scored'] - stats['avg_points_allowed']
                
                # Win percentage
                wins = sum(1 for i, score in enumerate(team_scores) if score > opponent_scores[i])
                stats['win_percentage'] = wins / len(team_scores) if team_scores else 0
                
                # Home/Away splits
                home_games = df[df['venue'] == 'home']
                away_games = df[df['venue'] == 'away']
                
                stats['home_win_pct'] = self._calculate_win_pct(home_games, 'home') if not home_games.empty else 0.5
                stats['away_win_pct'] = self._calculate_win_pct(away_games, 'away') if not away_games.empty else 0.5
                
                # Recent form (last 5 games)
                recent_games = df.head(5)
                if not recent_games.empty:
                    recent_wins = 0
                    for _, row in recent_games.iterrows():
                        if row['venue'] == 'home' and row['home_score'] > row['away_score']:
                            recent_wins += 1
                        elif row['venue'] == 'away' and row['away_score'] > row['home_score']:
                            recent_wins += 1
                    stats['recent_form'] = recent_wins / len(recent_games)
                else:
                    stats['recent_form'] = 0.5
                
                # Scoring consistency (standard deviation)
                stats['scoring_consistency'] = 1 / (np.std(team_scores) + 1) if team_scores else 0.5
                
                return stats
                
        except Exception as e:
            logger.error(f"Error calculating team stats: {str(e)}")
            return self._get_default_stats()
    
    def _calculate_win_pct(self, games_df: pd.DataFrame, venue: str) -> float:
        """Calculate win percentage for home/away games"""
        if games_df.empty:
            return 0.5
        
        wins = 0
        for _, row in games_df.iterrows():
            if venue == 'home' and row['home_score'] > row['away_score']:
                wins += 1
            elif venue == 'away' and row['away_score'] > row['home_score']:
                wins += 1
        
        return wins / len(games_df)
    
    def _get_default_stats(self) -> Dict:
        """Return default stats when no data available"""
        return {
            'avg_points_scored': 110.0,
            'avg_points_allowed': 110.0,
            'avg_point_differential': 0.0,
            'win_percentage': 0.5,
            'home_win_pct': 0.5,
            'away_win_pct': 0.5,
            'recent_form': 0.5,
            'scoring_consistency': 0.5
        }
    
    def get_head_to_head_stats(self, team1_id: str, team2_id: str, games_back: int = 5) -> Dict:
        """Get head-to-head statistics between two teams"""
        try:
            with self.db.get_connection() as conn:
                query = """
                    SELECT 
                        home_team_id,
                        away_team_id,
                        home_score,
                        away_score,
                        game_date
                    FROM games
                    WHERE ((home_team_id = %s AND away_team_id = %s) 
                           OR (home_team_id = %s AND away_team_id = %s))
                        AND status = 'completed'
                        AND home_score IS NOT NULL
                        AND away_score IS NOT NULL
                    ORDER BY game_date DESC
                    LIMIT %s
                """
                
                df = pd.read_sql(query, conn, params=[team1_id, team2_id, team2_id, team1_id, games_back])
                
                if df.empty:
                    return {'h2h_win_pct': 0.5, 'avg_total_points': 220.0, 'avg_margin': 0.0}
                
                team1_wins = 0
                total_points = []
                margins = []
                
                for _, row in df.iterrows():
                    if row['home_team_id'] == team1_id:
                        if row['home_score'] > row['away_score']:
                            team1_wins += 1
                        margins.append(row['home_score'] - row['away_score'])
                    else:
                        if row['away_score'] > row['home_score']:
                            team1_wins += 1
                        margins.append(row['away_score'] - row['home_score'])
                    
                    total_points.append(row['home_score'] + row['away_score'])
                
                return {
                    'h2h_win_pct': team1_wins / len(df),
                    'avg_total_points': np.mean(total_points),
                    'avg_margin': np.mean(margins)
                }
                
        except Exception as e:
            logger.error(f"Error calculating head-to-head stats: {str(e)}")
            return {'h2h_win_pct': 0.5, 'avg_total_points': 220.0, 'avg_margin': 0.0}
    
    def create_game_features(self, home_team_id: str, away_team_id: str) -> Dict:
        """Create feature vector for a game prediction"""
        # Get team statistics
        home_stats = self.get_team_stats(home_team_id)
        away_stats = self.get_team_stats(away_team_id)
        h2h_stats = self.get_head_to_head_stats(home_team_id, away_team_id)
        
        # Create feature dictionary
        features = {}
        
        # Team strength features
        features['home_avg_scored'] = home_stats['avg_points_scored']
        features['home_avg_allowed'] = home_stats['avg_points_allowed']
        features['away_avg_scored'] = away_stats['avg_points_scored']
        features['away_avg_allowed'] = away_stats['avg_points_allowed']
        
        # Differential features
        features['home_point_diff'] = home_stats['avg_point_differential']
        features['away_point_diff'] = away_stats['avg_point_differential']
        features['point_diff_advantage'] = features['home_point_diff'] - features['away_point_diff']
        
        # Win percentage features
        features['home_win_pct'] = home_stats['win_percentage']
        features['away_win_pct'] = away_stats['win_percentage']
        features['win_pct_advantage'] = features['home_win_pct'] - features['away_win_pct']
        
        # Home court advantage
        features['home_court_advantage'] = home_stats['home_win_pct'] - away_stats['away_win_pct']
        
        # Recent form
        features['home_recent_form'] = home_stats['recent_form']
        features['away_recent_form'] = away_stats['recent_form']
        features['form_advantage'] = features['home_recent_form'] - features['away_recent_form']
        
        # Head-to-head
        features['h2h_win_pct'] = h2h_stats['h2h_win_pct']
        features['h2h_avg_total'] = h2h_stats['avg_total_points']
        features['h2h_avg_margin'] = h2h_stats['avg_margin']
        
        # Consistency features
        features['home_consistency'] = home_stats['scoring_consistency']
        features['away_consistency'] = away_stats['scoring_consistency']
        
        # Projected totals
        features['projected_home_score'] = (home_stats['avg_points_scored'] + away_stats['avg_points_allowed']) / 2
        features['projected_away_score'] = (away_stats['avg_points_scored'] + home_stats['avg_points_allowed']) / 2
        features['projected_total'] = features['projected_home_score'] + features['projected_away_score']
        features['projected_spread'] = features['projected_home_score'] - features['projected_away_score']
        
        return features
    
    def prepare_training_data(self, start_date: str = None, end_date: str = None) -> pd.DataFrame:
        """Prepare training dataset from historical games"""
        try:
            with self.db.get_connection() as conn:
                # Get completed games with scores
                query = """
                    SELECT 
                        g.id,
                        g.home_team_id,
                        g.away_team_id,
                        g.home_score,
                        g.away_score,
                        g.game_date,
                        ht.name as home_team_name,
                        at.name as away_team_name
                    FROM games g
                    JOIN teams ht ON g.home_team_id = ht.id
                    JOIN teams at ON g.away_team_id = at.id
                    WHERE g.status = 'completed'
                        AND g.home_score IS NOT NULL
                        AND g.away_score IS NOT NULL
                """
                
                params = []
                if start_date:
                    query += " AND g.game_date >= %s"
                    params.append(start_date)
                if end_date:
                    query += " AND g.game_date <= %s"
                    params.append(end_date)
                
                query += " ORDER BY g.game_date"
                
                games_df = pd.read_sql(query, conn, params=params)
                
                if games_df.empty:
                    logger.warning("No completed games found for training")
                    return pd.DataFrame()
                
                # Create features for each game
                training_data = []
                
                for _, game in games_df.iterrows():
                    features = self.create_game_features(game['home_team_id'], game['away_team_id'])
                    
                    # Add target variables
                    features['home_score'] = game['home_score']
                    features['away_score'] = game['away_score']
                    features['total_points'] = game['home_score'] + game['away_score']
                    features['home_win'] = 1 if game['home_score'] > game['away_score'] else 0
                    features['point_spread'] = game['home_score'] - game['away_score']
                    features['game_id'] = game['id']
                    features['game_date'] = game['game_date']
                    
                    training_data.append(features)
                
                return pd.DataFrame(training_data)
                
        except Exception as e:
            logger.error(f"Error preparing training data: {str(e)}")
            return pd.DataFrame()

if __name__ == "__main__":
    engineer = FeatureEngineer()
    
    # Test feature engineering
    training_data = engineer.prepare_training_data()
    if not training_data.empty:
        print(f"Prepared {len(training_data)} training samples")
        print("Feature columns:", training_data.columns.tolist())
    else:
        print("No training data available")
