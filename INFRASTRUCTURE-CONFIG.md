# HealthScribe Infrastructure Configuration Guide

## Overview

This document describes the complete Docker and network setup for the HealthScribe application, including all containers, networks, and connectivity requirements.

**Last Updated:** December 22, 2025

## System Architecture

### Containers

The HealthScribe system consists of 9 Docker containers across 3 separate docker-compose stacks:

#### 1. Medical Transcription App Stack (app_medical-transcription)
```
Name: medical-transcription-app
Image: healthscribe/app:latest
Purpose: Next.js web application
Port: 3000 (internal), exposed as 0.0.0.0:3000
Status: Must be running
```

#### 2. Internal Services Stack (app_medical-transcription)
```
Name: medical-transcription-postgres
Image: postgres:15
Purpose: Application database
Port: 5432 (internal)
Volume: app_postgres_data
Status: Must be running

Name: medical-transcription-redis
Image: redis:7-alpine
Purpose: Caching and session storage
Port: 6379 (internal)
Volume: app_redis_data
Status: Must be running

Name: medical-transcription-n8n-db
Image: postgres:15-alpine
Purpose: N8N workflow database
Port: 5432 (internal)
Volume: healthscribe_n8n-db-data
Status: Must be running
```

#### 3. Supabase Stack (healthscribe_web)
```
Name: supabase-db
Image: supabase/postgres:15.8.1.085
Purpose: Supabase PostgreSQL database
Port: 5432 (internal)
Status: Must be running (healthy)

Name: supabase-rest
Image: postgrest/postgrest:v13.0.7
Purpose: REST API interface for Supabase
Port: 3000 (internal)
Status: Must be running

Name: supabase-kong
Image: kong:2.8.1
Purpose: API Gateway and reverse proxy
Port: 8000, 8443 (internal)
Status: Must be running (healthy) - CRITICAL FOR STORAGE UPLOADS

Name: supabase-auth
Image: supabase/gotrue:v2.180.0
Purpose: Authentication service
Port: 9999 (internal)
Status: Must be running (healthy)

Name: supabase-storage
Image: supabase/storage-api:v1.28.1
Purpose: File storage service
Port: 5000 (internal)
Status: Must be running (healthy) - CRITICAL FOR FILE UPLOADS
```

## Network Configuration

### Networks Used

| Network Name | Purpose | Type | Containers |
|---|---|---|---|
| `app_medical-transcription` | Internal app services | bridge | medical-transcription-app, postgres, redis, n8n-db |
| `healthscribe_web` | Supabase and external services | bridge | supabase-* (all), medical-transcription-app |
| `supabase_default` | Internal Supabase communication | bridge | supabase-* (all) |
| `supabase_network_supabase` | Supabase internal network | bridge | supabase-* (all) |
| `traefik-proxy` | External ingress | bridge | supabase-kong, nginx, traefik |

### Critical Network Connections

**The app container MUST be on BOTH networks:**

1. **app_medical-transcription** (10.0.4.x)
   - Connects to: medical-transcription-postgres, medical-transcription-redis
   - IP: 10.0.4.2
   - Purpose: Internal service communication

2. **healthscribe_web** (10.0.6.x)
   - Connects to: supabase-kong, supabase-storage, supabase-auth
   - IP: 10.0.6.4
   - Purpose: Supabase integration and file uploads

### Hostname Resolution

Inside the app container, the following hostnames must resolve correctly:

```
medical-transcription-postgres:5432  → 10.0.4.x  (internal postgres)
medical-transcription-redis:6379     → 10.0.4.x  (internal redis)
supabase-kong:8000                   → 10.0.6.x  (supabase gateway)
supabase-auth:9999                   → 10.0.6.x  (supabase auth)
supabase-storage:5000                → 10.0.6.x  (supabase storage)
```

## Critical Paths and Connectivity

### File Upload Flow (Most Critical)

1. **Client → App (via nginx/https)**
   ```
   https://healthscribe.pro/api/transcribe-optimized
   → nginx:443 (host)
   → medical-transcription-app:3000 (docker)
   ```

2. **App → Supabase Storage (must work)**
   ```
   medical-transcription-app
   → supabase-kong:8000 (via healthscribe_web network)
   → /storage/v1/object/audio-files/...
   ```

   **If this fails:** You'll see errors like:
   ```
   Error: getaddrinfo EAI_AGAIN supabase-kong
   Failed to upload audio to storage
   ```

### Database Connection

1. **App → PostgreSQL**
   ```
   medical-transcription-app
   → medical-transcription-postgres:5432 (via app_medical-transcription network)
   ```

2. **App → Supabase DB (via PostgREST)**
   ```
   medical-transcription-app
   → supabase-kong:8000 → supabase-rest:3000
   → supabase-db:5432
   ```

### Redis Cache

```
medical-transcription-app
→ medical-transcription-redis:6379 (via app_medical-transcription network)
```

## Verification Commands

### 1. Check All Containers Running

```bash
# SSH into server
ssh -i ~/.ssh/healthscribe_key root@154.26.155.207

# Verify all containers are up
docker ps | grep -E "medical-transcription|supabase"
# Should show 9 containers all with "Up" status
```

### 2. Verify Network Connectivity

```bash
# Check app is on both networks
docker inspect medical-transcription-app | grep -A 30 'Networks' | grep -E "app_medical-transcription|healthscribe_web"

# Should show BOTH networks present
```

### 3. Test Hostname Resolution

```bash
# From inside app container
docker exec medical-transcription-app nslookup supabase-kong
# Should resolve to 10.0.6.3

docker exec medical-transcription-app nslookup medical-transcription-redis
# Should resolve to 10.0.4.4
```

### 4. Test Supabase Connectivity

```bash
# Check if supabase-kong is responding
docker exec supabase-kong wget -qO- http://supabase-kong:8000/status 2>&1 | head

# Check storage is responding
docker exec supabase-storage wget -qO- http://localhost:5000/status 2>&1 | head
```

### 5. Check App Logs for Upload Issues

```bash
# Watch for storage upload errors
docker logs medical-transcription-app 2>&1 | grep -i "upload\|storage" | tail -20

# Look for:
# ✅ Audio uploaded successfully  (GOOD)
# ❌ Failed to upload           (BAD - network issue)
```

## Troubleshooting

### Problem: "Failed to upload audio file to storage"

**Error Message:** `getaddrinfo EAI_AGAIN supabase-kong`

**Cause:** App container is not on the `healthscribe_web` network

**Fix:**
```bash
# Connect the app to the correct network
docker network connect healthscribe_web medical-transcription-app

# Restart app to refresh connections
docker restart medical-transcription-app

# Verify
docker inspect medical-transcription-app | grep -A 5 healthscribe_web
```

### Problem: Database Connection Failed

**Cause:** PostgreSQL container not running or app not on correct network

**Fix:**
```bash
# Check postgres is running
docker ps | grep medical-transcription-postgres

# Check network connectivity
docker exec medical-transcription-app nslookup medical-transcription-postgres

# Restart if needed
docker restart medical-transcription-postgres
```

### Problem: Container Won't Start After Docker Restart

**Cause:** Docker restart policy may have failed

**Fix:**
```bash
# Restart all app containers
docker start medical-transcription-app
docker start medical-transcription-postgres
docker start medical-transcription-redis
docker start medical-transcription-n8n-db

# Restart supabase containers
docker start supabase-db
docker start supabase-rest
docker start supabase-kong
docker start supabase-auth
docker start supabase-storage

# If still failing, check logs
docker logs medical-transcription-app 2>&1 | tail -50
```

### Problem: Supabase-Kong Not Responding

**Symptoms:** Uploads fail, PostgREST doesn't work

**Fix:**
```bash
# Restart Kong with proper network
docker restart supabase-kong

# Check it's on all required networks
docker inspect supabase-kong | grep -E "healthscribe_web|supabase_default|traefik-proxy"

# All three networks should be present
```

## Docker Compose Files

### 1. App Stack Location
```
/root/healthscribe-build/docker-compose.yml
```

Services defined:
- traefik (reverse proxy)
- n8n (workflow engine)
- redis (caching)
- app (next.js)

### 2. Supabase Stack Location
```
/root/healthscribe-build/supabase/docker-compose.yml
# OR check if it's in a separate supabase directory
```

Services defined:
- supabase-db
- supabase-rest
- supabase-kong
- supabase-auth
- supabase-storage

## Environment Variables

### Critical App Environment Variables

```
NODE_ENV=production
SUPABASE_SERVICE_ROLE_KEY=<set in .env>
OPENAI_API_KEY=<set in .env>
GOOGLE_API_KEY=<set in .env>
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook
REDIS_URL=redis://medical-transcription-redis:6379
HOSTNAME=0.0.0.0
```

### Supabase URLs (Inside App)

```
Internal Supabase URL: http://supabase-kong:8000
(Must use hostname, not IP, for DNS resolution)
```

## Health Check Endpoints

```
# App health
curl http://localhost:3000/api/health

# Supabase Kong
curl http://supabase-kong:8000/status

# Supabase Storage
curl http://supabase-storage:5000/status

# Via HTTPS (from outside)
curl -k https://healthscribe.pro/
```

## Security Notes

### Network Isolation

- App container is isolated on `app_medical-transcription` for internal services
- App connects to `healthscribe_web` for Supabase only
- No direct internet access from containers (only through nginx reverse proxy)
- All inter-container communication happens on bridge networks

### Volumes

- Data persists in Docker volumes (not lost on container restart)
- PostgreSQL data: `app_postgres_data`, `supabase_db-config`
- Redis data: `app_redis_data`
- N8N data: `healthscribe_n8n-data`, `n8n_data`

## Recovery Procedures

### If Website is Down

1. **Check if app container is running**
   ```bash
   docker ps | grep medical-transcription-app
   ```

2. **Verify network connectivity**
   ```bash
   docker inspect medical-transcription-app | grep healthscribe_web
   # If missing, run: docker network connect healthscribe_web medical-transcription-app
   ```

3. **Check logs**
   ```bash
   docker logs medical-transcription-app 2>&1 | tail -100
   ```

4. **Restart if needed**
   ```bash
   docker restart medical-transcription-app
   ```

### If Uploads are Failing

1. **Verify app is on healthscribe_web network**
   ```bash
   docker inspect medical-transcription-app | grep -A 5 healthscribe_web
   ```

2. **Verify supabase-kong is running and healthy**
   ```bash
   docker ps | grep supabase-kong
   docker logs supabase-kong 2>&1 | tail -20
   ```

3. **Test connectivity from app**
   ```bash
   docker exec medical-transcription-app nslookup supabase-kong
   # Must resolve to 10.0.6.3
   ```

4. **If all checks pass, restart app**
   ```bash
   docker restart medical-transcription-app
   ```

## Deployment

### To Deploy Changes

1. **Update code in local repo**
2. **Commit and push**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin master
   ```

3. **On server, pull and rebuild**
   ```bash
   cd /root/healthscribe-build
   git pull origin master
   docker-compose down
   docker-compose up -d
   ```

4. **Verify all containers started**
   ```bash
   docker ps | wc -l  # Should show 9 + header = 10 lines
   ```

## Monitoring

### Monitor All Services

```bash
# Watch container status
watch 'docker ps | grep -E "medical-transcription|supabase"'

# Watch app logs
docker logs -f medical-transcription-app 2>&1 | grep -E "upload|error|ERROR"

# Monitor disk usage
docker system df
```

### Key Metrics to Monitor

- All containers status must be "Up"
- Healthy containers (supabase-kong, supabase-db, supabase-auth, supabase-storage) must be "healthy"
- No "getaddrinfo EAI_AGAIN" errors in app logs
- Upload logs show "✅ Audio uploaded successfully"
- No OOM (Out of Memory) errors

## Support

If containers become misaligned:

1. **Don't force restart** - check logs first
2. **Verify networks** - ensure app is on both required networks
3. **Check DNS** - run nslookup tests
4. **Check volumes** - ensure data persists correctly
5. **Review logs** - look for specific error messages

