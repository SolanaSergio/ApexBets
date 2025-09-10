#!/usr/bin/env python3
"""
ML Prediction Models for Project Apex
Implements various machine learning models for sports predictions
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report, mean_absolute_error
import joblib
import logging
from datetime import datetime
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_utils import DatabaseManager
from ml_models.feature_engineering import FeatureEngineer

logger = logging.getLogger(__name__)

class GameOutcomePredictor:
    """Predicts game winners using classification models"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.is_trained = False
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for game outcome prediction"""
        feature_cols = [
            'home_avg_scored', 'home_avg_allowed', 'away_avg_scored', 'away_avg_allowed',
            'home_point_diff', 'away_point_diff', 'point_diff_advantage',
            'home_win_pct', 'away_win_pct', 'win_pct_advantage',
            'home_court_advantage', 'home_recent_form', 'away_recent_form', 'form_advantage',
            'h2h_win_pct', 'home_consistency', 'away_consistency'
        ]
        
        # Filter to available columns
        available_cols = [col for col in feature_cols if col in df.columns]
        self.feature_columns = available_cols
        
        return df[available_cols].fillna(0)
    
    def train(self, training_data: pd.DataFrame):
        """Train the game outcome prediction model"""
        try:
            if training_data.empty or 'home_win' not in training_data.columns:
                logger.error("Invalid training data for game outcome prediction")
                return False
            
            # Prepare features and target
            X = self.prepare_features(training_data)
            y = training_data['home_win']
            
            if X.empty:
                logger.error("No valid features for training")
                return False
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train ensemble model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_accuracy = self.model.score(X_train_scaled, y_train)
            test_accuracy = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"Game Outcome Model - Train Accuracy: {train_accuracy:.3f}, Test Accuracy: {test_accuracy:.3f}")
            
            # Cross-validation
            cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
            logger.info(f"Cross-validation accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
            self.is_trained = True
            return True
            
        except Exception as e:
            logger.error(f"Error training game outcome model: {str(e)}")
            return False
    
    def predict(self, features: pd.DataFrame) -> Dict:
        """Predict game outcome"""
        if not self.is_trained or self.model is None:
            return {'home_win_probability': 0.5, 'confidence': 0.0}
        
        try:
            X = self.prepare_features(features)
            X_scaled = self.scaler.transform(X)
            
            # Get probability predictions
            probabilities = self.model.predict_proba(X_scaled)
            home_win_prob = probabilities[0][1] if len(probabilities[0]) > 1 else 0.5
            
            # Calculate confidence based on how far from 0.5 the prediction is
            confidence = abs(home_win_prob - 0.5) * 2
            
            return {
                'home_win_probability': home_win_prob,
                'away_win_probability': 1 - home_win_prob,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Error predicting game outcome: {str(e)}")
            return {'home_win_probability': 0.5, 'confidence': 0.0}

class SpreadPredictor:
    """Predicts point spreads using regression models"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.is_trained = False
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for spread prediction"""
        feature_cols = [
            'home_avg_scored', 'home_avg_allowed', 'away_avg_scored', 'away_avg_allowed',
            'point_diff_advantage', 'win_pct_advantage', 'home_court_advantage',
            'form_advantage', 'h2h_avg_margin', 'projected_spread'
        ]
        
        available_cols = [col for col in feature_cols if col in df.columns]
        self.feature_columns = available_cols
        
        return df[available_cols].fillna(0)
    
    def train(self, training_data: pd.DataFrame):
        """Train the spread prediction model"""
        try:
            if training_data.empty or 'point_spread' not in training_data.columns:
                logger.error("Invalid training data for spread prediction")
                return False
            
            X = self.prepare_features(training_data)
            y = training_data['point_spread']
            
            if X.empty:
                logger.error("No valid features for training")
                return False
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train gradient boosting regressor
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_predictions = self.model.predict(X_train_scaled)
            test_predictions = self.model.predict(X_test_scaled)
            
            train_mae = mean_absolute_error(y_train, train_predictions)
            test_mae = mean_absolute_error(y_test, test_predictions)
            
            logger.info(f"Spread Model - Train MAE: {train_mae:.2f}, Test MAE: {test_mae:.2f}")
            
            self.is_trained = True
            return True
            
        except Exception as e:
            logger.error(f"Error training spread model: {str(e)}")
            return False
    
    def predict(self, features: pd.DataFrame) -> Dict:
        """Predict point spread"""
        if not self.is_trained or self.model is None:
            return {'predicted_spread': 0.0, 'confidence': 0.0}
        
        try:
            X = self.prepare_features(features)
            X_scaled = self.scaler.transform(X)
            
            predicted_spread = self.model.predict(X_scaled)[0]
            
            # Estimate confidence based on feature importance and values
            confidence = min(0.8, abs(predicted_spread) / 20.0)  # Higher confidence for larger spreads
            
            return {
                'predicted_spread': predicted_spread,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Error predicting spread: {str(e)}")
            return {'predicted_spread': 0.0, 'confidence': 0.0}

class TotalPointsPredictor:
    """Predicts total points (over/under) using regression models"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = None
        self.is_trained = False
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for total points prediction"""
        feature_cols = [
            'home_avg_scored', 'home_avg_allowed', 'away_avg_scored', 'away_avg_allowed',
            'projected_home_score', 'projected_away_score', 'projected_total',
            'h2h_avg_total', 'home_consistency', 'away_consistency'
        ]
        
        available_cols = [col for col in feature_cols if col in df.columns]
        self.feature_columns = available_cols
        
        return df[available_cols].fillna(0)
    
    def train(self, training_data: pd.DataFrame):
        """Train the total points prediction model"""
        try:
            if training_data.empty or 'total_points' not in training_data.columns:
                logger.error("Invalid training data for total points prediction")
                return False
            
            X = self.prepare_features(training_data)
            y = training_data['total_points']
            
            if X.empty:
                logger.error("No valid features for training")
                return False
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train random forest regressor
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_predictions = self.model.predict(X_train_scaled)
            test_predictions = self.model.predict(X_test_scaled)
            
            train_mae = mean_absolute_error(y_train, train_predictions)
            test_mae = mean_absolute_error(y_test, test_predictions)
            
            logger.info(f"Total Points Model - Train MAE: {train_mae:.2f}, Test MAE: {test_mae:.2f}")
            
            self.is_trained = True
            return True
            
        except Exception as e:
            logger.error(f"Error training total points model: {str(e)}")
            return False
    
    def predict(self, features: pd.DataFrame) -> Dict:
        """Predict total points"""
        if not self.is_trained or self.model is None:
            return {'predicted_total': 220.0, 'confidence': 0.0}
        
        try:
            X = self.prepare_features(features)
            X_scaled = self.scaler.transform(X)
            
            predicted_total = self.model.predict(X_scaled)[0]
            
            # Estimate confidence
            confidence = min(0.8, 1.0 - abs(predicted_total - 220) / 100.0)  # Higher confidence near average
            
            return {
                'predicted_total': predicted_total,
                'confidence': max(0.1, confidence)
            }
            
        except Exception as e:
            logger.error(f"Error predicting total points: {str(e)}")
            return {'predicted_total': 220.0, 'confidence': 0.0}

class MLModelManager:
    """Manages all ML models for Project Apex"""
    
    def __init__(self):
        self.outcome_model = GameOutcomePredictor()
        self.spread_model = SpreadPredictor()
        self.total_model = TotalPointsPredictor()
        self.feature_engineer = FeatureEngineer()
        self.db = DatabaseManager()
        self.models_dir = "ml_models/saved_models"
        
        # Create models directory
        os.makedirs(self.models_dir, exist_ok=True)
    
    def train_all_models(self, start_date: str = None, end_date: str = None):
        """Train all prediction models"""
        logger.info("Starting model training...")
        
        # Prepare training data
        training_data = self.feature_engineer.prepare_training_data(start_date, end_date)
        
        if training_data.empty:
            logger.error("No training data available")
            return False
        
        logger.info(f"Training with {len(training_data)} samples")
        
        # Train models
        outcome_success = self.outcome_model.train(training_data)
        spread_success = self.spread_model.train(training_data)
        total_success = self.total_model.train(training_data)
        
        # Save models
        if outcome_success:
            self.save_model(self.outcome_model, 'game_outcome_model')
        if spread_success:
            self.save_model(self.spread_model, 'spread_model')
        if total_success:
            self.save_model(self.total_model, 'total_points_model')
        
        success_count = sum([outcome_success, spread_success, total_success])
        logger.info(f"Successfully trained {success_count}/3 models")
        
        return success_count > 0
    
    def save_model(self, model, model_name: str):
        """Save a trained model"""
        try:
            model_path = os.path.join(self.models_dir, f"{model_name}.joblib")
            joblib.dump(model, model_path)
            logger.info(f"Saved model: {model_name}")
        except Exception as e:
            logger.error(f"Error saving model {model_name}: {str(e)}")
    
    def load_model(self, model_name: str):
        """Load a saved model"""
        try:
            model_path = os.path.join(self.models_dir, f"{model_name}.joblib")
            if os.path.exists(model_path):
                return joblib.load(model_path)
            else:
                logger.warning(f"Model file not found: {model_path}")
                return None
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            return None
    
    def predict_game(self, home_team_id: str, away_team_id: str) -> Dict:
        """Generate comprehensive predictions for a game"""
        try:
            # Create features
            features_dict = self.feature_engineer.create_game_features(home_team_id, away_team_id)
            features_df = pd.DataFrame([features_dict])
            
            # Get predictions from all models
            outcome_pred = self.outcome_model.predict(features_df)
            spread_pred = self.spread_model.predict(features_df)
            total_pred = self.total_model.predict(features_df)
            
            # Combine predictions
            predictions = {
                'home_win_probability': outcome_pred['home_win_probability'],
                'away_win_probability': outcome_pred['away_win_probability'],
                'predicted_spread': spread_pred['predicted_spread'],
                'predicted_total': total_pred['predicted_total'],
                'confidence_scores': {
                    'outcome': outcome_pred['confidence'],
                    'spread': spread_pred['confidence'],
                    'total': total_pred['confidence']
                },
                'model_name': 'Project Apex ML',
                'prediction_time': datetime.now().isoformat()
            }
            
            return predictions
            
        except Exception as e:
            logger.error(f"Error generating game predictions: {str(e)}")
            return {
                'home_win_probability': 0.5,
                'away_win_probability': 0.5,
                'predicted_spread': 0.0,
                'predicted_total': 220.0,
                'confidence_scores': {'outcome': 0.0, 'spread': 0.0, 'total': 0.0}
            }

if __name__ == "__main__":
    # Initialize and train models
    manager = MLModelManager()
    
    # Train models with recent data
    success = manager.train_all_models()
    
    if success:
        logger.info("Model training completed successfully")
    else:
        logger.error("Model training failed")
