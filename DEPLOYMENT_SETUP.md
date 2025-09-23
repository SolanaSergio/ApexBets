# 🚀 ApexBets Deployment & Auto-Sync Setup Guide

## 📋 Current Issues Fixed

### ✅ **Background Sync Service Issue**
- **Problem**: `background-sync-service.js` wasn't being compiled to `dist/server/`
- **Solution**: Updated `tsconfig.server.json` to include the service file
- **Result**: Server will now load background sync service properly

### ✅ **Vercel Cron Limitation**
- **Problem**: Vercel free plan only allows 2 cron jobs per day (insufficient for sports data)
- **Solution**: Implemented GitHub Actions for free, frequent syncing
- **Result**: Can sync every 15 minutes for free

## 🔧 **Setup Instructions**

### **1. GitHub Actions Setup (RECOMMENDED)**

#### **Step 1: Add Repository Secrets**
Go to your GitHub repository → Settings → Secrets and variables → Actions, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SPORTS_API_KEY=your_sports_api_key
SPORTS_API_BASE_URL=your_sports_api_base_url
```

#### **Step 2: Enable GitHub Actions**
- The workflow file is already created at `.github/workflows/sync-sports-data.yml`
- It will automatically run every 15 minutes
- You can also trigger it manually from the Actions tab

#### **Step 3: Test the Setup**
```bash
# Test locally first
pnpm run sync:test

# Check GitHub Actions logs
# Go to your repo → Actions tab → "Sync Sports Data" workflow
```

### **2. Alternative: External Cron Service**

If you prefer not to use GitHub Actions, you can use external cron services:

#### **Option A: cron-job.org (Free)**
1. Sign up at https://cron-job.org
2. Create a new cron job
3. Set URL to: `https://your-vercel-app.vercel.app/api/cron/sync`
4. Set schedule to every 15 minutes
5. Add authentication header if needed

#### **Option B: EasyCron (Free Tier)**
1. Sign up at https://www.easycron.com
2. Create a new cron job
3. Set URL to your Vercel app's cron endpoint
4. Configure schedule and authentication

### **3. Vercel Deployment**

#### **Update vercel.json**
```json
{
  "version": 2,
  "builds": [
    { "src": "next.config.mjs", "use": "@vercel/next" }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Note**: This Vercel cron will only run twice per day (every 6 hours) on the free plan.

## 🧪 **Testing Your Setup**

### **Local Testing**
```bash
# Test background sync service
pnpm run sync:test

# Test server startup
pnpm run dev

# Check if background sync loads
# Look for: "✅ Background sync service loaded"
```

### **Production Testing**
```bash
# Test Vercel cron endpoint
curl https://your-app.vercel.app/api/cron/sync

# Test GitHub Actions
# Go to Actions tab and trigger manually
```

## 📊 **Monitoring & Logs**

### **GitHub Actions Logs**
- Go to your repo → Actions tab
- Click on "Sync Sports Data" workflow
- View logs for each run

### **Vercel Logs**
- Go to Vercel dashboard → Functions tab
- View function logs for cron executions

### **Database Monitoring**
- Check Supabase dashboard for data updates
- Monitor API usage and rate limits

## 🔄 **Sync Frequency Options**

| Method | Free Tier | Frequency | Reliability |
|--------|-----------|-----------|-------------|
| GitHub Actions | ✅ | Every 15 min | High |
| Vercel Cron | ✅ | 2x per day | High |
| External Cron | ✅ | Every 15 min | Medium |
| Railway/Render | ✅ | Every 15 min | High |

## 🚨 **Troubleshooting**

### **Background Sync Not Loading**
```bash
# Check if file exists
ls dist/server/services/background-sync-service.js

# Rebuild if missing
pnpm run build:server
```

### **GitHub Actions Failing**
1. Check repository secrets are set correctly
2. Verify environment variables in workflow
3. Check build logs for TypeScript errors

### **Vercel Deployment Issues**
1. Check `vercel.json` configuration
2. Verify environment variables in Vercel dashboard
3. Check function logs for errors

## 📈 **Performance Optimization**

### **Rate Limiting**
- The background sync service respects API rate limits
- Configured to avoid overwhelming external APIs
- Uses exponential backoff for retries

### **Database Efficiency**
- Only syncs changed data
- Uses batch operations for better performance
- Implements proper error handling and recovery

## 🎯 **Next Steps**

1. **Set up GitHub Actions** (recommended)
2. **Test the sync process** locally and in production
3. **Monitor logs** for any issues
4. **Adjust sync frequency** based on your needs
5. **Set up alerts** for sync failures (optional)

## 📞 **Support**

If you encounter issues:
1. Check the logs first
2. Verify all environment variables are set
3. Test locally before deploying
4. Check API rate limits and quotas

---

**🎉 You're all set! Your database will now populate automatically without needing a paid Vercel account.**
