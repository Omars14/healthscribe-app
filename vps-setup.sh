#!/bin/bash

# Medical Transcription System - VPS Setup Script
# This script automates the initial VPS setup for Contabo deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables - Update these!
DOMAIN_NAME="your-domain.com"
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""
OPENAI_API_KEY=""
GEMINI_API_KEY=""

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

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

update_system() {
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    log_success "System updated successfully"
}

install_basics() {
    log_info "Installing basic tools..."
    apt install -y curl wget git unzip software-properties-common ufw htop
    log_success "Basic tools installed"
}

configure_firewall() {
    log_info "Configuring firewall..."
    ufw allow ssh
    ufw allow 'Nginx Full'
    echo "y" | ufw --force enable
    log_success "Firewall configured"
}

install_nodejs() {
    log_info "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    log_success "Node.js 18 installed"
}

install_pm2() {
    log_info "Installing PM2..."
    npm install -g pm2
    log_success "PM2 installed"
}

install_nginx() {
    log_info "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    log_success "Nginx installed and started"
}

install_postgresql() {
    log_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql

    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE transcription_db;" || true
    sudo -u postgres psql -c "CREATE USER transcription_user WITH ENCRYPTED PASSWORD 'secure_password_2024';" || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE transcription_db TO transcription_user;" || true

    log_success "PostgreSQL installed and configured"
}

install_n8n() {
    log_info "Installing n8n..."
    npm install -g n8n

    # Create n8n user
    useradd -m -s /bin/bash n8n || true
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

    systemctl daemon-reload
    systemctl enable n8n
    log_success "n8n installed and service created"
}

setup_ssl() {
    log_info "Installing Certbot for SSL..."
    apt install -y certbot python3-certbot-nginx

    log_warning "SSL certificates will be obtained after nginx configuration"
    log_info "Run the following commands after setup:"
    echo "sudo certbot --nginx -d $DOMAIN_NAME"
    echo "sudo certbot --nginx -d $N8N_SUBDOMAIN"
}

create_nginx_configs() {
    log_info "Creating Nginx configurations..."

    # Main application config
    cat > /etc/nginx/sites-available/medical-transcription << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

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

    # n8n subdomain config
    cat > /etc/nginx/sites-available/$N8N_SUBDOMAIN << EOF
server {
    listen 80;
    server_name $N8N_SUBDOMAIN;

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

    # Enable sites
    ln -sf /etc/nginx/sites-available/medical-transcription /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/$N8N_SUBDOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test nginx config
    nginx -t
    systemctl reload nginx

    log_success "Nginx configurations created and enabled"
}

create_env_file() {
    log_info "Creating environment configuration template..."

    cat > .env.local.template << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# n8n Configuration
N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://$DOMAIN_NAME

# File Upload Limits
MAX_FILE_SIZE=104857600

# API Keys (Configure these)
OPENAI_API_KEY=$OPENAI_API_KEY
GEMINI_API_KEY=$GEMINI_API_KEY
EOF

    log_success "Environment template created"
}

create_deployment_script() {
    log_info "Creating application deployment script..."

    cat > deploy-app.sh << 'EOF'
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Clone repository (replace with your repo URL)
REPO_URL="https://github.com/your-username/dashboard-next.git"
APP_DIR="/var/www/medical-transcription"

log_info "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

if [ ! -d ".git" ]; then
    log_info "Cloning repository..."
    git clone $REPO_URL .
fi

log_info "Installing dependencies..."
npm install

log_info "Copying environment file..."
cp .env.local.template .env.local
# Edit .env.local with your actual values
nano .env.local

log_info "Building application..."
npm run build

log_info "Starting with PM2..."
pm2 delete medical-transcription 2>/dev/null || true
pm2 start npm --name "medical-transcription" -- start
pm2 save
pm2 startup

log_success "Application deployed successfully!"
log_info "Application URL: https://your-domain.com"
EOF

    chmod +x deploy-app.sh
    log_success "Deployment script created"
}

main() {
    echo "==============================================="
    echo "🩺 Medical Transcription System - VPS Setup"
    echo "==============================================="

    check_root

    log_warning "Please update the configuration variables at the top of this script before running!"
    read -p "Have you updated the configuration variables? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Please update the variables and run again."
        exit 1
    fi

    update_system
    install_basics
    configure_firewall
    install_nodejs
    install_pm2
    install_nginx
    install_postgresql
    install_n8n
    setup_ssl
    create_nginx_configs
    create_env_file
    create_deployment_script

    echo
    echo "==============================================="
    log_success "VPS Setup Complete!"
    echo "==============================================="
    echo
    log_info "Next steps:"
    echo "1. Run SSL certificate setup:"
    echo "   sudo certbot --nginx -d $DOMAIN_NAME"
    echo "   sudo certbot --nginx -d $N8N_SUBDOMAIN"
    echo
    echo "2. Run the application deployment:"
    echo "   sudo ./deploy-app.sh"
    echo
    echo "3. Configure your n8n workflows"
    echo "4. Test the application"
    echo
    log_info "Don't forget to:"
    echo "- Update .env.local with your actual API keys"
    echo "- Configure your Supabase database"
    echo "- Set up monitoring and backups"
}

# Run main function
main "$@"
