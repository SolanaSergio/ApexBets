# Image Management Maintenance Guide

## Overview

This guide covers maintenance tasks for the ApexBets image management system, including automated updates, monitoring, and troubleshooting.

## Daily Maintenance

### Automated Tasks

The system runs these tasks automatically:

1. **Daily Auto-Update** (2:00 AM)
   - Updates missing team logos
   - Refreshes stale player photos
   - Logs all operations to audit table

2. **Weekly Verification** (Sunday 3:00 AM)
   - Verifies all stored URLs are accessible
   - Fixes broken URLs with fresh ESPN CDN links
   - Generates health reports

### Manual Checks

1. **Image Health Dashboard**
   ```bash
   curl /api/admin/image-health
   ```
   
   Check for:
   - Overall health status
   - Database hit rate (>80% target)
   - SVG fallback rate (<5% target)
   - Average load time (<200ms target)

2. **Recent Failures**
   ```bash
   curl /api/admin/image-stats
   ```
   
   Review:
   - Failed image loads
   - High SVG usage patterns
   - Performance issues

## Weekly Maintenance

### Database Cleanup

1. **Audit Log Cleanup**
   ```sql
   -- Remove audit logs older than 90 days
   DELETE FROM image_audit_log 
   WHERE created_at < NOW() - INTERVAL '90 days';
   ```

2. **Stale URL Cleanup**
   ```sql
   -- Find teams with stale logos (older than 90 days)
   SELECT name, sport, logo_url, last_updated
   FROM teams 
   WHERE last_updated < NOW() - INTERVAL '90 days'
   AND logo_url IS NOT NULL;
   ```

### Performance Review

1. **Load Time Analysis**
   - Check average load times
   - Identify slow-loading images
   - Review fallback patterns

2. **Coverage Analysis**
   - Teams without logos
   - Players without photos
   - Missing team colors

## Monthly Maintenance

### Data Population

1. **Full Logo Population**
   ```bash
   # Populate all sports
   curl -X POST /api/admin/populate-logos
   
   # Populate specific sport
   curl -X POST /api/admin/populate-logos?sport=basketball
   ```

2. **Verification Run**
   ```bash
   # Verify all images
   curl -X POST /api/admin/verify-logos
   
   # Verify specific sport
   curl -X POST /api/admin/verify-logos?sport=football
   ```

### Team Color Updates

1. **Update Team Colors**
   ```sql
   -- Example: Update Lakers colors
   UPDATE teams 
   SET primary_color = '#552583', 
       secondary_color = '#FDB927',
       last_updated = NOW()
   WHERE name = 'Lakers' AND sport = 'basketball';
   ```

2. **Bulk Color Updates**
   ```sql
   -- Update all NBA team colors
   UPDATE teams 
   SET primary_color = CASE name
     WHEN 'Lakers' THEN '#552583'
     WHEN 'Warriors' THEN '#1D428A'
     WHEN 'Celtics' THEN '#007A33'
     -- Add more teams...
   END,
   secondary_color = CASE name
     WHEN 'Lakers' THEN '#FDB927'
     WHEN 'Warriors' THEN '#FFC72C'
     WHEN 'Celtics' THEN '#BA9653'
     -- Add more teams...
   END,
   last_updated = NOW()
   WHERE sport = 'basketball';
   ```

## Troubleshooting

### High SVG Fallback Rate

**Symptoms**: >20% of images using SVG fallbacks

**Causes**:
- Missing ESPN CDN URLs in database
- ESPN CDN URLs are broken
- Team names don't match ESPN mappings

**Solutions**:
1. Run populate-images Edge Function
2. Check ESPN CDN mappings
3. Verify team names in database
4. Update team name mappings if needed

### Slow Load Times

**Symptoms**: Average load time >500ms

**Causes**:
- Database performance issues
- ESPN CDN connectivity problems
- Large SVG generation overhead

**Solutions**:
1. Check database performance
2. Verify ESPN CDN accessibility
3. Optimize SVG generation
4. Increase memory cache size

### Missing Team Colors

**Symptoms**: SVG logos using default colors

**Causes**:
- Teams table missing color data
- Color values are null/empty
- SVG generator not reading colors

**Solutions**:
1. Update teams table with colors
2. Run populate-images to update colors
3. Check SVG generator implementation

### Broken ESPN URLs

**Symptoms**: ESPN CDN URLs returning 404

**Causes**:
- ESPN changed URL structure
- Team ID mappings outdated
- Network connectivity issues

**Solutions**:
1. Update ESPN CDN mappings
2. Verify team ID mappings
3. Check network connectivity
4. Update URL generation logic

## Monitoring & Alerts

### Health Metrics

Monitor these key metrics:

1. **Database Hit Rate**: >80%
2. **SVG Fallback Rate**: <5%
3. **Average Load Time**: <200ms
4. **Success Rate**: >95%

### Alert Conditions

Set up alerts for:

1. **Critical**: SVG fallback rate >50%
2. **Warning**: SVG fallback rate >20%
3. **Critical**: Success rate <70%
4. **Warning**: Success rate <90%
5. **Critical**: Average load time >5000ms
6. **Warning**: Average load time >2000ms

### Monitoring Dashboard

Access the monitoring dashboard at:
```
/api/admin/image-health
```

Key sections:
- Overall health status
- Source distribution
- Performance metrics
- Recent failures
- Recommendations

## Edge Function Management

### Deploying Edge Functions

1. **Populate Images**
   ```bash
   supabase functions deploy populate-images
   ```

2. **Auto Update Images**
   ```bash
   supabase functions deploy auto-update-images
   ```

3. **Verify Images**
   ```bash
   supabase functions deploy verify-images
   ```

### Testing Edge Functions

1. **Test Populate Images**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/populate-images \
     -H "Authorization: Bearer [service-key]"
   ```

2. **Test Auto Update**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/auto-update-images \
     -H "Authorization: Bearer [service-key]"
   ```

3. **Test Verify Images**
   ```bash
   curl -X POST https://[project-ref].supabase.co/functions/v1/verify-images \
     -H "Authorization: Bearer [service-key]"
   ```

### Cron Job Management

1. **List Cron Jobs**
   ```sql
   SELECT * FROM cron.job;
   ```

2. **Add Cron Job**
   ```sql
   SELECT cron.schedule('job-name', 'schedule', 'command');
   ```

3. **Remove Cron Job**
   ```sql
   SELECT cron.unschedule('job-name');
   ```

## Performance Optimization

### Database Optimization

1. **Index Optimization**
   ```sql
   -- Ensure proper indexes exist
   CREATE INDEX IF NOT EXISTS idx_teams_name_sport ON teams(name, sport);
   CREATE INDEX IF NOT EXISTS idx_players_name_sport ON players(name, sport);
   CREATE INDEX IF NOT EXISTS idx_image_audit_entity ON image_audit_log(entity_type, entity_id);
   ```

2. **Query Optimization**
   - Use specific sport filters
   - Limit result sets
   - Use proper WHERE clauses

### Caching Optimization

1. **Memory Cache Tuning**
   - Increase cache size for high-traffic teams
   - Implement cache warming
   - Use cache invalidation strategies

2. **Database Cache Optimization**
   - Pre-populate popular teams
   - Use connection pooling
   - Optimize query patterns

### SVG Optimization

1. **SVG Size Reduction**
   - Minimize SVG markup
   - Use efficient color schemes
   - Optimize SVG generation

2. **Caching SVG Results**
   - Cache generated SVGs
   - Use consistent team colors
   - Implement SVG compression

## Backup & Recovery

### Database Backup

1. **Regular Backups**
   ```bash
   # Backup teams table
   pg_dump -t teams [connection-string] > teams_backup.sql
   
   # Backup players table
   pg_dump -t players [connection-string] > players_backup.sql
   
   # Backup audit log
   pg_dump -t image_audit_log [connection-string] > audit_log_backup.sql
   ```

2. **Point-in-Time Recovery**
   - Use Supabase backup features
   - Implement WAL archiving
   - Test recovery procedures

### Edge Function Backup

1. **Function Code Backup**
   ```bash
   # Backup function code
   cp -r supabase/functions/ functions_backup/
   ```

2. **Configuration Backup**
   ```bash
   # Backup cron jobs
   psql [connection-string] -c "SELECT * FROM cron.job;" > cron_backup.sql
   ```

## Security Considerations

### API Security

1. **Rate Limiting**
   - Implement rate limits on image endpoints
   - Use proper authentication
   - Monitor for abuse

2. **Input Validation**
   - Validate team names and sports
   - Sanitize user inputs
   - Prevent injection attacks

### Data Security

1. **Sensitive Data**
   - Don't log sensitive information
   - Use proper error handling
   - Implement access controls

2. **Audit Logging**
   - Log all image operations
   - Monitor for suspicious activity
   - Implement alerting

## Best Practices

### Development

1. **Code Quality**
   - Use TypeScript strict mode
   - Implement proper error handling
   - Write comprehensive tests

2. **Performance**
   - Optimize database queries
   - Use efficient caching
   - Monitor performance metrics

### Operations

1. **Monitoring**
   - Set up comprehensive monitoring
   - Implement alerting
   - Regular health checks

2. **Documentation**
   - Keep documentation updated
   - Document all changes
   - Maintain troubleshooting guides

### Maintenance

1. **Regular Updates**
   - Update dependencies regularly
   - Apply security patches
   - Review and update mappings

2. **Testing**
   - Run tests regularly
   - Test edge cases
   - Validate performance
