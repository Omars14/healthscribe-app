#!/bin/bash

# Simple Database Migration Script
# This script sets up a basic PostgreSQL database and migrates your data

set -e

echo "🚀 Simple Database Migration for Medical Transcription System"
echo "============================================================"

# Configuration
DOMAIN="www.healthscribe.pro"
SUPABASE_SUBDOMAIN="supabase.healthscribe.pro"
VPS_IP="154.26.155.207"

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

# Check if running on VPS
if [ "$(hostname -I | grep -o '154.26.155.207')" = "154.26.155.207" ]; then
    print_info "Running on VPS - executing simple migration"
    IS_VPS=true
else
    print_info "This script should be run on your VPS"
    print_info "SSH to your VPS and run this script there"
    exit 1
fi

print_info "Step 1: Installing PostgreSQL and required packages"
apt update
apt install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx

print_info "Step 2: Setting up PostgreSQL"
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE healthscribe;
CREATE USER healthscribe_user WITH ENCRYPTED PASSWORD 'healthscribe_password_2024';
GRANT ALL PRIVILEGES ON DATABASE healthscribe TO healthscribe_user;
ALTER USER healthscribe_user CREATEDB;
\q
EOF

print_info "Step 3: Creating database schema"
sudo -u postgres psql -d healthscribe << 'EOF'
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

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'transcriptionist',
  assigned_editor_id UUID,
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
  requested_by UUID NOT NULL,
  assigned_to UUID,
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
  transcription_id UUID,
  edited_text TEXT NOT NULL,
  edit_type VARCHAR(50),
  edited_by UUID,
  edit_reason TEXT,
  changes_made JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcription_metrics table
CREATE TABLE IF NOT EXISTS transcription_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID,
  metric_type VARCHAR(50),
  duration_ms INTEGER,
  document_type VARCHAR(100),
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT,
  doctor_name TEXT,
  patient_name TEXT,
  document_type TEXT,
  transcription_text TEXT,
  user_id UUID,
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
  transcriptionist_id UUID,
  formatted_text TEXT,
  formatting_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
  formatting_prompt TEXT,
  is_formatted BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  final_text TEXT,
  version INTEGER DEFAULT 1
);

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
CREATE INDEX IF NOT EXISTS idx_status_formatted ON transcriptions(upload_status, is_formatted);
CREATE INDEX IF NOT EXISTS idx_transcription_edits_id ON transcription_edits(transcription_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON transcription_metrics(metric_type, created_at);

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

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO healthscribe_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO healthscribe_user;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Medical transcription database setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '✅ Tables created: user_profiles, reviews, document_templates, transcription_edits, transcription_metrics, transcriptions';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ 8 medical document templates inserted';
  RAISE NOTICE '✅ Database user and permissions configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Migrate data from cloud database';
  RAISE NOTICE '2. Test the database connection';
  RAISE NOTICE '3. Start your application';
END $$;
EOF

print_info "Step 4: Setting up nginx"
# Create nginx configuration for your app
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

    # Main application
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

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

print_info "Step 5: Setting up application environment"
cd /opt/healthscribe/dashboard-next

# Create environment file for PostgreSQL
cat > .env.local << EOF
# Database Configuration
DATABASE_URL=postgresql://healthscribe_user:healthscribe_password_2024@localhost:5432/healthscribe
POSTGRES_PASSWORD=healthscribe_password_2024
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user

# Application Configuration
NEXT_PUBLIC_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN
NODE_ENV=production

# Simple authentication (we'll use a basic approach)
NEXT_PUBLIC_USE_SIMPLE_AUTH=true
EOF

print_info "Step 6: Installing Node.js dependencies"
npm install

print_info "Step 7: Creating systemd service for your app"
cat > /etc/systemd/system/healthscribe-app.service << EOF
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

# Enable service
systemctl enable healthscribe-app.service

print_info "Step 8: Starting services"
systemctl start nginx
systemctl start healthscribe-app

print_status "Simple database setup completed!"
echo ""
echo "🎉 Simple Database Setup Complete!"
echo "================================="
echo ""
echo "📋 What's been set up:"
echo "  ✅ PostgreSQL database with all tables"
echo "  ✅ Database user and permissions"
echo "  ✅ Nginx configuration"
echo "  ✅ Application environment"
echo "  ✅ Systemd service"
echo ""
echo "📝 Next Steps:"
echo "  1. Run the data migration script to copy your data from cloud"
echo "  2. Test the database connection"
echo "  3. Get SSL certificates"
echo ""
echo "🔧 To migrate your data, run:"
echo "  cd /opt/healthscribe/dashboard-next"
echo "  node migrate-data-simple.js"
echo ""
echo "🔒 To get SSL certificates:"
echo "  certbot --nginx -d $DOMAIN"
echo ""
print_warning "Important: Make sure your DNS points to this VPS before testing!"




