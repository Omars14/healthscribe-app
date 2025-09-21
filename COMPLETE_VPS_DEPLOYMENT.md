# 🚀 Complete VPS Deployment Guide

This guide will migrate your **ENTIRE** medical transcription system to your VPS, including:
- ✅ Your Next.js application
- ✅ Self-hosted Supabase database
- ✅ All your data (82 transcriptions)
- ✅ nginx with SSL
- ✅ Complete production setup

## 🎯 What This Achieves

**Before:** Your app runs locally, connects to cloud Supabase
**After:** Everything runs on your VPS - complete self-hosting

## 📋 Prerequisites

- VPS with Ubuntu 20.04/22.04
- 4GB+ RAM, 50GB+ storage
- Domain name (healthscribe.pro)
- Root access to VPS
- Your application code ready

## 🚀 Step 1: Prepare Your VPS

### 1.1 Upload Your Application Code

```bash
# From your local machine, upload your entire project
scp -r /path/to/your/dashboard-next root@your-vps-ip:/opt/healthscribe/

# Or if you have it in git:
ssh root@your-vps-ip
cd /opt/healthscribe
git clone https://github.com/your-username/dashboard-next.git
```

### 1.2 Upload Migration Scripts

```bash
# Upload the migration scripts to your VPS
scp complete-vps-migration.sh root@your-vps-ip:/root/
scp migrate-to-vps.js root@your-vps-ip:/root/
```

## 🛠️ Step 2: Run Complete Migration

### 2.1 Execute the Migration Script

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Make the script executable and run it
chmod +x complete-vps-migration.sh
./complete-vps-migration.sh
```

**This script will:**
- Install all dependencies (Docker, Node.js, nginx)
- Set up self-hosted Supabase
- Configure nginx with SSL
- Create systemd services
- Set up monitoring and backups
- Start all services

### 2.2 Get SSL Certificates

The script will automatically get SSL certificates, but if it fails:

```bash
certbot --nginx -d healthscribe.pro
certbot --nginx -d supabase.healthscribe.pro
```

## 📊 Step 3: Migrate Your Data

### 3.1 Run Data Migration

```bash
# On your VPS, run the data migration
cd /root
node migrate-to-vps.js
```

**This will:**
- Copy all your data from cloud Supabase to VPS
- Update your environment variables
- Migrate storage buckets
- Preserve all 82 transcriptions

## 🔧 Step 4: Update DNS

### 4.1 Point Your Domain to VPS

Update your DNS records:
```
A record: healthscribe.pro → YOUR_VPS_IP
A record: supabase.healthscribe.pro → YOUR_VPS_IP
```

### 4.2 Wait for DNS Propagation

```bash
# Test DNS resolution
nslookup healthscribe.pro
nslookup supabase.healthscribe.pro
```

## ✅ Step 5: Test Everything

### 5.1 Test Your Application

```bash
# Check if services are running
systemctl status healthscribe-app
systemctl status supabase
systemctl status nginx

# Test your application
curl -I https://healthscribe.pro
curl -I https://supabase.healthscribe.pro
```

### 5.2 Test Login Functionality

1. Go to `https://healthscribe.pro`
2. Try to log in with your existing credentials
3. Verify you can see your 82 transcriptions
4. Test file upload functionality

## 📊 Step 6: Verify Data Migration

### 6.1 Check Data Counts

```bash
# Test database connection
curl -H "apikey: YOUR_VPS_ANON_KEY" \
     -H "Authorization: Bearer YOUR_VPS_ANON_KEY" \
     "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count"
```

### 6.2 Compare with Cloud

Your VPS should have the same data as your cloud instance.

## 🔧 Management Commands

### Service Management

```bash
# Start services
systemctl start healthscribe-app
systemctl start supabase
systemctl start nginx

# Stop services
systemctl stop healthscribe-app
systemctl stop supabase

# Restart services
systemctl restart healthscribe-app
systemctl restart supabase

# Check status
systemctl status healthscribe-app
systemctl status supabase
```

### Monitoring

```bash
# View application logs
journalctl -u healthscribe-app -f

# View Supabase logs
cd /opt/supabase/supabase/docker
docker-compose logs -f

# System monitoring
/usr/local/bin/monitor-healthscribe.sh
```

### Backups

```bash
# Manual backup
/usr/local/bin/backup-healthscribe.sh

# Automated daily backups (already set up)
crontab -l
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Not Starting
```bash
# Check logs
journalctl -u healthscribe-app -f

# Check if port is in use
netstat -tulpn | grep :3000

# Restart service
systemctl restart healthscribe-app
```

#### 2. Supabase Not Accessible
```bash
# Check Docker containers
cd /opt/supabase/supabase/docker
docker-compose ps

# Check logs
docker-compose logs -f

# Restart Supabase
systemctl restart supabase
```

#### 3. SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew certificates
certbot renew

# Test SSL
openssl s_client -connect healthscribe.pro:443
```

#### 4. Database Connection Issues
```bash
# Test database connection
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT version();"

# Check database logs
docker-compose logs db
```

## 📈 Performance Optimization

### Database Tuning

```sql
-- Connect to database
docker exec -it supabase_db psql -U postgres -d postgres

-- Optimize settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### Application Optimization

```bash
# Enable gzip compression in nginx
# (Already configured in the script)

# Monitor resource usage
htop
iotop
```

## 🔐 Security Best Practices

### Firewall Configuration

```bash
# Check firewall status
ufw status

# Allow only necessary ports
ufw allow 22
ufw allow 80
ufw allow 443
ufw deny 3000
ufw deny 8000
```

### Regular Updates

```bash
# Update system
apt update && apt upgrade -y

# Update Docker images
cd /opt/supabase/supabase/docker
docker-compose pull
docker-compose up -d
```

## 📊 Monitoring Setup

### System Monitoring

```bash
# Install monitoring tools
apt install -y htop iotop sysstat

# Set up log rotation
logrotate -d /etc/logrotate.conf
```

### Application Monitoring

```bash
# Monitor application performance
journalctl -u healthscribe-app --since "1 hour ago"

# Monitor database performance
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT * FROM pg_stat_activity;"
```

## 🎯 Success Checklist

- [ ] VPS migration script completed successfully
- [ ] SSL certificates installed and working
- [ ] All services running (app, Supabase, nginx)
- [ ] Data migration completed (82 transcriptions)
- [ ] DNS updated and propagated
- [ ] Application accessible at https://healthscribe.pro
- [ ] Login functionality working
- [ ] All transcriptions visible
- [ ] File upload/download working
- [ ] Monitoring and backup systems configured

## 🎉 Congratulations!

You now have a **completely self-hosted** medical transcription system:

- ✅ **Your Next.js app** running on your VPS
- ✅ **Self-hosted Supabase** with all your data
- ✅ **SSL certificates** for secure connections
- ✅ **Production-ready** configuration
- ✅ **Monitoring and backup** systems
- ✅ **Complete data control**

## 📞 Support

If you encounter any issues:

1. Check the logs: `journalctl -u healthscribe-app -f`
2. Verify services: `systemctl status healthscribe-app`
3. Test connectivity: `curl -I https://healthscribe.pro`
4. Check Docker: `docker-compose ps`

## 🔄 Rollback Plan

If something goes wrong, you can:

1. **Keep cloud Supabase running** as backup
2. **Revert DNS** to point back to cloud
3. **Restore from backup** if needed
4. **Debug issues** without losing data

Your system is now **completely independent** and running on your own infrastructure! 🏠⚡




