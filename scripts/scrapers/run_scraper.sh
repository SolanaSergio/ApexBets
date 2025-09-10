#!/bin/bash
# Project Apex Scraper Runner
# Runs the data scraping pipeline

echo "Starting Project Apex Data Scraper..."

# Set up Python environment
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Install requirements if needed
if [ ! -f "venv/bin/activate" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run the scrapers
echo "Running NBA scraper..."
python3 scrapers/nba_scraper.py

echo "Running odds scraper..."
python3 scrapers/odds_scraper.py

echo "Running data cleanup..."
python3 data_cleaner.py

echo "Scraping pipeline completed!"
