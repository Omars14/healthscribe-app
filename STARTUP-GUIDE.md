# 🚀 Medical Transcription System - Complete Startup Guide

## Quick Start (One Command)

```powershell
# Start everything automatically (n8n, ngrok, Next.js)
npm run start-all
```

This single command will:
- ✅ Load all environment variables from `.env.local`
- ✅ Start n8n workflow engine
- ✅ Start ngrok tunnel
- ✅ Automatically update webhook URLs
- ✅ Start Next.js development server
- ✅ Display all service URLs and configuration

## Available Commands

### 🎯 Main Startup Commands

```powershell
# Start all services for development
npm run start-all:dev

# Start all services and deploy to production
npm run start-all:prod

# Start with Docker (n8n in container)
npm run start-all:docker

# Stop all services
npm run stop-all
```

### 🔧 Setup & Configuration

```powershell
# Full initial setup (installs dependencies, configures environment)
npm run setup:full

# Update ngrok webhook URLs only
npm run update-ngrok

# Deploy to Vercel
npm run deploy
```

## Advanced Usage

### PowerShell Script Options

Run the main script directly with options:

```powershell
# Skip Vercel deployment
.\scripts\start-all-services.ps1 -SkipVercelDeploy

# Use Docker for n8n
.\scripts\start-all-services.ps1 -UseDocker

# Production mode (no local dev server, deploys to Vercel)
.\scripts\start-all-services.ps1 -Production

# Custom domain
.\scripts\start-all-services.ps1 -CustomDomain "https://your-domain.com"

# Combine options
.\scripts\start-all-services.ps1 -UseDocker -Production -CustomDomain "https://healthscribe.pro"
```

## Environment Variables

The script automatically loads and manages these variables:

| Variable | Description | Auto-Updated |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n webhook endpoint | ✅ Yes |
| `N8N_WEBHOOK_URL` | n8n webhook (server-side) | ✅ Yes |
| `NEXT_PUBLIC_WEBHOOK_URL` | Webhook URL for client | ✅ Yes |

## Service URLs

After running `npm run start-all`, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| n8n Dashboard | http://localhost:5678 | Workflow automation |
| ngrok Inspector | http://localhost:4040 | Tunnel management |
| Next.js Dev | http://localhost:3000 | Application frontend |
| Webhook URL | https://[id].ngrok.io/webhook/medical-transcribe-v2 | Auto-configured |

## Workflow Setup

After starting services:

1. **Open n8n**: http://localhost:5678
2. **Import workflow**: Use `/n8n-workflows/latest-workflow.json`
3. **Configure credentials**:
   - Supabase: Add your URL and service role key
   - Whisper API: Add your API key
   - Gemini API: Add your API key
4. **Activate the workflow**

## Testing Your Setup

1. **Check all services are running**:
   - n8n: http://localhost:5678
   - ngrok: http://localhost:4040
   - App: http://localhost:3000

2. **Test transcription**:
   - Upload an audio file in the app
   - Check n8n execution logs
   - Verify transcription appears in the app

## Troubleshooting

### Services won't start
```powershell
# Stop all and restart
npm run stop-all
npm run start-all
```

### Port already in use
```powershell
# Force stop all services
.\scripts\stop-all-services.ps1

# Check specific ports
netstat -ano | findstr :5678
netstat -ano | findstr :3000
```

### ngrok URL not updating
```powershell
# Manually update ngrok URL
npm run update-ngrok

# Or enter manually when prompted
.\scripts\update-ngrok.js
```

### Docker issues
```powershell
# Ensure Docker Desktop is running
docker ps

# Clean up Docker containers
docker stop n8n
docker rm n8n
docker volume rm n8n_data
```

## Production Deployment

### Deploy to Vercel with current ngrok
```powershell
# Start services and deploy
npm run start-all:prod
```

### Deploy without starting local services
```powershell
# Just deploy to Vercel
npm run deploy
```

### Update Vercel environment variables
1. Go to Vercel dashboard
2. Settings > Environment Variables
3. Add all variables from `.env.local`
4. Redeploy

## Directory Structure

```
dashboard-next/
├── scripts/
│   ├── start-all-services.ps1    # Main startup script
│   ├── stop-all-services.ps1     # Stop all services
│   ├── setup.ps1                 # Initial setup
│   ├── deploy.ps1                # Deployment helper
│   └── update-ngrok.js           # ngrok URL updater
├── .env.local                    # Your environment variables
├── .env.example                  # Template for env vars
└── vercel.json                   # Vercel configuration
```

## Tips

1. **First time setup**: Run `npm run setup:full` once
2. **Daily development**: Just run `npm run start-all`
3. **Production updates**: Use `npm run start-all:prod`
4. **Quick restart**: `npm run stop-all` then `npm run start-all`

## Security Notes

- Never commit `.env.local` to git
- Keep your Supabase service role key secret
- Use environment variables in Vercel for production
- Rotate ngrok URLs regularly for security

## Support

For issues:
1. Check service logs in their respective windows
2. Verify environment variables in `.env.local`
3. Ensure all prerequisites are installed:
   - Node.js 18+
   - ngrok CLI
   - Docker Desktop (optional)
   - Vercel CLI

---

© 2024 Medical Transcription Dashboard
