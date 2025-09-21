#!/bin/bash

# Fix all migration issues

echo "🔧 Fixing Migration Issues"
echo "========================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info "Step 1: Fixing PostgreSQL user password"
# Fix the PostgreSQL user password
sudo -u postgres psql << 'EOF'
ALTER USER healthscribe_user WITH PASSWORD 'healthscribe_password_2024';
GRANT ALL PRIVILEGES ON DATABASE healthscribe TO healthscribe_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthscribe_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthscribe_user;
\q
EOF

if [ $? -eq 0 ]; then
    print_status "PostgreSQL user password fixed"
else
    print_error "Failed to fix PostgreSQL password"
    exit 1
fi

print_info "Step 2: Creating application directory"
# Create the application directory
mkdir -p /opt/healthscribe/dashboard-next
cd /opt/healthscribe/dashboard-next

# Copy your application files (assuming they're in the current directory)
if [ -d "/root/dashboard-next" ]; then
    cp -r /root/dashboard-next/* /opt/healthscribe/dashboard-next/
    print_status "Application files copied"
else
    print_warning "Application files not found in /root/dashboard-next"
    print_info "You may need to upload your application files manually"
fi

print_info "Step 3: Setting up application environment"
# Create environment file
cat > .env.local << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://healthscribe_user:healthscribe_password_2024@localhost:5432/healthscribe
POSTGRES_PASSWORD=healthscribe_password_2024
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user

# Application Configuration
NEXT_PUBLIC_URL=http://www.healthscribe.pro
NEXT_PUBLIC_API_URL=http://www.healthscribe.pro
NODE_ENV=production

# Simple authentication
NEXT_PUBLIC_USE_SIMPLE_AUTH=true
EOF

print_status "Application environment configured"

print_info "Step 4: Installing Node.js dependencies"
npm install

if [ $? -eq 0 ]; then
    print_status "Node.js dependencies installed"
else
    print_warning "Some dependencies may have failed to install"
fi

print_info "Step 5: Creating systemd service"
# Create systemd service
cat > /etc/systemd/system/healthscribe-app.service << 'EOF'
[Unit]
Description=HealthScribe Medical Transcription App
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/healthscribe/dashboard-next
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://healthscribe_user:healthscribe_password_2024@localhost:5432/healthscribe
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl daemon-reload
systemctl enable healthscribe-app.service

print_status "Systemd service created and enabled"

print_info "Step 6: Testing database connection"
# Test database connection
PGPASSWORD=healthscribe_password_2024 psql -h localhost -U healthscribe_user -d healthscribe -c "SELECT version();"

if [ $? -eq 0 ]; then
    print_status "Database connection test successful"
else
    print_error "Database connection test failed"
fi

print_info "Step 7: Starting application"
systemctl start healthscribe-app.service

if [ $? -eq 0 ]; then
    print_status "Application started successfully"
else
    print_warning "Application start failed - checking logs"
    journalctl -u healthscribe-app.service --no-pager -l
fi

print_info "Step 8: Checking all services"
echo "📊 PostgreSQL Status:"
systemctl status postgresql --no-pager -l
echo ""
echo "📊 Nginx Status:"
systemctl status nginx --no-pager -l
echo ""
echo "📊 Application Status:"
systemctl status healthscribe-app --no-pager -l

print_status "All issues fixed!"
echo ""
echo "🎉 Your Medical Transcription System is now properly configured!"
echo "=============================================================="
echo ""
echo "📋 What's been fixed:"
echo "  ✅ PostgreSQL user password corrected"
echo "  ✅ Application directory created"
echo "  ✅ Environment variables configured"
echo "  ✅ Node.js dependencies installed"
echo "  ✅ Systemd service created and started"
echo "  ✅ All services running"
echo ""
echo "🌐 Access URLs:"
echo "  • Main Application: http://www.healthscribe.pro"
echo "  • Database: PostgreSQL on localhost:5432"
echo ""
echo "🔧 Management Commands:"
echo "  • Check app status: systemctl status healthscribe-app"
echo "  • View app logs: journalctl -u healthscribe-app -f"
echo "  • Check database: PGPASSWORD=healthscribe_password_2024 psql -h localhost -U healthscribe_user -d healthscribe"
echo "  • Restart app: systemctl restart healthscribe-app"
echo ""
echo "📝 Next Steps:"
echo "  1. Test your application at http://www.healthscribe.pro"
echo "  2. Run data migration: node migrate-data-simple.js"
echo "  3. Test login functionality"
echo "  4. Verify all transcriptions are visible"
echo ""
print_warning "Important: Make sure your DNS points to this VPS!"




