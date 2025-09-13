# 🚀 Medical Transcription System - VPS Deployment

Welcome! This guide will help you deploy your complete medical transcription system to a Contabo VPS instead of Vercel.

## 📋 What You'll Get

A fully functional medical transcription system with:
- ✅ **Next.js Application** - Modern React frontend
- ✅ **Supabase Database** - Secure data storage & authentication
- ✅ **n8n Workflows** - AI-powered transcription processing
- ✅ **SSL Certificates** - Secure HTTPS connections
- ✅ **Nginx Reverse Proxy** - High-performance serving
- ✅ **Automated Backups** - Data protection
- ✅ **Monitoring** - System health tracking

## 🎯 Quick Start (3 Steps)

### Step 1: Prepare Your VPS
```bash
# Connect to your Contabo VPS
ssh root@your-vps-ip

# Update configuration in the deployment script
nano complete-vps-deployment.sh
# Edit the variables at the top of the file
```

### Step 2: Run Automated Deployment
```bash
# Make script executable and run
chmod +x complete-vps-deployment.sh
./complete-vps-deployment.sh
```

### Step 3: Configure Workflows
```bash
# Visit your n8n dashboard and import workflows
# Configure API credentials
# Test the system
```

## 🏠 Self-Hosted vs Cloud Supabase

| Feature | Self-Hosted Supabase | Cloud Supabase |
|---------|---------------------|----------------|
| **Data Control** | ✅ Complete control | ❌ Vendor control |
| **Monthly Cost** | €4.99-14.99 (VPS only) | $25+ (database) |
| **Setup Complexity** | 🔧 More complex | ⚡ Easier setup |
| **Customization** | ✅ Full control | ⚠️ Limited |
| **Scalability** | ✅ Scale your VPS | ✅ Auto-scaling |
| **Maintenance** | 🔧 Manual updates | ✅ Managed |
| **HIPAA Ready** | ✅ Self-hosted data | ⚠️ May require BAA |
| **Internet Required** | ❌ Works offline | ✅ Always online |

## 📁 Project Structure

```
medical-transcription-vps/
├── 🚀 DEPLOYMENT SCRIPTS
│   ├── 📄 complete-vps-deployment.sh           # Cloud Supabase deployment
│   ├── 📄 complete-vps-deployment-with-supabase.sh  # Self-hosted deployment
│   ├── 📄 vps-setup.sh                         # VPS environment setup
│   └── 📄 deploy-app.sh                        # Application deployment
├── ⚙️ CONFIGURATION
│   ├── 📄 .env.vps.template                    # Environment template
│   ├── 📄 docker-compose.yml                   # Docker deployment
│   ├── 📄 Dockerfile                           # App container
│   └── 📄 nginx.docker.conf                    # Nginx for Docker
├── 📋 DOCUMENTATION
│   ├── 📋 VPS_DEPLOYMENT_README.md            # This file
│   ├── 📋 README_SELF_HOSTED.md               # Self-hosted guide
│   ├── 📋 VPS_DEPLOYMENT_GUIDE.md             # Manual deployment
│   ├── 📋 SUPABASE_SETUP_GUIDE.md             # Cloud Supabase setup
│   ├── 📋 SUPABASE_SELF_HOSTED_GUIDE.md       # Self-hosted Supabase
│   └── 📋 N8N_VPS_SETUP_GUIDE.md              # n8n configuration
└── 🎯 QUICK START OPTIONS
    ├── 💡 Use complete-vps-deployment.sh       # Cloud option (easier)
    └── 🏠 Use complete-vps-deployment-with-supabase.sh  # Self-hosted (full control)
```

## ⚙️ Choose Your Deployment Path

### Option 1: Cloud Supabase (Recommended for beginners)
**Easier setup, managed database service**
```bash
# Use this script for cloud Supabase
./complete-vps-deployment.sh
```

**Required configuration:**
```bash
DOMAIN_NAME="your-domain.com"
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"
SUPABASE_URL="https://your-project.supabase.co"      # From Supabase dashboard
SUPABASE_ANON_KEY="your-anon-key"                    # From Supabase dashboard
SUPABASE_SERVICE_KEY="your-service-key"              # From Supabase dashboard
DEEPGRAM_API_KEY="your-deepgram-api-key"                  # From Deepgram
GEMINI_API_KEY="your-gemini-key"                     # From Google AI
```

### Option 2: Self-Hosted Supabase (Full control)
**Complete data ownership, more complex setup**
```bash
# Use this script for self-hosted Supabase
./complete-vps-deployment-with-supabase.sh
```

**Required configuration:**
```bash
DOMAIN_NAME="your-domain.com"
SUPABASE_SUBDOMAIN="supabase.your-domain.com"        # New subdomain for Supabase
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"
DEEPGRAM_API_KEY="your-deepgram-api-key"                  # From Deepgram (optional)
GEMINI_API_KEY="your-gemini-key"                     # From Google AI (optional)
# Database passwords are auto-generated
```

## 🚀 Deployment Options

### Option 1: Complete Automated Deployment (Recommended)
```bash
./complete-vps-deployment.sh
```
**What it does:**
- Updates system packages
- Installs Node.js, Nginx, PostgreSQL
- Sets up n8n workflow engine
- Configures SSL certificates
- Deploys your Next.js application
- Sets up monitoring and backups

### Option 2: Docker Deployment
```bash
docker-compose up -d
```
**Requirements:** Docker and Docker Compose installed

### Option 3: Manual Step-by-Step
Follow the detailed guide in `VPS_DEPLOYMENT_GUIDE.md`

## 🔧 Prerequisites

### VPS Requirements
- **OS:** Ubuntu 20.04 or 22.04
- **RAM:** Minimum 2GB (4GB recommended)
- **CPU:** 1 vCPU minimum (2+ recommended)
- **Storage:** 20GB minimum
- **Network:** Public IP and domain name

### Domain Requirements
1. **Domain Name** - Point your domain to the VPS IP
2. **DNS Records:**
   ```
   your-domain.com     A     YOUR_VPS_IP
   n8n.your-domain.com A     YOUR_VPS_IP
   ```

### API Requirements
- **Supabase Account** - [supabase.com](https://supabase.com)
- **OpenAI API Key** - [platform.openai.com](https://platform.openai.com)
- **Google AI API Key** - [makersuite.google.com](https://makersuite.google.com)

## 📊 System Architecture

```
Internet
    ↓
[Cloudflare/Nginx] ← SSL Termination & Load Balancing
    ↓
[Next.js App] ← React Frontend (Port 3000)
    ↓
[Supabase] ← Database & Authentication
    ↓
[n8n] ← Workflow Engine (Port 5678)
    ↓
[OpenAI API] ← Audio Transcription
[Gemini API] ← Medical Formatting
```

## 🔐 Security Features

- ✅ **SSL/TLS Encryption** - Let's Encrypt certificates
- ✅ **Firewall** - UFW with minimal open ports
- ✅ **Row Level Security** - Database access control
- ✅ **API Key Protection** - Secure credential storage
- ✅ **HTTPS Only** - Forced SSL redirection
- ✅ **Rate Limiting** - DDoS protection

## 📈 Performance Optimizations

- ✅ **Nginx Caching** - Static file optimization
- ✅ **Gzip Compression** - Reduced bandwidth
- ✅ **PM2 Clustering** - Multi-core utilization
- ✅ **Database Indexing** - Fast query performance
- ✅ **CDN Ready** - Static asset optimization

## 🔍 Monitoring & Maintenance

### Built-in Monitoring
```bash
# Check application status
pm2 status

# View application logs
pm2 logs medical-transcription

# Check n8n status
sudo systemctl status n8n

# View n8n logs
sudo journalctl -u n8n -f

# Check nginx status
sudo systemctl status nginx
```

### Automated Tasks
- **Daily Backups** - 3 AM system backups
- **SSL Renewal** - Automatic certificate renewal
- **Log Rotation** - Prevents disk space issues
- **Health Checks** - Service monitoring

## 🧪 Testing Your Deployment

### Quick Tests
```bash
# Test main application
curl -I https://your-domain.com

# Test n8n dashboard
curl -I https://n8n.your-domain.com

# Test API endpoints
curl https://your-domain.com/api/health
```

### Functional Tests
1. **User Registration** - Create a new account
2. **File Upload** - Upload a test audio file
3. **Transcription** - Check if processing starts
4. **Review System** - Test editing capabilities

## 🚨 Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs medical-transcription

# Restart application
pm2 restart medical-transcription
```

#### n8n Not Accessible
```bash
# Check n8n service
sudo systemctl status n8n

# Restart n8n
sudo systemctl restart n8n
```

#### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Reload nginx
sudo systemctl reload nginx
```

#### Database Connection Issues
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
```

### Getting Help
1. **Check Logs** - Use the monitoring commands above
2. **Review Configuration** - Verify all environment variables
3. **Test Network** - Ensure API endpoints are accessible
4. **Check Resources** - Monitor CPU, RAM, and disk usage

## 💰 Cost Estimation

### VPS Costs (Contabo)
- **VPS S**: €4.99/month (1 vCPU, 8GB RAM) - Development
- **VPS M**: €8.49/month (2 vCPU, 16GB RAM) - Production
- **VPS L**: €14.99/month (4 vCPU, 32GB RAM) - High traffic

### Additional Costs
- **Domain**: €10-15/year
- **SSL**: Free (Let's Encrypt)
- **Supabase**: Free tier available, $25+/month for paid
- **OpenAI API**: $0.006/minute for Whisper
- **Gemini API**: Free tier available

## 🔄 Updates & Maintenance

### System Updates
```bash
# Update the application
cd /var/www/medical-transcription
git pull origin main
npm install
npm run build
pm2 restart medical-transcription

# Update n8n
sudo npm update -g n8n
sudo systemctl restart n8n
```

### Backup & Restore
```bash
# Manual backup
/usr/local/bin/backup-medical-transcription.sh

# List backups
ls -la /var/backups/medical-transcription/

# Restore from backup
# (Contact support for restore procedures)
```

## 📞 Support

### Documentation
- 📖 **Deployment Guide**: `VPS_DEPLOYMENT_GUIDE.md`
- 🗄️ **Database Setup**: `SUPABASE_SETUP_GUIDE.md`
- 🤖 **n8n Setup**: `N8N_VPS_SETUP_GUIDE.md`

### Emergency Contacts
- **Contabo Support**: support@contabo.com
- **Supabase Support**: support@supabase.com
- **n8n Community**: community.n8n.io

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Application loads at `https://your-domain.com`
- ✅ User registration works
- ✅ File upload functions
- ✅ n8n dashboard accessible at `https://n8n.your-domain.com`
- ✅ Transcription workflow processes files
- ✅ SSL certificates are valid
- ✅ All services are running

## 🚀 You're All Set!

After successful deployment, you'll have:
- **Professional Medical Transcription System** running on your VPS
- **Scalable Architecture** that can handle growing demands
- **Secure & Compliant** setup with HIPAA-ready features
- **Automated Maintenance** with backups and monitoring
- **Full Control** over your data and infrastructure

**Time to launch:** ~30-45 minutes
**Maintenance:** ~15 minutes/week
**Cost:** €4.99+/month

---

## 📝 Checklist

### Pre-Deployment
- [ ] Domain name purchased and configured
- [ ] DNS records pointing to VPS IP
- [ ] Supabase project created
- [ ] API keys obtained (OpenAI, Gemini)
- [ ] VPS accessible via SSH

### During Deployment
- [ ] Configuration variables updated
- [ ] Deployment script executed successfully
- [ ] SSL certificates obtained
- [ ] Services started and tested

### Post-Deployment
- [ ] n8n workflows configured
- [ ] API credentials set up
- [ ] User accounts created
- [ ] Test transcription completed
- [ ] Monitoring alerts configured

---

**🎉 Ready to deploy your medical transcription system to production!**

For questions or issues, refer to the detailed guides or check the troubleshooting section above.
