# 🚀 HealthScribe.Pro - Complete Setup Instructions

**Domain**: healthscribe.pro
**VPS IP**: 154.26.155.207
**Username**: root
**Password**: Nomar123

## 📋 Complete Step-by-Step Guide

### Step 1: DNS Configuration (REQUIRED FIRST)

**You must do this before running any scripts!**

1. **Login to GoDaddy**:
   - Go to [godaddy.com](https://godaddy.com)
   - Login to your account

2. **Access Domain Settings**:
   - Click on your domain: `healthscribe.pro`
   - Go to **DNS** section

3. **Add DNS Records**:
   Add these A records (one at a time):

   ```
   Type: A
   Name: @
   Value: 154.26.155.207
   TTL: 600
   ```

   ```
   Type: A
   Name: supabase
   Value: 154.26.155.207
   TTL: 600
   ```

   ```
   Type: A
   Name: n8n
   Value: 154.26.155.207
   TTL: 600
   ```

4. **Wait for DNS Propagation**:
   - DNS changes take 5-30 minutes to propagate
   - You can check propagation at: [dnschecker.org](https://dnschecker.org)

---

### Step 2: Connect to VPS & Run Deployment

```bash
# Connect to your VPS
ssh root@154.26.155.207
# Password: Nomar123
```

```bash
# Download the deployment script
wget https://raw.githubusercontent.com/your-repo/healthscribe-deployment.sh
# OR copy the script content to a file called healthscribe-deployment.sh

# Make it executable
chmod +x healthscribe-deployment.sh

# Run the deployment
./healthscribe-deployment.sh
```

**The script will:**
- ✅ Update system packages
- ✅ Install Docker, Node.js, Nginx
- ✅ Set up self-hosted Supabase
- ✅ Configure PostgreSQL database
- ✅ Install n8n workflow engine
- ✅ Set up SSL certificates
- ✅ Deploy your Next.js application
- ✅ Configure monitoring & backups

---

### Step 3: Clone Your Application Repository

**After the deployment script completes**, you need to add your application code:

```bash
# Navigate to application directory
cd /var/www/healthscribe

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/your-dashboard-next-repo.git .

# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 restart healthscribe
```

---

### Step 4: Access Your System

After deployment, you'll have these URLs:

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | `https://healthscribe.pro` | Medical transcription interface |
| **Supabase** | `https://supabase.healthscribe.pro` | Database management dashboard |
| **n8n** | `https://n8n.healthscribe.pro` | Workflow automation dashboard |

### Default Credentials

**Supabase Dashboard:**
- URL: `https://supabase.healthscribe.pro`
- Username: `admin`
- Password: `HealthScribe2025!`

**n8n Dashboard:**
- URL: `https://n8n.healthscribe.pro`
- Username: `admin`
- Password: `HealthScribe2025!`

**Database:**
- Host: `localhost`
- Port: `5432`
- Database: `medical_transcription`
- Username: `postgres`
- Password: `[Generated - check script output]`

---

### Step 5: Configure n8n Workflows

1. **Access n8n Dashboard**:
   - Go to: `https://n8n.healthscribe.pro`
   - Login with credentials above

2. **Import Medical Workflow**:
   - Click **Workflows** → **Import from File**
   - Upload: `n8n-medical-workflow-gemini.json`

3. **Configure API Credentials**:

   **OpenAI API:**
   ```
   Name: OpenAI Whisper
   API Key: sk-your-openai-api-key-here
   Organization: (leave empty)
   ```

   **Google Gemini API:**
   ```
   Name: Gemini API
   API Key: your-gemini-api-key-here
   ```

   **Supabase API:**
   ```
   Name: Supabase
   URL: https://supabase.healthscribe.pro
   Service Key: [Auto-generated - check .env.local]
   ```

4. **Activate Workflow**:
   - Click the **Active** toggle
   - Save the workflow

---

### Step 6: Configure Application Environment

Update your `.env.local` file with API keys:

```bash
cd /var/www/healthscribe
nano .env.local
```

Add your API keys:
```env
# Add these lines (replace with your actual keys)
DEEPGRAM_API_KEY=your-deepgram-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

```bash
# Restart the application
pm2 restart healthscribe
```

---

### Step 7: Test Your System

1. **Visit Main Application**:
   - Go to: `https://healthscribe.pro`
   - Create your first admin account

2. **Test Transcription Workflow**:
   - Upload an audio file
   - Check if transcription starts
   - Verify n8n workflow execution

3. **Check Database**:
   - Go to: `https://supabase.healthscribe.pro`
   - Verify tables are created
   - Check user profiles and transcriptions

---

## 🔧 Useful Commands

### System Status
```bash
# Check all services
pm2 status
docker ps
sudo systemctl status nginx
sudo systemctl status n8n

# View logs
pm2 logs healthscribe
docker-compose -f /opt/supabase-healthscribe/docker/docker-compose.yml logs -f
sudo journalctl -u n8n -f
```

### Restart Services
```bash
# Restart application
pm2 restart healthscribe

# Restart Supabase
cd /opt/supabase-healthscribe/docker
docker-compose restart

# Restart n8n
sudo systemctl restart n8n

# Reload nginx
sudo systemctl reload nginx
```

### Backup & Monitoring
```bash
# Manual backup
/usr/local/bin/backup-supabase.sh
/usr/local/bin/backup-healthscribe.sh

# System monitoring
htop
df -h
free -h
```

---

## 🚨 Troubleshooting

### Common Issues

#### DNS Not Working
```bash
# Check DNS resolution
nslookup healthscribe.pro
nslookup supabase.healthscribe.pro
nslookup n8n.healthscribe.pro

# Clear DNS cache (if needed)
sudo systemd-resolve --flush-caches
```

#### SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

#### Application Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs healthscribe

# Check environment variables
cd /var/www/healthscribe
cat .env.local
```

#### Database Connection Issues
```bash
# Test database connection
docker exec -it $(docker ps -q --filter name=supabase_db) psql -U postgres -d medical_transcription

# Check Supabase services
cd /opt/supabase-healthscribe/docker
docker-compose ps
```

#### n8n Not Working
```bash
# Check n8n service
sudo systemctl status n8n

# Check n8n logs
sudo journalctl -u n8n -f

# Restart n8n
sudo systemctl restart n8n
```

---

## 📞 Getting Help

### If Something Goes Wrong

1. **Check the Logs**:
   ```bash
   pm2 logs healthscribe
   docker-compose -f /opt/supabase-healthscribe/docker/docker-compose.yml logs
   sudo journalctl -u n8n -f
   ```

2. **Restart Services**:
   ```bash
   pm2 restart healthscribe
   cd /opt/supabase-healthscribe/docker && docker-compose restart
   sudo systemctl restart n8n
   ```

3. **Check System Resources**:
   ```bash
   htop
   df -h
   free -h
   ```

4. **Verify Configuration**:
   ```bash
   cd /var/www/healthscribe
   cat .env.local
   ```

### Emergency Contacts
- **Contabo Support**: support@contabo.com
- **GoDaddy Support**: godaddy.com/help

---

## 🎯 Success Checklist

- [ ] DNS records configured and propagated
- [ ] VPS accessible via SSH
- [ ] Deployment script ran successfully
- [ ] All services are running (check with `pm2 status && docker ps`)
- [ ] SSL certificates are valid
- [ ] Can access all three URLs
- [ ] Can login to Supabase and n8n dashboards
- [ ] API credentials configured in n8n
- [ ] Test transcription workflow works
- [ ] Backups are running automatically

---

## 🚀 Your HealthScribe.Pro System is Ready!

Once everything is set up, you'll have:

✅ **Professional Medical Transcription Platform**
✅ **Self-hosted Database** (HIPAA-ready)
✅ **AI-powered Processing** (OpenAI + Gemini)
✅ **Secure SSL Encryption**
✅ **Automated Backups**
✅ **Monitoring & Logging**
✅ **Scalable Architecture**

**Next Steps:**
1. Create user accounts and roles
2. Configure document templates
3. Set up user permissions
4. Start processing medical audio files
5. Monitor system performance

Your complete medical transcription system is now production-ready! 🩺⚡

---

**Domain**: healthscribe.pro
**VPS IP**: 154.26.155.207
**Status**: Ready for deployment
