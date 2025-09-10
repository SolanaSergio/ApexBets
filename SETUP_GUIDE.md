# ApexBets Setup Guide - Step by Step

## 🎯 Overview
This guide will walk you through setting up your ApexBets website with real sports data and multi-sport support.

## 📋 Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed
- Code editor (VS Code recommended)

---

## Step 1: Environment Setup

### 1.1 Create Environment File
```bash
# Copy the example environment file
cp env.example .env.local
```

### 1.2 Configure Supabase (Required)
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API
4. Copy your project URL and keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

### 1.3 Configure Sports APIs (Optional but Recommended)
For free tier, you can use:
```env
# Free APIs (no registration needed)
NEXT_PUBLIC_SPORTSDB_API_KEY=123
# BALLDONTLIE is completely free, no key needed

# Optional: Premium APIs (better data quality)
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_ODDS_API_KEY=your_odds_api_key
```

---

## Step 2: Database Setup

### 2.1 Install Dependencies
```bash
npm install
# or
pnpm install
```

### 2.2 Run Database Setup Script
```bash
# This will create all necessary tables
node scripts/setup-database-simple.js
```

### 2.3 Apply Multi-Sport Schema
```bash
# Run the multi-sport schema in your Supabase SQL editor
# Copy and paste the contents of scripts/006_multi_sport_schema.sql
```

---

## Step 3: Test the Setup

### 3.1 Start Development Server
```bash
npm run dev
# or
pnpm dev
```

### 3.2 Test API Endpoints
```bash
# Test health endpoint
npm run health

# Test detailed health
npm run health:detailed
```

### 3.3 Test Sports Data
Visit these URLs in your browser:
- `http://localhost:3000/api/debug/external-apis`
- `http://localhost:3000/api/games`
- `http://localhost:3000/api/teams`

---

## Step 4: Populate with Real Data

### 4.1 Run Data Population Script
```bash
node scripts/populate-real-data.js
```

### 4.2 Verify Data
Check your Supabase dashboard to see the populated data.

---

## Step 5: Test the Website

### 5.1 Visit the Website
Open `http://localhost:3000` in your browser

### 5.2 Test Features
- Navigate between different sports
- Check analytics pages
- Test predictions functionality
- Verify real-time data updates

---

## Step 6: Production Deployment

### 6.1 Build the Project
```bash
npm run build
```

### 6.2 Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect to Vercel
3. Deploy automatically

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
- Check your Supabase credentials
- Ensure your project is active
- Verify the URL format

#### API Errors
- Check your API keys
- Verify rate limits
- Check network connectivity

#### Build Errors
- Run `npm install` again
- Clear `.next` folder
- Check TypeScript errors

---

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your environment variables
3. Test individual API endpoints
4. Check the Supabase logs

---

## 🎉 Success!

Once everything is working, you'll have:
- ✅ Multi-sport support (7 sports)
- ✅ Real-time data integration
- ✅ AI predictions
- ✅ Analytics dashboard
- ✅ Mobile-responsive design
- ✅ Production-ready deployment

Your ApexBets website is now ready for users!
