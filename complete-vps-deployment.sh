#!/bin/bash

# Complete Medical Transcription System - VPS Deployment Script
# This script orchestrates the entire deployment process

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
N8N_SUBDOMAIN="n8n.your-domain.com"
EMAIL="your-email@example.com"
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_KEY=""
DEEPGRAM_API_KEY=""
GEMINI_API_KEY=""

# Project paths
PROJECT_DIR="/var/www/medical-transcription"
REPO_URL="https://github.com/your-username/dashboard-next.git"

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

    if [[ -z "$SUPABASE_URL" ]]; then
        log_error "SUPABASE_URL is not configured"
        errors=$((errors + 1))
    fi

    if [[ -z "$SUPABASE_ANON_KEY" ]]; then
        log_error "SUPABASE_ANON_KEY is not configured"
        errors=$((errors + 1))
    fi

    if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
        log_error "SUPABASE_SERVICE_KEY is not configured"
        errors=$((errors + 1))
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
    apt install -y curl wget git unzip software-properties-common ufw htop

    log_success "System updated successfully"
}

configure_firewall() {
    log_step "Step 2: Configuring Firewall"
    log_info "Setting up firewall rules..."

    ufw allow ssh
    ufw allow 'Nginx Full'
    echo "y" | ufw --force enable

    log_success "Firewall configured"
}

install_nodejs() {
    log_step "Step 3: Installing Node.js"
    log_info "Installing Node.js 18..."

    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs

    # Install PM2
    npm install -g pm2

    log_success "Node.js and PM2 installed"
}

install_nginx() {
    log_step "Step 4: Installing Nginx"
    log_info "Installing and configuring Nginx..."

    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx

    log_success "Nginx installed and started"
}

install_postgresql() {
    log_step "Step 5: Installing PostgreSQL"
    log_info "Setting up PostgreSQL database..."

    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql

    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE transcription_db;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER transcription_user WITH ENCRYPTED PASSWORD 'secure_password_2024';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE transcription_db TO transcription_user;" 2>/dev/null || true

    log_success "PostgreSQL installed and configured"
}

install_n8n() {
    log_step "Step 6: Installing n8n"
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
    log_step "Step 7: Configuring Nginx"
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
    ln -sf /etc/nginx/sites-available/$N8N_SUBDOMAIN /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    # Test configuration
    nginx -t
    systemctl reload nginx

    log_success "Nginx configured successfully"
}

setup_ssl() {
    log_step "Step 8: Setting up SSL Certificates"
    log_info "Installing Let's Encrypt certificates..."

    apt install -y certbot python3-certbot-nginx

    # Get certificates
    certbot --nginx -d $DOMAIN_NAME --email $EMAIL --agree-tos --non-interactive
    certbot --nginx -d $N8N_SUBDOMAIN --email $EMAIL --agree-tos --non-interactive

    # Set up auto-renewal
    (crontab -l ; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

    log_success "SSL certificates installed and auto-renewal configured"
}

deploy_application() {
    log_step "Step 9: Deploying Application"
    log_info "Setting up Next.js application..."

    # Create application directory
    mkdir -p $PROJECT_DIR
    cd $PROJECT_DIR

    # Clone or update repository
    if [ ! -d ".git" ]; then
        log_info "Cloning repository..."
        git clone $REPO_URL .
    else
        log_info "Updating repository..."
        git pull origin main
    fi

    # Install dependencies
    log_info "Installing dependencies..."
    npm install

    # Create environment file
    log_info "Creating environment configuration..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# n8n Configuration
N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://$DOMAIN_NAME
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME

# API Keys
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
    log_step "Step 10: Setting up Monitoring"
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

    # Create backup script
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

echo "Backup completed: \$DATE"
EOF

    chmod +x /usr/local/bin/backup-medical-transcription.sh

    # Set up daily backups
    (crontab -l ; echo "0 3 * * * /usr/local/bin/backup-medical-transcription.sh") | crontab -

    log_success "Monitoring and backup system configured"
}

test_deployment() {
    log_step "Step 11: Testing Deployment"
    log_info "Running deployment tests..."

    local tests_passed=0
    local total_tests=6

    # Test 1: Nginx configuration
    if nginx -t &>/dev/null; then
        log_success "✓ Nginx configuration is valid"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ Nginx configuration has errors"
    fi

    # Test 2: Application startup
    sleep 5
    if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
        log_success "✓ Next.js application is running"
        tests_passed=$((tests_passed + 1))
    else
        log_warning "⚠ Next.js application may not be responding yet"
    fi

    # Test 3: n8n startup
    if curl -s -I http://localhost:5678 | grep -q "200 OK"; then
        log_success "✓ n8n is running"
        tests_passed=$((tests_passed + 1))
    else
        log_warning "⚠ n8n may not be responding yet"
    fi

    # Test 4: SSL certificates
    if [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
        log_success "✓ SSL certificate for $DOMAIN_NAME is installed"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ SSL certificate for $DOMAIN_NAME not found"
    fi

    # Test 5: Services status
    if systemctl is-active --quiet nginx; then
        log_success "✓ Nginx service is active"
        tests_passed=$((tests_passed + 1))
    else
        log_error "✗ Nginx service is not active"
    fi

    # Test 6: PM2 status
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
    fi
}

show_completion_summary() {
    echo
    echo "==============================================="
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "==============================================="
    echo
    log_success "Your Medical Transcription System is now running on:"
    echo
    echo "🌐 **Main Application**: https://$DOMAIN_NAME"
    echo "🤖 **n8n Dashboard**: https://$N8N_SUBDOMAIN"
    echo "🗄️ **Database**: Supabase Cloud"
    echo
    log_info "🔐 Access Credentials:"
    echo "   n8n Username: admin"
    echo "   n8n Password: $(grep N8N_BASIC_AUTH_PASSWORD /home/n8n/.n8n/.env | cut -d'=' -f2)"
    echo
    log_info "📋 Next Steps:"
    echo "1. 🌐 Visit https://$DOMAIN_NAME and create an admin account"
    echo "2. 🤖 Go to https://$N8N_SUBDOMAIN to configure workflows"
    echo "3. 📝 Import the medical transcription workflow"
    echo "4. 🔧 Configure API credentials (OpenAI, Gemini)"
    echo "5. 🧪 Test the complete transcription workflow"
    echo
    log_info "🛠️ Useful Commands:"
    echo "   Check status: pm2 status"
    echo "   View logs: pm2 logs medical-transcription"
    echo "   Restart app: pm2 restart medical-transcription"
    echo "   Restart n8n: sudo systemctl restart n8n"
    echo "   Check nginx: sudo systemctl status nginx"
    echo
    log_info "📊 Monitoring:"
    echo "   Application logs: /var/log/medical-transcription/"
    echo "   n8n logs: sudo journalctl -u n8n -f"
    echo "   Nginx logs: sudo tail -f /var/log/nginx/access.log"
    echo
    log_info "🔄 Backups:"
    echo "   Daily backups run at 3 AM"
    echo "   Backup location: /var/backups/medical-transcription/"
    echo
    log_warning "⚠️ Important Security Notes:"
    echo "   - Change default n8n password immediately"
    echo "   - Keep API keys secure and rotate regularly"
    echo "   - Monitor server resources regularly"
    echo "   - Keep system and applications updated"
    echo
    log_info "📞 Support:"
    echo "   If you encounter issues:"
    echo "   1. Check the logs using the commands above"
    echo "   2. Verify all environment variables are set correctly"
    echo "   3. Ensure all services are running"
    echo "   4. Test network connectivity to external APIs"
    echo
    echo "==============================================="
    echo "🚀 Your system is ready for medical transcription!"
    echo "==============================================="
}

main() {
    echo "==============================================="
    echo "🩺 Medical Transcription System - Complete VPS Deployment"
    echo "==============================================="
    echo
    log_info "This script will set up your entire medical transcription system on this VPS."
    log_warning "Make sure you have updated the configuration variables at the top of this script!"
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
    install_nodejs
    install_nginx
    install_postgresql
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
