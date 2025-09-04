# Medical Transcription Dashboard - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Vercel account (free at vercel.com)
- Supabase project set up
- n8n instance running (local or cloud)
- ngrok for webhook tunneling (if n8n is local)

### Step 1: Initial Setup
```powershell
# Run the setup script
./scripts/setup.ps1

# Or manually:
npm install
cp .env.example .env.local
# Edit .env.local with your values
```

### Step 2: Configure Environment Variables

Update `.env.local` with your actual values:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Webhook (Required)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook/medical-transcribe-v2

# Application URLs (Update after deployment)
NEXT_PUBLIC_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

### Step 3: Set up ngrok (for local n8n)

1. Start n8n locally:
```bash
npx n8n
```

2. In another terminal, start ngrok:
```bash
ngrok http 5678
```

3. Update webhook URLs automatically:
```powershell
npm run update-ngrok
```

### Step 4: Deploy to Vercel

#### Option A: Using Deploy Script
```powershell
./scripts/deploy.ps1
```

#### Option B: Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

#### Option C: GitHub Integration
1. Push your code to GitHub
2. Import project on vercel.com
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Step 5: Configure Vercel Environment Variables

In Vercel Dashboard (Settings > Environment Variables), add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_N8N_WEBHOOK_URL
NEXT_PUBLIC_URL
NEXT_PUBLIC_API_URL
MAX_FILE_SIZE
ALLOWED_FILE_TYPES
RATE_LIMIT_WINDOW
RATE_LIMIT_MAX_REQUESTS
```

## 🔄 Updating Webhook URLs

When your ngrok URL changes:

1. Run the update script:
```powershell
npm run update-ngrok
```

2. Update in Vercel:
```bash
vercel env pull
# Edit .env.local
vercel env push
```

Or update manually in Vercel dashboard.

## 🗄️ Database Setup

Run the Supabase migration:

```sql
-- In Supabase SQL Editor, run the migration from:
-- /supabase/migrations/001_review_system.sql
```

## 📱 n8n Workflow Setup

1. Import the workflow from `/n8n-workflows/latest-workflow.json`
2. Update credentials (Supabase, Whisper, Gemini)
3. Activate the workflow
4. Test with the medical transcription interface

## 🧪 Testing Deployment

1. **Test Authentication:**
   - Sign up a new user
   - Log in
   - Reset password

2. **Test Transcription:**
   - Upload an audio file
   - Check webhook triggers in n8n
   - Verify transcription appears

3. **Test Review System:**
   - Create transcriptionist and editor accounts
   - Assign roles via `/admin-setup`
   - Request and process reviews

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Webhook Not Working
- Check n8n workflow is active
- Verify ngrok is running
- Update webhook URLs in environment variables
- Check n8n logs for incoming requests

### Database Connection Issues
- Verify Supabase URL and keys
- Check Row Level Security policies
- Run migrations if needed

### Environment Variables Not Loading
- Ensure `.env.local` exists
- Restart dev server after changes
- Check Vercel dashboard for production

## 📊 Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor performance and errors

### Supabase Dashboard
- Monitor database usage
- Check storage usage
- Review auth logs

### n8n Execution History
- Monitor workflow executions
- Check for errors
- Review processing times

## 🔐 Security Checklist

- [ ] All API keys are in environment variables
- [ ] Supabase RLS policies are enabled
- [ ] CORS is configured properly
- [ ] Rate limiting is enabled
- [ ] File upload restrictions are set
- [ ] HTTPS is enforced
- [ ] Authentication is required for protected routes

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [n8n Documentation](https://docs.n8n.io)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in Vercel/Supabase/n8n dashboards
3. Test locally with `npm run dev`

---

© 2024 Medical Transcription Dashboard. Built with Next.js, Supabase, and n8n.
