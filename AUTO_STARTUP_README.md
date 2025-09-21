# 🚀 Auto-Startup System

Your ApexBets application now has **automatic startup** for all monitoring and data quality services! No more manual setup required.

## ✨ What Starts Automatically

When you run `pnpm run dev` or `pnpm start`, the following services start automatically:

- 📊 **Automated Monitoring** - Real-time health checks every 5 minutes
- 🔍 **Data Quality Checks** - Integrity validation and duplicate detection
- 🏥 **Health Monitoring** - Database connection and performance tracking
- 🚨 **Alert System** - Automatic notifications for critical issues
- 🔄 **Retry Mechanisms** - Automatic recovery from API failures

## 🎯 How It Works

### 1. **Automatic Initialization**
```bash
pnpm run dev  # Starts everything automatically!
```

The system will:
1. Start your Next.js server
2. Wait 3-5 seconds for full initialization
3. Start all monitoring services
4. Run initial health checks
5. Begin continuous monitoring

### 2. **Console Output**
You'll see output like this:
```
🚀 Next.js server preparing...
✅ Auto-startup service loaded
> Ready on http://localhost:3000
🎉 Server started successfully!
🚀 Starting auto-startup services...
📊 Starting automated monitoring...
✅ Monitoring started
🏥 Running initial health check...
✅ Health check completed
🔍 Running data quality checks...
✅ Data quality check completed
🎉 Auto-startup services initialized successfully!
```

## 🛠️ Manual Control

Even though everything starts automatically, you can still control services manually:

### Check Status
```bash
pnpm run startup:status
```

### Check Health
```bash
pnpm run startup:health
```

### Restart Services
```bash
pnpm run startup:restart
```

### Stop Services
```bash
pnpm run startup:stop
```

## ⚙️ Configuration

### Environment-Based Settings

**Development** (`pnpm run dev`):
- Monitoring: Every 2 minutes
- Auto-cleanup: **Enabled** (automatic duplicate removal)
- Startup delay: 5 seconds

**Production** (`pnpm start`):
- Monitoring: Every 10 minutes
- Auto-cleanup: **Enabled** (automatic duplicate removal)
- Startup delay: 10 seconds

### Custom Configuration

You can customize settings by modifying `startup.config.json`:

```json
{
  "autoStartup": {
    "enabled": true,
    "monitoring": {
      "enabled": true,
      "intervalMinutes": 5
    },
    "dataQuality": {
      "enabled": true,
      "autoCleanup": true
    }
  }
}
```

## 📊 What You Get

### 1. **Real-Time Monitoring**
- Database connection status
- Response time tracking
- Memory and CPU usage
- Data freshness monitoring

### 2. **Automatic Alerts**
- Database connection failures
- High memory usage
- Data quality issues
- Duplicate data detection

### 3. **Data Protection**
- Duplicate prevention
- Data validation
- Integrity checks
- Automatic cleanup (when enabled)

### 4. **Performance Optimization**
- Query optimization
- Index management
- Connection pooling
- Caching strategies

## 🔧 API Endpoints

### Startup Control
- `GET /api/startup?action=status` - Check service status
- `GET /api/startup?action=health` - Run health check
- `GET /api/startup?action=restart` - Restart services
- `GET /api/startup?action=stop` - Stop services

### Database Management
- `GET /api/admin/database-audit?action=audit` - Run full audit
- `GET /api/admin/database-audit?action=integrity` - Check data integrity
- `GET /api/admin/database-audit?action=monitoring` - View monitoring data
- `GET /api/admin/database-audit?action=health` - Force health check

## 🚨 Troubleshooting

### Services Not Starting?
1. Check console output for errors
2. Verify database connection
3. Check environment variables
4. Run `pnpm run startup:status`

### Monitoring Not Working?
1. Check if services are running: `pnpm run startup:status`
2. Restart services: `pnpm run startup:restart`
3. Check database connection
4. Verify API endpoints are accessible

### Data Quality Issues?
1. Run integrity check: `pnpm run startup:health`
2. Check for duplicates in database
3. Verify unique constraints are in place
4. Run manual cleanup if needed

## 📈 Monitoring Dashboard

Visit these URLs to see your system status:

- **Health Check**: `http://localhost:3000/api/startup?action=health`
- **Monitoring Data**: `http://localhost:3000/api/admin/database-audit?action=monitoring`
- **Database Audit**: `http://localhost:3000/api/admin/database-audit?action=audit`

## 🎉 Benefits

✅ **Zero Manual Setup** - Everything starts automatically
✅ **Continuous Monitoring** - 24/7 system health tracking
✅ **Automatic Recovery** - Self-healing from common issues
✅ **Data Protection** - Prevents data corruption and duplicates
✅ **Performance Optimization** - Automatic query and index optimization
✅ **Professional Grade** - Enterprise-level monitoring and alerting

## 🔄 Migration from Manual

If you were previously starting services manually:

1. **Old way**: `pnpm run dev` + manual API calls
2. **New way**: Just `pnpm run dev` - everything starts automatically!

The old manual commands still work if you need them, but they're no longer necessary.

---

**🎯 Result**: Your ApexBets application now starts with enterprise-grade monitoring and data protection automatically! No more manual setup required. 🚀
