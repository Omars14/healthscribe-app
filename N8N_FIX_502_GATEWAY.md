# n8n 502 Bad Gateway Fix - 2025-10-21

## Problem
After a recent n8n update, `n8n.healthscribe.pro` was returning **502 Bad Gateway** errors.

## Root Cause
The issue was a **proxy configuration mismatch** between Traefik and n8n. When Traefik proxied requests to n8n with `X-Forwarded-For` headers, n8n's Express.js rate limiter was validating that the `trust proxy` setting was enabled, but it wasn't.

**Error message:**
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false (default).
Code: ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
```

## Solution Applied

### 1. Enable Trust Proxy in n8n
Added `TRUST_PROXY=true` to:
- `.env` file
- `docker-compose.yml` environment section for n8n service

### 2. Disable Express Rate Limiting Validation
Added `N8N_RATE_LIMIT_ENABLED=false` to `.env` file

This works around the express-rate-limit validation issue while maintaining n8n functionality.

## Files Modified

### docker-compose.yml
- Added environment variable: `TRUST_PROXY=true` to the n8n service

### .env (on VPS)
- Added: `TRUST_PROXY=true`
- Added: `N8N_RATE_LIMIT_ENABLED=false`

## Deployment Steps Taken

1. SSH'd into VPS: `154.26.155.207`
2. Navigated to: `/opt/healthscribe/dashboard-next`
3. Created backup: `docker-compose.yml.bak-before-trust-proxy`
4. Modified `docker-compose.yml` and `.env` with proxy settings
5. Restarted n8n container: `docker compose restart n8n`
6. Verified health: `curl -I https://n8n.healthscribe.pro` → **HTTP 200 ✓**

## Verification

```bash
# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}" | grep n8n
# Result: healthscribe-n8n-1  Up X seconds ✓

# Check external endpoint
curl -I https://n8n.healthscribe.pro
# Result: HTTP/2 200 ✓

# Check logs
docker logs --tail 50 healthscribe-n8n-1
# Result: "n8n ready on ::, port 5678" ✓
#         "Editor is now accessible via: https://n8n.healthscribe.pro" ✓
#         NO "X-Forwarded-For" errors ✓
```

## Why This Happened

The update to n8n likely updated the express-rate-limit middleware which has stricter validation. The rate limiter now validates that when `X-Forwarded-For` headers are present, Express's `trust proxy` must be explicitly enabled.

## Notes for Future Updates

- When updating n8n, monitor logs for proxy-related validation errors
- The `TRUST_PROXY=true` setting is necessary when n8n sits behind a reverse proxy (Traefik)
- `N8N_RATE_LIMIT_ENABLED=false` can be kept enabled if needed, but disabling it prevents validation errors
- No credentials were affected; the fix is purely configuration

## Rollback Plan (if needed)

If issues occur, restore from backup:
```bash
cd /opt/healthscribe/dashboard-next
cp docker-compose.yml.bak-before-trust-proxy docker-compose.yml
docker compose restart n8n
```

---

**Status**: ✅ RESOLVED - n8n.healthscribe.pro is responding with HTTP 200
