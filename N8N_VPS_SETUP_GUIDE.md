# n8n Setup Guide for Contabo VPS

## 🎯 Overview

This guide covers setting up a self-hosted n8n instance on your Contabo VPS for the medical transcription system.

**What is n8n?**
- Workflow automation tool
- Handles transcription processing
- Connects Deepgram, Gemini AI, and Supabase
- Processes medical audio files and formats them

---

## 🚀 Quick Setup (Automated)

If you ran the `vps-setup.sh` script, n8n should already be installed as a systemd service. Skip to **Step 4: Configuration**.

---

## 📋 Manual Setup Steps

### Step 1: Install Node.js (if not already done)

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install n8n Globally

```bash
sudo npm install -g n8n
```

### Step 3: Create n8n User and Directory

```bash
# Create n8n user
sudo useradd -m -s /bin/bash n8n

# Create n8n data directory
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
Environment=N8N_HOST=n8n.your-domain.com

[Install]
WantedBy=multi-user.target
EOF

# Enable and start n8n service
sudo systemctl daemon-reload
sudo systemctl enable n8n
```

### Step 4: Configure n8n Environment

Create environment configuration:

```bash
# Switch to n8n user
sudo -u n8n tee /home/n8n/.n8n/.env > /dev/null <<EOF
# Basic Configuration
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_HOST=n8n.your-domain.com
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Database Configuration
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/home/n8n/.n8n/n8n.db

# Webhook Configuration
WEBHOOK_URL=https://n8n.your-domain.com

# Security
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 12)

# Performance
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200

# Logging
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console,file
N8N_LOG_FILE_LOCATION=/home/n8n/.n8n/logs/n8n.log
EOF
```

### Step 5: Start n8n Service

```bash
sudo systemctl start n8n
sudo systemctl status n8n
```

---

## 🔧 n8n Configuration

### Access n8n Dashboard

1. **URL**: `https://n8n.your-domain.com`
2. **Username**: `admin` (or whatever you set in .env)
3. **Password**: Check the generated password in `/home/n8n/.n8n/.env`

### First-Time Setup

1. **Create Admin Account**:
   - Go to Settings → Users
   - Create your admin account
   - Delete the default admin user

2. **Configure Security**:
   - Go to Settings → Security
   - Enable authentication
   - Configure password policies

---

## 🤖 Import Medical Transcription Workflow

### Step 1: Import Workflow

1. In n8n dashboard, click **Workflows** in the left sidebar
2. Click **Import from File**
3. Select the workflow file: `n8n-medical-workflow-gemini.json`
4. Click **Import**

### Step 2: Verify Workflow Structure

The workflow should include these nodes:
- **Webhook**: Receives transcription requests
- **Supabase**: Database operations
- **Deepgram**: Audio transcription
- **Google Gemini**: Medical document formatting
- **HTTP Request**: API communications
- **Switch/Condition**: Logic branches
- **Error Handler**: Error handling

### Step 3: Configure Credentials

#### Deepgram API Credential

1. Click **Credentials** in the left sidebar
2. Click **Add Credential**
3. Select **Deepgram** (or create HTTP Request credential)
4. Configure:
   ```
   Name: Deepgram
   API Key: your-deepgram-api-key
   ```

#### Google AI (Gemini) Credential

1. Click **Credentials** → **Add Credential**
2. Select **Google AI**
3. Configure:
   ```
   Name: Gemini API
   API Key: your-gemini-api-key
   ```

#### Supabase API Credential

1. Click **Credentials** → **Add Credential**
2. Select **Supabase API** (or create custom HTTP credential)
3. Configure:
   ```
   Name: Supabase
   URL: https://your-project.supabase.co
   Service Role Key: your-service-role-key
   ```

### Step 4: Update Webhook URL

1. Open the imported workflow
2. Click on the **Webhook** node
3. Copy the webhook URL (should look like: `https://n8n.your-domain.com/webhook/medical-transcribe-v2`)
4. Update your application `.env.local`:
   ```env
   N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/medical-transcribe-v2
   ```

### Step 5: Activate Workflow

1. Click the **Active** toggle in the workflow header
2. Save the workflow
3. The workflow is now ready to receive requests

---

## 🔧 Advanced n8n Configuration

### Environment Variables

For production deployment, add these to `/home/n8n/.n8n/.env`:

```bash
# Production Settings
NODE_ENV=production
N8N_RELEASE_TYPE=stable

# Security
N8N_SECURITY_CORS_ENABLED=true
N8N_SECURITY_CORS_ORIGIN=https://your-domain.com

# Performance
N8N_BINARY_DATA_TTL=240
N8N_WORKFLOWS_DEFAULT_NAME=Medical Transcription
N8N_EXECUTIONS_DATA_PRUNE=true
N8N_EXECUTIONS_DATA_MAX_AGE=336

# Database (for PostgreSQL if you prefer)
# DB_TYPE=postgresdb
# DB_POSTGRESDB_HOST=localhost
# DB_POSTGRESDB_PORT=5432
# DB_POSTGRESDB_DATABASE=n8n
# DB_POSTGRESDB_USER=n8n_user
# DB_POSTGRESDB_PASSWORD=secure_password
```

### Database Setup (Optional)

If you want to use PostgreSQL instead of SQLite:

```bash
# Install PostgreSQL (if not already done)
sudo apt install -y postgresql postgresql-contrib

# Create n8n database
sudo -u postgres psql
CREATE DATABASE n8n_db;
CREATE USER n8n_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE n8n_db TO n8n_user;
\q

# Update n8n environment
sudo -u n8n tee -a /home/n8n/.n8n/.env > /dev/null <<EOF
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n_db
DB_POSTGRESDB_USER=n8n_user
DB_POSTGRESDB_PASSWORD=secure_password
EOF
```

### Backup Configuration

```bash
# Create backup script for n8n
sudo tee /usr/local/bin/backup-n8n.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/n8n"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Stop n8n
sudo systemctl stop n8n

# Backup data
tar -czf \$BACKUP_DIR/n8n_backup_\$DATE.tar.gz /home/n8n/.n8n

# Start n8n
sudo systemctl start n8n

echo "n8n backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-n8n.sh

# Add to cron for daily backups
echo "0 2 * * * /usr/local/bin/backup-n8n.sh" | sudo crontab -
```

---

## 🔍 Monitoring n8n

### Service Status

```bash
# Check n8n service status
sudo systemctl status n8n

# View n8n logs
sudo journalctl -u n8n -f

# Restart n8n
sudo systemctl restart n8n
```

### n8n Logs

```bash
# View application logs
sudo -u n8n tail -f /home/n8n/.n8n/logs/n8n.log

# View workflow execution logs in n8n dashboard
# Go to Executions → Click on any execution for details
```

### Performance Monitoring

```bash
# Monitor n8n process
ps aux | grep n8n

# Check memory usage
pm2 monit  # (if using PM2 instead of systemd)

# Check disk usage
du -sh /home/n8n/.n8n
```

---

## 🚨 Troubleshooting

### n8n Won't Start

```bash
# Check for errors
sudo journalctl -u n8n -n 50

# Check environment file
sudo -u n8n cat /home/n8n/.n8n/.env

# Test n8n manually
sudo -u n8n /usr/bin/n8n --help
```

### Workflow Not Triggering

1. **Check Webhook URL**:
   - Verify the webhook URL in your application matches n8n
   - Check n8n logs for incoming requests

2. **Check Credentials**:
   - Verify API keys are correct
   - Test credentials in n8n dashboard

3. **Check Workflow Status**:
   - Ensure workflow is active
   - Check for error nodes in workflow

### API Connection Issues

```bash
# Test OpenAI API
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.openai.com/v1/models

# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/
```

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 5678
sudo netstat -tulpn | grep :5678

# Kill the process
sudo kill -9 <PID>

# Or change n8n port
echo "N8N_PORT=5679" | sudo tee -a /home/n8n/.n8n/.env
sudo systemctl restart n8n
```

#### Database Connection Failed
```bash
# For PostgreSQL issues
sudo -u postgres psql
\l  # List databases
\du  # List users
\q

# Test connection
psql -h localhost -U n8n_user -d n8n_db
```

#### SSL/Certificate Issues
```bash
# Check certificate
openssl s_client -connect n8n.your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew
sudo systemctl reload nginx
```

---

## 🔄 Updating n8n

```bash
# Stop n8n
sudo systemctl stop n8n

# Update n8n
sudo npm update -g n8n

# Start n8n
sudo systemctl start n8n

# Check version
n8n --version
```

---

## 📊 Scaling n8n

### Multiple Instances

For high traffic, you can run multiple n8n instances:

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Create ecosystem file
sudo tee /home/n8n/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [{
    name: 'n8n-1',
    script: 'n8n',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      N8N_PORT: 5678,
      N8N_PROTOCOL: 'https',
      N8N_HOST: 'n8n.your-domain.com'
    }
  }]
}
EOF

# Start with PM2
sudo -u n8n pm2 start /home/n8n/ecosystem.config.js
sudo -u n8n pm2 save
sudo -u n8n pm2 startup
```

### Load Balancing

Configure nginx for load balancing:

```nginx
upstream n8n_backend {
    server localhost:5678;
    server localhost:5679;
    server localhost:5680;
}

server {
    # ... other config
    location / {
        proxy_pass http://n8n_backend;
        # ... proxy settings
    }
}
```

---

## 🔐 Security Best Practices

### Network Security

```bash
# Configure firewall
sudo ufw allow 5678
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### n8n Security

1. **Strong Passwords**: Use complex passwords for n8n
2. **HTTPS Only**: Always use HTTPS
3. **API Keys**: Store securely, rotate regularly
4. **User Management**: Limit admin access
5. **Audit Logs**: Monitor workflow executions

### Data Security

1. **Encryption**: Enable database encryption
2. **Backups**: Regular encrypted backups
3. **Access Control**: Principle of least privilege
4. **Updates**: Keep n8n and dependencies updated

---

## 🎯 Testing Your Setup

### Test Workflow Execution

1. **Manual Test**:
   - Go to your Next.js application
   - Upload a test audio file
   - Check n8n dashboard for workflow execution

2. **API Test**:
   ```bash
   # Test webhook endpoint
   curl -X POST https://n8n.your-domain.com/webhook/medical-transcribe-v2 \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Database Test**:
   ```bash
   # Check if transcription records are created
   # Query your Supabase database
   ```

### Performance Testing

```bash
# Test concurrent requests
ab -n 100 -c 10 https://n8n.your-domain.com/webhook/test

# Monitor resource usage
htop
```

---

## 📞 Support & Resources

### n8n Resources

- **Documentation**: [docs.n8n.io](https://docs.n8n.io)
- **Community**: [community.n8n.io](https://community.n8n.io)
- **GitHub**: [github.com/n8n-io/n8n](https://github.com/n8n-io/n8n)

### Getting Help

1. **Logs**: Check n8n and nginx logs
2. **Dashboard**: Use n8n's built-in debugging tools
3. **Community**: Ask questions on n8n forums
4. **GitHub Issues**: Report bugs

---

## 🎉 Success Checklist

- [ ] n8n installed and running
- [ ] Workflow imported successfully
- [ ] API credentials configured
- [ ] Webhook URL updated in application
- [ ] SSL certificate configured
- [ ] Firewall rules set
- [ ] Backup system configured
- [ ] Monitoring set up
- [ ] Test workflow execution successful

---

## 🚀 You're Ready!

Your n8n instance is now configured and ready to process medical transcription workflows!

**Access Points:**
- **n8n Dashboard**: https://n8n.your-domain.com
- **Workflow Webhook**: https://n8n.your-domain.com/webhook/medical-transcribe-v2

**Next Steps:**
1. Test the complete workflow with your application
2. Monitor performance and resource usage
3. Set up automated backups
4. Configure alerts for workflow failures

Your medical transcription system is now fully operational! 🩺🤖
