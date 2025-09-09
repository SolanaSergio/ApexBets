#!/usr/bin/env python3
"""
Odds Scraper for Project Apex
Scrapes betting odds from free sources and odds comparison sites
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database_utils import DatabaseManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OddsScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.db = DatabaseManager()
    
    def scrape_odds_from_covers(self) -> List[Dict]:
        """Scrape odds from Covers.com (free odds comparison site)"""
        try:
            logger.info("Scraping odds from Covers.com...")
            url = "https://www.covers.com/sports/nba/odds"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            odds_data = []
            
            # Find odds containers
            game_rows = soup.find_all('tr', class_='covers-CoversOddsTable-row')
            
            for row in game_rows:
                try:
                    # Extract team names
                    team_cells = row.find_all('td', class_='covers-CoversOddsTable-team')
                    if len(team_cells) >= 2:
                        away_team = team_cells[0].get_text(strip=True)
                        home_team = team_cells[1].get_text(strip=True)
                        
                        # Extract moneyline odds
                        ml_cells = row.find_all('td', class_='covers-CoversOddsTable-ml')
                        if len(ml_cells) >= 2:
                            away_ml = ml_cells[0].get_text(strip=True)
                            home_ml = ml_cells[1].get_text(strip=True)
                            
                            # Extract spread
                            spread_cells = row.find_all('td', class_='covers-CoversOddsTable-spread')
                            spread = spread_cells[0].get_text(strip=True) if spread_cells else "N/A"
                            
                            # Extract total
                            total_cells = row.find_all('td', class_='covers-CoversOddsTable-total')
                            total = total_cells[0].get_text(strip=True) if total_cells else "N/A"
                            
                            odds_data.append({
                                'home_team': home_team,
                                'away_team': away_team,
                                'home_ml': self._parse_odds(home_ml),
                                'away_ml': self._parse_odds(away_ml),
                                'spread': self._parse_spread(spread),
                                'total': self._parse_total(total),
                                'source': 'covers.com',
                                'timestamp': datetime.now().isoformat()
                            })
                
                except Exception as e:
                    logger.warning(f"Error parsing odds row: {str(e)}")
                    continue
            
            logger.info(f"Successfully scraped {len(odds_data)} odds entries")
            return odds_data
            
        except Exception as e:
            logger.error(f"Error scraping odds: {str(e)}")
            return []
    
    def _parse_odds(self, odds_str: str) -> Optional[float]:
        """Parse moneyline odds string to decimal"""
        try:
            if odds_str and odds_str != "N/A":
                # Remove + sign and convert to float
                clean_odds = odds_str.replace('+', '').replace('−', '-')
                return float(clean_odds)
        except:
            pass
        return None
    
    def _parse_spread(self, spread_str: str) -> Optional[float]:
        """Parse spread string to decimal"""
        try:
            if spread_str and spread_str != "N/A":
                # Extract numeric part
                import re
                match = re.search(r'[-+]?\d+\.?\d*', spread_str)
                if match:
                    return float(match.group())
        except:
            pass
        return None
    
    def _parse_total(self, total_str: str) -> Optional[float]:
        """Parse total/over-under string to decimal"""
        try:
            if total_str and total_str != "N/A":
                import re
                match = re.search(r'\d+\.?\d*', total_str)
                if match:
                    return float(match.group())
        except:
            pass
        return None
    
    def run_odds_scrape(self):
        """Run odds scraping session"""
        logger.info("Starting odds scrape...")
        
        odds_data = self.scrape_odds_from_covers()
        if odds_data:
            self.db.insert_odds(odds_data)
            self.db.log_scrape_activity('covers.com', 'odds', len(odds_data), True)
        
        logger.info("Odds scrape completed")

if __name__ == "__main__":
    scraper = OddsScraper()
    scraper.run_odds_scrape()
