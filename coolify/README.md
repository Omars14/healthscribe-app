# Healthscribe.pro - Coolify Deployment Guide

## Overview
This directory contains the configuration files needed to deploy Healthscribe.pro to Coolify.

## Files
- `docker-compose.yml` - Docker Compose configuration for the application stack
- `.env` - Environment variables for Coolify deployment
- `coolify.json` - Coolify-specific configuration
- `README.md` - This deployment guide

## Deployment Steps

### Option 1: Using Coolify Web Interface
1. Login to your Coolify instance
2. Create a new project
3. Select "Docker Compose" as the deployment type
4. Upload or paste the contents of `docker-compose.yml`
5. Set the environment variables from `.env`
6. Deploy

### Option 2: Using Coolify CLI
```bash
# If you have Coolify CLI installed
coolify deploy --project healthscribe-pro --file docker-compose.yml
```

### Option 3: Git-based Deployment
1. Push this repository to your Git hosting service
2. Connect your Git repository to Coolify
3. Coolify will automatically detect the `docker-compose.yml` file

## Environment Variables
Make sure these environment variables are set in your Coolify project:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `N8N_WEBHOOK_URL` - n8n webhook URL for transcription processing
- `NEXT_PUBLIC_N8N_WEBHOOK_URL` - Public n8n webhook URL
- `NEXT_PUBLIC_URL` - Your application's public URL
- `NEXT_PUBLIC_API_URL` - Your API URL
- `GOOGLE_API_KEY` - Google Gemini API key for AI transcription
- `OPENAI_API_KEY` - OpenAI API key (fallback)
- `ENCRYPTION_KEY` - Encryption key for sensitive data

## Services Included
- **healthscribe-app** - Next.js application (port 3000)
- **healthscribe-nginx** - Nginx reverse proxy for SSL termination

## Post-Deployment Steps
1. Verify the application is running at your domain
2. Check that SSL certificate is properly installed
3. Test the transcription functionality
4. Monitor the application logs through Coolify dashboard

## Troubleshooting
- Check application logs in Coolify dashboard
- Verify all environment variables are correctly set
- Ensure the domain DNS points to your Coolify instance
- Check that all required ports are open in your firewall

## Support
For issues with Coolify deployment, check:
- [Coolify Documentation](https://coolify.io/docs/)
- [Coolify GitHub Issues](https://github.com/coolify-io/coolify/issues)
