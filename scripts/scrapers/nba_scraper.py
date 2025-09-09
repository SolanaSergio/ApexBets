#!/usr/bin/env python3
"""
NBA Data Scraper for Project Apex
Scrapes team data, schedules, and basic stats from NBA.com and ESPN
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os
import sys

# Add the parent directory to the path to import database utilities
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database_utils import DatabaseManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class NBAScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.db = DatabaseManager()
        
    def scrape_teams(self) -> List[Dict]:
        """Scrape NBA team information from ESPN"""
        try:
            logger.info("Scraping NBA teams from ESPN...")
            url = "https://www.espn.com/nba/teams"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            teams = []
            
            # Find team containers
            team_links = soup.find_all('a', class_='AnchorLink')
            
            for link in team_links:
                if '/nba/team/_/name/' in link.get('href', ''):
                    team_name = link.get_text(strip=True)
                    team_url = link.get('href')
                    
                    # Extract team abbreviation from URL
                    try:
                        abbr = team_url.split('/name/')[1].split('/')[0].upper()
                    except:
                        abbr = team_name[:3].upper()
                    
                    teams.append({
                        'name': team_name,
                        'abbreviation': abbr,
                        'league': 'NBA',
                        'sport': 'basketball',
                        'city': team_name.split()[-1] if len(team_name.split()) > 1 else team_name
                    })
            
            logger.info(f"Successfully scraped {len(teams)} NBA teams")
            return teams
            
        except Exception as e:
            logger.error(f"Error scraping teams: {str(e)}")
            return []
    
    def scrape_schedule(self, days_ahead: int = 7) -> List[Dict]:
        """Scrape upcoming NBA games from ESPN"""
        try:
            logger.info(f"Scraping NBA schedule for next {days_ahead} days...")
            games = []
            
            for i in range(days_ahead):
                date = datetime.now() + timedelta(days=i)
                date_str = date.strftime('%Y%m%d')
                
                url = f"https://www.espn.com/nba/schedule/_/date/{date_str}"
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find game containers
                game_rows = soup.find_all('tr', class_='Table__TR')
                
                for row in game_rows:
                    try:
                        teams = row.find_all('a', class_='AnchorLink')
                        if len(teams) >= 2:
                            away_team = teams[0].get_text(strip=True)
                            home_team = teams[1].get_text(strip=True)
                            
                            # Extract game time
                            time_elem = row.find('td', class_='date-time')
                            game_time = time_elem.get_text(strip=True) if time_elem else "TBD"
                            
                            games.append({
                                'home_team': home_team,
                                'away_team': away_team,
                                'game_date': date.strftime('%Y-%m-%d'),
                                'game_time': game_time,
                                'season': '2024-25',
                                'status': 'scheduled'
                            })
                    except Exception as e:
                        logger.warning(f"Error parsing game row: {str(e)}")
                        continue
                
                # Be respectful with requests
                time.sleep(1)
            
            logger.info(f"Successfully scraped {len(games)} games")
            return games
            
        except Exception as e:
            logger.error(f"Error scraping schedule: {str(e)}")
            return []
    
    def scrape_player_stats(self, team_abbr: str) -> List[Dict]:
        """Scrape basic player stats for a team"""
        try:
            logger.info(f"Scraping player stats for {team_abbr}...")
            url = f"https://www.espn.com/nba/team/stats/_/name/{team_abbr.lower()}"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            players = []
            
            # Find player stat tables
            stat_tables = soup.find_all('table', class_='Table')
            
            for table in stat_tables:
                rows = table.find_all('tr')[1:]  # Skip header
                
                for row in rows:
                    cells = row.find_all('td')
                    if len(cells) >= 10:  # Ensure we have enough stat columns
                        try:
                            player_name = cells[0].get_text(strip=True)
                            position = cells[1].get_text(strip=True) if len(cells) > 1 else "N/A"
                            
                            # Extract basic stats (points, rebounds, assists)
                            stats = {
                                'player_name': player_name,
                                'position': position,
                                'team_abbreviation': team_abbr,
                                'points': float(cells[2].get_text(strip=True)) if cells[2].get_text(strip=True).replace('.', '').isdigit() else 0,
                                'rebounds': float(cells[3].get_text(strip=True)) if cells[3].get_text(strip=True).replace('.', '').isdigit() else 0,
                                'assists': float(cells[4].get_text(strip=True)) if cells[4].get_text(strip=True).replace('.', '').isdigit() else 0
                            }
                            players.append(stats)
                        except Exception as e:
                            logger.warning(f"Error parsing player stats: {str(e)}")
                            continue
            
            logger.info(f"Successfully scraped stats for {len(players)} players")
            return players
            
        except Exception as e:
            logger.error(f"Error scraping player stats for {team_abbr}: {str(e)}")
            return []
    
    def run_full_scrape(self):
        """Run a complete scraping session"""
        logger.info("Starting full NBA data scrape...")
        
        # Scrape teams
        teams = self.scrape_teams()
        if teams:
            self.db.insert_teams(teams)
        
        # Scrape schedule
        games = self.scrape_schedule()
        if games:
            self.db.insert_games(games)
        
        # Log scraping activity
        self.db.log_scrape_activity('ESPN', 'teams_and_schedule', len(teams) + len(games), True)
        
        logger.info("Full scrape completed successfully")

if __name__ == "__main__":
    scraper = NBAScraper()
    scraper.run_full_scrape()
