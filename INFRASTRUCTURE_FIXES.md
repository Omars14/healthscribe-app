# Healthscribe.pro Infrastructure Fixes & Architecture

## Overview
This document outlines all critical fixes applied to the Healthscribe infrastructure, including SSL/TLS routing, container networking, and service orchestration.

---

## 1. Critical Issues & Resolutions

### Issue 1.1: 502 Bad Gateway on n8n Service
**Problem:** n8n service returned 502 errors despite being running internally.

**Root Cause:** 
- Traefik reverse proxy was not running or properly configured
- n8n container was only on internal network, not accessible via Traefik proxy
- No Traefik labels or routing configuration on n8n service

**Solution:**
1. Added Traefik service definition to docker-compose
2. Configured Traefik to listen on ports 80/443
3. Added Traefik routing rules via dynamic configuration file
4. Removed conflicting Docker labels from n8n in docker-compose (to use file-based config instead)
5. Verified Traefik acme volume for SSL certificate persistence

**Implementation Details:**
```yaml
Traefik Service:
  - Listens on port 80 (HTTP redirect) and 443 (HTTPS)
  - Uses Let's Encrypt for SSL via acme.json volume
  - Configured with file provider for dynamic routing rules
  - Runs on traefik-proxy network for container discovery
  - Mounts healthscribe-traefik.yaml for service routes
```

---

### Issue 1.2: Missing SSL Certificates
**Problem:** Main website and n8n not accessible via HTTPS, SSL certificate errors.

**Root Cause:**
- Old Coolify nginx container occupying ports 80/443
- Traefik not running to manage SSL certificates
- No acme.json volume for certificate storage

**Solution:**
1. Stopped and removed old nginx container (Coolify leftover)
2. Added Traefik service with Let's Encrypt configuration
3. Created persistent `traefik-acme` volume for certificate storage
4. Configured Traefik command with proper ACME challenge methods

**Command Used:**
```bash
docker stop healthscribe-nginx
docker rm healthscribe-nginx
```

**Traefik ACME Configuration:**
```yaml
Environment Variables:
  - TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_HTTPCHALLENGE=true
  - TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_HTTPCHALLENGE_ENTRYPOINT=web
  - TRAEFIK_CERTIFICATESRESOLVERS_LETSENCRYPT_ACME_STORAGE=/letsencrypt/acme.json
```

---

### Issue 1.3: Network Isolation & Container Discovery
**Problem:** Services couldn't communicate due to incorrect network configuration.

**Root Cause:**
- Multiple networks (coolify, traefik-proxy) not properly connected
- Static IPs not assigned to services
- Traefik couldn't discover services on internal networks

**Solution:**
1. Implemented static IP assignments for critical services:
   ```yaml
   Networks:
     app: 172.20.0.2
     supabase-postgres: 172.20.0.3
     supabase-kong: 172.20.0.4
     supabase-vector: 172.20.0.5
     n8n: 172.20.0.6
   ```

2. Unified under `traefik-proxy` network for service discovery
3. Preserved old `coolify` network for backward compatibility

---

## 2. Architecture Overview

### Service Structure
```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                          │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Traefik Reverse Proxy                       │
│  (Port 80→443, SSL via Let's Encrypt, Dynamic Routing)  │
└────────────────┬───────────────┬───────────────┬────────┘
                 │ HTTP Route    │ HTTP Route    │ HTTP Route
                 ▼               ▼               ▼
        ┌─────────────┐  ┌──────────────┐  ┌──────────┐
        │ Main App    │  │ n8n Service  │  │ Dashboard│
        │  :3000      │  │  :5678       │  │  (proxy) │
        └─────────────┘  └──────────────┘  └──────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  Supabase Stack (Internal)       │
        │  - Kong API Gateway      :8000   │
        │  - PostgreSQL           :5432    │
        │  - Vector (pgvector)    :6534    │
        │  - Auth Service         (internal)
        └──────────────────────────────────┘
```

### Docker Networks
```
traefik-proxy:
  ├─ Traefik (172.20.0.1)
  ├─ healthscribe-app (172.20.0.2)
  ├─ supabase-postgres (172.20.0.3)
  ├─ supabase-kong (172.20.0.4)
  ├─ supabase-vector (172.20.0.5)
  └─ n8n (172.20.0.6)

coolify (legacy):
  └─ (maintained for backward compatibility)
```

---

## 3. Configuration Files

### Traefik Dynamic Configuration
**File:** `healthscribe-traefik.yaml`

Contains routes for:
- Main application → localhost:3000
- n8n service → localhost:5678
- Dashboard → proxied through main app

**Key Backticks:** Routes defined with backticks for Traefik middleware and path matching

### Environment Variables
**File:** `.env.local`

Critical variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro
```

---

## 4. Validation & Testing

### Health Checks
1. **SSL Certificate:** Verified via browser HTTPS connection
2. **Traefik Dashboard:** Accessible at configured URL
3. **n8n Service:** Returns 200 status code
4. **Main Application:** Login page loads without SSL errors
5. **Container Networks:** All services on `traefik-proxy` network

### Testing Commands
```bash
# Check Traefik logs
docker logs traefik

# Verify n8n routing
curl -v https://n8n.healthscribe.pro

# Check container networks
docker network inspect traefik-proxy

# Verify volumes
docker volume ls | grep traefik
```

---

## 5. Lessons Learned & Prevention

### What Breaks What
| When You Fix | This May Break |
|---|---|
| SSL/Traefik | Backend API endpoints (if CORS misconfigured) |
| Container networking | Database connections (if IPs change) |
| Environment variables | API authentication (if keys invalid) |
| Database schema | User profiles and transcription queries |

### Prevention Strategy
1. **Before changes:** Document current state and backup configs
2. **Test incrementally:** Fix one issue, verify others still work
3. **Staging environment:** Test infrastructure changes before production
4. **Monitoring:** Keep logs of all services for quick diagnostics
5. **Rollback plan:** Maintain previous working docker-compose version

---

## 6. Future Improvements

1. **Kubernetes Migration:** Move from Docker Compose to K8s for better service management
2. **Monitoring Stack:** Add Prometheus + Grafana for infrastructure visibility
3. **Automated SSL Renewal:** Ensure Let's Encrypt certificates auto-renew
4. **Load Balancing:** Implement load balancing for high availability
5. **Database Replication:** Set up PostgreSQL replication for disaster recovery

---

## 7. Quick Reference

### Restart All Services
```bash
docker-compose down
docker-compose up -d
```

### Check Service Status
```bash
docker ps -a --filter "label=com.docker.compose.project=healthscribe"
```

### Access Logs
```bash
docker logs healthscribe-app -f
docker logs traefik -f
docker logs n8n -f
```

### Emergency Rollback
```bash
git checkout docker-compose.yml
docker-compose down
docker-compose up -d
```

---

**Last Updated:** October 22, 2025
**Maintained By:** Infrastructure Team
