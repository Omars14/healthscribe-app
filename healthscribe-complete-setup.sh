#!/bin/bash

# HealthScribe.Pro - Complete Setup Script
# Run this on your VPS: 154.26.155.207
# Domain: healthscribe.pro

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
DOMAIN_NAME="healthscribe.pro"
SUPABASE_SUBDOMAIN="supabase.healthscribe.pro"
N8N_SUBDOMAIN="n8n.healthscribe.pro"
EMAIL="admin@healthscribe.pro"

# Auto-generated passwords
POSTGRES_PASSWORD="HealthScribe_$(openssl rand -hex 8)"
JWT_SECRET="$(openssl rand -base64 32)"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(openssl rand -hex 32).$(openssl rand -hex 16)"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.$(openssl rand -hex 32).$(openssl rand -hex 16)"

# Project paths
PROJECT_DIR="/var/www/healthscribe"
SUPABASE_DIR="/opt/supabase"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${PURPLE}[STEP]${NC} $1"; }

show_header() {
    echo "==============================================="
    echo "🩺 HealthScribe.Pro - Complete Setup"
    echo "==============================================="
    echo "Domain: $DOMAIN_NAME"
    echo "VPS IP: 154.26.155.207"
    echo "==============================================="
}

update_system() {
    log_step "Step 1: Updating System"
    apt update && apt upgrade -y
    apt install -y curl wget git unzip software-properties-common ufw htop iotop sysstat
    log_success "System updated"
}

install_docker() {
    log_step "Step 2: Installing Docker"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    log_success "Docker installed"
}

install_nodejs() {
    log_step "Step 3: Installing Node.js"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    npm install -g pm2
    log_success "Node.js and PM2 installed"
}

install_nginx() {
    log_step "Step 4: Installing Nginx"
    apt install -y nginx certbot python3-certbot-nginx
    systemctl enable nginx
    systemctl start nginx
    log_success "Nginx installed"
}

configure_firewall() {
    log_step "Step 5: Configuring Firewall"
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 5432
    ufw allow 9000
    echo "y" | ufw --force enable
    log_success "Firewall configured"
}

setup_supabase() {
    log_step "Step 6: Setting up Supabase"
    
    mkdir -p $SUPABASE_DIR
    cd $SUPABASE_DIR
    
    git clone https://github.com/supabase/supabase
    cd supabase/docker
    
    # Create environment file
    cat > .env << EOF
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
JWT_SECRET=$JWT_SECRET
SUPABASE_PUBLIC_URL=https://$SUPABASE_SUBDOMAIN
API_EXTERNAL_URL=https://$SUPABASE_SUBDOMAIN
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=HealthScribe2025!
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=http://localhost:9000
STORAGE_S3_BUCKET=healthscribe-bucket
EOF

    # Start Supabase
    docker-compose up -d
    
    # Wait for services
    log_info "Waiting for Supabase to initialize..."
    sleep 60
    
    # Create medical transcription database
    docker-compose exec -T db psql -U postgres -c "CREATE DATABASE medical_transcription;" 2>/dev/null || true
    
    log_success "Supabase setup complete"
}

install_n8n() {
    log_step "Step 7: Installing n8n"
    
    npm install -g n8n
    
    # Create n8n user
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

    # Create n8n environment
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
N8N_BASIC_AUTH_PASSWORD=HealthScribe2025!
EXECUTIONS_PROCESS=main
EXECUTIONS_TIMEOUT=3600
N8N_LOG_LEVEL=info
EOF

    chown n8n:n8n /home/n8n/.n8n/.env
    
    systemctl daemon-reload
    systemctl enable n8n
    systemctl start n8n
    
    log_success "n8n installed"
}

configure_nginx_sites() {
    log_step "Step 8: Configuring Nginx Sites"
    
    # Main application
    cat > /etc/nginx/sites-available/healthscribe << EOF
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
}
EOF

    # Supabase
    cat > /etc/nginx/sites-available/supabase << EOF
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

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # n8n
    cat > /etc/nginx/sites-available/n8n << EOF
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

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable sites
    ln -sf /etc/nginx/sites-available/healthscribe /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t
    systemctl reload nginx
    
    log_success "Nginx sites configured"
}

setup_ssl() {
    log_step "Step 9: Setting up SSL Certificates"
    
    certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive
    certbot --nginx -d $SUPABASE_SUBDOMAIN --email $EMAIL --agree-tos --non-interactive  
    certbot --nginx -d $N8N_SUBDOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL certificates installed"
}

setup_application() {
    log_step "Step 10: Setting up Application Directory"
    
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR
    
    # Create environment file
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_SUBDOMAIN
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# n8n Configuration
N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://$DOMAIN_NAME
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME

# API Keys (you'll need to add these)
DEEPGRAM_API_KEY=your-deepgram-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here

# File Upload Limits
MAX_FILE_SIZE=104857600
NODE_ENV=production
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF
    
    log_success "Application directory prepared"
}

setup_database_schema() {
    log_step "Step 11: Setting up Database Schema"
    
    cd $SUPABASE_DIR/supabase/docker
    
    # Create init script
    mkdir -p volumes/db/init
    
    cat > volumes/db/init/01-medical-transcription.sql << 'EOF'
\c medical_transcription;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'transcriptionist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  audio_file_url TEXT,
  transcription_text TEXT,
  formatted_text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  formatting_instructions TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO document_templates (document_type, display_name, formatting_instructions) VALUES
('consultation', 'Consultation Note', 'Format as a consultation note with: CHIEF COMPLAINT, HISTORY OF PRESENT ILLNESS, PAST MEDICAL HISTORY, MEDICATIONS, ALLERGIES, PHYSICAL EXAMINATION, ASSESSMENT, and PLAN sections.'),
('surgery_report', 'Surgery Report', 'Format as an operative report with: PREOPERATIVE DIAGNOSIS, POSTOPERATIVE DIAGNOSIS, PROCEDURE PERFORMED, SURGEON, ASSISTANT, ANESTHESIA, INDICATIONS, FINDINGS, TECHNIQUE, and ESTIMATED BLOOD LOSS sections.'),
('discharge_summary', 'Discharge Summary', 'Format with: ADMISSION DATE, DISCHARGE DATE, ADMITTING DIAGNOSIS, DISCHARGE DIAGNOSIS, HOSPITAL COURSE, DISCHARGE MEDICATIONS, DISCHARGE INSTRUCTIONS, and FOLLOW-UP sections.'),
('progress_note', 'Progress Note', 'Format as SOAP note with clear sections: SUBJECTIVE, OBJECTIVE, ASSESSMENT, and PLAN sections.')
ON CONFLICT (document_type) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files', 
  false,
  104857600,
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;
EOF
    
    # Restart to apply schema
    docker-compose restart
    sleep 30
    
    log_success "Database schema configured"
}

setup_backups() {
    log_step "Step 12: Setting up Backups"
    
    cat > /usr/local/bin/backup-healthscribe.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/healthscribe"
DATE=\$(date +%Y%m%d_%H%M%S)
mkdir -p \$BACKUP_DIR

# Backup Supabase
cd $SUPABASE_DIR/supabase/docker
docker-compose exec -T db pg_dump -U postgres medical_transcription > \$BACKUP_DIR/db_\$DATE.sql
tar -czf \$BACKUP_DIR/supabase_\$DATE.tar.gz ./volumes/

# Backup application
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz $PROJECT_DIR
tar -czf \$BACKUP_DIR/n8n_\$DATE.tar.gz /home/n8n/.n8n

echo "Backup completed: \$DATE"
EOF
    
    chmod +x /usr/local/bin/backup-healthscribe.sh
    
    # Daily backups at 3 AM
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-healthscribe.sh") | crontab -
    
    log_success "Backup system configured"
}

show_completion() {
    echo
    echo "==============================================="
    echo "🎉 HEALTHSCRIBE.PRO SETUP COMPLETE!"
    echo "==============================================="
    echo
    echo "🌐 Your URLs:"
    echo "   Main App: https://$DOMAIN_NAME"
    echo "   Supabase: https://$SUPABASE_SUBDOMAIN"
    echo "   n8n: https://$N8N_SUBDOMAIN"
    echo
    echo "🔐 Login Credentials:"
    echo "   Supabase: admin / HealthScribe2025!"
    echo "   n8n: admin / HealthScribe2025!"
    echo "   Database Password: $POSTGRES_PASSWORD"
    echo
    echo "📋 Next Steps:"
    echo "1. Clone your app to $PROJECT_DIR"
    echo "2. Add Deepgram & Gemini API keys to .env.local"
    echo "3. Configure n8n workflows"
    echo "4. Test the system"
    echo
    echo "🛠️ Useful Commands:"
    echo "   pm2 status"
    echo "   docker ps"
    echo "   systemctl status nginx n8n"
    echo
    echo "==============================================="
}

main() {
    show_header
    
    log_info "Starting HealthScribe.Pro setup..."
    
    update_system
    install_docker
    install_nodejs
    install_nginx
    configure_firewall
    setup_supabase
    install_n8n
    configure_nginx_sites
    setup_ssl
    setup_application
    setup_database_schema
    setup_backups
    
    show_completion
}

main "$@"
EOF
