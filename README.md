# ApexBets - Advanced Sports Betting Analytics Platform

A comprehensive sports betting analytics platform built with Next.js, featuring real-time data integration, ML-powered predictions, and value betting opportunities.

## 🚀 Features

### Core Functionality
- **Real-time Sports Data**: Live scores, odds, and game updates from multiple APIs
- **ML Predictions**: Advanced machine learning models for game outcomes, spreads, and totals
- **Value Betting**: Automated detection of profitable betting opportunities
- **Analytics Dashboard**: Comprehensive performance tracking and insights
- **Live Updates**: Real-time notifications and data streaming

### Data Sources
- **TheSportsDB**: Free multi-sport API with generous rate limits
- **API-SPORTS**: Fast real-time sports data (15-second updates)
- **BALLDONTLIE**: Comprehensive NBA historical data (1946-present)
- **The Odds API**: Betting odds and live sports data

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **ML**: Python scikit-learn, pandas, numpy
- **APIs**: RESTful services with rate limiting and error handling
- **Real-time**: WebSocket-like updates and live data streaming

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.8+ (for ML models)
- Supabase account
- API keys for sports data providers

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ApexBets
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your API keys and configuration:
   ```env
   # Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Sports APIs
   NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
   NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
   ```

4. **Set up Supabase database**
   ```bash
   # Run the SQL scripts in order
   psql -h your-db-host -U your-username -d your-database -f scripts/001_create_core_tables.sql
   psql -h your-db-host -U your-username -d your-database -f scripts/002_enable_rls.sql
   psql -h your-db-host -U your-username -d your-database -f scripts/003_create_profile_trigger.sql
   psql -h your-db-host -U your-username -d your-database -f scripts/004_seed_sample_data.sql
   ```

5. **Set up Python environment for ML models**
   ```bash
   cd scripts/ml_models
   pip install -r requirements.txt
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔑 API Keys Setup

### Required APIs

1. **RapidAPI (API-SPORTS)**
   - Sign up at [RapidAPI](https://rapidapi.com/api-sports/api/api-sports)
   - Subscribe to API-SPORTS plan
   - Get your API key

2. **The Odds API**
   - Sign up at [The Odds API](https://the-odds-api.com/)
   - Get your free API key (100 requests/month)

### Optional APIs

3. **TheSportsDB** (Free)
   - No API key required
   - Generous rate limits

4. **BALLDONTLIE** (Free)
   - No API key required
   - NBA-focused data

## 📊 API Endpoints

### Games
- `GET /api/games` - Get games with optional filters
- `GET /api/games?external=true` - Get real-time games from external APIs

### Odds
- `GET /api/odds` - Get betting odds
- `GET /api/odds?external=true` - Get real-time odds

### Predictions
- `GET /api/predictions?game_id={id}` - Get ML predictions for a game

### Value Bets
- `GET /api/value-bets` - Get value betting opportunities
- `GET /api/value-bets?sport=basketball&min_value=0.1` - Filtered opportunities

### Live Updates
- `GET /api/live-scores` - Get live game scores
- `GET /api/live-updates` - WebSocket-like live updates

### Analytics
- `GET /api/analytics/stats` - Get analytics overview
- `GET /api/analytics/stats?external=true` - Enhanced analytics

## 🤖 ML Models

The platform includes several machine learning models:

### Game Outcome Predictor
- Predicts game winners using Random Forest
- Features: team stats, recent form, head-to-head records
- Accuracy: ~65%

### Spread Predictor
- Predicts point spreads using Gradient Boosting
- Features: offensive/defensive ratings, home advantage
- MAE: ~3.5 points

### Total Points Predictor
- Predicts over/under totals using Random Forest
- Features: pace, offensive efficiency, recent trends
- MAE: ~8 points

### Training Models
```bash
cd scripts/ml_models
python prediction_models.py
```

## 📈 Value Betting

The platform automatically identifies value betting opportunities by:

1. **Calculating Implied Probability**: From betting odds
2. **Model Probability**: From ML predictions
3. **Value Calculation**: `(Model Prob × Odds) - 1`
4. **Kelly Criterion**: Optimal bet sizing
5. **Risk Assessment**: Confidence-based recommendations

### Value Bet Levels
- **Strong**: >20% value, high confidence
- **Moderate**: 10-20% value, medium confidence  
- **Weak**: 5-10% value, low confidence

## 🔄 Real-time Updates

The platform provides real-time updates for:

- **Live Scores**: Game scores and status updates
- **Odds Changes**: Betting odds movements
- **Value Bets**: New opportunities as they arise
- **Predictions**: Updated ML predictions

### Update Frequency
- Live scores: Every 30 seconds
- Odds: Every 2 minutes
- Value bets: Every 5 minutes
- Predictions: On demand

## 📱 Usage

### Dashboard
1. **Overview**: Key metrics and performance stats
2. **Games**: Live and upcoming games
3. **Predictions**: ML-powered game predictions
4. **Value Bets**: Profitable betting opportunities
5. **Analytics**: Performance tracking and insights

### Live Updates
1. Enable live updates in the dashboard
2. Monitor real-time scores and odds
3. Get notified of new value betting opportunities
4. Track your betting performance

### Analytics
1. View overall performance metrics
2. Analyze prediction accuracy by type
3. Track value betting success rates
4. Monitor ROI and profit/loss

## 🛡️ Error Handling

The platform includes comprehensive error handling:

- **Rate Limiting**: Prevents API abuse
- **Circuit Breakers**: Protects against failing services
- **Retry Logic**: Automatic retry with exponential backoff
- **Graceful Degradation**: Fallback to cached data
- **Error Logging**: Detailed error tracking and monitoring

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Docker
```bash
docker build -t apexbets .
docker run -p 3000:3000 apexbets
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Monitoring

### Performance Metrics
- API response times
- Error rates
- Cache hit rates
- Rate limit usage

### Business Metrics
- Prediction accuracy
- Value bet success rate
- User engagement
- Revenue tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced ML models (LSTM, Transformer)
- [ ] Social features (sharing predictions)
- [ ] Portfolio management
- [ ] Automated betting integration
- [ ] More sports (NFL, MLB, NHL)
- [ ] Advanced analytics (Monte Carlo simulations)

### Performance Improvements
- [ ] Redis caching
- [ ] CDN integration
- [ ] Database optimization
- [ ] API response compression
- [ ] Background job processing

---

**Disclaimer**: This platform is for educational and analytical purposes only. Always gamble responsibly and within your means. The predictions and value bets are not guaranteed to be accurate or profitable.
