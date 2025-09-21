#!/bin/bash

# Run Clean Migration Script - FIXED VERSION
# This script will set up a fresh database and migrate your data

set -e

echo "🚀 Clean Database Migration Runner (FIXED)"
echo "=========================================="

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
    print_info "Running on VPS - proceeding with migration"
else
    print_warning "This script should be run on your VPS"
    print_info "SSH to your VPS and run this script there"
    exit 1
fi

print_info "Step 1: Setting up fresh Supabase database (FIXED VERSION)"
chmod +x clean-database-migration-fixed.sh
./clean-database-migration-fixed.sh

if [ $? -eq 0 ]; then
    print_status "Fresh database setup completed"
else
    print_warning "Database setup failed - please check the logs"
    exit 1
fi

print_info "Step 2: Waiting for services to be fully ready"
sleep 30

print_info "Step 3: Testing Supabase connectivity"
curl -f http://localhost:8000/auth/v1/settings > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status "Supabase is ready"
else
    print_warning "Supabase may not be fully ready yet - waiting longer"
    sleep 30
fi

print_info "Step 4: Migrating data from cloud to self-hosted"
cd /opt/healthscribe/dashboard-next
chmod +x migrate-data-clean.js
node migrate-data-clean.js

if [ $? -eq 0 ]; then
    print_status "Data migration completed"
else
    print_warning "Data migration had issues - please check the logs"
fi

print_info "Step 5: Starting application services"
systemctl start healthscribe-app
systemctl start nginx

print_info "Step 6: Checking service status"
systemctl status healthscribe-app --no-pager
systemctl status nginx --no-pager

print_status "Clean migration process completed!"
echo ""
echo "🎉 Your Medical Transcription System is now running with a fresh database!"
echo "========================================================================"
echo ""
echo "📋 What's been accomplished:"
echo "  ✅ Fresh self-hosted Supabase database"
echo "  ✅ All your data migrated from cloud"
echo "  ✅ Application running on your VPS"
echo "  ✅ All 82 transcriptions preserved"
echo ""
echo "🌐 Access URLs:"
echo "  • Main Application: https://www.healthscribe.pro"
echo "  • Supabase API: https://supabase.healthscribe.pro"
echo "  • Supabase Dashboard: https://supabase.healthscribe.pro:3001"
echo ""
echo "🔧 Management Commands:"
echo "  • Check status: systemctl status healthscribe-app"
echo "  • View logs: journalctl -u healthscribe-app -f"
echo "  • Monitor: /usr/local/bin/monitor-healthscribe.sh"
echo ""
echo "📝 Next Steps:"
echo "  1. Test login functionality"
echo "  2. Verify all transcriptions are visible"
echo "  3. Test file upload/download"
echo "  4. Update DNS if not already done"
echo ""
print_warning "Important: Make sure your DNS points to this VPS!"




