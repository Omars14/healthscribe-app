# Medical Transcription System - Contabo VPS Deployment Guide

## 🚀 Overview
This guide will help you deploy your medical transcription system to a Contabo VPS instead of Vercel.

## 📋 Prerequisites
- Contabo VPS with Ubuntu 20.04/22.04
- Root or sudo access
- Domain name (recommended)
- Supabase account (or we'll set up self-hosted)

## 📦 What We'll Set Up
1. **Node.js 18+** - Runtime for Next.js
2. **Nginx** - Reverse proxy and SSL termination
3. **PM2** - Process manager for Node.js apps
4. **n8n** - Self-hosted workflow automation
5. **PostgreSQL** - Database (if using self-hosted Supabase)
6. **SSL Certificates** - Let's Encrypt
7. **Firewall** - UFW configuration

---

## Step 1: Initial VPS Setup

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Essential Tools
```bash
sudo apt install -y curl wget git unzip software-properties-common ufw
```

### 1.3 Configure Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 1.4 Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1.5 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.6 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## Step 2: Database Setup

### Option A: Use Cloud Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys
4. Run the database migrations from your project

### Option B: Self-Hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE transcription_db;
CREATE USER transcription_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE transcription_db TO transcription_user;
\q
```

---

## Step 3: n8n Setup (Self-Hosted)

### 3.1 Install n8n
```bash
# Install n8n globally
sudo npm install -g n8n

# Create n8n user and directories
sudo useradd -m -s /bin/bash n8n
sudo mkdir -p /home/n8n/.n8n
sudo chown -R n8n:n8n /home/n8n/.n8n

# Create systemd service
sudo tee /etc/systemd/system/n8n.service > /dev/null <<EOF
[Unit]
Description=n8n Workflow Automation
After=network.target

[Service]
Type=simple
User=n8n
ExecStart=/usr/bin/n8n
Restart=always
RestartSec=5
Environment=N8N_PORT=5678
Environment=N8N_PROTOCOL=https
Environment=N8N_HOST=your-domain.com

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable n8n
```

### 3.2 Configure n8n Environment
```bash
# Create n8n environment file
sudo tee /home/n8n/.n8n/.env > /dev/null <<EOF
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_HOST=your-domain.com
N8N_ENCRYPTION_KEY=your-encryption-key-here
WEBHOOK_URL=https://your-domain.com
EOF

sudo chown n8n:n8n /home/n8n/.n8n/.env
```

---

## Step 4: Application Deployment

### 4.1 Clone and Setup Application
```bash
# Clone your repository
git clone https://github.com/your-username/dashboard-next.git
cd dashboard-next

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### 4.2 Configure Environment Variables
Edit `.env.local`:
```bash
nano .env.local
```

Update with your values:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Configuration
N8N_WEBHOOK_URL=https://your-domain.com/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://your-domain.com

# File Upload Limits
MAX_FILE_SIZE=104857600
```

### 4.3 Build Application
```bash
npm run build
```

### 4.4 Start with PM2
```bash
pm2 start npm --name "medical-transcription" -- start
pm2 save
pm2 startup
```

---

## Step 5: Nginx Configuration

### 5.1 Main Application Config
```bash
sudo tee /etc/nginx/sites-available/medical-transcription > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### 5.2 n8n Subdomain Config
```bash
sudo tee /etc/nginx/sites-available/n8n.your-domain.com > /dev/null <<EOF
server {
    listen 80;
    server_name n8n.your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
```

### 5.3 Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/medical-transcription /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/n8n.your-domain.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 6: SSL Setup with Let's Encrypt

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Get SSL Certificates
```bash
# For main domain
sudo certbot --nginx -d your-domain.com

# For n8n subdomain
sudo certbot --nginx -d n8n.your-domain.com
```

### 6.3 Set Up Auto-Renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Step 7: Database Migration

### 7.1 Run Supabase Migrations
If using cloud Supabase, run these SQL commands in your Supabase SQL Editor:

```sql
-- Run the contents of supabase-medical-migration.sql
-- Or run individual migrations from supabase/migrations/
```

### 7.2 If Using Self-Hosted PostgreSQL
```bash
# Connect to your database and run migrations
psql -h localhost -U transcription_user -d transcription_db
# Then paste your migration SQL
```

---

## Step 8: n8n Workflow Setup

### 8.1 Access n8n Dashboard
Navigate to: `https://n8n.your-domain.com`

### 8.2 Import Workflow
1. In n8n dashboard, click **Workflows** → **Import from File**
2. Select `n8n-medical-workflow-gemini.json` from your project

### 8.3 Configure Credentials
1. **Supabase API**:
   - Type: Supabase API
   - Name: Supabase
   - URL: Your Supabase URL
   - Service Role Key: Your service key

2. **OpenAI API**:
   - Type: OpenAI API
   - Name: OpenAI Whisper
   - API Key: Your OpenAI API key

3. **Google AI API**:
   - Type: Google AI API
   - Name: Gemini API
   - API Key: Your Gemini API key

### 8.4 Update Webhook URL
1. Click on the **Webhook** node
2. Copy the webhook URL
3. Update your `.env.local`:
```env
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/medical-transcribe-v2
```

### 8.5 Activate Workflow
Click **Active** toggle and save the workflow.

---

## Step 9: Final Configuration

### 9.1 Update Application Environment
```bash
# Update webhook URL in application
nano .env.local
# Add/update: N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/medical-transcribe-v2

# Restart application
pm2 restart medical-transcription
```

### 9.2 Test the Setup
```bash
# Check services status
pm2 status
sudo systemctl status nginx
sudo systemctl status n8n

# Test application
curl -I https://your-domain.com
curl -I https://n8n.your-domain.com
```

---

## Step 10: Monitoring & Maintenance

### 10.1 Set Up Log Rotation
```bash
# PM2 logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Nginx logs
sudo nano /etc/logrotate.d/nginx
# Add configuration for custom logs
```

### 10.2 Backup Strategy
```bash
# Create backup script
sudo tee /usr/local/bin/backup.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/medical-transcription"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup application
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz /path/to/your/app

# Backup n8n data
tar -czf \$BACKUP_DIR/n8n_\$DATE.tar.gz /home/n8n/.n8n

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup.sh
```

### 10.3 Monitoring Commands
```bash
# Check application logs
pm2 logs medical-transcription

# Check n8n logs
sudo journalctl -u n8n -f

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor resources
htop
df -h
free -h
```

---

## Troubleshooting

### Application Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs medical-transcription

# Check environment variables
cat /path/to/your/app/.env.local
```

### n8n Not Accessible
```bash
# Check n8n service
sudo systemctl status n8n
sudo journalctl -u n8n -f

# Check nginx config
sudo nginx -t
sudo systemctl reload nginx
```

### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U transcription_user -d transcription_db

# Check Supabase credentials
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/
```

### SSL Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Check nginx SSL config
sudo nginx -t
```

---

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] UFW firewall configured
- [ ] SSL certificates installed
- [ ] Environment variables secured
- [ ] Database credentials protected
- [ ] API keys encrypted
- [ ] File permissions correct
- [ ] Automatic updates configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts set up

---

## Performance Optimization

### PM2 Configuration
```bash
# Scale application
pm2 scale medical-transcription 2

# Set memory limits
pm2 set pm2-logrotate:max_memory_restart 1G
```

### Nginx Optimization
```bash
# Enable gzip compression
sudo nano /etc/nginx/nginx.conf
# Add gzip configuration

# Set up rate limiting
# Add rate limiting to nginx config
```

### Database Optimization
```bash
# PostgreSQL tuning
sudo nano /etc/postgresql/14/main/postgresql.conf
# Adjust memory and connection settings
```

---

## Cost Estimation

### Monthly VPS Costs (Contabo)
- **VPS S**: €4.99/month (1 vCPU, 8GB RAM) - Good for testing
- **VPS M**: €8.49/month (2 vCPU, 16GB RAM) - Recommended for production
- **VPS L**: €14.99/month (4 vCPU, 32GB RAM) - For high traffic

### Additional Costs
- **Domain**: ~€10-15/year
- **SSL**: Free (Let's Encrypt)
- **Supabase**: Free tier available, paid plans from $25/month
- **External APIs**: OpenAI/Gemini usage costs

---

## Support & Maintenance

### Regular Tasks
- [ ] Monitor server resources weekly
- [ ] Check logs for errors
- [ ] Update SSL certificates
- [ ] Backup data regularly
- [ ] Update dependencies monthly

### Emergency Contacts
- Contabo Support: support@contabo.com
- Supabase Support: support@supabase.com
- Your emergency contact information

---

## 🎉 Deployment Complete!

Your medical transcription system is now running on your Contabo VPS!

**Access URLs:**
- **Main Application**: https://your-domain.com
- **n8n Dashboard**: https://n8n.your-domain.com
- **API Documentation**: https://your-domain.com/api

**Next Steps:**
1. Test the upload and transcription workflow
2. Configure user accounts and permissions
3. Set up monitoring and alerts
4. Plan for scaling and backups

---

*This guide was created for deploying the Medical Transcription System to Contabo VPS. Last updated: January 2025*