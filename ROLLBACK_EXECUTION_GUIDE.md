# 🎯 Healthscribe Pro - Oct 12 Rollback Execution Guide

**Target State:** Commit `c35937a` from October 12, 2025 01:25:25 UTC  
**VPS:** 154.26.155.207  
**Domains:**
- **Application:** https://healthscribe.pro
- **API/Supabase:** https://supabase.healthscribe.pro
- **n8n Workflows:** https://n8n.healthscribe.pro

---

## ✅ Completed Steps
- [x] Scope and inputs collected
- [x] SSH session established
- [x] Full backup of current broken state: `/root/rollbacks/2025-10-20/`
- [x] All containers stopped gracefully
- [x] Docker network `coolify` verified

---

## 🚀 Next Steps (Must Execute in Order)

### Step 1: Restore Application Code to Oct 12

```bash
ssh root@154.26.155.207

# Navigate to app repo or clone fresh
if [ ! -d "/opt/app/.git" ]; then
  cd /opt
  git clone https://github.com/yourusername/your-repo.git app
  cd app
else
  cd /opt/app
fi

# Verify the commit exists and checkout
git fetch --all --tags
git log --oneline | grep c35937a || echo "Commit not found in history!"
git reset --hard c35937a

# Verify successful checkout
git log -1 --oneline
```

### Step 2: Restore Environment Variables (CRITICAL)

The extracted env from Coolify shows these key values:

**Extract from current backup:**
```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwODgzNDY0LCJleHAiOjIwNzYyNDM0NjR9.BKKuiWHJ8BP4F1lT_ygeOQkBp7hOzb68irBIgJK3dRs

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImViYzM3ODRkLWYzNDYtNGExMS1hMjk3LTBjMjgwZGZjNjNjNCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzYwOTc5NzcwLCJleHAiOjE3NjE1ODQ1NzB9.2tIvZsYpSkQujAAWOEbeVavUTwwkgLMQPU10cf1rkAc

JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
```

**Create new .env file for application:**
```bash
cat > /data/coolify/applications/tkwoos4soccckws84088wc04/.env << 'EOF'
NODE_ENV=production
NEXT_TELEMETRY_DISABLE=1
NEXT_PUBLIC_URL=https://healthscribe.pro
NEXT_PUBLIC_API_URL=https://healthscribe.pro
NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYwODgzNDY0LCJleHAiOjIwNzYyNDM0NjR9.BKKuiWHJ8BP4F1lT_ygeOQkBp7hOzb68irBIgJK3dRs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImViYzM3ODRkLWYzNDYtNGExMS1hMjk3LTBjMjgwZGZjNjNjNCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzYwOTc5NzcwLCJleHAiOjE3NjE1ODQ1NzB9.2tIvZsYpSkQujAAWOEbeVavUTwwkgLMQPU10cf1rkAc
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
CALLBACK_URL=https://healthscribe.pro/api/transcription-result-v2
NEXT_PUBLIC_CALLBACK_URL=https://healthscribe.pro/api/transcription-result-v2
STORAGE_BUCKET_NAME=audio-files
HOST=0.0.0.0
PORT=3000
EOF
```

### Step 3: Reset Supabase Volumes (Clean Database)

```bash
# Remove old Supabase volumes - data will be rebuilt from migrations
docker volume ls | grep -i supabase | awk '{print $2}' | while read vol; do
  docker volume rm "$vol" 2>/dev/null || true
done
echo "✅ Supabase volumes wiped"
```

### Step 4: Deploy Fresh Supabase Stack

The Supabase compose from Coolify at `/data/coolify/services/e088wwks88k8k48sccg8gk0o/docker-compose.yml` will be used.

**Key environment variables for Supabase:**

```bash
export SUPABASE_PROJECT=healthscribe
export JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
export POSTGRES_PASSWORD=postgres
export SUPABASE_ADMIN_EMAIL=admin@healthscribe.pro
export SUPABASE_ADMIN_PASSWORD=AdminPass2024!

# Bring up Supabase fresh
cd /data/coolify/services/e088wwks88k8k48sccg8gk0o/
docker-compose up -d db
sleep 15  # Wait for DB to be ready
docker-compose up -d
sleep 30  # Wait for all services
echo "✅ Supabase deployed"
```

### Step 5: Verify Supabase Connectivity

```bash
# Check internal service names resolve
docker run --rm --network coolify alpine ping -c1 supabase-auth 2>&1 | grep "64 bytes" && echo "✅ supabase-auth resolved"
docker run --rm --network coolify alpine ping -c1 supabase-db 2>&1 | grep "64 bytes" && echo "✅ supabase-db resolved"

# Check auth health
docker exec -it supabase-auth-e088wwks88k8k48sccg8gk0o curl -s http://localhost:9999/health | jq . && echo "✅ Auth healthy"

# Check DB connection
docker exec -it supabase-db-e088wwks88k8k48sccg8gk0o pg_isready -U postgres && echo "✅ DB ready"
```

### Step 6: Apply Database Schema from Oct 12

Locate migrations in the codebase:

```bash
cd /opt/app
find . -path "./supabase/migrations" -o -path "./prisma/migrations" -o -path "*/db/migrations"

# If using supabase CLI migrations:
docker run --rm \
  --network coolify \
  -v /opt/app/supabase/migrations:/migrations \
  -e POSTGRES_URL=postgres://postgres:postgres@supabase-db:5432/postgres \
  supabase/postgres:15.8 \
  sh -c 'for f in /migrations/*.sql; do psql "$POSTGRES_URL" -f "$f"; done'

echo "✅ Database schema applied"
```

### Step 7: Ensure Traefik is Running with Correct Config

Traefik is managed by Coolify, but verify it's up and has the correct settings:

```bash
docker-compose -f /data/coolify/proxy/docker-compose.yml up -d
sleep 10

# Check Traefik logs for errors
docker logs -n 50 coolify-proxy | tail -20
echo "✅ Traefik ready"
```

### Step 8: Build and Deploy Application Container

```bash
cd /data/coolify/applications/tkwoos4soccckws84088wc04/

# Build the fresh container
docker-compose build --no-cache

# Start the container
docker-compose up -d

# Verify it's running and connected to coolify network
docker inspect tkwoos4soccckws84088wc04-* --format '{{json .NetworkSettings.Networks}}' | jq .

echo "✅ Application deployed"
```

### Step 9: Verify All Containers Are Healthy

```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "supabase|traefik|healthscribe|n8n"
```

---

## 🔍 Verification Checklist

**DNS Resolution:**
```bash
dig +short healthscribe.pro     # Should return 154.26.155.207
dig +short supabase.healthscribe.pro  # Should return 154.26.155.207
dig +short n8n.healthscribe.pro  # Should return 154.26.155.207
```

**TLS Certificates:**
```bash
curl -I https://healthscribe.pro        # Should return 200 or 302
curl -I https://supabase.healthscribe.pro  # Should return 200
curl -I https://n8n.healthscribe.pro    # Should return 200
```

**Supabase Health:**
```bash
curl -sSf https://supabase.healthscribe.pro/auth/v1/health | jq .
curl -sSf https://supabase.healthscribe.pro/rest/v1/ | jq . || echo "Expected 403"
```

**Application Login:**
1. Go to https://healthscribe.pro
2. Try to login with any test account
3. Upload a test audio file
4. Verify transcription processes through n8n

---

## 🆘 Troubleshooting

### If Traefik shows 404 for API domain:

1. Check Kong is running: `docker ps | grep supabase-kong`
2. Verify Kong is on coolify network: `docker inspect KONG_CONTAINER | grep coolify`
3. Restart Kong: `docker restart supabase-kong-e088wwks88k8k48sccg8gk0o`
4. Check Traefik logs: `docker logs coolify-proxy | grep -i "supabase\|api"`

### If Auth returns 401 or JWT errors:

1. Verify JWT_SECRET is identical in Supabase and app env
2. Check SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY match in both places
3. Restart auth service: `docker restart supabase-auth-e088wwks88k8k48sccg8gk0o`

### If uploads fail:

1. Check storage bucket exists: `docker exec -it supabase-db-... psql -U postgres -c "SELECT * FROM storage.buckets;"`
2. Verify RLS policies on storage: `docker exec -it supabase-db-... psql -U postgres -c "SELECT * FROM storage.policies;"`
3. Check n8n webhook connectivity: `curl https://n8n.healthscribe.pro`

---

## 📝 Backup Restoration (If Needed)

To revert to pre-rollback broken state:

```bash
/root/rollbacks/2025-10-20/restore.sh
```

---

## ✨ Success Indicators

- [x] All containers healthy and on `coolify` network
- [x] DNS resolves all three domains to 154.26.155.207
- [x] TLS certificates issued by Let's Encrypt
- [x] Supabase auth responds to health checks
- [x] Application loads at https://healthscribe.pro
- [x] Login works with valid credentials
- [x] Uploads process successfully through n8n
- [x] No errors in Docker logs for critical services
