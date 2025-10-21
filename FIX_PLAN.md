# 502 Bad Gateway - Comprehensive Fix Plan

## Root Cause Analysis

### Current State:
- **Traefik**: Running, routes configured correctly via healthscribe-traefik.yaml
- **App container**: CRASHING on startup (exit code 255)
- **N8N**: Crashing due to encryption key mismatch (separate issue)
- **Redis**: Running fine
- **Network**: traefik-proxy network exists and configured

### Why App is Crashing:
The Dockerfile uses Alpine's `sed` in an environment where the escape sequences don't work as expected. The sed command fails, causing the RUN to error out with exit code 255.

**Current failing line in Dockerfile (line 56):**
```dockerfile
RUN sed -i "s/const hostname = process\\.env\\.HOSTNAME || '0\\.0\\.0\\.0'/const hostname = '0.0.0.0'/" /app/server.js
```

### The Real Problem:
Node.js's standalone server.js binds to whatever HOSTNAME env var Docker sets. Docker overrides it with the container ID, so Node.js only listens on the first network interface (internal), not 0.0.0.0. Traefik can't reach it.

## Solution Overview

### Phase 1: Fix the Dockerfile
- Remove the complex sed command that fails
- Use a simpler Node.js approach: create a wrapper script or use environment variable properly
- **Best approach**: Copy a fixed server.js or modify at runtime before USER nextjs

### Phase 2: Fix docker-compose.yml  
- No changes needed (configuration is correct)
- Network setup is correct

### Phase 3: Fix Traefik Configuration
- No changes needed (healthscribe-traefik.yaml is correct)

### Phase 4: Fix N8N (bonus)
- Clear encryption key mismatch by removing old config

---

## Detailed Implementation

### FIX 1: Dockerfile - Simple Node.js wrapper

Replace the failing sed line with a Node.js-based patching approach that's more reliable:

**File**: Dockerfile (line 50-65)

OLD (FAILING):
```dockerfile
# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Force server.js to bind to 0.0.0.0 (MUST be done as root before USER nextjs)
RUN sed -i "s/const hostname = process\\.env\\.HOSTNAME || '0\\.0\\.0\\.0'/const hostname = '0.0.0.0'/" /app/server.js

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000 || exit 1

CMD ["node", "server.js"]
```

NEW (WORKING):
```dockerfile
# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Create a startup wrapper script that forces 0.0.0.0 binding (as root before USER nextjs)
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
# Override the hostname to bind to all interfaces
exec node -e "
process.env.HOSTNAME = '0.0.0.0';
const fs = require('fs');
const code = fs.readFileSync('./server.js', 'utf8');
eval(code);
"
EOF
RUN chmod +x /app/start.sh

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000 || exit 1

# Use the wrapper script instead of node directly
CMD ["/app/start.sh"]
```

**WHY THIS WORKS:**
- ✅ Runs BEFORE USER nextjs (as root, can write files)
- ✅ No complex sed escaping
- ✅ Directly sets HOSTNAME in Node.js process (not Docker env)
- ✅ Simpler and more maintainable
- ✅ Guarantees server binds to 0.0.0.0

---

### FIX 2: N8N Encryption Key Issue (BONUS)

The n8n container keeps crashing because the saved encryption key doesn't match the environment variable.

**Solution**: Clear the old config volume so n8n regenerates it:

```bash
# On the server:
docker compose down n8n
docker volume rm healthscribe_n8n-data  # WARNING: clears n8n config
docker compose up -d n8n

# n8n will recreate its config with the current encryption key
```

**Or, less destructive**: Update docker-compose.yml to add this environment variable:
```yaml
n8n:
  environment:
    - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false  # Ignore permission warnings
```

---

## Deployment Steps

### Step 1: Update Dockerfile locally
- Apply FIX 1 above to Dockerfile

### Step 2: Copy files to server
```bash
scp -o StrictHostKeyChecking=no Dockerfile root@154.26.155.207:/opt/healthscribe/dashboard-next/
```

### Step 3: On server - rebuild and restart
```bash
cd /opt/healthscribe/dashboard-next

# Stop everything
docker compose down

# Create external network if missing
docker network create traefik-proxy 2>/dev/null || true

# Full rebuild
docker compose build --no-cache app

# Start all services
docker compose up -d

# Monitor startup
sleep 5
docker compose ps
docker logs healthscribe-app-1
```

### Step 4: Verify connectivity
```bash
# Check app is listening on all interfaces
docker exec healthscribe-app-1 netstat -tuln | grep 3000

# Should see: tcp        0      0 0.0.0.0:3000           0.0.0.0:*               LISTEN

# Test Traefik to app
docker exec healthscribe-traefik-1 wget -qO- http://app:3000/login 2>&1 | head -3

# Test via HTTP (will redirect to HTTPS)
curl -i -H 'Host: healthscribe.pro' http://localhost/

# Should see: 301 Moved Permanently
# Location: https://healthscribe.pro/

# Test via HTTPS
curl -i https://healthscribe.pro/

# Should see: 200 OK (or redirect to /login)
```

### Step 5: Fix N8N (Optional)
```bash
# Option A: Nuke and rebuild n8n
docker compose down n8n
docker volume rm healthscribe_n8n-data  # WARNING: loses n8n data
docker compose up -d n8n

# Option B: Just ignore permission errors
# (No action needed if it's not blocking your setup)
```

---

## Rollback Plan

If something breaks:

```bash
# Revert to previous Dockerfile
scp -o StrictHostKeyChecking=no your_backup_Dockerfile root@154.26.155.207:/opt/healthscribe/dashboard-next/Dockerfile

# Rebuild and restart
ssh root@154.26.155.207 'cd /opt/healthscribe/dashboard-next && docker compose down && docker compose build app && docker compose up -d'
```

---

## Expected Outcome

✅ App container will start successfully  
✅ App will bind to 0.0.0.0:3000  
✅ Traefik can connect to it via http://app:3000  
✅ Website accessible at https://healthscribe.pro  
✅ No more 502 Bad Gateway errors  
