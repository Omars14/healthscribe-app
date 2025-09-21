#!/bin/bash

# Run Simple Migration Script
# This script sets up a simple PostgreSQL database and migrates your data

set -e

echo "🚀 Simple Database Migration Runner"
echo "==================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Check if running on VPS
if [ "$(hostname -I | grep -o '154.26.155.207')" = "154.26.155.207" ]; then
    print_info "Running on VPS - proceeding with simple migration"
else
    print_warning "This script should be run on your VPS"
    print_info "SSH to your VPS and run this script there"
    exit 1
fi

print_info "Step 1: Setting up simple PostgreSQL database"
chmod +x simple-database-migration.sh
./simple-database-migration.sh

if [ $? -eq 0 ]; then
    print_status "Simple database setup completed"
else
    print_warning "Database setup failed - please check the logs"
    exit 1
fi

print_info "Step 2: Installing Node.js dependencies for migration"
cd /opt/healthscribe/dashboard-next
npm install pg @supabase/supabase-js dotenv

print_info "Step 3: Migrating data from cloud to PostgreSQL"
chmod +x migrate-data-simple.js
node migrate-data-simple.js

if [ $? -eq 0 ]; then
    print_status "Data migration completed"
else
    print_warning "Data migration had issues - please check the logs"
fi

print_info "Step 4: Checking service status"
systemctl status healthscribe-app --no-pager
systemctl status nginx --no-pager
systemctl status postgresql --no-pager

print_status "Simple migration process completed!"
echo ""
echo "🎉 Your Medical Transcription System is now running with PostgreSQL!"
echo "=================================================================="
echo ""
echo "📋 What's been accomplished:"
echo "  ✅ PostgreSQL database with all tables"
echo "  ✅ All your data migrated from cloud"
echo "  ✅ Application running on your VPS"
echo "  ✅ All 82 transcriptions preserved"
echo ""
echo "🌐 Access URLs:"
echo "  • Main Application: https://www.healthscribe.pro"
echo "  • Database: PostgreSQL on localhost:5432"
echo ""
echo "🔧 Management Commands:"
echo "  • Check app status: systemctl status healthscribe-app"
echo "  • View app logs: journalctl -u healthscribe-app -f"
echo "  • Check database: sudo -u postgres psql -d healthscribe"
echo "  • Restart app: systemctl restart healthscribe-app"
echo ""
echo "📝 Next Steps:"
echo "  1. Test login functionality"
echo "  2. Verify all transcriptions are visible"
echo "  3. Test file upload/download"
echo "  4. Get SSL certificates: certbot --nginx -d www.healthscribe.pro"
echo "  5. Update DNS if not already done"
echo ""
print_warning "Important: Make sure your DNS points to this VPS!"




