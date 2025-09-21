# 🚀 Manual VPS Deployment Steps

Since automated deployment is having issues, here are the manual steps to deploy your medical transcription system to your VPS.

## 📋 Prerequisites
- VPS IP: `154.26.155.207`
- Username: `root`
- Password: `Nomar123`

## 🛠️ Step 1: Connect to Your VPS

```bash
ssh root@154.26.155.207
# Enter password: Nomar123
```

## 📁 Step 2: Create Directories

```bash
mkdir -p /opt/healthscribe
mkdir -p /opt/supabase
mkdir -p /var/backups/healthscribe
```

## 📤 Step 3: Upload Your Application Code

From your local machine, upload your code:

```bash
# Option 1: Using SCP (if available)
scp -r . root@154.26.155.207:/opt/healthscribe/dashboard-next

# Option 2: Using WinSCP (Windows GUI tool)
# Download WinSCP, connect to 154.26.155.207 with root/Nomar123
# Upload your entire project folder to /opt/healthscribe/dashboard-next

# Option 3: Using FileZilla (FTP client)
# Connect via SFTP to 154.26.155.207 with root/Nomar123
# Upload your project to /opt/healthscribe/dashboard-next
```

## 📤 Step 4: Upload Migration Scripts

Upload these files to `/root/` on your VPS:
- `complete-vps-migration.sh`
- `migrate-to-vps.js`

## 🚀 Step 5: Run the Migration Script

On your VPS:

```bash
cd /root
chmod +x complete-vps-migration.sh
./complete-vps-migration.sh
```

This script will:
- Install Docker, Node.js, nginx
- Set up self-hosted Supabase
- Configure nginx with SSL
- Create systemd services
- Start all services

## 📊 Step 6: Migrate Your Data

```bash
cd /root
npm install @supabase/supabase-js dotenv
node migrate-to-vps.js
```

This will copy all your data from cloud Supabase to your VPS.

## 🔍 Step 7: Check Services

```bash
systemctl status healthscribe-app
systemctl status supabase
systemctl status nginx
```

## 🌐 Step 8: Get SSL Certificates

```bash
certbot --nginx -d healthscribe.pro
certbot --nginx -d supabase.healthscribe.pro
```

## 📋 Step 9: Update DNS

Update your DNS records to point to `154.26.155.207`:
- `healthscribe.pro` → `154.26.155.207`
- `supabase.healthscribe.pro` → `154.26.155.207`

## ✅ Step 10: Test Your Application

1. Go to `http://154.26.155.207` (or `https://healthscribe.pro` after DNS update)
2. Test login functionality
3. Verify you can see your 82 transcriptions
4. Test file upload/download

## 🔧 Management Commands

```bash
# Check application status
systemctl status healthscribe-app

# View application logs
journalctl -u healthscribe-app -f

# Check Supabase status
systemctl status supabase

# View Supabase logs
cd /opt/supabase/supabase/docker
docker-compose logs -f

# Monitor system
/usr/local/bin/monitor-healthscribe.sh

# Backup system
/usr/local/bin/backup-healthscribe.sh
```

## 🚨 Troubleshooting

### If services won't start:
```bash
# Check logs
journalctl -u healthscribe-app -f
journalctl -u supabase -f

# Restart services
systemctl restart healthscribe-app
systemctl restart supabase
systemctl restart nginx
```

### If database connection fails:
```bash
# Check Supabase containers
cd /opt/supabase/supabase/docker
docker-compose ps

# Check database
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT version();"
```

### If nginx fails:
```bash
# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## 🎉 Success!

Once completed, your medical transcription system will be:
- ✅ Running on your VPS
- ✅ Using self-hosted Supabase
- ✅ All 82 transcriptions preserved
- ✅ SSL certificates installed
- ✅ Production-ready setup

## 📞 Need Help?

If you encounter any issues:
1. Check the logs using the commands above
2. Verify all services are running
3. Test connectivity to your VPS
4. Ensure DNS is properly configured

Your system will be completely self-hosted and independent! 🏠⚡




