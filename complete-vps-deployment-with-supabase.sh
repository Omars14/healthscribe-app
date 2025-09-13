#!/bin/bash

# Complete Medical Transcription System - VPS Deployment with Self-Hosted Supabase
# This script sets up your entire system including self-hosted Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration variables - UPDATE THESE!
DOMAIN_NAME="your-domain.com"
SUPABASE_SUBDOMAIN="supabase.your-domain.com"
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"

# API Keys (for n8n workflows)
DEEPGRAM_API_KEY="your-deepgram-api-key"
GEMINI_API_KEY="your-gemini-api-key"

# Database passwords (generate strong ones)
POSTGRES_PASSWORD="your-super-secret-postgres-password-$(openssl rand -hex 8)"
JWT_SECRET="$(openssl rand -base64 32)"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(openssl rand -hex 32).$(openssl rand -hex 16)"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(openssl rand -hex 32).$(openssl rand -hex 16)"

# Dashboard credentials
DASHBOARD_USERNAME="admin"
DASHBOARD_PASSWORD="secure-dashboard-password-$(openssl rand -hex 8)"

# Project paths
PROJECT_DIR="/var/www/medical-transcription"
SUPABASE_DIR="/opt/supabase"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_progress() {
    echo -e "${CYAN}[PROGRESS]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

validate_config() {
    log_info "Validating configuration..."

    local errors=0

    if [[ -z "$DOMAIN_NAME" || "$DOMAIN_NAME" == "your-domain.com" ]]; then
        log_error "DOMAIN_NAME is not configured"
        errors=$((errors + 1))
    fi

    if [[ -z "$EMAIL" || "$EMAIL" == "your-email@example.com" ]]; then
        log_error "EMAIL is not configured"
        errors=$((errors + 1))
    fi

    if [[ -z "$DEEPGRAM_API_KEY" || "$DEEPGRAM_API_KEY" == "your-deepgram-api-key" ]]; then
        log_warning "DEEPGRAM_API_KEY is not configured - you'll need to set this up later"
    fi

    if [[ -z "$GEMINI_API_KEY" || "$GEMINI_API_KEY" == "your-gemini-api-key" ]]; then
        log_warning "GEMINI_API_KEY is not configured - you'll need to set this up later"
    fi

    if [[ $errors -gt 0 ]]; then
        log_error "Please update the configuration variables at the top of this script"
        exit 1
    fi

    log_success "Configuration validated"
}

update_system() {
    log_step "Step 1: Updating System"
    log_info "Updating system packages..."

    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common ufw htop iotop sysstat

    log_success "System updated successfully"
}

configure_firewall() {
    log_step "Step 2: Configuring Firewall"
    log_info "Setting up firewall rules..."

    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 5432  # PostgreSQL
    ufw allow 9000  # MinIO (Supabase storage)
    echo "y" | ufw --force enable

    log_success "Firewall configured"
}

install_docker() {
    log_step "Step 3: Installing Docker"
    log_info "Installing Docker and Docker Compose..."

    # Install Docker
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker

    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose

    # Add current user to docker group
    usermod -aG docker $SUDO_USER 2>/dev/null || usermod -aG docker root

    log_success "Docker and Docker Compose installed"
}

install_nodejs() {
    log_step "Step 4: Installing Node.js"
    log_info "Installing Node.js 18..."

    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g pm2

    log_success "Node.js and PM2 installed"
}

install_nginx() {
    log_step "Step 5: Installing Nginx"
    log_info "Installing and configuring Nginx..."

    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx

    log_success "Nginx installed and started"
}

setup_supabase() {
    log_step "Step 6: Setting up Self-Hosted Supabase"
    log_info "Installing and configuring Supabase..."

    # Create Supabase directory
    mkdir -p $SUPABASE_DIR
    cd $SUPABASE_DIR

    # Clone Supabase repository
    if [ ! -d "docker" ]; then
        git clone https://github.com/supabase/supabase
        cd supabase/docker
    else
        cd docker
        git pull origin master
    fi

    # Create environment file
    cat > .env << EOF
# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Supabase
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# JWT Secret
JWT_SECRET=$JWT_SECRET

# API URLs
SUPABASE_PUBLIC_URL=https://$SUPABASE_SUBDOMAIN
API_EXTERNAL_URL=https://$SUPABASE_SUBDOMAIN

# Dashboard
DASHBOARD_USERNAME=$DASHBOARD_USERNAME
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD

# Storage
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=http://localhost:9000
STORAGE_S3_BUCKET=supabase-bucket
EOF

    # Create custom docker-compose.yml
    cat > docker-compose.yml << 'EOF'
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
    ports:
      - "5432:5432"

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
EOF

    # Start Supabase
    log_info "Starting Supabase services (this may take a few minutes)..."
    docker-compose up -d

    # Wait for services to be ready
    log_info "Waiting for Supabase services to initialize..."
    sleep 60

    # Test database connection
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
            log_success "Database is ready!"
            break
        fi
        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        log_error "Database failed to start within timeout"
        exit 1
    fi

    log_success "Supabase setup completed"
}

setup_database() {
    log_step "Step 7: Setting up Medical Transcription Database"
    log_info "Creating database and running migrations..."

    cd $SUPABASE_DIR/docker

    # Create medical transcription database
    docker-compose exec -T db psql -U postgres -c "CREATE DATABASE medical_transcription;" 2>/dev/null || true
    docker-compose exec -T db psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE medical_transcription TO postgres;" 2>/dev/null || true

    # Create init script for database setup
    mkdir -p volumes/db/init

    cat > volumes/db/init/01-init-medical-transcription.sql << 'EOF'
-- Connect to medical transcription database
\c medical_transcription;

-- Create extensions
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

-- Create user_profiles table
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

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status review_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  editor_notes TEXT,
  original_text TEXT,
  edited_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  formatting_instructions TEXT NOT NULL,
  structure_template JSONB,
  example_output TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcription_edits table
CREATE TABLE IF NOT EXISTS transcription_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  edited_text TEXT NOT NULL,
  edit_type VARCHAR(50),
  edited_by UUID REFERENCES auth.users(id),
  edit_reason TEXT,
  changes_made JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcription_metrics table
CREATE TABLE IF NOT EXISTS transcription_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  metric_type VARCHAR(50),
  duration_ms INTEGER,
  document_type VARCHAR(100),
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to transcriptions table
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS review_status review_status,
ADD COLUMN IF NOT EXISTS review_id UUID,
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_version TEXT,
ADD COLUMN IF NOT EXISTS transcriptionist_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS formatted_text TEXT,
ADD COLUMN IF NOT EXISTS formatting_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
ADD COLUMN IF NOT EXISTS formatting_prompt TEXT,
ADD COLUMN IF NOT EXISTS is_formatted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS final_text TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned_to ON reviews(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reviews_requested_by ON reviews(requested_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_editor ON user_profiles(assigned_editor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_transcriptions_review_status ON transcriptions(review_status);
CREATE INDEX IF NOT EXISTS idx_document_type ON transcriptions(document_type);
CREATE INDEX IF NOT EXISTS idx_is_formatted ON transcriptions(is_formatted);
CREATE INDEX IF NOT EXISTS idx_status_formatted ON transcriptions(status, is_formatted);
CREATE INDEX IF NOT EXISTS idx_transcription_edits_id ON transcription_edits(transcription_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON transcription_metrics(metric_type, created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_metrics ENABLE ROW LEVEL SECURITY;

-- Insert default document templates
INSERT INTO document_templates (document_type, display_name, formatting_instructions) VALUES
('consultation', 'Consultation Note', 'Format as a consultation note with: CHIEF COMPLAINT, HISTORY OF PRESENT ILLNESS, PAST MEDICAL HISTORY, MEDICATIONS, ALLERGIES, PHYSICAL EXAMINATION, ASSESSMENT, and PLAN sections.'),
('surgery_report', 'Surgery Report', 'Format as an operative report with: PREOPERATIVE DIAGNOSIS, POSTOPERATIVE DIAGNOSIS, PROCEDURE PERFORMED, SURGEON, ASSISTANT, ANESTHESIA, INDICATIONS, FINDINGS, TECHNIQUE, and ESTIMATED BLOOD LOSS sections.'),
('discharge_summary', 'Discharge Summary', 'Format with: ADMISSION DATE, DISCHARGE DATE, ADMITTING DIAGNOSIS, DISCHARGE DIAGNOSIS, HOSPITAL COURSE, DISCHARGE MEDICATIONS, DISCHARGE INSTRUCTIONS, and FOLLOW-UP sections.'),
('progress_note', 'Progress Note', 'Format as SOAP note with clear sections: SUBJECTIVE (patient complaints and symptoms), OBJECTIVE (vital signs and exam findings), ASSESSMENT (diagnosis and clinical impression), and PLAN (treatment and next steps).'),
('radiology_report', 'Radiology Report', 'Format with: INDICATION, TECHNIQUE, COMPARISON, FINDINGS (organized by anatomical region), and IMPRESSION sections.'),
('pathology_report', 'Pathology Report', 'Format with: SPECIMEN IDENTIFICATION, GROSS DESCRIPTION, MICROSCOPIC DESCRIPTION, SPECIAL STAINS, and DIAGNOSIS sections.'),
('emergency_note', 'Emergency Department Note', 'Format with: CHIEF COMPLAINT, HPI, REVIEW OF SYSTEMS, PAST MEDICAL HISTORY, MEDICATIONS, ALLERGIES, PHYSICAL EXAM, ED COURSE, MEDICAL DECISION MAKING, and DISPOSITION sections.'),
('procedure_note', 'Procedure Note', 'Format with: PROCEDURE, INDICATION, CONSENT, PREPARATION, TECHNIQUE, FINDINGS, COMPLICATIONS, and POST-PROCEDURE INSTRUCTIONS sections.')
ON CONFLICT (document_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  formatting_instructions = EXCLUDED.formatting_instructions,
  updated_at = NOW();

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;
EOF

    # Restart Supabase to apply database changes
    log_info "Restarting Supabase to apply database schema..."
    docker-compose restart

    # Wait for services to restart
    sleep 30

    log_success "Database setup completed"
}

install_n8n() {
    log_step "Step 8: Installing n8n"
    log_info "Setting up n8n workflow automation..."

    npm install -g n8n

    # Create n8n user and directories
    useradd -m -s /bin/bash n8n 2>/dev/null || true
    mkdir -p /home/n8n/.n8n
    chown -R n8n:n8n /home/n8n/.n8n

    # Create n8n service
    cat > /etc/systemd/system/n8n.service << EOF
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
Environment=N8N_HOST=$N8N_SUBDOMAIN

[Install]
WantedBy=multi-user.target
EOF

    # Create n8n environment file
    cat > /home/n8n/.n8n/.env << EOF
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_HOST=$N8N_SUBDOMAIN
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)
DB_TYPE=sqlite
DB_SQLITE_DATABASE=/home/n8n/.n8n/n8n.db
WEBHOOK_URL=https://$N8N_SUBDOMAIN
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 12)
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=3600
EXECUTIONS_TIMEOUT_MAX=7200
N8N_LOG_LEVEL=info
EOF

    chown n8n:n8n /home/n8n/.n8n/.env

    systemctl daemon-reload
    systemctl enable n8n
    systemctl start n8n

    log_success "n8n installed and started"
}

configure_nginx() {
    log_step "Step 9: Configuring Nginx"
    log_info "Setting up Nginx reverse proxy..."

    # Main application config
    cat > /etc/nginx/sites-available/medical-transcription << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        limit_req zone=general burst=200 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Supabase subdomain config
    cat > /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN << EOF
server {
    listen 80;
    server_name $SUPABASE_SUBDOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SUPABASE_SUBDOMAIN;

    ssl_certificate /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

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

    # n8n subdomain config
    cat > /etc/nginx/sites-available/$N8N_SUBDOMAIN << EOF
server {
    listen 80;
    server_name $N8N_SUBDOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $N8N_SUBDOMAIN;

    ssl_certificate /etc/letsencrypt/live/$N8N_SUBDOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$N8N_SUBDOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

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
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    # Enable rate limiting
    cat >> /etc/nginx/nginx.conf << 'EOF'

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;

    limit_req_status 429;
EOF

    # Enable sites
    ln -sf /etc/nginx/sites-available/medical-transcription /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/$N8N_SUBDOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t
    systemctl reload nginx

    log_success "Nginx configured successfully"
}

setup_ssl() {
    log_step "Step 10: Setting up SSL Certificates"
    log_info "Installing Let's Encrypt certificates..."

    apt install -y certbot python3-certbot-nginx

    # Get certificates
    certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive
    certbot --nginx -d $SUPABASE_SUBDOMAIN --email $EMAIL --agree-tos --non-interactive
    certbot --nginx -d $N8N_SUBDOMAIN --email $EMAIL --agree-tos --non-interactive

    # Set up auto-renewal
    (crontab -l ; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    log_success "SSL certificates installed and auto-renewal configured"
}

deploy_application() {
    log_step "Step 11: Deploying Application"
    log_info "Setting up Next.js application..."

    # Create application directory
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR

    # Clone repository (you'll need to provide the actual repo URL)
    if [ ! -d ".git" ]; then
        log_warning "Please clone your application repository to $PROJECT_DIR"
        log_info "Run: cd $PROJECT_DIR && git clone YOUR_REPO_URL ."
        log_info "Then run this deployment script again."
        exit 1
    fi

    # Install dependencies
    log_info "Installing dependencies..."
    npm install

    # Create environment file
    log_info "Creating environment configuration..."
    cat > .env.local << EOF
# Self-hosted Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_SUBDOMAIN
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# n8n Configuration
N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://$DOMAIN_NAME
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME

# API Keys (configure these later in n8n)
DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY

# File Upload Limits
MAX_FILE_SIZE=104857600

# Application Settings
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=production

# Security
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

    # Build application
    log_info "Building application..."
    npm run build

    # Start with PM2
    log_info "Starting application with PM2..."
    pm2 delete medical-transcription 2>/dev/null || true
    pm2 start npm --name "medical-transcription" -- start
    pm2 save

    # Set up PM2 to start on boot
    pm2 startup | grep -v "sudo" | bash || true

    log_success "Application deployed successfully"
}

setup_monitoring() {
    log_step "Step 12: Setting up Monitoring"
    log_info "Configuring monitoring and logging..."

    # Create log directories
    mkdir -p /var/log/medical-transcription
    chown www-data:www-data /var/log/medical-transcription

    # Set up log rotation
    cat > /etc/logrotate.d/medical-transcription << EOF
/var/log/medical-transcription/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Create backup scripts
    cat > /usr/local/bin/backup-supabase.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/supabase"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Stop Supabase services
cd $SUPABASE_DIR/docker
docker-compose stop

# Backup database
docker-compose exec -T db pg_dump -U postgres medical_transcription > \$BACKUP_DIR/db_backup_\$DATE.sql

# Backup volumes
tar -czf \$BACKUP_DIR/volumes_backup_\$DATE.tar.gz ./volumes/

# Start services again
docker-compose start

echo "Supabase backup completed: \$DATE"
EOF

    cat > /usr/local/bin/backup-medical-transcription.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/medical-transcription"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Stop services temporarily
pm2 stop medical-transcription
systemctl stop n8n

# Backup application
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz $PROJECT_DIR

# Backup n8n data
tar -czf \$BACKUP_DIR/n8n_\$DATE.tar.gz /home/n8n/.n8n

# Start services
pm2 start medical-transcription
systemctl start n8n

echo "Application backup completed: \$DATE"
EOF

    chmod +x /usr/local/bin/backup-supabase.sh
    chmod +x /usr/local/bin/backup-medical-transcription.sh

    # Set up daily backups
    (crontab -l ; echo "0 3 * * * /usr/local/bin/backup-supabase.sh") | crontab -
    (crontab -l ; echo "0 4 * * * /usr/local/bin/backup-medical-transcription.sh") | crontab -

    log_success "Monitoring and backup system configured"
}

test_deployment() {
    log_step "Step 13: Testing Deployment"
    log_info "Running deployment tests..."

    local tests_passed=0
    local total_tests=8

    # Test 1: Nginx configuration
    if nginx -t &>/dev/null; then
        log_success "✓ Nginx configuration is valid"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ Nginx configuration has errors"
    fi

    # Test 2: Docker services
    if docker ps | grep -q "supabase"; then
        log_success "✓ Supabase Docker services are running"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ Supabase Docker services are not running"
    fi

    # Test 3: Database connectivity
    if docker exec $($SUPABASE_DIR/docker/docker-compose ps -q db) pg_isready -U postgres &>/dev/null; then
        log_success "✓ Database is accessible"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ Database is not accessible"
    fi

    # Test 4: Application startup
    sleep 5
    if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
        log_success "✓ Next.js application is running"
        tests_passed=$((tests_passed + 1))
    else
        log_warning "⚠ Next.js application may not be responding yet"
    fi

    # Test 5: n8n startup
    if curl -s -I http://localhost:5678 | grep -q "200 OK"; then
        log_success "✓ n8n is running"
        tests_passed=$((tests_passed + 1))
    else
        log_warning "⚠ n8n may not be responding yet"
    fi

    # Test 6: Supabase API
    if curl -s -I http://localhost:8000 | grep -q "200 OK"; then
        log_success "✓ Supabase API is responding"
        tests_passed=$((tests_passed + 1))
    else
        log_warning "⚠ Supabase API may not be responding yet"
    fi

    # Test 7: SSL certificates
    if [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
        log_success "✓ SSL certificate for $DOMAIN_NAME is installed"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ SSL certificate for $DOMAIN_NAME not found"
    fi

    # Test 8: PM2 status
    if pm2 list | grep -q "medical-transcription"; then
        log_success "✓ PM2 application is running"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ PM2 application is not running"
    fi

    log_info "Tests completed: $tests_passed/$total_tests passed"

    if [ $tests_passed -eq $total_tests ]; then
        log_success "🎉 All tests passed! Deployment successful."
    else
        log_warning "⚠ Some tests failed. Please check the errors above."
        log_info "Some services may still be starting up. Wait a few minutes and check again."
    fi
}

show_completion_summary() {
    echo
    echo "==============================================="
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "==============================================="
    echo
    log_success "Your Self-Hosted Medical Transcription System is ready!"
    echo
    echo "🌐 **Main Application**: https://$DOMAIN_NAME"
    echo "🏠 **Supabase Dashboard**: https://$SUPABASE_SUBDOMAIN"
    echo "🤖 **n8n Dashboard**: https://$N8N_SUBDOMAIN"
    echo "🗄️ **Database**: Self-hosted PostgreSQL"
    echo
    log_info "🔐 Access Credentials:"
    echo "   Supabase Dashboard Username: $DASHBOARD_USERNAME"
    echo "   Supabase Dashboard Password: $DASHBOARD_PASSWORD"
    echo "   n8n Username: admin"
    echo "   n8n Password: $(grep N8N_BASIC_AUTH_PASSWORD /home/n8n/.n8n/.env | cut -d'=' -f2)"
    echo
    log_info "📋 Next Steps:"
    echo "1. 🌐 Visit https://$DOMAIN_NAME and create your first admin account"
    echo "2. 🏠 Go to https://$SUPABASE_SUBDOMAIN to access your database dashboard"
    echo "3. 🤖 Visit https://$N8N_SUBDOMAIN to configure workflows"
    echo "4. 📝 Import the medical transcription workflow (n8n-medical-workflow-gemini.json)"
    echo "5. 🔧 Configure API credentials in n8n (OpenAI, Gemini)"
    echo "6. 🧪 Test the complete transcription workflow"
    echo
    log_info "🛠️ Useful Commands:"
    echo "   Check status: pm2 status && docker ps"
    echo "   View app logs: pm2 logs medical-transcription"
    echo "   View Supabase logs: cd $SUPABASE_DIR/docker && docker-compose logs -f"
    echo "   View n8n logs: sudo journalctl -u n8n -f"
    echo "   Restart app: pm2 restart medical-transcription"
    echo "   Restart Supabase: cd $SUPABASE_DIR/docker && docker-compose restart"
    echo "   Restart n8n: sudo systemctl restart n8n"
    echo "   Check nginx: sudo systemctl status nginx"
    echo
    log_info "📊 Monitoring:"
    echo "   Application logs: /var/log/medical-transcription/"
    echo "   Supabase logs: $SUPABASE_DIR/docker/logs/"
    echo "   n8n logs: sudo journalctl -u n8n -f"
    echo "   System monitoring: htop, iotop"
    echo
    log_info "🔄 Backups:"
    echo "   Daily backups run at 3 AM (Supabase) and 4 AM (Application)"
    echo "   Backup location: /var/backups/"
    echo
    log_warning "⚠️ Important Security Notes:"
    echo "   - Change default passwords immediately"
    echo "   - Keep API keys secure and rotate regularly"
    echo "   - Monitor server resources regularly"
    echo "   - Keep system and applications updated"
    echo "   - Review firewall rules and access controls"
    echo
    log_info "📞 Support & Resources:"
    echo "   - Supabase Self-Hosting: Check SUPABASE_SELF_HOSTED_GUIDE.md"
    echo "   - n8n Documentation: https://docs.n8n.io"
    echo "   - Docker Documentation: https://docs.docker.com"
    echo "   - PostgreSQL Docs: https://postgresql.org/docs"
    echo
    echo "==============================================="
    echo "🚀 Your self-hosted system is ready for production!"
    echo "==============================================="
}

main() {
    echo "==============================================="
    echo "🩺 Self-Hosted Medical Transcription System Deployment"
    echo "==============================================="
    echo
    log_info "This script will set up your complete medical transcription system with:"
    echo "  ✅ Self-hosted Supabase (Database & Auth)"
    echo "  ✅ Next.js Application (Frontend)"
    echo "  ✅ n8n Workflow Engine (AI Processing)"
    echo "  ✅ Nginx Reverse Proxy (SSL & Load Balancing)"
    echo "  ✅ Automated Backups & Monitoring"
    echo
    log_warning "Make sure you have updated the configuration variables at the top of this script!"
    log_warning "Also ensure your domain DNS points to this VPS IP address."
    echo

    check_root
    validate_config

    read -p "Are you ready to start the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled. Please update the configuration and try again."
        exit 1
    fi

    echo
    log_progress "Starting deployment process..."
    echo

    update_system
    configure_firewall
    install_docker
    install_nodejs
    install_nginx
    setup_supabase
    setup_database
    install_n8n
    configure_nginx
    setup_ssl
    deploy_application
    setup_monitoring
    test_deployment
    show_completion_summary
}

# Run main function
main "$@"
