# Infrastructure Documentation Index

## Overview

This directory contains comprehensive documentation for the HealthScribe infrastructure setup, including all Docker containers, networks, and dependencies.

**Current Status:** ✅ All systems operational (as of Dec 22, 2025)
- 9 containers running
- 5 networks configured
- File uploads working correctly
- Website accessible via HTTPS

## Documentation Files

### 1. **INFRASTRUCTURE-QUICK-REFERENCE.md** ⭐ START HERE
**Purpose:** Quick troubleshooting and command reference  
**Read this if:** Something is broken and you need a quick fix  
**Contains:**
- Quick status checks
- Common problems and fixes in 30 seconds
- Error reference table
- Command cheat sheet

### 2. **INFRASTRUCTURE-CONFIG.md** 📖 COMPLETE GUIDE
**Purpose:** Complete system architecture and configuration details  
**Read this if:** You want to understand the entire system  
**Contains:**
- Complete container inventory
- Network topology and connectivity
- Critical paths for data flow
- Verification commands
- Detailed troubleshooting procedures
- Deployment instructions
- Security notes

### 3. **verify-infrastructure.sh** 🔍 DIAGNOSTIC TOOL
**Purpose:** Automated verification of infrastructure health  
**Use this:** Every time you want to verify everything is working  
**Checks:**
- All 9 containers running
- All 5 networks exist
- App is on both required networks
- DNS resolution working
- Container health status
- Recent uploads successful
- Website accessibility

**Usage:**
```bash
cd /root/healthscribe-build
bash verify-infrastructure.sh
```

## Quick Start: What You Need to Know

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Internet                          │
│                 (HTTPS Port 443)                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ↓
         ┌─────────────────────────┐
         │  NGINX (Reverse Proxy)  │
         │    Port 80/443/8000     │
         └──────────────┬──────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ↓                             ↓
  ┌─────────────────┐         ┌──────────────────┐
  │  Next.js App    │         │  Supabase API    │
  │  Port 3000      │         │  (Kong Gateway)  │
  │                 │         │  Port 8000/8443  │
  └────────┬────────┘         └──────────┬───────┘
           │                             │
      ┌────┴─────┐           ┌──────────┴─────────┐
      ↓          ↓           ↓          ↓          ↓
   ┌──────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
   │ Postgres│ Redis │ │Supabase  │ │Supabase│ │Supabase  │
   │ (App)  │       │ │ Database │ │ Auth   │ │ Storage  │
   └──────┘ └────────┘ └──────────┘ └────────┘ └──────────┘
```

### Critical Networks

The app container MUST be on BOTH networks:

1. **app_medical-transcription** (10.0.4.x)
   - Connects to: postgres, redis, n8n-db
   - Purpose: Internal app services

2. **healthscribe_web** (10.0.6.x)
   - Connects to: supabase services
   - Purpose: File uploads, authentication, REST API

### The Most Common Problem

**Symptom:** "Failed to upload audio file to storage"

**Root Cause:** App container is not on the `healthscribe_web` network

**Fix (2 commands):**
```bash
docker network connect healthscribe_web medical-transcription-app
docker restart medical-transcription-app
```

## Documentation Reading Guide

### If you have 2 minutes:
1. Read "Quick Status Check" in INFRASTRUCTURE-QUICK-REFERENCE.md
2. Run `bash verify-infrastructure.sh`

### If you have 10 minutes:
1. Read all of INFRASTRUCTURE-QUICK-REFERENCE.md
2. Bookmark for future reference

### If you have 30 minutes:
1. Read INFRASTRUCTURE-QUICK-REFERENCE.md
2. Read the "Network Configuration" section in INFRASTRUCTURE-CONFIG.md
3. Run verification script

### If you have 1 hour:
1. Read INFRASTRUCTURE-QUICK-REFERENCE.md
2. Read INFRASTRUCTURE-CONFIG.md completely
3. Run verification script
4. Test the diagnostic commands

## Key System Information

| Component | Details |
|-----------|---------|
| **Server** | 154.26.155.207 (DigitalOcean VPS) |
| **Domain** | healthscribe.pro |
| **SSH Key** | ~/.ssh/healthscribe_key |
| **Repository** | /root/healthscribe-build |
| **Docker Version** | 29.1.3 |
| **Total Containers** | 9 |
| **Total Networks** | 5 |
| **Volume Count** | 11 |

## Container Inventory

### Application Stack (app_medical-transcription network)
- **medical-transcription-app** - Next.js web application
- **medical-transcription-postgres** - Application database
- **medical-transcription-redis** - Caching and session storage
- **medical-transcription-n8n-db** - N8N workflow database

### Supabase Stack (healthscribe_web network)
- **supabase-db** - PostgreSQL database
- **supabase-rest** - PostgREST API
- **supabase-kong** - API Gateway (CRITICAL for uploads)
- **supabase-auth** - Authentication service
- **supabase-storage** - File storage service

## Network Inventory

| Network | Purpose | IP Range |
|---------|---------|----------|
| app_medical-transcription | Internal app services | 10.0.4.x |
| healthscribe_web | Supabase integration | 10.0.6.x |
| supabase_default | Supabase internal | 10.0.3.x |
| supabase_network_supabase | Supabase internal | varies |
| traefik-proxy | External reverse proxy | 10.0.2.x |

## Critical Hostnames

These must resolve correctly for the app to function:

```
supabase-kong:8000              → 10.0.6.3  (file uploads)
medical-transcription-redis:6379 → 10.0.4.4  (caching)
medical-transcription-postgres   → 10.0.4.3  (app database)
supabase-auth:9999              → 10.0.6.x  (authentication)
supabase-storage:5000           → 10.0.6.x  (storage)
```

## Most Common Commands

```bash
# Status checks
docker ps                           # Show running containers
docker ps | wc -l                   # Count containers (should be 10 with header)
docker network ls                   # Show all networks
docker volume ls                    # Show all volumes

# Container operations
docker start medical-transcription-app      # Start app
docker stop medical-transcription-app       # Stop app
docker restart medical-transcription-app    # Restart app
docker logs medical-transcription-app       # View logs

# Network operations
docker network connect healthscribe_web medical-transcription-app    # Connect to network
docker network disconnect healthscribe_web medical-transcription-app # Disconnect from network

# Verification
docker inspect medical-transcription-app | grep healthscribe_web     # Check network
docker exec medical-transcription-app nslookup supabase-kong         # Test DNS
bash verify-infrastructure.sh                                        # Full verification
```

## Troubleshooting Decision Tree

```
Is the website down?
├─ YES → Check "If Website is Down" in INFRASTRUCTURE-QUICK-REFERENCE.md
└─ NO → Go to next question

Are file uploads failing?
├─ YES → Check "If Uploads Are Failing" in INFRASTRUCTURE-QUICK-REFERENCE.md
└─ NO → Go to next question

Are you seeing an error message?
├─ YES → Look up in "Error Reference" table in INFRASTRUCTURE-QUICK-REFERENCE.md
└─ NO → Run: bash verify-infrastructure.sh

Still stuck?
├─ Read relevant section in INFRASTRUCTURE-CONFIG.md
├─ Check Docker logs: docker logs medical-transcription-app
└─ Post the error message in your logs
```

## What to Check When in Doubt

1. **Run verification script** - `bash verify-infrastructure.sh`
2. **Check app logs** - `docker logs medical-transcription-app 2>&1 | tail -100`
3. **Check container status** - `docker ps | grep -E "medical|supabase"`
4. **Check networks** - `docker inspect medical-transcription-app | grep Network`

## Prevention

To keep infrastructure healthy:

1. ✅ Always use `docker-compose` for changes (never manual `docker run`)
2. ✅ Never kill docker daemon (use `systemctl restart docker`)
3. ✅ Keep app on both required networks (verify with inspect)
4. ✅ Monitor uploads in logs (should see "Audio uploaded successfully")
5. ✅ Run verification script weekly

## Getting Help

1. Read INFRASTRUCTURE-QUICK-REFERENCE.md first (2 min)
2. Run `bash verify-infrastructure.sh` (30 sec)
3. Check Docker logs for specific error messages
4. Review INFRASTRUCTURE-CONFIG.md for detailed explanations
5. If still stuck, post the verification script output and logs

## Recent Changes

### December 22, 2025
- Fixed file upload issues by connecting app to healthscribe_web network
- Removed dangerous eval() from Dockerfile (security fix)
- Created comprehensive infrastructure documentation
- Added automated verification script

### December 21, 2025
- Resolved malware-induced build corruption
- Rebuilt Next.js app with clean code
- Restored full website functionality

## Summary

The HealthScribe infrastructure consists of 9 Docker containers across 5 networks working together to provide a complete transcription platform. The most critical aspect is ensuring the app container is on both the `app_medical-transcription` network (for internal services) and the `healthscribe_web` network (for Supabase integration).

**Current Status:** ✅ All systems healthy and operational

For immediate help, read INFRASTRUCTURE-QUICK-REFERENCE.md and run `bash verify-infrastructure.sh`.
