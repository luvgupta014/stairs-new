# STAIRS Platform - Maintenance & Support Guide# STAIRS Platform - Maintenance & Support Guide



## Routine Maintenance Tasks## Routine Maintenance Tasks



### Daily Tasks### Daily Tasks

- Monitor server logs for errors

- Check PM2 process status#### 1. Monitor Application Health

- Review failed API requests```bash

- Monitor database connections# Check PM2 status

pm2 status

### Weekly Tasks

- Review payment transactions# Check application logs

- Check certificate generation success ratepm2 logs stairs-backend --lines 100

- Analyze user registration trends

- Update dependencies (security patches)# Check for errors

pm2 logs stairs-backend --err

### Monthly Tasks```

- Database backup verification

- Storage cleanup (old logs, temp files)#### 2. Monitor Database

- Performance monitoring review```bash

- Security audit# Check database connections

psql -U stairs_user -d stairs_production -c "SELECT count(*) FROM pg_stat_activity;"

---

# Check database size

## Monitoringpsql -U stairs_user -d stairs_production -c "SELECT pg_size_pretty(pg_database_size('stairs_production'));"

```

### PM2 Process Monitoring

```bash#### 3. Review Error Logs

# Check status```bash

pm2 status# Backend logs

tail -f backend/logs/error.log

# View logs

pm2 logs stairs-backend# Nginx logs

pm2 logs stairs-backend --lines 100sudo tail -f /var/log/nginx/error.log

```

# Monitor in real-time

pm2 monit### Weekly Tasks



# Restart if needed#### 1. Database Backup

pm2 restart stairs-backend```bash

```# Manual backup

pg_dump stairs_production > backup_$(date +%Y%m%d).sql

### Log Files

```bash# Verify backup

# Backend logspsql -U stairs_user -d stairs_test < backup_$(date +%Y%m%d).sql

tail -f /var/www/stairs-new/backend/logs/error.log```

tail -f /var/www/stairs-new/backend/logs/combined.log

#### 2. Clean Up Old Files

# Nginx logs```bash

sudo tail -f /var/log/nginx/error.log# Remove old certificates (older than 1 year)

sudo tail -f /var/log/nginx/access.logfind backend/uploads/certificates/ -type f -mtime +365 -delete



# PostgreSQL logs# Remove old result files (older than 6 months)

sudo tail -f /var/log/postgresql/postgresql-14-main.logfind backend/uploads/event-results/ -type f -mtime +180 -delete

```

# Remove temporary files

---rm -rf backend/temp/*

```

## Backup & Restore

#### 3. Check Disk Space

### Database Backup```bash

# Check disk usage

#### Manual Backupdf -h

```bash

# Full database backup# Check large files

pg_dump -U postgres stairs_prod > backup_$(date +%Y%m%d_%H%M%S).sqldu -h -d 1 /path/to/stairs | sort -hr | head -10

```

# Compressed backup

pg_dump -U postgres stairs_prod | gzip > backup_$(date +%Y%m%d).sql.gz#### 4. Review Failed Payments

``````bash

# Query failed payments

#### Automated Backup Scriptpsql -U stairs_user -d stairs_production -c "

Create `/root/backup_db.sh`:SELECT * FROM \"EventOrders\" 

```bashWHERE \"paymentStatus\" = 'FAILED' 

#!/bin/bashAND \"createdAt\" > NOW() - INTERVAL '7 days';

BACKUP_DIR="/backups/database""

DATE=$(date +%Y%m%d_%H%M%S)```

DB_NAME="stairs_prod"

### Monthly Tasks

mkdir -p $BACKUP_DIR

pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/stairs_$DATE.sql.gz#### 1. Update Dependencies

```bash

# Keep only last 30 days# Check for updates

find $BACKUP_DIR -name "stairs_*.sql.gz" -mtime +30 -deletenpm outdated



echo "Backup completed: stairs_$DATE.sql.gz"# Update non-breaking changes

```npm update



Setup cron job:# Review and update major versions carefully

```bashnpm install package@latest

crontab -e```

# Add: Daily backup at 2 AM

0 2 * * * /root/backup_db.sh >> /var/log/db_backup.log 2>&1#### 2. Security Audit

``````bash

# Run security audit

### Database Restorenpm audit

```bash

# Uncompress and restore# Fix vulnerabilities

gunzip -c backup_20251112.sql.gz | psql -U postgres stairs_prodnpm audit fix



# Or from uncompressed file# Review high-severity issues manually

psql -U postgres stairs_prod < backup_20251112.sqlnpm audit --production

``````



### File System Backup#### 3. Database Maintenance

```bash```bash

# Backup uploads directory# Vacuum and analyze database

tar -czf uploads_$(date +%Y%m%d).tar.gz /var/www/stairs-new/backend/uploadspsql -U stairs_user -d stairs_production -c "VACUUM ANALYZE;"



# Backup to remote server (if configured)# Reindex if needed

rsync -avz /var/www/stairs-new/backend/uploads/ backup_server:/backups/stairs_uploads/psql -U stairs_user -d stairs_production -c "REINDEX DATABASE stairs_production;"

```

# Check for bloat

---psql -U stairs_user -d stairs_production -c "

SELECT schemaname, tablename, 

## Common Issues & Solutions       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size

FROM pg_tables 

### Issue 1: Backend Server DownWHERE schemaname = 'public' 

**Symptoms**: API not responding, 502 Bad GatewayORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

"

**Diagnosis**:```

```bash

pm2 status#### 4. Review Subscription Expiries

pm2 logs stairs-backend --lines 50```bash

```# Check expiring subscriptions (next 7 days)

psql -U stairs_user -d stairs_production -c "

**Solutions**:SELECT c.id, u.email, c.\"subscriptionExpiry\" 

```bashFROM \"Coaches\" c 

# Restart PM2 processJOIN \"Users\" u ON c.\"userId\" = u.id 

pm2 restart stairs-backendWHERE c.\"subscriptionExpiry\" < NOW() + INTERVAL '7 days' 

AND c.\"subscriptionExpiry\" > NOW();

# If still failing, check logs"

pm2 logs stairs-backend --err```



# Check port availability---

sudo lsof -i :5000

## Backup & Restore

# Reboot if necessary

pm2 stop stairs-backend### Automated Backup Script

pm2 start stairs-backend

```Create `/home/username/backup-stairs.sh`:

```bash

---#!/bin/bash



### Issue 2: Database Connection Error# Configuration

**Symptoms**: "Connection refused" or "timeout" errorsBACKUP_DIR="/var/backups/stairs"

DB_NAME="stairs_production"

**Diagnosis**:DB_USER="stairs_user"

```bashRETENTION_DAYS=30

# Check PostgreSQL statusDATE=$(date +%Y%m%d_%H%M%S)

sudo systemctl status postgresql

# Create backup directory if not exists

# Test connectionmkdir -p $BACKUP_DIR

psql -U postgres -d stairs_prod

```# Database backup

pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

**Solutions**:

```bash# File uploads backup

# Restart PostgreSQLtar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz backend/uploads/

sudo systemctl restart postgresql

# Remove old backups

# Check max connectionsfind $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

psql -U postgres -c "SHOW max_connections;"find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete



# Check active connectionsecho "Backup completed: $DATE"

psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"```



# If max connections reached, kill idle connectionsSetup automated backup:

psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"```bash

```# Make script executable

chmod +x /home/username/backup-stairs.sh

---

# Add to crontab (daily at 2 AM)

### Issue 3: Certificate Generation Failingcrontab -e

**Symptoms**: Certificates not generating, Puppeteer errors# Add: 0 2 * * * /home/username/backup-stairs.sh >> /var/log/stairs-backup.log 2>&1

```

**Diagnosis**:

```bash### Restore from Backup

# Check Puppeteer/Chrome

node -e "const puppeteer = require('puppeteer'); console.log('Puppeteer OK');"#### Restore Database

```bash

# Check upload directory permissions# Stop application

ls -la /var/www/stairs-new/backend/uploads/certificates/pm2 stop stairs-backend

```

# Restore database

**Solutions**:gunzip < /var/backups/stairs/db_backup_20251110_020000.sql.gz | psql -U stairs_user -d stairs_production

```bash

# Reinstall Puppeteer with Chrome# Restart application

cd /var/www/stairs-new/backendpm2 start stairs-backend

npm install puppeteer --unsafe-perm=true --allow-root```



# Fix permissions#### Restore Files

sudo chown -R www-data:www-data /var/www/stairs-new/backend/uploads```bash

sudo chmod -R 755 /var/www/stairs-new/backend/uploads# Stop application

pm2 stop stairs-backend

# Restart backend

pm2 restart stairs-backend# Restore uploads

```tar -xzf /var/backups/stairs/uploads_backup_20251110_020000.tar.gz -C /path/to/



---# Restart application

pm2 start stairs-backend

### Issue 4: Payment Failures```

**Symptoms**: Razorpay payment not completing

---

**Diagnosis**:

```bash## Log Management

# Check Razorpay credentials in .env

grep RAZORPAY /var/www/stairs-new/backend/.env### Log Locations

- **Application Logs**: `backend/logs/`

# Check logs for Razorpay errors- **PM2 Logs**: `~/.pm2/logs/`

pm2 logs stairs-backend | grep -i razorpay- **Nginx Logs**: `/var/log/nginx/`

```- **PostgreSQL Logs**: `/var/log/postgresql/`



**Solutions**:### Log Rotation

- Verify Razorpay API keys are correct

- Check Razorpay dashboard for failed paymentsCreate `/etc/logrotate.d/stairs`:

- Ensure webhook URLs are configured```

- Test with Razorpay test credentials/path/to/stairs/backend/logs/*.log {

    daily

---    rotate 7

    compress

### Issue 5: Email Not Sending    delaycompress

**Symptoms**: OTP, notifications not reaching users    missingok

    notifempty

**Diagnosis**:    create 0644 www-data www-data

```bash}

# Check email configuration```

grep EMAIL /var/www/stairs-new/backend/.env

### Analyzing Logs

# Check logs

pm2 logs stairs-backend | grep -i email#### Find Errors

``````bash

# Recent errors in application

**Solutions**:grep "ERROR" backend/logs/app.log | tail -50

```bash

# Test email configuration# Failed API requests

node -e "require('./src/utils/emailService').sendEmail({to:'test@example.com',subject:'Test',text:'Test email'});"grep "500\|400\|401\|403" backend/logs/access.log | tail -50



# For Gmail: Enable "Less secure app access" or use App Password# Database connection errors

# Check SMTP credentialsgrep "database\|connection" backend/logs/error.log

# Verify firewall allows SMTP port (587)```

```

#### Monitor Real-Time

---```bash

# Watch application logs

### Issue 6: High CPU Usagetail -f backend/logs/app.log

**Symptoms**: Server slow, high response times

# Watch PM2 logs

**Diagnosis**:pm2 logs --lines 50

```bash```

# Check CPU usage

top---

htop

## Common Issues & Solutions

# Check PM2 processes

pm2 monit### Issue 1: Application Not Responding



# Check database queries**Symptoms:**

psql -U postgres -d stairs_prod -c "SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle';"- API requests timeout

```- 502 Bad Gateway errors



**Solutions**:**Diagnosis:**

```bash```bash

# Identify slow queries# Check if application is running

psql -U postgres -d stairs_prod -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;"pm2 status



# Kill long-running queries# Check application logs

psql -U postgres -d stairs_prod -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <pid>;"pm2 logs stairs-backend --err



# Optimize database# Check system resources

VACUUM ANALYZE;top

free -h

# Add missing indexes (see DATABASE_SCHEMA.md)df -h

``````



---**Solutions:**

```bash

### Issue 7: Disk Space Full# Restart application

**Symptoms**: "No space left on device" errorspm2 restart stairs-backend



**Diagnosis**:# If high memory usage

```bashpm2 restart stairs-backend --max-memory-restart 500M

# Check disk usage

df -h# If process crashed

pm2 start src/index.js --name stairs-backend

# Find large files```

du -sh /* | sort -h

du -sh /var/www/stairs-new/backend/* | sort -h### Issue 2: Database Connection Errors

```

**Symptoms:**

**Solutions**:- "Connection refused" errors

```bash- "Too many connections" errors

# Clean PM2 logs

pm2 flush**Diagnosis:**

```bash

# Clean old logs# Check PostgreSQL status

find /var/www/stairs-new/backend/logs -name "*.log" -mtime +30 -deletesudo systemctl status postgresql



# Clean npm cache# Check connections

npm cache clean --forcepsql -U stairs_user -d stairs_production -c "

SELECT count(*) as connections, state 

# Clean old backupsFROM pg_stat_activity 

find /backups -name "*.sql.gz" -mtime +30 -deleteGROUP BY state;

"

# Check uploads directory```

du -sh /var/www/stairs-new/backend/uploads/*

```**Solutions:**

```bash

---# Restart PostgreSQL

sudo systemctl restart postgresql

## Error Handling

# Increase max connections (edit postgresql.conf)

### Backend Error Logs# max_connections = 200

Location: `/var/www/stairs-new/backend/logs/error.log`

# Close idle connections

Common errors to watch for:psql -U stairs_user -d stairs_production -c "

- Database connection errorsSELECT pg_terminate_backend(pid) 

- JWT validation failuresFROM pg_stat_activity 

- Payment verification failuresWHERE state = 'idle' 

- File upload errorsAND state_change < current_timestamp - INTERVAL '5 minutes';

- Certificate generation errors"

```

### Frontend Error Handling

- API errors displayed to users### Issue 3: Certificate Generation Failures

- Console errors in browser dev tools

- Report critical errors to backend**Symptoms:**

- Certificates not generating

---- Puppeteer errors in logs



## Performance Monitoring**Diagnosis:**

```bash

### Key Metrics# Check Puppeteer logs

- API response timesgrep "puppeteer\|certificate" backend/logs/error.log

- Database query performance

- Server CPU/RAM usage# Check Chrome/Chromium installation

- Disk I/Owhich chromium-browser

- Active connections```



### Tools**Solutions:**

```bash```bash

# PM2 monitoring# Install Chrome dependencies

pm2 monitsudo apt-get install -y \

    libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0

# Database performance

psql -U postgres -d stairs_prod -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"# Reinstall Puppeteer

cd backend

# Server resourcesnpm rebuild puppeteer

htop

iostat# Test certificate generation

```node scripts/testCertificateIssuance.js

```

---

### Issue 4: Payment Verification Failures

## Security Maintenance

**Symptoms:**

### SSL Certificate Renewal- Payments not getting verified

```bash- Razorpay signature mismatch

# Check certificate expiry

sudo certbot certificates**Diagnosis:**

```bash

# Renew certificates# Check Razorpay logs

sudo certbot renewgrep "razorpay\|payment" backend/logs/app.log



# Test auto-renewal# Verify environment variables

sudo certbot renew --dry-runpm2 env 0 | grep RAZORPAY

``````



### Update Dependencies**Solutions:**

```bash```bash

cd /var/www/stairs-new/backend# Verify Razorpay keys are correct

npm audit# Check .env file

npm audit fixcat backend/.env | grep RAZORPAY



cd ../frontend# Restart application with updated env

npm auditpm2 restart stairs-backend --update-env

npm audit fix

```# Test payment flow manually

node scripts/checkOrderStatus.js

### Review Access Logs```

```bash

# Check for suspicious activity### Issue 5: Email Delivery Failures

sudo tail -f /var/log/nginx/access.log | grep -E "(POST|DELETE)"

**Symptoms:**

# Check failed login attempts- OTP emails not sent

pm2 logs stairs-backend | grep -i "login failed"- No error in logs

```

**Diagnosis:**

---```bash

# Check email configuration

## Escalation Proceduresgrep "email\|smtp" backend/logs/error.log



### Level 1: Self-Service# Verify SMTP credentials

- Check logsnode -e "console.log(process.env.EMAIL_HOST)"

- Restart services```

- Clear caches

- Review documentation**Solutions:**

```bash

### Level 2: Developer Support# For Gmail, enable "Less secure app access"

**Contact**: Development team  # Or use App Passwords with 2FA

**For**: Code issues, bugs, feature problems  

**Information to provide**:# Test email sending

- Error logsnode scripts/testEmail.js

- Steps to reproduce

- Expected vs actual behavior# Check SMTP connection

telnet smtp.gmail.com 587

### Level 3: Infrastructure Support```

**Contact**: DevOps/Infrastructure team  

**For**: Server issues, database problems, network issues  ### Issue 6: Date/Time Display Issues

**Information to provide**:

- Server metrics**Symptoms:**

- Resource usage- Events showing wrong time

- Network diagnostics- Timezone conversion errors



### Critical Issues (P0)**Diagnosis:**

- Production down```bash

- Data loss# Check date handling in logs

- Security breachgrep "IST\|UTC\|timezone" backend/logs/app.log

- Payment system failure

# Verify server timezone

**Action**: Immediately contact development team and infrastructure teamtimedatectl

```

---

**Solutions:**

## Useful Commands```bash

# All dates stored in UTC, converted to IST on retrieval

### Quick Diagnostics# Verify parseAsIST and formatDateAsIST functions

```bash

# System health check# Test date handling

./health_check.shnode testing/debug/test-date-handling.js



# Service status# Set server timezone (if needed)

pm2 statussudo timedatectl set-timezone Asia/Kolkata

sudo systemctl status nginx```

sudo systemctl status postgresql

---

# Recent errors

pm2 logs stairs-backend --err --lines 50## Performance Monitoring



# Active users### Application Metrics

psql -U postgres -d stairs_prod -c "SELECT role, COUNT(*) FROM \"User\" WHERE \"isActive\" = true GROUP BY role;"```bash

# PM2 monitoring

# Recent registrationspm2 monit

psql -U postgres -d stairs_prod -c "SELECT DATE(\"createdAt\"), COUNT(*) FROM \"User\" WHERE \"createdAt\" > NOW() - INTERVAL '7 days' GROUP BY DATE(\"createdAt\");"

```# Resource usage

pm2 describe stairs-backend

---```



## Contact Information### Database Performance

```bash

**Development Team**: dev@stairs.com  # Slow queries

**DevOps Team**: devops@stairs.com  psql -U stairs_user -d stairs_production -c "

**Support**: support@stairs.comSELECT query, calls, total_time, mean_time 

FROM pg_stat_statements 

---ORDER BY mean_time DESC 

LIMIT 10;

**Last Updated**: November 2025"


# Index usage
psql -U stairs_user -d stairs_production -c "
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan ASC;
"
```

### API Response Times
```bash
# Analyze Nginx access logs
awk '{print $NF}' /var/log/nginx/access.log | 
  sort -n | 
  awk '{a[i++]=$0} END {print "P50:", a[int(i/2)], "P95:", a[int(i*0.95)]}'
```

---

## Security Maintenance

### Regular Security Tasks

#### 1. Update SSL Certificates
```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### 2. Review User Access
```bash
# List admin users
psql -U stairs_user -d stairs_production -c "
SELECT u.email, u.\"createdAt\" 
FROM \"Users\" u 
WHERE u.role = 'ADMIN';
"

# Review recent logins
grep "login" backend/logs/access.log | tail -50
```

#### 3. Check for Suspicious Activity
```bash
# Failed login attempts
grep "401\|login failed" backend/logs/app.log | wc -l

# Unusual API access
grep "admin" /var/log/nginx/access.log | grep -v "YOUR_IP"
```

---

## Escalation Procedures

### Severity Levels

**P1 - Critical** (Response: Immediate)
- Application down
- Database corrupted
- Security breach
- Payment system failure

**P2 - High** (Response: < 2 hours)
- Major feature broken
- Performance degradation
- Certificate generation failing

**P3 - Medium** (Response: < 24 hours)
- Minor feature issues
- UI bugs
- Non-critical errors

**P4 - Low** (Response: Next sprint)
- Enhancement requests
- Minor UI improvements
- Documentation updates

### Contact Information
- **Primary Developer**: [Your Name] - [Email] - [Phone]
- **DevOps Team**: [Team Email]
- **Database Admin**: [DBA Contact]
- **24/7 Support**: [Emergency Contact]

### Escalation Matrix
1. Developer/Support Engineer
2. Lead Developer
3. Technical Lead
4. CTO/Technical Manager

---

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Critical Systems**: 1 hour
- **Non-Critical Systems**: 4 hours

### Recovery Point Objective (RPO)
- **Database**: 24 hours (daily backups)
- **Files**: 24 hours (daily backups)

### Disaster Recovery Steps

1. **Assess Situation**
   - Identify affected systems
   - Determine root cause
   - Estimate recovery time

2. **Communicate**
   - Notify stakeholders
   - Update status page
   - Set expectations

3. **Execute Recovery**
   - Restore from backups
   - Verify data integrity
   - Test critical functions

4. **Post-Mortem**
   - Document incident
   - Identify improvements
   - Update procedures

---

## Monitoring & Alerts

### Setup Monitoring

#### Health Check Endpoint
```javascript
// backend/src/routes/health.js
router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

#### Uptime Monitoring
- Use services like UptimeRobot, Pingdom, or StatusCake
- Monitor: `/api/health` endpoint
- Alert on: Down, Slow response (> 2s)

#### Log Monitoring
- Setup log aggregation (ELK Stack, Papertrail)
- Alert on: ERROR, CRITICAL keywords
- Monitor: API error rates, database errors

---

For additional support:
- See `SETUP_DEPLOYMENT_GUIDE.md` for deployment issues
- See `TESTING_GUIDE.md` for testing procedures
- See `API_REFERENCE.md` for API documentation
- See `DATABASE_SCHEMA.md` for database queries
