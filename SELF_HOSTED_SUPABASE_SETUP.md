# 🏠 Complete Self-Hosted Supabase Setup Guide

This guide will help you set up a fully functional self-hosted Supabase instance for your medical transcription system.

## 🎯 Overview

We'll migrate from your current cloud Supabase to a self-hosted instance with:
- ✅ Complete data migration
- ✅ Proper nginx configuration
- ✅ SSL certificates
- ✅ CORS configuration
- ✅ Database schema and policies
- ✅ Storage configuration

## 📋 Prerequisites

- VPS with Ubuntu 20.04/22.04
- 4GB+ RAM
- 50GB+ storage
- Domain name (healthscribe.pro)
- Root or sudo access

## 🚀 Step 1: Set Up Supabase on Your VPS

### 1.1 Upload and Run Setup Script

```bash
# On your local machine, upload the setup script to your VPS
scp setup-self-hosted-supabase.sh root@your-vps-ip:/root/

# SSH into your VPS
ssh root@your-vps-ip

# Make the script executable and run it
chmod +x setup-self-hosted-supabase.sh
./setup-self-hosted-supabase.sh
```

### 1.2 Get SSL Certificates

```bash
# Install certbot if not already installed
apt update
apt install -y certbot python3-certbot-nginx

# Get SSL certificate for your Supabase subdomain
certbot --nginx -d supabase.healthscribe.pro

# Test automatic renewal
certbot renew --dry-run
```

### 1.3 Verify Supabase is Running

```bash
# Check service status
systemctl status supabase

# Check Docker containers
cd /opt/supabase/supabase/docker
docker-compose ps

# Test API endpoints
curl -I https://supabase.healthscribe.pro/auth/v1/settings
curl -I https://supabase.healthscribe.pro/rest/v1/
```

## 🔄 Step 2: Migrate Your Data

### 2.1 Update Migration Script

Edit `migrate-data-to-self-hosted.js` and update the self-hosted configuration:

```javascript
// Update these values with your actual self-hosted Supabase details
const SELF_HOSTED_URL = 'https://supabase.healthscribe.pro';
const SELF_HOSTED_ANON_KEY = 'your-actual-anon-key';
const SELF_HOSTED_SERVICE_KEY = 'your-actual-service-key';
```

### 2.2 Run Data Migration

```bash
# Install required dependencies
npm install @supabase/supabase-js dotenv

# Run the migration script
node migrate-data-to-self-hosted.js
```

### 2.3 Verify Data Migration

```bash
# Test the migration by checking record counts
curl -H "apikey: YOUR_SERVICE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_KEY" \
     "https://supabase.healthscribe.pro/rest/v1/user_profiles?select=count"

curl -H "apikey: YOUR_SERVICE_KEY" \
     -H "Authorization: Bearer YOUR_SERVICE_KEY" \
     "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=count"
```

## 🔧 Step 3: Update Your Application

### 3.1 Update Environment Variables

Update your `.env.local` file:

```env
# Self-hosted Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-key

# Keep other variables the same
NEXT_PUBLIC_URL=https://healthscribe.pro
NEXT_PUBLIC_API_URL=https://healthscribe.pro
```

### 3.2 Test Your Application

```bash
# Restart your development server
npm run dev

# Test login functionality
# Go to http://localhost:3000 and try to log in
```

## 🔍 Step 4: Verify Everything Works

### 4.1 Test Authentication

```bash
# Test auth endpoint
curl -X POST https://supabase.healthscribe.pro/auth/v1/token \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "email": "your-test-email@example.com",
    "password": "your-test-password"
  }'
```

### 4.2 Test Database Queries

```bash
# Test database access
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://supabase.healthscribe.pro/rest/v1/transcriptions?select=*&limit=5"
```

### 4.3 Test Storage

```bash
# Test storage access
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://supabase.healthscribe.pro/storage/v1/b/audio-files"
```

## 🛠️ Step 5: Configure nginx for Your Main Application

Update your main nginx configuration to work with the self-hosted Supabase:

```nginx
# /etc/nginx/sites-available/healthscribe.pro
server {
    listen 443 ssl http2;
    server_name healthscribe.pro;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/healthscribe.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthscribe.pro/privkey.pem;

    # CORS headers for Supabase requests
    add_header "Access-Control-Allow-Origin" "https://supabase.healthscribe.pro" always;
    add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header "Access-Control-Allow-Headers" "*" always;
    add_header "Access-Control-Allow-Credentials" "true" always;

    # Your main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Step 6: Monitoring and Maintenance

### 6.1 Set Up Monitoring

```bash
# Check service status
systemctl status supabase

# View logs
cd /opt/supabase/supabase/docker
docker-compose logs -f

# Monitor resources
/usr/local/bin/monitor-supabase.sh
```

### 6.2 Set Up Backups

```bash
# Run manual backup
/usr/local/bin/backup-supabase.sh

# Set up automated daily backups
echo "0 4 * * * /usr/local/bin/backup-supabase.sh" | crontab -
```

### 6.3 Update Management

```bash
# Update Supabase
cd /opt/supabase/supabase/docker
docker-compose pull
docker-compose up -d

# Check for updates
docker-compose images
```

## 🚨 Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Check nginx configuration
nginx -t
systemctl reload nginx

# Verify CORS headers
curl -I https://supabase.healthscribe.pro/auth/v1/settings
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose logs db

# Test database connection
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT version();"
```

#### 3. Authentication Issues
```bash
# Check auth service logs
docker-compose logs auth

# Verify JWT secret
grep JWT_SECRET /opt/supabase/supabase/docker/.env
```

#### 4. Storage Issues
```bash
# Check storage service logs
docker-compose logs storage

# Verify storage bucket
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT * FROM storage.buckets;"
```

## 🔐 Security Best Practices

### 1. Network Security
```bash
# Configure firewall
ufw allow 80
ufw allow 443
ufw allow 22
ufw --force enable
```

### 2. Database Security
```bash
# Change default passwords
cd /opt/supabase/supabase/docker
nano .env
# Update POSTGRES_PASSWORD with a strong password
```

### 3. API Security
```bash
# Enable rate limiting in nginx
# Add rate limiting directives to your nginx configuration
```

## 📈 Performance Optimization

### 1. Database Tuning
```sql
-- Connect to database
docker exec -it supabase_db psql -U postgres -d postgres

-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

### 2. Application Optimization
```bash
# Configure connection pooling
echo "POSTGRES_POOL_SIZE=10" >> /opt/supabase/supabase/docker/.env
docker-compose restart
```

## 🎯 Success Checklist

- [ ] Supabase services running (`docker-compose ps`)
- [ ] SSL certificates installed and working
- [ ] nginx configuration updated and reloaded
- [ ] Data migration completed successfully
- [ ] Application environment variables updated
- [ ] Login functionality working
- [ ] Database queries working
- [ ] Storage access working
- [ ] Monitoring and backup systems configured
- [ ] Security measures implemented

## 📞 Support

If you encounter any issues:

1. Check the logs: `docker-compose logs -f`
2. Verify configuration: `nginx -t`
3. Test connectivity: `curl -I https://supabase.healthscribe.pro`
4. Check service status: `systemctl status supabase`

## 🎉 Congratulations!

You now have a fully functional, self-hosted Supabase instance with:
- ✅ Complete data control
- ✅ Custom configurations
- ✅ Cost-effective operation
- ✅ HIPAA-ready architecture
- ✅ Full API compatibility

Your medical transcription system is now running on your own infrastructure! 🏠⚡




