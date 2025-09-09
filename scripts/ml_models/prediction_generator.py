#!/usr/bin/env python3
"""
Prediction Generator for Project Apex
Generates predictions for upcoming games and stores them in database
"""

import logging
import sys
import os
from datetime import datetime, timedelta
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_models.prediction_models import MLModelManager
from database_utils import DatabaseManager

logger = logging.getLogger(__name__)

class PredictionGenerator:
    def __init__(self):
        self.model_manager = MLModelManager()
        self.db = DatabaseManager()
    
    def generate_predictions_for_upcoming_games(self, days_ahead: int = 7):
        """Generate predictions for upcoming games"""
        try:
            logger.info(f"Generating predictions for games in next {days_ahead} days...")
            
            # Get upcoming games
            with self.db.get_connection() as conn:
                query = """
                    SELECT 
                        g.id,
                        g.home_team_id,
                        g.away_team_id,
                        g.game_date,
                        ht.name as home_team,
                        at.name as away_team
                    FROM games g
                    JOIN teams ht ON g.home_team_id = ht.id
                    JOIN teams at ON g.away_team_id = at.id
                    WHERE g.status = 'scheduled'
                        AND g.game_date BETWEEN %s AND %s
                    ORDER BY g.game_date
                """
                
                start_date = datetime.now().date()
                end_date = start_date + timedelta(days=days_ahead)
                
                games_df = pd.read_sql(query, conn, params=[start_date, end_date])
            
            if games_df.empty:
                logger.info("No upcoming games found")
                return
            
            logger.info(f"Found {len(games_df)} upcoming games")
            
            # Generate predictions for each game
            predictions_made = 0
            
            for _, game in games_df.iterrows():
                try:
                    predictions = self.model_manager.predict_game(
                        game['home_team_id'], 
                        game['away_team_id']
                    )
                    
                    # Store predictions in database
                    self.store_predictions(game['id'], predictions)
                    
                    logger.info(f"Generated predictions for {game['home_team']} vs {game['away_team']}")
                    predictions_made += 1
                    
                except Exception as e:
                    logger.error(f"Error generating prediction for game {game['id']}: {str(e)}")
                    continue
            
            logger.info(f"Successfully generated {predictions_made} predictions")
            
        except Exception as e:
            logger.error(f"Error generating predictions: {str(e)}")
    
    def store_predictions(self, game_id: str, predictions: dict):
        """Store predictions in the database"""
        try:
            with self.db.get_connection() as conn:
                with conn.cursor() as cur:
                    # Store winner prediction
                    cur.execute("""
                        INSERT INTO predictions (game_id, model_name, prediction_type, predicted_value, confidence)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (game_id, model_name, prediction_type) 
                        DO UPDATE SET 
                            predicted_value = EXCLUDED.predicted_value,
                            confidence = EXCLUDED.confidence,
                            created_at = NOW()
                    """, (
                        game_id,
                        predictions['model_name'],
                        'winner',
                        predictions['home_win_probability'],
                        predictions['confidence_scores']['outcome']
                    ))
                    
                    # Store spread prediction
                    cur.execute("""
                        INSERT INTO predictions (game_id, model_name, prediction_type, predicted_value, confidence)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (game_id, model_name, prediction_type) 
                        DO UPDATE SET 
                            predicted_value = EXCLUDED.predicted_value,
                            confidence = EXCLUDED.confidence,
                            created_at = NOW()
                    """, (
                        game_id,
                        predictions['model_name'],
                        'spread',
                        predictions['predicted_spread'],
                        predictions['confidence_scores']['spread']
                    ))
                    
                    # Store total prediction
                    cur.execute("""
                        INSERT INTO predictions (game_id, model_name, prediction_type, predicted_value, confidence)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (game_id, model_name, prediction_type) 
                        DO UPDATE SET 
                            predicted_value = EXCLUDED.predicted_value,
                            confidence = EXCLUDED.confidence,
                            created_at = NOW()
                    """, (
                        game_id,
                        predictions['model_name'],
                        'total',
                        predictions['predicted_total'],
                        predictions['confidence_scores']['total']
                    ))
                    
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Error storing predictions: {str(e)}")
    
    def update_prediction_accuracy(self):
        """Update prediction accuracy for completed games"""
        try:
            logger.info("Updating prediction accuracy...")
            
            with self.db.get_connection() as conn:
                with conn.cursor() as cur:
                    # Update winner predictions
                    cur.execute("""
                        UPDATE predictions p
                        SET 
                            actual_value = CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END,
                            is_correct = CASE 
                                WHEN p.predicted_value > 0.5 AND g.home_score > g.away_score THEN TRUE
                                WHEN p.predicted_value <= 0.5 AND g.home_score <= g.away_score THEN TRUE
                                ELSE FALSE
                            END
                        FROM games g
                        WHERE p.game_id = g.id
                            AND p.prediction_type = 'winner'
                            AND g.status = 'completed'
                            AND g.home_score IS NOT NULL
                            AND g.away_score IS NOT NULL
                            AND p.actual_value IS NULL
                    """)
                    
                    # Update spread predictions
                    cur.execute("""
                        UPDATE predictions p
                        SET 
                            actual_value = g.home_score - g.away_score,
                            is_correct = ABS(p.predicted_value - (g.home_score - g.away_score)) <= 3
                        FROM games g
                        WHERE p.game_id = g.id
                            AND p.prediction_type = 'spread'
                            AND g.status = 'completed'
                            AND g.home_score IS NOT NULL
                            AND g.away_score IS NOT NULL
                            AND p.actual_value IS NULL
                    """)
                    
                    # Update total predictions
                    cur.execute("""
                        UPDATE predictions p
                        SET 
                            actual_value = g.home_score + g.away_score,
                            is_correct = ABS(p.predicted_value - (g.home_score + g.away_score)) <= 5
                        FROM games g
                        WHERE p.game_id = g.id
                            AND p.prediction_type = 'total'
                            AND g.status = 'completed'
                            AND g.home_score IS NOT NULL
                            AND g.away_score IS NOT NULL
                            AND p.actual_value IS NULL
                    """)
                    
                    conn.commit()
                    logger.info("Prediction accuracy updated successfully")
                    
        except Exception as e:
            logger.error(f"Error updating prediction accuracy: {str(e)}")

if __name__ == "__main__":
    generator = PredictionGenerator()
    
    # Generate predictions for upcoming games
    generator.generate_predictions_for_upcoming_games()
    
    # Update accuracy for completed games
    generator.update_prediction_accuracy()
