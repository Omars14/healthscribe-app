# 🔧 Coolify Routing Issue - Debug Commands

Your Next.js app is running perfectly (port 3000), but Coolify's reverse proxy isn't routing traffic to it.

## 🚨 IMMEDIATE FIX - Run These In Coolify Server Terminal

### 1. Check Container Status
```bash
# List all containers
docker ps | grep tkwoos4s

# Expected output: Should show your container running on port 3000
# Container ID: tkwoos4soccckws84088wc04-031350049020 (or similar)
```

### 2. Test Container Directly
```bash
# Get your container ID from step 1, then:
CONTAINER_ID="tkwoos4soccckws84088wc04-031350049020"

# Test if app responds inside container
docker exec -it $CONTAINER_ID curl http://localhost:3000/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

### 3. Check Network Configuration
```bash
# Inspect container network
docker inspect $CONTAINER_ID | grep -A 20 "NetworkSettings"

# Should show it's connected to 'coolify' network
```

### 4. Check Traefik Configuration
```bash
# List Traefik containers
docker ps | grep traefik

# Check Traefik logs for routing errors
docker logs $(docker ps | grep traefik | awk '{print $1}') --tail=50
```

### 5. Verify DNS Resolution
```bash
# Test internal DNS resolution
docker exec -it $(docker ps | grep traefik | awk '{print $1}') nslookup tkwoos4soccckws84088wc04-031350049020

# Test direct container connectivity
docker exec -it $(docker ps | grep traefik | awk '{print $1}') curl http://tkwoos4soccckws84088wc04-031350049020:3000/api/health
```

## 🔧 COOLIFY DASHBOARD FIXES

### Fix 1: Check Service Port Configuration
1. **Go to Coolify Dashboard**
2. **Find your HealthScribe service**
3. **Go to "Configuration" → "Service"**
4. **Verify these settings:**
   - **Port**: `3000` ✅
   - **Expose**: `Enabled` ✅
   - **Publish**: `Enabled` ✅

### Fix 2: Check Domain Configuration
1. **Go to "Configuration" → "Domains"**
2. **Ensure domain is set to**: `www.healthscribe.pro`
3. **SSL Certificate should be**: `Valid`

### Fix 3: Check Labels/Traefik Configuration
1. **Go to "Configuration" → "Advanced"**
2. **Look for Traefik labels**
3. **Should include**:
   ```
   traefik.enable=true
   traefik.http.routers.{name}.rule=Host(`www.healthscribe.pro`)
   traefik.http.services.{name}.loadbalancer.server.port=3000
   ```

## 🚀 EMERGENCY FIXES

### Option A: Restart Service
```bash
# In Coolify dashboard
1. Stop the service
2. Wait 10 seconds
3. Start the service
4. Check logs for "Ready in XXXms"
```

### Option B: Force Container Recreation
```bash
# SSH to your server and run:
cd /path/to/coolify/data
docker compose down {service-name}
docker compose up -d {service-name}
```

### Option C: Traefik Restart
```bash
# Sometimes Traefik needs a kick
docker restart $(docker ps | grep traefik | awk '{print $1}')
```

## ✅ SUCCESS INDICATORS

After fixes, you should see:
```bash
curl -I https://www.healthscribe.pro
# Expected: HTTP/1.1 200 OK (not 503)
```

## 🆘 IF ALL ELSE FAILS

### Manual Port Binding (Temporary)
If Traefik is completely broken, you can expose the port directly:

1. **Stop the service in Coolify**
2. **Manually run container with port binding**:
```bash
docker run -d \
  --name healthscribe-emergency \
  --network coolify \
  -p 8080:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro \
  [... other env vars ...] \
  tkwoos4soccckws84088wc04:28af2e68a093008fa95595a3989712fedc52bd71
```

3. **Access via**: `http://your-vps-ip:8080`

---

**The core issue**: Your app works fine, but Coolify's reverse proxy (Traefik) isn't routing HTTPS traffic to your container's port 3000.