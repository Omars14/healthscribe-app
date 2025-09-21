#!/bin/bash

# Complete VPS Deployment Script for Medical Transcription System
# This script will deploy everything to your VPS automatically

set -e

echo "🚀 Complete VPS Deployment for Medical Transcription System"
echo "========================================================="

# Configuration
VPS_IP="154.26.155.207"
VPS_USER="root"
VPS_PASS="Nomar123"
DOMAIN="healthscribe.pro"
SUPABASE_SUBDOMAIN="supabase.healthscribe.pro"
APP_PORT=3000

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to run commands on VPS
run_on_vps() {
    local command="$1"
    local description="$2"
    
    print_info "$description"
    
    # Use sshpass if available, otherwise use expect
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "$command"
    else
        # Use expect to handle password
        expect << EOF
spawn ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "$command"
expect "password:"
send "$VPS_PASS\r"
expect eof
EOF
    fi
    
    if [ $? -eq 0 ]; then
        print_status "$description completed"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Function to copy files to VPS
copy_to_vps() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    print_info "$description"
    
    if command -v sshpass &> /dev/null; then
        sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no -r "$local_path" "$VPS_USER@$VPS_IP:$remote_path"
    else
        # Use expect for scp
        expect << EOF
spawn scp -o StrictHostKeyChecking=no -r "$local_path" "$VPS_USER@$VPS_IP:$remote_path"
expect "password:"
send "$VPS_PASS\r"
expect eof
EOF
    fi
    
    if [ $? -eq 0 ]; then
        print_status "$description completed"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Check if we're running locally or on VPS
if [ "$(hostname -I | grep -o '154.26.155.207')" = "154.26.155.207" ]; then
    print_info "Running on VPS - executing deployment directly"
    IS_VPS=true
else
    print_info "Running locally - will deploy to VPS"
    IS_VPS=false
fi

if [ "$IS_VPS" = false ]; then
    # We're running locally, deploy to VPS
    
    print_info "Step 1: Creating directories on VPS"
    run_on_vps "mkdir -p /opt/healthscribe && mkdir -p /opt/supabase && mkdir -p /var/backups/healthscribe" "Creating directories"
    
    print_info "Step 2: Uploading application code"
    copy_to_vps "." "/opt/healthscribe/dashboard-next" "Uploading application code"
    
    print_info "Step 3: Uploading migration scripts"
    copy_to_vps "complete-vps-migration.sh" "/root/" "Uploading migration script"
    copy_to_vps "migrate-to-vps.js" "/root/" "Uploading data migration script"
    
    print_info "Step 4: Running VPS migration script"
    run_on_vps "cd /root && chmod +x complete-vps-migration.sh && ./complete-vps-migration.sh" "Running VPS migration script"
    
    print_info "Step 5: Migrating data from cloud to VPS"
    run_on_vps "cd /root && npm install @supabase/supabase-js dotenv && node migrate-to-vps.js" "Migrating data from cloud to VPS"
    
    print_info "Step 6: Checking services status"
    run_on_vps "systemctl status healthscribe-app --no-pager && systemctl status supabase --no-pager && systemctl status nginx --no-pager" "Checking services status"
    
    print_info "Step 7: Testing connectivity"
    run_on_vps "curl -I http://localhost:3000 && curl -I http://localhost:8000" "Testing connectivity"
    
else
    # We're running on VPS, execute the deployment
    print_info "Executing VPS deployment..."
    
    # Install required packages
    print_info "Installing system packages..."
    apt update
    apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban expect
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        curl -fsSL https://get.docker.com | bash
        systemctl enable docker
        systemctl start docker
        usermod -aG docker $USER
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Install Node.js
    if ! command -v node &> /dev/null; then
        print_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    fi
    
    # Set up Supabase
    print_info "Setting up Supabase..."
    cd /opt/supabase
    
    if [ ! -d "supabase" ]; then
        git clone https://github.com/supabase/supabase.git
    fi
    
    cd supabase/docker
    
    # Generate secure passwords
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    DASHBOARD_PASSWORD=$(openssl rand -base64 16)
    
    # Create Supabase environment
    cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# API Keys
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Supabase Configuration
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# External URLs
SUPABASE_PUBLIC_URL=https://$SUPABASE_SUBDOMAIN
API_EXTERNAL_URL=https://$SUPABASE_SUBDOMAIN

# Dashboard Configuration
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD

# Storage Configuration
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=http://storage:9000
STORAGE_S3_BUCKET=supabase-storage
STORAGE_S3_ACCESS_KEY_ID=supabase
STORAGE_S3_SECRET_ACCESS_KEY=supabase-storage-key

# Email Configuration
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_ADMIN_EMAIL=
SMTP_SENDER_NAME=HealthScribe

# Additional Configuration
ENABLE_ANALYTICS=false
ENABLE_LOGS=true
LOG_LEVEL=info
EOF
    
    # Create custom docker-compose for Supabase
    cat > docker-compose.override.yml << EOF
version: '3.8'

services:
  db:
    image: supabase/postgres:15.1.0.147
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: \${POSTGRES_DB}
    volumes:
      - ./volumes/db/data:/var/lib/postgresql/data
      - ./volumes/db/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3
    ports:
      - "5432:5432"

  rest:
    image: supabase/postgrest:v12.0.2
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_DB_SCHEMA: public,graphql_public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: \${JWT_SECRET}
      PGRST_JWT_SECRET_IS_BASE64: false

  auth:
    image: supabase/gotrue:v2.151.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: \${SUPABASE_PUBLIC_URL}
      GOTRUE_URI_ALLOW_LIST: \${SUPABASE_PUBLIC_URL}/*
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: \${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      GOTRUE_MAILER_AUTOCONFIRM: true

  storage:
    image: supabase/storage-api:v0.50.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      ANON_KEY: \${ANON_KEY}
      SERVICE_KEY: \${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: \${JWT_SECRET}
      DATABASE_URL: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage

  meta:
    image: supabase/supabase-admin-api:v0.50.0
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      PG_META_DB_URL: postgres://postgres:\${POSTGRES_PASSWORD}@db:5432/postgres
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
      SUPABASE_ANON_KEY: \${ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: \${SERVICE_ROLE_KEY}
      STUDIO_PG_META_URL: http://meta:8080
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      DASHBOARD_USERNAME: \${DASHBOARD_USERNAME}
      DASHBOARD_PASSWORD: \${DASHBOARD_PASSWORD}
    ports:
      - "3001:3000/tcp"

volumes:
  db-data:
    driver: local
  kong-data:
    driver: local
  storage-data:
    driver: local
EOF
    
    # Create Kong configuration
    mkdir -p volumes/kong
    cat > volumes/kong/kong.yml << EOF
_format_version: "1.1"

consumers:
  - username: anon
    keyauth_credentials:
      - key: \${ANON_KEY}
  - username: service_role
    keyauth_credentials:
      - key: \${SERVICE_ROLE_KEY}

acls:
  - consumer: anon
    group: anon
  - consumer: service_role
    group: service_role

services:
  - name: auth-v1-open
    url: http://auth:9999/verify
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - /auth/v1/verify
    plugins:
      - name: cors
  - name: auth-v1
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/
    plugins:
      - name: cors
  - name: rest-v1
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: cors
  - name: storage-v1
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
    plugins:
      - name: cors
  - name: meta
    url: http://meta:8080/
    routes:
      - name: meta-all
        strip_path: true
        paths:
          - /pg/
    plugins:
      - name: cors
EOF
    
    # Create database initialization
    mkdir -p volumes/db/init
    cat > volumes/db/init/01-init.sql << 'EOF'
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'transcriptionist',
  assigned_editor_id UUID REFERENCES auth.users(id),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  transcription_text TEXT,
  user_id UUID REFERENCES auth.users(id),
  upload_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  audio_url TEXT,
  storage_provider TEXT,
  file_size INTEGER,
  upload_status TEXT,
  audio_file_name TEXT,
  review_status review_status,
  review_id UUID,
  is_final BOOLEAN DEFAULT FALSE,
  final_version TEXT,
  transcriptionist_id UUID REFERENCES auth.users(id),
  formatted_text TEXT,
  formatting_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
  formatting_prompt TEXT,
  is_formatted BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  final_text TEXT,
  version INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own transcriptions" ON transcriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own transcriptions" ON transcriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own transcriptions" ON transcriptions FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
EOF
    
    # Start Supabase
    print_info "Starting Supabase services..."
    docker-compose up -d
    
    # Wait for services
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Set up application
    print_info "Setting up application..."
    cd /opt/healthscribe/dashboard-next
    
    # Install dependencies
    npm install
    npm run build
    
    # Create environment file
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_SUBDOMAIN
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NEXT_PUBLIC_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN
EOF
    
    # Configure nginx
    print_info "Configuring nginx..."
    
    # Main application nginx config
    cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL will be configured by certbot
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # CORS headers for Supabase
    add_header "Access-Control-Allow-Origin" "https://$SUPABASE_SUBDOMAIN" always;
    add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header "Access-Control-Allow-Headers" "*" always;
    add_header "Access-Control-Allow-Credentials" "true" always;

    # Main application
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Supabase nginx config
    cat > /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN << EOF
server {
    listen 80;
    server_name $SUPABASE_SUBDOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SUPABASE_SUBDOMAIN;

    # SSL will be configured by certbot
    ssl_certificate /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # CORS headers
    add_header "Access-Control-Allow-Origin" "https://$DOMAIN" always;
    add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header "Access-Control-Allow-Headers" "*" always;
    add_header "Access-Control-Allow-Credentials" "true" always;

    # Handle OPTIONS preflight requests
    if (\$request_method = OPTIONS) {
        add_header "Access-Control-Allow-Origin" "https://$DOMAIN" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        add_header "Content-Type" "text/plain charset=UTF-8" always;
        add_header "Content-Length" "0" always;
        return 204;
    }

    # Route to Supabase Kong
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Enable sites
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config
    nginx -t
    
    # Configure firewall
    print_info "Configuring firewall..."
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    # Create systemd service for your app
    print_info "Creating systemd service for your application..."
    cat > /etc/systemd/system/healthscribe-app.service << EOF
[Unit]
Description=HealthScribe Medical Transcription App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/healthscribe/dashboard-next
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_SUBDOMAIN
Environment=NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
Environment=SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
Environment=NEXT_PUBLIC_URL=https://$DOMAIN
Environment=NEXT_PUBLIC_API_URL=https://$DOMAIN
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Create systemd service for Supabase
    cat > /etc/systemd/system/supabase.service << EOF
[Unit]
Description=Supabase Self-Hosted
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/supabase/supabase/docker
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable services
    systemctl enable healthscribe-app.service
    systemctl enable supabase.service
    
    # Start services
    print_info "Starting services..."
    systemctl start supabase.service
    systemctl start healthscribe-app.service
    systemctl start nginx
    
    # Get SSL certificates
    print_info "Getting SSL certificates..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    certbot --nginx -d $SUPABASE_SUBDOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Create backup script
    print_info "Creating backup script..."
    cat > /usr/local/bin/backup-healthscribe.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/healthscribe"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/healthscribe/

# Backup Supabase
cd /opt/supabase/supabase/docker
docker exec supabase_db pg_dump -U postgres postgres > $BACKUP_DIR/db_backup_$DATE.sql

# Backup volumes
tar -czf $BACKUP_DIR/volumes_backup_$DATE.tar.gz ./volumes/

echo "Backup completed: $DATE"
EOF
    
    chmod +x /usr/local/bin/backup-healthscribe.sh
    
    # Create monitoring script
    print_info "Creating monitoring script..."
    cat > /usr/local/bin/monitor-healthscribe.sh << 'EOF'
#!/bin/bash
echo "=== HealthScribe System Status ==="
echo "Date: $(date)"
echo ""

echo "=== Application Status ==="
systemctl status healthscribe-app --no-pager -l
echo ""

echo "=== Supabase Status ==="
systemctl status supabase --no-pager -l
echo ""

echo "=== Nginx Status ==="
systemctl status nginx --no-pager -l
echo ""

echo "=== Docker Containers ==="
cd /opt/supabase/supabase/docker
docker-compose ps
echo ""

echo "=== Resource Usage ==="
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo "Load: $(uptime | awk -F'load average:' '{ print $2 }')"
EOF
    
    chmod +x /usr/local/bin/monitor-healthscribe.sh
    
    # Final status check
    print_info "Final status check..."
    systemctl status healthscribe-app --no-pager
    systemctl status supabase --no-pager
    systemctl status nginx --no-pager
    
    print_status "Complete VPS deployment finished!"
    echo ""
    echo "🎉 Your Medical Transcription System is now running on your VPS!"
    echo "================================================================"
    echo ""
    echo "📋 Access URLs:"
    echo "  • Main Application: https://$DOMAIN"
    echo "  • Supabase Dashboard: https://$SUPABASE_SUBDOMAIN:3001"
    echo "  • Supabase API: https://$SUPABASE_SUBDOMAIN"
    echo ""
    echo "🔑 API Keys:"
    echo "  • Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    echo "  • Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Test your application at https://$DOMAIN"
    echo "  2. Migrate your data using the migration script"
    echo "  3. Update your DNS to point to this VPS"
    echo "  4. Test all functionality"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • Monitor: /usr/local/bin/monitor-healthscribe.sh"
    echo "  • Backup: /usr/local/bin/backup-healthscribe.sh"
    echo "  • App logs: journalctl -u healthscribe-app -f"
    echo "  • Supabase logs: cd /opt/supabase/supabase/docker && docker-compose logs -f"
    echo ""
    echo "⚠️  Important: Update your DNS records to point to this VPS IP address!"
fi

print_status "Deployment script completed!"




