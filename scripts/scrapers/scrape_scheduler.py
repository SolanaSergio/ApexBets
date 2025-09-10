#!/usr/bin/env python3
"""
Scraping Scheduler for Project Apex
Orchestrates regular data scraping tasks
"""

import schedule
import time
import logging
from datetime import datetime
import sys
import os

# Add scrapers to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers'))

from scrapers.nba_scraper import NBAScraper
from scrapers.odds_scraper import OddsScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScrapeScheduler:
    def __init__(self):
        self.nba_scraper = NBAScraper()
        self.odds_scraper = OddsScraper()
    
    def daily_team_update(self):
        """Daily update of team information"""
        logger.info("Running daily team update...")
        try:
            teams = self.nba_scraper.scrape_teams()
            if teams:
                self.nba_scraper.db.insert_teams(teams)
                logger.info("Daily team update completed successfully")
        except Exception as e:
            logger.error(f"Daily team update failed: {str(e)}")
    
    def hourly_schedule_update(self):
        """Hourly update of game schedules"""
        logger.info("Running hourly schedule update...")
        try:
            games = self.nba_scraper.scrape_schedule(days_ahead=3)
            if games:
                self.nba_scraper.db.insert_games(games)
                logger.info("Hourly schedule update completed successfully")
        except Exception as e:
            logger.error(f"Hourly schedule update failed: {str(e)}")
    
    def frequent_odds_update(self):
        """Frequent odds updates (every 15 minutes during game days)"""
        logger.info("Running odds update...")
        try:
            self.odds_scraper.run_odds_scrape()
            logger.info("Odds update completed successfully")
        except Exception as e:
            logger.error(f"Odds update failed: {str(e)}")
    
    def setup_schedule(self):
        """Setup the scraping schedule"""
        # Daily team updates at 6 AM
        schedule.every().day.at("06:00").do(self.daily_team_update)
        
        # Hourly schedule updates
        schedule.every().hour.do(self.hourly_schedule_update)
        
        # Odds updates every 15 minutes
        schedule.every(15).minutes.do(self.frequent_odds_update)
        
        logger.info("Scraping schedule configured")
    
    def run(self):
        """Run the scheduler"""
        self.setup_schedule()
        logger.info("Starting scraping scheduler...")
        
        # Run initial scrape
        self.daily_team_update()
        self.hourly_schedule_update()
        self.frequent_odds_update()
        
        # Keep running scheduled tasks
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    scheduler = ScrapeScheduler()
    scheduler.run()
