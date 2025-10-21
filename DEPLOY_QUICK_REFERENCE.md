# Deployment Quick Reference

## 🚀 Deploy in 5 Steps

### 1. SSH Key (Windows PowerShell - one-time)
```powershell
ssh-keygen -t ed25519 -C "omar@healthscribe" -f "$env:USERPROFILE\.ssh\id_ed25519" -N ""
$pk = Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
ssh root@154.26.155.207 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pk' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 2. VPS Bootstrap (SSH - one-time)
```bash
ssh root@154.26.155.207
docker network create traefik-proxy
mkdir -p /opt/healthscribe/dashboard-next
```

### 3. Setup .env on VPS
```bash
ssh root@154.26.155.207
cd /opt/healthscribe/dashboard-next
cat > .env <<'EOF'
APP_HOST=www.healthscribe.pro
N8N_HOST=n8n.healthscribe.pro
TRAEFIK_HOST=traefik.healthscribe.pro
TRAEFIK_ACME_EMAIL=admin@healthscribe.pro
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://www.healthscribe.pro
NEXT_PUBLIC_URL=https://www.healthscribe.pro
NEXT_PUBLIC_API_URL=https://www.healthscribe.pro/api
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_N8N_URL=https://n8n.healthscribe.pro
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n.healthscribe.pro/webhook
N8N_WEBHOOK_URL=https://n8n.healthscribe.pro
N8N_ENCRYPTION_KEY=YOUR_32_BYTE_HEX_STRING
GOOGLE_API_KEY=YOUR_KEY
OPENAI_API_KEY=YOUR_KEY
APP_IMAGE_TAG=latest
EOF
```

### 4. Deploy from Windows
```powershell
cd "C:\Users\Omar\Desktop\AI website Latest\dashboard-next"
.\deploy.ps1
```

### 5. Verify
```bash
curl https://www.healthscribe.pro
curl https://n8n.healthscribe.pro
```

---

## 📊 Check Status

### Container Status
```bash
ssh root@154.26.155.207
docker compose -f /opt/healthscribe/dashboard-next/docker-compose.yml ps
```

### View Logs
```bash
# Real-time app logs
ssh root@154.26.155.207 "docker compose -f /opt/healthscribe/dashboard-next/docker-compose.yml logs -f app"

# View deployment logs
ssh root@154.26.155.207 "tail -f /opt/healthscribe/dashboard-next/ops/logs/deploy-*.log"

# n8n logs
ssh root@154.26.155.207 "docker compose -f /opt/healthscribe/dashboard-next/docker-compose.yml logs n8n"
```

---

## 🔧 Troubleshooting

### Build failed: Missing env var
**Fix:** SSH to VPS and check .env
```bash
ssh root@154.26.155.207
cat /opt/healthscribe/dashboard-next/.env | grep NEXT_PUBLIC_N8N_URL
```

### App won't start
**Fix:** Check app logs
```bash
ssh root@154.26.155.207
docker compose -f /opt/healthscribe/dashboard-next/docker-compose.yml logs app --tail=50
```

### No SSL certificate
**Wait 2-3 minutes** - Traefik is getting Let's Encrypt cert:
```bash
ssh root@154.26.155.207
docker compose -f /opt/healthscribe/dashboard-next/docker-compose.yml logs traefik | grep -i acme
```

### Rollback to previous version
```bash
ssh root@154.26.155.207
cd /opt/healthscribe/dashboard-next
export APP_IMAGE_TAG=$(cat .deploy/last_app_tag)
docker compose up -d --no-deps app
```

---

## 📝 Files Reference

| File | Purpose | Location |
|------|---------|----------|
| Dockerfile | Next.js build | `./Dockerfile` |
| docker-compose.yml | Stack definition | `./docker-compose.yml` |
| deploy.ps1 | Windows deploy script | `./deploy.ps1` |
| ops/deploy.sh | Server-side deploy | `./ops/deploy.sh` |
| .env.example | Env template (commit) | `./.env.example` |
| .env | Production secrets (VPS only) | `/opt/healthscribe/dashboard-next/.env` |

---

## 🔗 URLs After Deployment

- App: https://www.healthscribe.pro
- n8n: https://n8n.healthscribe.pro
- Traefik Dashboard: https://traefik.healthscribe.pro (if enabled)

---

## 📞 Emergency Restart

```bash
# Hard restart everything
ssh root@154.26.155.207
cd /opt/healthscribe/dashboard-next
docker compose down --remove-orphans
docker compose up -d
```

⚠️ **Do NOT** add `-v` flag (that destroys volumes and data!)

---

## ✅ Pre-Deployment Checklist

- [ ] SSH key generated and installed on VPS
- [ ] Traefik network created: `docker network create traefik-proxy`
- [ ] .env file created on VPS with all values filled in
- [ ] DNS A-records created pointing to 154.26.155.207
- [ ] Supabase credentials obtained
- [ ] TRAEFIK_ACME_EMAIL set to valid email
- [ ] deploy.ps1 is in repo root (Windows)

---

**Need help?** Check logs first, then refer to DEPLOYMENT.md for full guide.
