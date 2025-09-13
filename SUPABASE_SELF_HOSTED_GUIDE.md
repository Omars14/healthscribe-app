# 🏠 Supabase Self-Hosting Guide for VPS

This guide covers setting up a **self-hosted Supabase instance** on your Contabo VPS for maximum control and data privacy.

## 🎯 Why Self-Host Supabase?

✅ **Complete Data Control** - Your data stays on your servers  
✅ **Cost Effective** - No monthly cloud database fees  
✅ **Customizable** - Full control over configurations  
✅ **Regulatory Compliance** - Easier for HIPAA/data privacy laws  
✅ **Offline Capable** - Works without internet connectivity  

## 📋 Prerequisites

- **VPS with Docker** - Ubuntu 20.04/22.04
- **4GB+ RAM** - Supabase requires substantial memory
- **50GB+ Storage** - Database and file storage
- **Domain/Subdomain** - For Supabase dashboard access

## 🚀 Quick Setup (Docker)

### Step 1: Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker
```

### Step 2: Clone Supabase Repository
```bash
cd /opt
sudo git clone https://github.com/supabase/supabase
cd supabase/docker
```

### Step 3: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

Update the `.env` file with your settings:

```env
# Database
POSTGRES_PASSWORD=your-super-secret-postgres-password
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Supabase
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate a random string)
JWT_SECRET=your-random-jwt-secret-here

# API URLs (update with your domain)
SUPABASE_PUBLIC_URL=https://supabase.your-domain.com
API_EXTERNAL_URL=https://supabase.your-domain.com

# SMTP (for email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Storage
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=http://localhost:9000
STORAGE_S3_BUCKET=supabase-bucket

# Dashboard
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-secure-dashboard-password
```

### Step 4: Generate API Keys
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate anon key (you can use the same JWT secret)
# The keys should be JWT tokens, but for self-hosting you can use simpler strings
```

### Step 5: Start Supabase
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 6: Access Dashboard
- **URL**: `http://localhost:8000` (internal) or `https://supabase.your-domain.com` (external)
- **Username**: admin (from DASHBOARD_USERNAME)
- **Password**: your-secure-dashboard-password

## 🔧 Advanced Configuration

### Custom Docker Compose
```yaml
version: '3.8'

services:
  db:
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./volumes/db/data:/var/lib/postgresql/data
      - ./volumes/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  rest:
    image: supabase/postgrest:v12.0.2
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMA: public,graphql_public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_JWT_SECRET_IS_BASE64: false

  auth:
    image: supabase/gotrue:v2.151.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_SITE_URL: ${SUPABASE_PUBLIC_URL}

  storage:
    image: supabase/storage-api:v0.50.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800

  meta:
    image: supabase/supabase-admin-api:v0.50.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PG_META_DB_URL: postgres://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      PG_META_PORT: 8080

  kong:
    image: supabase/kong:2.8.1
    restart: unless-stopped
    depends_on:
      - rest
      - auth
      - storage
      - meta
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_PLUGINS: request-transformer,cors,key-auth,http-log
    volumes:
      - ./volumes/kong:/var/lib/kong
    ports:
      - "8000:8000/tcp"

  studio:
    image: supabase/studio:20240422-5cf8f30
    restart: unless-stopped
    depends_on:
      - db
      - kong
    environment:
      SUPABASE_URL: http://kong:8000
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      DASHBOARD_USERNAME: ${DASHBOARD_USERNAME}
      DASHBOARD_PASSWORD: ${DASHBOARD_PASSWORD}
    ports:
      - "3000:3000/tcp"

volumes:
  db-data:
    driver: local
  kong-data:
    driver: local
```

## 🗄️ Database Setup

### Step 1: Access Database
```bash
# Connect to PostgreSQL
docker exec -it supabase_db psql -U postgres -d postgres
```

### Step 2: Create Medical Transcription Database
```sql
-- Create medical transcription database
CREATE DATABASE medical_transcription;
GRANT ALL PRIVILEGES ON DATABASE medical_transcription TO postgres;

-- Connect to the new database
\c medical_transcription;
```

### Step 3: Run Migration Scripts
Copy and paste the migration SQL from your project:

```sql
-- Run the contents of supabase-medical-migration.sql
-- This will create all necessary tables and functions
```

### Step 4: Create Storage Bucket
```sql
-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
);
```

## 🌐 Nginx Configuration

### Step 1: Add Supabase to Nginx
```bash
sudo tee /etc/nginx/sites-available/supabase.your-domain.com > /dev/null <<EOF
server {
    listen 80;
    server_name supabase.your-domain.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name supabase.your-domain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/supabase.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supabase.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy to Supabase Studio
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

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
```

### Step 2: Enable Site and SSL
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/supabase.your-domain.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d supabase.your-domain.com
```

## 🔧 Application Configuration

### Update Your Environment Variables
```env
# Self-hosted Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://supabase.your-domain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-generated-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-generated-service-key

# Local development (if needed)
# SUPABASE_URL=http://localhost:8000
```

### Update n8n Credentials
In your n8n dashboard, update the Supabase credential:
- **URL**: `https://supabase.your-domain.com`
- **Service Role Key**: Your service role key

## 📊 Monitoring & Maintenance

### Check Service Status
```bash
# Check all Supabase services
cd /opt/supabase/docker
docker-compose ps

# View logs
docker-compose logs -f

# Individual service logs
docker-compose logs db
docker-compose logs auth
docker-compose logs storage
```

### Database Monitoring
```bash
# Connect to database
docker exec -it supabase_db psql -U postgres -d medical_transcription

# Check database size
SELECT pg_size_pretty(pg_database_size('medical_transcription'));

# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'medical_transcription';

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Strategy
```bash
# Create backup script
sudo tee /usr/local/bin/backup-supabase.sh > /dev/null <<EOF
#!/bin/bash
BACKUP_DIR="/var/backups/supabase"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Stop Supabase services
cd /opt/supabase/docker
docker-compose stop

# Backup database
docker exec supabase_db pg_dump -U postgres medical_transcription > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup volumes
tar -czf \$BACKUP_DIR/volumes_backup_\$DATE.tar.gz ./volumes/

# Start services again
docker-compose start

echo "Supabase backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-supabase.sh

# Set up daily backups
echo "0 4 * * * /usr/local/bin/backup-supabase.sh" | sudo crontab -
```

### Resource Monitoring
```bash
# Monitor Docker containers
docker stats

# Check disk usage
df -h /opt/supabase

# Monitor memory usage
docker system df

# Clean up unused Docker resources
docker system prune -f
```

## 🚨 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker status
sudo systemctl status docker

# Check for port conflicts
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Check environment variables
cd /opt/supabase/docker
cat .env
```

#### Database Connection Issues
```bash
# Test database connection
docker exec -it supabase_db psql -U postgres -d postgres -c "SELECT version();"

# Check if database exists
docker exec -it supabase_db psql -U postgres -d postgres -c "\l"

# Reset database
docker-compose down -v
docker-compose up -d db
```

#### Authentication Issues
```bash
# Check JWT secret
cd /opt/supabase/docker
grep JWT_SECRET .env

# Regenerate JWT secret if needed
openssl rand -base64 32
```

#### Storage Issues
```bash
# Check storage service logs
docker-compose logs storage

# Verify bucket exists
docker exec -it supabase_db psql -U postgres -d medical_transcription -c "SELECT * FROM storage.buckets;"
```

### Performance Issues
```bash
# Increase memory limits
echo 'vm.overcommit_memory=1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Add swap space if needed
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 🔄 Updates & Scaling

### Update Supabase
```bash
cd /opt/supabase/docker

# Stop services
docker-compose down

# Pull latest images
docker-compose pull

# Start services
docker-compose up -d

# Check for database migrations if needed
docker-compose logs db
```

### Scaling Services
```bash
# Scale specific services
docker-compose up -d --scale rest=2 --scale auth=2

# Check scaled services
docker-compose ps
```

### High Availability Setup
For production environments, consider:
1. **Load Balancer** - nginx or HAProxy
2. **Database Replication** - PostgreSQL streaming replication
3. **Backup Strategy** - Automated offsite backups
4. **Monitoring** - Prometheus + Grafana

## 🔐 Security Best Practices

### Network Security
```bash
# Configure firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw --force enable

# Disable root SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### Database Security
```bash
# Change default PostgreSQL password
cd /opt/supabase/docker
nano .env
# Update POSTGRES_PASSWORD with a strong password

# Enable SSL for PostgreSQL connections
echo "ssl = on" | sudo tee -a /etc/postgresql/15/main/postgresql.conf
sudo systemctl restart postgresql
```

### API Security
```bash
# Enable rate limiting in nginx
sudo nano /etc/nginx/sites-available/supabase.your-domain.com
# Add rate limiting directives

# Enable CORS properly
# Configure in your application settings
```

## 📊 Performance Optimization

### Database Tuning
```sql
-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Restart PostgreSQL
SELECT pg_reload_conf();
```

### Application Optimization
```bash
# Configure connection pooling
cd /opt/supabase/docker
echo "POSTGRES_POOL_SIZE=10" >> .env

# Restart services
docker-compose restart
```

### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install -y htop iotop sysstat

# Set up automatic monitoring
sudo tee /usr/local/bin/monitor-supabase.sh > /dev/null <<EOF
#!/bin/bash
echo "=== Supabase Health Check ==="
echo "Date: \$(date)"
echo "Uptime: \$(uptime -p)"
echo ""
echo "=== Docker Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Resource Usage ==="
echo "Memory: \$(free -h | grep Mem)"
echo "Disk: \$(df -h / | tail -1)"
echo "Load: \$(uptime | awk -F'load average:' '{ print \$2 }')"
echo ""
echo "=== Database Status ==="
docker exec supabase_db psql -U postgres -d medical_transcription -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || echo "Database connection failed"
EOF

sudo chmod +x /usr/local/bin/monitor-supabase.sh

# Set up hourly monitoring
echo "0 * * * * /usr/local/bin/monitor-supabase.sh >> /var/log/supabase-monitor.log 2>&1" | sudo crontab -
```

## 🎯 Success Checklist

- [ ] Supabase services running (`docker-compose ps`)
- [ ] Dashboard accessible (`https://supabase.your-domain.com`)
- [ ] Database created and migrated
- [ ] Storage bucket configured
- [ ] SSL certificates installed
- [ ] Application connected successfully
- [ ] n8n credentials updated
- [ ] Backup system configured
- [ ] Monitoring alerts set up

## 📞 Support Resources

- **Supabase Self-Hosting Docs**: [supabase.com/docs/guides/hosting/overview](https://supabase.com/docs/guides/hosting/overview)
- **Docker Documentation**: [docs.docker.com](https://docs.docker.com)
- **PostgreSQL Docs**: [postgresql.org/docs](https://postgresql.org/docs)
- **Community Forums**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)

## 🚀 Your Self-Hosted Supabase is Ready!

You now have a fully functional, self-hosted Supabase instance with:
- ✅ Complete data control
- ✅ Custom configurations
- ✅ Cost-effective operation
- ✅ HIPAA-ready architecture
- ✅ Full API compatibility

**Access URLs:**
- **Dashboard**: `https://supabase.your-domain.com`
- **API**: `https://supabase.your-domain.com/api`
- **Database**: `postgresql://postgres:password@localhost:5432/medical_transcription`

Next, configure your application to use the local Supabase instance and test the complete system! 🏠⚡
