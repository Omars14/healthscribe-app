#!/bin/bash

# Clean Database Migration Script - FIXED VERSION
# This script will set up a fresh self-hosted Supabase and migrate data cleanly

set -e

echo "🚀 Clean Database Migration for Medical Transcription System (FIXED)"
echo "=================================================================="

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
    print_info "Running on VPS - executing clean migration"
    IS_VPS=true
else
    print_info "This script should be run on your VPS"
    print_info "SSH to your VPS and run this script there"
    exit 1
fi

print_info "Step 1: Stopping existing services to start fresh"
systemctl stop healthscribe-app || true
systemctl stop supabase || true
systemctl stop nginx || true

print_info "Step 2: Cleaning up existing Supabase setup"
cd /opt/supabase/supabase/docker
docker-compose down -v || true
docker system prune -f || true

print_info "Step 3: Setting up fresh Supabase configuration"

# Generate new secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DASHBOARD_PASSWORD=$(openssl rand -base64 16)

# Create comprehensive Supabase environment with ALL required variables
cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=3600

# API Keys (using standard self-hosted keys)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Supabase Configuration
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# External URLs
SUPABASE_PUBLIC_URL=https://$SUPABASE_SUBDOMAIN
API_EXTERNAL_URL=https://$SUPABASE_SUBDOMAIN
SITE_URL=https://$SUPABASE_SUBDOMAIN

# Dashboard Configuration
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASSWORD
STUDIO_DEFAULT_ORGANIZATION=default
STUDIO_DEFAULT_PROJECT=default

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
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
DISABLE_SIGNUP=false
ENABLE_ANONYMOUS_USERS=false

# Mailer URLs
MAILER_URLPATHS_INVITE=https://$SUPABASE_SUBDOMAIN/auth/v1/verify
MAILER_URLPATHS_CONFIRMATION=https://$SUPABASE_SUBDOMAIN/auth/v1/verify
MAILER_URLPATHS_RECOVERY=https://$SUPABASE_SUBDOMAIN/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=https://$SUPABASE_SUBDOMAIN/auth/v1/verify
ADDITIONAL_REDIRECT_URLS=

# Additional Configuration
ENABLE_ANALYTICS=false
ENABLE_LOGS=true
LOG_LEVEL=info

# Logflare Configuration
LOGFLARE_PUBLIC_ACCESS_TOKEN=
LOGFLARE_PRIVATE_ACCESS_TOKEN=

# Kong Configuration
KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

# Database Pooler Configuration
POOLER_MAX_CLIENT_CONN=100
POOLER_DB_POOL_SIZE=15
POOLER_DEFAULT_POOL_SIZE=15
POOLER_TENANT_ID=default
POOLER_PROXY_PORT_TRANSACTION=5432

# Security Configuration
SECRET_KEY_BASE=$(openssl rand -base64 32)
VAULT_ENC_KEY=$(openssl rand -base64 32)

# Functions Configuration
FUNCTIONS_VERIFY_JWT=true

# Image Proxy Configuration
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Docker Configuration
DOCKER_SOCKET_LOCATION=/var/run/docker.sock

# PostgREST Configuration
PGRST_DB_SCHEMAS=public,graphql_public
EOF

print_info "Step 4: Creating simplified Docker Compose configuration"
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
      PGRST_DB_EXTRA_SEARCH_PATH: public,extensions
      PGRST_APP_SETTINGS_JWT_SECRET: \${JWT_SECRET}
      PGRST_APP_SETTINGS_JWT_EXP: 3600

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
      GOTRUE_DISABLE_SIGNUP: \${DISABLE_SIGNUP}
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: \${JWT_EXPIRY}
      GOTRUE_JWT_SECRET: \${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: \${ENABLE_EMAIL_SIGNUP}
      GOTRUE_MAILER_AUTOCONFIRM: \${ENABLE_EMAIL_AUTOCONFIRM}
      GOTRUE_SMTP_ADMIN_EMAIL: \${SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: \${SMTP_HOST}
      GOTRUE_SMTP_PORT: \${SMTP_PORT}
      GOTRUE_SMTP_USER: \${SMTP_USER}
      GOTRUE_SMTP_PASS: \${SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: \${SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: \${MAILER_URLPATHS_INVITE}
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: \${MAILER_URLPATHS_CONFIRMATION}
      GOTRUE_MAILER_URLPATHS_RECOVERY: \${MAILER_URLPATHS_RECOVERY}
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: \${MAILER_URLPATHS_EMAIL_CHANGE}

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
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub

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
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_DNS_STRATEGY: A
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
      STUDIO_DEFAULT_ORGANIZATION: \${STUDIO_DEFAULT_ORGANIZATION}
      STUDIO_DEFAULT_PROJECT: \${STUDIO_DEFAULT_PROJECT}
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

print_info "Step 5: Creating Kong configuration"
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
  - name: auth-v1-open-callback
    url: http://auth:9999/callback
    routes:
      - name: auth-v1-open-callback
        strip_path: true
        paths:
          - /auth/v1/callback
    plugins:
      - name: cors
  - name: auth-v1-open-authorize
    url: http://auth:9999/authorize
    routes:
      - name: auth-v1-open-authorize
        strip_path: true
        paths:
          - /auth/v1/authorize
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
  - name: realtime-v1
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
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

print_info "Step 6: Creating fresh database initialization"
mkdir -p volumes/db/init
cat > volumes/db/init/01-init.sql << 'EOF'
-- Enable necessary extensions
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

-- Create transcriptions table if it doesn't exist
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Document templates are viewable by all authenticated users" ON document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own transcription edits" ON transcription_edits FOR SELECT TO authenticated USING (transcription_id IN (SELECT id FROM transcriptions WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own transcriptions" ON transcriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own transcriptions" ON transcriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own transcriptions" ON transcriptions FOR UPDATE TO authenticated USING (user_id = auth.uid());

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

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  104857600, -- 100MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Medical transcription database setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '✅ Tables created: user_profiles, reviews, document_templates, transcription_edits, transcription_metrics, transcriptions';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Row Level Security enabled';
  RAISE NOTICE '✅ 8 medical document templates inserted';
  RAISE NOTICE '✅ Storage bucket and policies configured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Start Supabase services';
  RAISE NOTICE '2. Migrate data from cloud Supabase';
  RAISE NOTICE '3. Test the database connection';
END $$;
EOF

print_info "Step 7: Starting fresh Supabase services"
docker-compose up -d

print_info "Step 8: Waiting for services to be ready"
sleep 30

print_info "Step 9: Checking service status"
docker-compose ps

print_info "Step 10: Testing Supabase connectivity"
curl -I http://localhost:8000/auth/v1/settings || print_warning "Auth service not ready yet"
curl -I http://localhost:8000/rest/v1/ || print_warning "REST service not ready yet"

print_info "Step 11: Updating application environment"
cd /opt/healthscribe/dashboard-next

# Update environment file with new Supabase URL
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://$SUPABASE_SUBDOMAIN
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
NEXT_PUBLIC_URL=https://$DOMAIN
NEXT_PUBLIC_API_URL=https://$DOMAIN
EOF

print_info "Step 12: Installing Node.js dependencies for migration"
npm install @supabase/supabase-js dotenv

print_status "Fresh Supabase setup completed!"
echo ""
echo "🎉 Clean Database Setup Complete!"
echo "================================"
echo ""
echo "📋 What's been set up:"
echo "  ✅ Fresh self-hosted Supabase instance"
echo "  ✅ Clean database schema with all tables"
echo "  ✅ Row Level Security policies"
echo "  ✅ Storage bucket for audio files"
echo "  ✅ Document templates"
echo "  ✅ Application environment updated"
echo ""
echo "📝 Next Steps:"
echo "  1. Run the data migration script to copy your data from cloud"
echo "  2. Test the database connection"
echo "  3. Start your application"
echo ""
echo "🔧 To migrate your data, run:"
echo "  cd /opt/healthscribe/dashboard-next"
echo "  node migrate-data-clean.js"
echo ""
echo "🚀 To start your application:"
echo "  systemctl start healthscribe-app"
echo "  systemctl start nginx"
echo ""
print_warning "Important: Make sure your DNS points to this VPS before testing!"




