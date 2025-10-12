# 🔧 Manual Supabase Self-Hosted Restoration Guide

## Overview

This guide will walk you through restoring your self-hosted Supabase auth service step by step.

**Time Required:** 20-30 minutes  
**Difficulty:** Medium  
**Requirements:** SSH access to your VPS

---

## Step 1: Connect to VPS

Open PowerShell or CMD and connect via SSH:

```powershell
ssh root@154.26.155.207
# Password: Nomar123
```

---

## Step 2: Check if Supabase is Installed

Once connected, check for existing Supabase installation:

```bash
# Check for Supabase in /opt
if [ -d "/opt/supabase" ]; then
  echo "Found in /opt/supabase"
  cd /opt/supabase/docker
elif [ -d "/data/supabase" ]; then
  echo "Found in /data/supabase"
  cd /data/supabase/docker
else
  echo "Not found - will install"
fi
```

---

## Step 3: Install Supabase (if not found)

If Supabase is not installed:

```bash
cd /opt
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

---

## Step 4: Configure Environment

```bash
# Copy example environment
cp .env.example .env

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Update .env file with your values
nano .env
```

**Important values to set:**

```bash
# JWT & Authentication
JWT_SECRET=<paste the generated JWT secret here>
ANON_KEY=<will be generated>
SERVICE_ROLE_KEY=<will be generated>

# Database
POSTGRES_PASSWORD=Nomar123
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# URLs
SITE_URL=https://healthscribe.pro
API_EXTERNAL_URL=https://supabase.healthscribe.pro
SUPABASE_PUBLIC_URL=https://supabase.healthscribe.pro

# Email (optional for now)
SMTP_ADMIN_EMAIL=omars14@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

Save and exit (Ctrl+X, then Y, then Enter in nano)

---

## Step 5: Generate API Keys

The Supabase `.env.example` should already have placeholder keys, but to generate your own:

```bash
# The JWT secret we generated earlier will be used
# For ANON_KEY and SERVICE_ROLE_KEY, they should already be in .env.example
# If not, you can use these as they're standard self-hosted keys:

# ANON_KEY (already in .env.example usually)
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# SERVICE_ROLE_KEY (already in .env.example usually)
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

---

## Step 6: Start Supabase Services

```bash
# Make sure you're in the docker directory
cd /opt/supabase/docker

# Stop any existing services
docker-compose down

# Start all Supabase services
docker-compose up -d

# Wait for services to start
echo "Waiting 30 seconds for services to start..."
sleep 30

# Check status
docker-compose ps
```

**Expected output:** You should see services like:
- `supabase-db` (PostgreSQL)
- `supabase-auth` (GoTrue)
- `supabase-rest` (PostgREST)
- `supabase-kong` (API Gateway)
- `supabase-storage`
- `supabase-meta`

---

## Step 7: Verify Auth Service

```bash
# Test auth endpoint
curl http://localhost:8000/auth/v1/health

# Should return something like: {"status":"ok"}
```

---

## Step 8: Get Your API Keys

```bash
# Display your API keys
echo "========================================="
echo "SUPABASE API KEYS"
echo "========================================="
echo ""
echo "URL: https://supabase.healthscribe.pro"
echo ""
echo "ANON_KEY:"
grep "ANON_KEY=" .env | cut -d= -f2
echo ""
echo "SERVICE_ROLE_KEY:"
grep "SERVICE_ROLE_KEY=" .env | cut -d= -f2
echo ""
echo "JWT_SECRET:"
grep "JWT_SECRET=" .env | cut -d= -f2
```

**COPY THESE VALUES** - you'll need them for your application!

---

## Step 9: Configure Nginx (if not already done)

Create Supabase nginx configuration:

```bash
cat > /etc/nginx/sites-available/supabase.healthscribe.pro << 'EOF'
upstream supabase_api {
    server localhost:8000;
}

server {
    listen 80;
    server_name supabase.healthscribe.pro;
    
    location / {
        proxy_pass http://supabase_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,apikey' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/supabase.healthscribe.pro /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# If test passes, reload nginx
systemctl reload nginx
```

---

## Step 10: Get SSL Certificate

```bash
# Request SSL certificate for supabase subdomain
certbot --nginx -d supabase.healthscribe.pro --non-interactive --agree-tos --email omars14@gmail.com

# Certbot will automatically configure SSL in nginx
```

---

## Step 11: Test External Access

From your local machine (Windows PowerShell):

```powershell
# Test auth endpoint
curl https://supabase.healthscribe.pro/auth/v1/health
```

Should return: `{"status":"ok"}`

---

## Step 12: Migrate Your Existing Data

Connect to the Supabase database and migrate your user data:

```bash
# Get the database container ID
DB_CONTAINER=$(docker ps --filter "name=supabase-db" --format "{{.Names}}" | head -1)

# Connect to database
docker exec -it $DB_CONTAINER psql -U postgres -d postgres

# Then in the PostgreSQL prompt, check if your user exists
SELECT email FROM auth.users WHERE email = 'omars14@gmail.com';

# If user doesn't exist, we'll create it in the next step
\q
```

### If you need to migrate from the existing database:

```bash
# Connect to your existing database (the one with 29 transcriptions)
EXISTING_DB=$(docker ps --filter "name=supabase_db_supabase" --format "{{.Names}}")

# Export user data
docker exec $EXISTING_DB pg_dump -U postgres -d postgres -t auth.users -t public.user_profiles > /tmp/users_backup.sql

# Import to new Supabase
docker exec -i $DB_CONTAINER psql -U postgres -d postgres < /tmp/users_backup.sql

# Export transcriptions
docker exec $EXISTING_DB pg_dump -U postgres -d postgres -t public.transcriptions > /tmp/transcriptions_backup.sql

# Import transcriptions
docker exec -i $DB_CONTAINER psql -U postgres -d postgres < /tmp/transcriptions_backup.sql
```

---

## Step 13: Update Application Configuration

Exit SSH and update your local `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste ANON_KEY from Step 8>
SUPABASE_SERVICE_ROLE_KEY=<paste SERVICE_ROLE_KEY from Step 8>
```

---

## Step 14: Deploy Application

```powershell
# Commit changes
git add .env.local
git commit -m "Update to self-hosted Supabase with restored auth service"
git push origin master

# Coolify will automatically deploy the changes
```

---

## Step 15: Test Login

1. Wait 2-3 minutes for deployment
2. Go to https://healthscribe.pro/login
3. Login with: omars14@gmail.com / Nomar123
4. Should successfully log in and see dashboard with 29 transcriptions

---

## Troubleshooting

### Auth service not starting

```bash
cd /opt/supabase/docker
docker-compose logs auth

# Check for errors like:
# - Database connection issues
# - JWT secret missingn
# - Port conflicts
```

### Can't connect to database

```bash
# Check database container
docker-compose logs db

# Test connection
docker exec -it supabase-db psql -U postgres -d postgres -c "SELECT version();"
```

### SSL certificate issues

```bash
# Check certbot logs
tail -f /var/log/letsencrypt/letsencrypt.log

# Manual certificate request
certbot --nginx -d supabase.healthscribe.pro
```

### Port conflicts

```bash
# Check what's using port 8000
netstat -tlnp | grep 8000

# If another service is using it, stop it or change Supabase port
```

---

## Quick Commands Cheat Sheet

```bash
# Check Supabase status
cd /opt/supabase/docker && docker-compose ps

# View logs
docker-compose logs -f auth

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Start services
docker-compose up -d

# Check database
docker exec -it supabase-db psql -U postgres -d postgres

# View API keys
cat .env | grep -E "ANON_KEY|SERVICE_ROLE_KEY"
```

---

## Success Checklist

- [ ] Supabase services running
- [ ] Auth service healthy (curl test passes)
- [ ] Nginx configured and SSL working
- [ ] External URL accessible
- [ ] User data migrated
- [ ] Application `.env.local` updated
- [ ] Application deployed
- [ ] Login working
- [ ] 29 transcriptions visible

---

## If You Get Stuck

1. Check Docker logs: `cd /opt/supabase/docker && docker-compose logs`
2. Verify all services are up: `docker-compose ps`
3. Test internal auth: `curl http://localhost:8000/auth/v1/health`
4. Test external auth: `curl https://supabase.healthscribe.pro/auth/v1/health`
5. Check nginx: `nginx -t && systemctl status nginx`

---

## Alternative: Quick Reference from Working Version

If the above seems complex, you mentioned it was working a week ago. To find the exact working configuration:

```bash
# Check Docker container history
docker ps -a | grep supabase

# If old containers exist, check their configuration
docker inspect <container_id> | grep -A 20 "Env"

# This will show you the exact environment variables that were working
```

---

**Once everything is working, the self-hosted Supabase will be fully functional and you'll have complete control over your data!** 🎉

