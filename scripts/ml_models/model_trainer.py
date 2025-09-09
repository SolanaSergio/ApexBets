#!/usr/bin/env python3
"""
Model Training Script for Project Apex
Trains and evaluates ML models for sports predictions
"""

import logging
import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_models.prediction_models import MLModelManager
from database_utils import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('model_training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def main():
    """Main training function"""
    logger.info("Starting Project Apex ML model training...")
    
    try:
        # Initialize model manager
        manager = MLModelManager()
        
        # Set training date range (last 2 seasons of data)
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
        
        logger.info(f"Training models with data from {start_date} to {end_date}")
        
        # Train all models
        success = manager.train_all_models(start_date, end_date)
        
        if success:
            logger.info("✅ Model training completed successfully!")
            
            # Test predictions on a sample game
            db = DatabaseManager()
            with db.get_connection() as conn:
                # Get a recent game for testing
                import pandas as pd
                test_query = """
                    SELECT home_team_id, away_team_id, ht.name as home_team, at.name as away_team
                    FROM games g
                    JOIN teams ht ON g.home_team_id = ht.id
                    JOIN teams at ON g.away_team_id = at.id
                    WHERE g.status = 'scheduled'
                    ORDER BY g.game_date ASC
                    LIMIT 1
                """
                
                test_df = pd.read_sql(test_query, conn)
                
                if not test_df.empty:
                    test_game = test_df.iloc[0]
                    logger.info(f"Testing prediction for: {test_game['home_team']} vs {test_game['away_team']}")
                    
                    predictions = manager.predict_game(test_game['home_team_id'], test_game['away_team_id'])
                    
                    logger.info("Sample Predictions:")
                    logger.info(f"  Home Win Probability: {predictions['home_win_probability']:.3f}")
                    logger.info(f"  Predicted Spread: {predictions['predicted_spread']:.1f}")
                    logger.info(f"  Predicted Total: {predictions['predicted_total']:.1f}")
        else:
            logger.error("❌ Model training failed!")
            return 1
        
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
