# 🏠 Self-Hosted Medical Transcription System

This guide covers deploying your medical transcription system with **Supabase self-hosted** on your Contabo VPS for maximum control and data privacy.

## 🎯 Why Self-Host Supabase?

✅ **Complete Data Control** - Your medical data stays on your servers  
✅ **Cost Effective** - No monthly cloud database fees  
✅ **Customizable** - Full control over configurations  
✅ **Regulatory Compliance** - Easier for HIPAA/data privacy laws  
✅ **Offline Capable** - Works without internet connectivity  
✅ **Scalable** - Can grow with your needs  

## 📋 System Architecture

```
Internet
    ↓
[Cloudflare/Nginx] ← SSL Termination & Load Balancing
    ↓
┌─────────────────────────────────────────────────┐
│                Your VPS Server                  │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │  Next.js    │  │  Supabase   │  │  n8n    │  │
│  │  Frontend   │  │  Self-Hosted│  │ Workflows│  │
│  │  (Port 3000)│  │  (Ports 8000│  │ (Port   │  │
│  └─────────────┘  │   + 3000)   │  │  5678)  │  │
│                   └─────────────┘  └─────────┘  │
│  ┌─────────────────────────────────────────────┐ │
│  │         PostgreSQL Database                 │ │
│  │         (Medical Records & Auth)            │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 🚀 Quick Start (Automated)

### Step 1: Prepare Your VPS
```bash
# Connect to your Contabo VPS
ssh root@your-vps-ip

# Make script executable
chmod +x complete-vps-deployment-with-supabase.sh

# Edit configuration variables
nano complete-vps-deployment-with-supabase.sh
```

### Step 2: Update Configuration
Edit these variables in the script:
```bash
# Your domains
DOMAIN_NAME="your-domain.com"
SUPABASE_SUBDOMAIN="supabase.your-domain.com"
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"

# API Keys (get these later if needed)
DEEPGRAM_API_KEY="your-deepgram-api-key"
GEMINI_API_KEY="your-gemini-key"
```

### Step 3: Clone Your Repository
```bash
# Create app directory and clone your code
mkdir -p /var/www/medical-transcription
cd /var/www/medical-transcription
git clone YOUR_REPO_URL .
```

### Step 4: Deploy Everything
```bash
# Run the deployment script
./complete-vps-deployment-with-supabase.sh
```

## 📦 What Gets Installed

### 🏠 Self-Hosted Supabase
- **PostgreSQL Database** - Your medical data storage
- **Supabase Auth** - User authentication & authorization
- **Supabase Storage** - File upload handling
- **Supabase REST API** - Database API endpoints
- **Supabase Studio** - Web-based database management

### 🤖 n8n Workflow Engine
- **AI Processing** - OpenAI Whisper + Gemini integration
- **Medical Formatting** - Document-specific templates
- **Webhook Handling** - Real-time transcription processing
- **Error Handling** - Robust failure recovery

### 🌐 Next.js Application
- **Medical Dashboard** - User interface for transcriptionists
- **File Upload** - Secure audio file handling
- **Review System** - Editor approval workflows
- **Real-time Updates** - Live status monitoring

### 🛡️ Security & Infrastructure
- **Nginx Proxy** - Load balancing & SSL termination
- **Let's Encrypt SSL** - Free automated certificates
- **Firewall (UFW)** - Network security
- **Automated Backups** - Daily data protection
- **Monitoring** - System health tracking

## 🔧 Access Your System

After deployment, you'll have these URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | `https://your-domain.com` | Medical transcription interface |
| **Supabase** | `https://supabase.your-domain.com` | Database management dashboard |
| **n8n** | `https://n8n.your-domain.com` | Workflow automation dashboard |
| **API** | `https://your-domain.com/api` | Application API endpoints |

### Default Credentials
```
Supabase Dashboard:
  Username: admin
  Password: [Generated during setup]

n8n Dashboard:
  Username: admin
  Password: [Generated during setup]
```

## 🗄️ Database Configuration

Your self-hosted Supabase includes:

### Pre-configured Tables
- ✅ `user_profiles` - User roles and permissions
- ✅ `transcriptions` - Medical transcription records
- ✅ `reviews` - Editor review workflow
- ✅ `document_templates` - Medical document formats
- ✅ `transcription_edits` - Version history
- ✅ `audit_log` - Security audit trail

### Storage Buckets
- ✅ `audio-files` - Secure audio file storage
- ✅ Configured with proper permissions
- ✅ HIPAA-ready file handling

### Row Level Security (RLS)
- ✅ User data isolation
- ✅ Role-based access control
- ✅ Secure API access
- ✅ Audit logging enabled

## 🤖 n8n Workflow Setup

### Pre-configured Workflows
1. **Medical Transcription** - Audio to text processing
2. **Document Formatting** - Medical report generation
3. **Review System** - Editor approval workflow
4. **Quality Assurance** - Error detection and correction

### Required API Credentials
After deployment, configure these in n8n:

#### OpenAI API (for Whisper transcription)
```
API Key: sk-your-openai-api-key-here
Organization: (optional)
```

#### Google Gemini API (for medical formatting)
```
API Key: your-gemini-api-key-here
```

#### Supabase API (already configured)
```
URL: https://supabase.your-domain.com
Service Key: [Auto-generated]
```

## 📊 Monitoring & Maintenance

### System Monitoring
```bash
# Check all services
pm2 status
docker ps

# View application logs
pm2 logs medical-transcription

# View Supabase logs
cd /opt/supabase/docker && docker-compose logs -f

# View n8n logs
sudo journalctl -u n8n -f

# System resources
htop
df -h
```

### Automated Backups
```bash
# Daily backups (configured automatically)
# Supabase: 3 AM daily
# Application: 4 AM daily
# Location: /var/backups/

# Manual backup
/usr/local/bin/backup-supabase.sh
/usr/local/bin/backup-medical-transcription.sh
```

### Performance Monitoring
```bash
# Database performance
docker exec -it supabase_db psql -U postgres -d medical_transcription
SELECT * FROM pg_stat_activity;

# Application performance
pm2 monit

# System resources
iotop
sysstat
```

## 🔄 Scaling & Updates

### Vertical Scaling
```bash
# Increase server resources (Contabo control panel)
# More CPU cores = Better transcription processing
# More RAM = Better concurrent user handling
# More storage = More audio file capacity
```

### Update Procedures
```bash
# Update application
cd /var/www/medical-transcription
git pull origin main
npm install
npm run build
pm2 restart medical-transcription

# Update Supabase
cd /opt/supabase/docker
git pull origin master
docker-compose pull
docker-compose up -d

# Update n8n
sudo npm update -g n8n
sudo systemctl restart n8n
```

## 🔐 Security Features

### Network Security
- ✅ **SSL/TLS Encryption** - End-to-end encryption
- ✅ **Firewall** - UFW with minimal open ports
- ✅ **Rate Limiting** - DDoS protection
- ✅ **HTTPS Only** - Forced SSL redirection

### Data Security
- ✅ **Row Level Security** - Database access control
- ✅ **Encrypted Storage** - Secure file handling
- ✅ **Audit Logging** - All data access tracked
- ✅ **Backup Encryption** - Secure data backups

### Application Security
- ✅ **Authentication** - Secure user login
- ✅ **Authorization** - Role-based permissions
- ✅ **Input Validation** - XSS/CSRF protection
- ✅ **Session Management** - Secure session handling

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker services
cd /opt/supabase/docker
docker-compose ps
docker-compose logs

# Check application
pm2 status
pm2 logs medical-transcription

# Check n8n
sudo systemctl status n8n
```

#### Database Connection Issues
```bash
# Test database
docker exec -it supabase_db psql -U postgres -d medical_transcription
\l  # List databases
\dt  # List tables

# Restart database
cd /opt/supabase/docker
docker-compose restart db
```

#### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Reload nginx
sudo systemctl reload nginx
```

#### Performance Issues
```bash
# Check resource usage
docker stats
pm2 monit
htop

# Optimize PostgreSQL
docker exec -it supabase_db nano /var/lib/postgresql/data/postgresql.conf
# Adjust memory settings based on your server resources
```

## 💰 Cost Comparison

| Component | Self-Hosted | Cloud Supabase |
|-----------|-------------|----------------|
| **Database** | Included | $25+/month |
| **Storage** | Included | $0.021/GB |
| **Bandwidth** | Included | $0.09/GB |
| **VPS Server** | €4.99-14.99/month | N/A |
| **SSL Certs** | Free | Free |
| **Backups** | Included | Extra cost |

**Break-even point**: ~500GB storage or high usage

## 📞 Support & Resources

### Documentation
- 📖 **Self-Hosted Guide**: `SUPABASE_SELF_HOSTED_GUIDE.md`
- 📖 **Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- 📖 **n8n Setup**: `N8N_VPS_SETUP_GUIDE.md`

### External Resources
- 🐙 **Supabase Self-Hosting**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
- 🤖 **n8n Documentation**: [docs.n8n.io](https://docs.n8n.io)
- 🐘 **PostgreSQL Docs**: [postgresql.org/docs](https://postgresql.org/docs)
- 🐳 **Docker Docs**: [docs.docker.com](https://docs.docker.com)

### Emergency Support
- **Server Issues**: Check logs and restart services
- **Database Issues**: Use Supabase Studio dashboard
- **Application Issues**: Check PM2 logs and restart
- **Network Issues**: Verify DNS and firewall settings

## 🎯 Success Checklist

- [ ] VPS deployed with all services running
- [ ] SSL certificates installed and working
- [ ] Supabase dashboard accessible
- [ ] n8n workflows configured
- [ ] API credentials set up
- [ ] Test transcription completed
- [ ] Backup system verified
- [ ] Monitoring alerts configured
- [ ] Security settings reviewed

## 🚀 Your Self-Hosted System is Ready!

You now have a **fully self-hosted, HIPAA-ready medical transcription system** with:

✅ **Complete Data Control** - Medical data stays on your servers  
✅ **Cost Effective** - No recurring cloud database fees  
✅ **Scalable Architecture** - Can grow with your needs  
✅ **Enterprise Security** - Production-ready security features  
✅ **Automated Operations** - Backups, monitoring, and maintenance  
✅ **Full API Compatibility** - Works with your existing workflows  

**Access your system:**
- 🌐 **Main Application**: `https://your-domain.com`
- 🏠 **Database Dashboard**: `https://supabase.your-domain.com`
- 🤖 **Workflow Engine**: `https://n8n.your-domain.com`

**Next steps:**
1. Create your first admin user
2. Configure n8n workflows with API keys
3. Test the transcription pipeline
4. Set up user roles and permissions
5. Start processing medical audio files!

Your self-hosted medical transcription system is now production-ready! 🩺🏠⚡
