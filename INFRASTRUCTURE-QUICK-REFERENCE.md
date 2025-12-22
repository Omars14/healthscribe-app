# Infrastructure Quick Reference

## Quick Status Check

```bash
# SSH to server
ssh -i ~/.ssh/healthscribe_key root@154.26.155.207

# Check all containers (should show 9)
docker ps | grep -E "medical-transcription|supabase"

# Check website is up
curl -s -k https://localhost/ | head -20
```

## If Uploads Are Failing

**Most common cause:** App container is not on the `healthscribe_web` network

```bash
# Fix in 2 steps:
docker network connect healthscribe_web medical-transcription-app
docker restart medical-transcription-app

# Verify fix worked
docker logs medical-transcription-app 2>&1 | tail -20
# Look for: ✅ Audio uploaded successfully
```

## If Website is Down

```bash
# 1. Check if app is running
docker ps | grep medical-transcription-app

# 2. If not running, start it
docker start medical-transcription-app

# 3. Check logs
docker logs medical-transcription-app 2>&1 | tail -50

# 4. If still broken, verify network
docker inspect medical-transcription-app | grep healthscribe_web
# If missing, run the "Uploads Failing" fix above
```

## If All Services Went Down (Docker Restart)

```bash
# Restart all containers
docker start medical-transcription-app
docker start medical-transcription-postgres
docker start medical-transcription-redis
docker start medical-transcription-n8n-db
docker start supabase-db
docker start supabase-rest
docker start supabase-kong
docker start supabase-auth
docker start supabase-storage

# Wait 30 seconds for services to initialize
sleep 30

# Verify all are up
docker ps | wc -l  # Should show 10 (9 containers + header)

# If app needs network fix
docker network connect healthscribe_web medical-transcription-app
docker restart medical-transcription-app
```

## Network Overview

| Container | Network 1 | Network 2 | Network 3 | Purpose |
|-----------|-----------|-----------|-----------|---------|
| medical-transcription-app | app_medical-transcription | healthscribe_web | - | Next.js app |
| postgres | app_medical-transcription | - | - | App database |
| redis | app_medical-transcription | - | - | Caching |
| n8n-db | app_medical-transcription | - | - | N8N database |
| supabase-kong | healthscribe_web | supabase_default | traefik-proxy | API Gateway (CRITICAL) |
| supabase-* | healthscribe_web | supabase_default | - | Supabase services |

**CRITICAL:** App MUST be on BOTH `app_medical-transcription` AND `healthscribe_web` networks

## Critical Hostnames (from inside app container)

Must resolve correctly for uploads to work:

```
supabase-kong:8000 → 10.0.6.3 (for file uploads)
medical-transcription-redis:6379 → 10.0.4.4 (for caching)
medical-transcription-postgres:5432 → 10.0.4.3 (for app DB)
```

Test with:
```bash
docker exec medical-transcription-app nslookup supabase-kong
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `getaddrinfo EAI_AGAIN supabase-kong` | App not on healthscribe_web network | See "Uploads Failing" above |
| `Connection refused` | Container not running | `docker start <container_name>` |
| `health check failed` | Service crashed | Check logs: `docker logs <container_name>` |
| Website returns 502 | App container not listening | `docker restart medical-transcription-app` |
| File uploads timeout | Supabase Kong not responding | `docker restart supabase-kong` |

## Diagnostic Commands

```bash
# Show all containers and networks
docker ps --format "table {{.Names}}\t{{.Networks}}\t{{.Status}}"

# Show app network details
docker inspect medical-transcription-app --format='{{json .NetworkSettings.Networks}}' | jq .

# Follow app logs live
docker logs -f medical-transcription-app 2>&1

# Check specific error in logs
docker logs medical-transcription-app 2>&1 | grep -i "error\|failed"

# Test network connectivity
docker exec medical-transcription-app nslookup supabase-kong

# Check docker resource usage
docker stats --no-stream
```

## Before Restarting Services

1. **Check logs first** - `docker logs <container> | tail -100`
2. **Don't kill docker** - always `docker restart` or `docker stop`
3. **Verify networks** - app needs TWO networks
4. **Wait for startup** - services take 10-30 seconds to initialize

## Common Commands Cheat Sheet

```bash
# Container management
docker start <name>
docker stop <name>
docker restart <name>
docker logs <name> --tail 50 -f

# Network management
docker network connect <network> <container>
docker network disconnect <network> <container>
docker inspect <container> | grep Network

# Status checks
docker ps                               # All running containers
docker ps -a                            # All containers
docker network ls                       # All networks
docker volume ls                        # All volumes
docker system df                        # Disk usage
```

## Prevention

To prevent these issues:

1. **Always use docker-compose** for production changes (not manual docker run)
2. **Never kill docker daemon** - always use systemctl restart
3. **Keep services on assigned networks** - don't modify manually
4. **Monitor uploads** - check logs: `docker logs medical-transcription-app 2>&1 | grep -i upload`
5. **Run verification script** - `bash verify-infrastructure.sh`

## Full Documentation

See `INFRASTRUCTURE-CONFIG.md` for:
- Complete system architecture
- All container details
- Network configuration details
- Troubleshooting procedures
- Deployment instructions
- Security notes

## Emergency Contact

If stuck:

1. Read error message carefully
2. Check relevant section in INFRASTRUCTURE-CONFIG.md
3. Run: `bash verify-infrastructure.sh`
4. Check Docker logs for specific errors
5. Review this quick reference again

## System Status

- **App**: healthscribe.pro
- **SSH**: root@154.26.155.207
- **SSH Key**: ~/.ssh/healthscribe_key
- **Repository**: /root/healthscribe-build
- **Docker Compose**: docker-compose.yml (app stack)
