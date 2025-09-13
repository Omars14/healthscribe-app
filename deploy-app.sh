#!/bin/bash

# Medical Transcription System - Application Deployment Script
# Run this after the VPS setup script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configuration
APP_DIR="/var/www/medical-transcription"
DOMAIN_NAME="your-domain.com"
N8N_SUBDOMAIN="n8n.your-domain.com"

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Run the VPS setup script first."
        exit 1
    fi

    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 is not installed. Run the VPS setup script first."
        exit 1
    fi

    if ! command -v nginx &> /dev/null; then
        log_error "Nginx is not installed. Run the VPS setup script first."
        exit 1
    fi

    log_success "All dependencies are installed"
}

setup_app_directory() {
    log_info "Setting up application directory..."

    mkdir -p $APP_DIR
    cd $APP_DIR

    # If directory is empty, clone repository
    if [ ! -d ".git" ] && [ ! -f "package.json" ]; then
        log_warning "No application found. Please either:"
        echo "1. Clone your repository to $APP_DIR"
        echo "2. Or copy your application files to $APP_DIR"
        echo "3. Or update the APP_DIR variable in this script"

        read -p "Have you placed the application files in $APP_DIR? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Please set up your application files and run this script again."
            exit 1
        fi
    fi

    log_success "Application directory ready"
}

install_dependencies() {
    log_info "Installing Node.js dependencies..."

    if [ -f "package.json" ]; then
        npm install
        log_success "Dependencies installed"
    else
        log_error "package.json not found. Make sure you're in the right directory."
        exit 1
    fi
}

configure_environment() {
    log_info "Configuring environment variables..."

    if [ ! -f ".env.local" ]; then
        log_warning ".env.local not found. Creating from template..."

        if [ -f ".env.local.template" ]; then
            cp .env.local.template .env.local
        else
            log_warning "No template found. Creating basic .env.local..."

            cat > .env.local << EOF
# Supabase Configuration (Update these!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Configuration
N8N_WEBHOOK_URL=https://$N8N_SUBDOMAIN/webhook/medical-transcribe-v2

# Application Settings
NEXT_PUBLIC_URL=https://$DOMAIN_NAME

# File Upload Limits
MAX_FILE_SIZE=104857600
EOF
        fi
    fi

    log_warning "Please edit .env.local with your actual configuration:"
    echo "nano .env.local"

    read -p "Have you configured .env.local with your API keys and settings? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Please configure your environment variables and run this script again."
        exit 1
    fi

    log_success "Environment configured"
}

build_application() {
    log_info "Building Next.js application..."

    npm run build

    if [ $? -eq 0 ]; then
        log_success "Application built successfully"
    else
        log_error "Build failed. Check the errors above."
        exit 1
    fi
}

start_with_pm2() {
    log_info "Starting application with PM2..."

    # Stop existing instance if running
    pm2 delete medical-transcription 2>/dev/null || true

    # Start new instance
    pm2 start npm --name "medical-transcription" -- start

    # Save PM2 configuration
    pm2 save

    # Set up PM2 to start on boot (if not already done)
    pm2 startup | grep -v "sudo" | bash || true

    log_success "Application started with PM2"
}

setup_n8n_service() {
    log_info "Setting up n8n service..."

    # Start n8n service
    systemctl enable n8n
    systemctl start n8n

    log_success "n8n service configured"
}

test_deployment() {
    log_info "Testing deployment..."

    # Wait a moment for services to start
    sleep 5

    # Test main application
    if curl -s -I http://localhost:3000 | grep -q "200 OK"; then
        log_success "Next.js application is running"
    else
        log_warning "Next.js application may not be responding correctly"
    fi

    # Test n8n
    if curl -s -I http://localhost:5678 | grep -q "200 OK"; then
        log_success "n8n is running"
    else
        log_warning "n8n may not be responding correctly"
    fi

    # Test nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
    else
        log_warning "Nginx is not running"
    fi
}

show_next_steps() {
    echo
    echo "==============================================="
    log_success "Deployment Complete!"
    echo "==============================================="
    echo
    log_info "Your application should be available at:"
    echo "🌐 Main App: https://$DOMAIN_NAME"
    echo "🤖 n8n Dashboard: https://$N8N_SUBDOMAIN"
    echo
    log_info "Next steps:"
    echo "1. 📝 Configure n8n workflows:"
    echo "   - Import your workflow from n8n-medical-workflow-gemini.json"
    echo "   - Set up API credentials (OpenAI, Gemini, Supabase)"
    echo
    echo "2. 🔧 Set up SSL certificates:"
    echo "   sudo certbot --nginx -d $DOMAIN_NAME"
    echo "   sudo certbot --nginx -d $N8N_SUBDOMAIN"
    echo
    echo "3. 🗄️ Configure your database:"
    echo "   - Run database migrations in Supabase"
    echo "   - Set up storage buckets"
    echo
    echo "4. 🧪 Test the application:"
    echo "   - Create a user account"
    echo "   - Upload a test audio file"
    echo "   - Check transcription workflow"
    echo
    log_info "Useful commands:"
    echo "📊 Check status: pm2 status"
    echo "📝 View logs: pm2 logs medical-transcription"
    echo "🔄 Restart app: pm2 restart medical-transcription"
    echo "🛑 Stop app: pm2 stop medical-transcription"
    echo
    log_warning "Remember to:"
    echo "- Set up regular backups"
    echo "- Monitor server resources"
    echo "- Keep dependencies updated"
    echo "- Configure firewall rules"
}

main() {
    echo "==============================================="
    echo "🚀 Medical Transcription - App Deployment"
    echo "==============================================="

    check_dependencies
    setup_app_directory
    install_dependencies
    configure_environment
    build_application
    start_with_pm2
    setup_n8n_service
    test_deployment
    show_next_steps
}

# Run main function
main "$@"
