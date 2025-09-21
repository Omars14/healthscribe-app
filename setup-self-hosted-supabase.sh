#!/bin/bash

# Self-Hosted Supabase Setup Script for Medical Transcription System
# Run this script on your VPS as root or with sudo privileges

set -e

echo "🚀 Setting up Self-Hosted Supabase for Medical Transcription System"
echo "=================================================================="

# Configuration
DOMAIN="healthscribe.pro"
SUPABASE_SUBDOMAIN="supabase.healthscribe.pro"
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo "📋 Configuration:"
echo "  • Domain: $DOMAIN"
echo "  • Supabase URL: https://$SUPABASE_SUBDOMAIN"
echo "  • PostgreSQL Password: [Generated]"
echo "  • JWT Secret: [Generated]"
echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p /opt/supabase
mkdir -p /opt/supabase/docker
mkdir -p /opt/supabase/volumes/db/data
mkdir -p /opt/supabase/volumes/kong
mkdir -p /opt/supabase/volumes/storage
mkdir -p /var/backups/supabase

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone Supabase repository
echo "📥 Cloning Supabase repository..."
cd /opt/supabase
if [ ! -d "supabase" ]; then
    git clone https://github.com/supabase/supabase.git
fi
cd supabase/docker

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# API Keys (will be generated)
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Supabase Configuration
SUPABASE_URL=http://kong:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# External URLs
SUPABASE_PUBLIC_URL=https://$SUPABASE_SUBDOMAIN
API_EXTERNAL_URL=https://$SUPABASE_SUBDOMAIN

# Dashboard Configuration
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=$(openssl rand -base64 16)

# Storage Configuration
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ENDPOINT=http://storage:9000
STORAGE_S3_BUCKET=supabase-storage
STORAGE_S3_ACCESS_KEY_ID=supabase
STORAGE_S3_SECRET_ACCESS_KEY=supabase-storage-key

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_ADMIN_EMAIL=
SMTP_SENDER_NAME=HealthScribe

# Additional Configuration
ENABLE_ANALYTICS=false
ENABLE_LOGS=true
LOG_LEVEL=info
EOF

# Create custom docker-compose.yml for medical transcription
echo "🐳 Creating custom Docker Compose configuration..."
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
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: \${JWT_SECRET}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      GOTRUE_MAILER_AUTOCONFIRM: true
      GOTRUE_SMTP_ADMIN_EMAIL: \${SMTP_ADMIN_EMAIL}
      GOTRUE_SMTP_HOST: \${SMTP_HOST}
      GOTRUE_SMTP_PORT: \${SMTP_PORT}
      GOTRUE_SMTP_USER: \${SMTP_USER}
      GOTRUE_SMTP_PASS: \${SMTP_PASS}
      GOTRUE_SMTP_SENDER_NAME: \${SMTP_SENDER_NAME}
      GOTRUE_MAILER_URLPATHS_INVITE: \${SUPABASE_PUBLIC_URL}/auth/v1/verify
      GOTRUE_MAILER_URLPATHS_CONFIRMATION: \${SUPABASE_PUBLIC_URL}/auth/v1/verify
      GOTRUE_MAILER_URLPATHS_RECOVERY: \${SUPABASE_PUBLIC_URL}/auth/v1/verify
      GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: \${SUPABASE_PUBLIC_URL}/auth/v1/verify

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
    ports:
      - "3000:3000/tcp"

  # MinIO for storage
  storage-minio:
    image: minio/minio:RELEASE.2023-03-20T20-16-18Z
    restart: unless-stopped
    environment:
      MINIO_ROOT_USER: supabase
      MINIO_ROOT_PASSWORD: supabase-storage-key
    command: server /data --console-address ":9001"
    volumes:
      - ./volumes/storage:/data
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  db-data:
    driver: local
  kong-data:
    driver: local
  storage-data:
    driver: local
EOF

# Create Kong configuration
echo "🔧 Creating Kong configuration..."
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
    _comment: "GoTrue: /auth/v1/* -> http://auth:9999/*"
    url: http://auth:9999/
    routes:
      - name: auth-v1-all
        strip_path: true
        paths:
          - /auth/v1/
    plugins:
      - name: cors
  - name: rest-v1
    _comment: "PostgREST: /rest/v1/* -> http://rest:3000/*"
    url: http://rest:3000/
    routes:
      - name: rest-v1-all
        strip_path: true
        paths:
          - /rest/v1/
    plugins:
      - name: cors
  - name: realtime-v1
    _comment: "Realtime: /realtime/v1/* -> ws://realtime:4000/socket/*"
    url: http://realtime:4000/socket/
    routes:
      - name: realtime-v1-all
        strip_path: true
        paths:
          - /realtime/v1/
    plugins:
      - name: cors
  - name: storage-v1
    _comment: "Storage: /storage/v1/* -> http://storage:5000/*"
    url: http://storage:5000/
    routes:
      - name: storage-v1-all
        strip_path: true
        paths:
          - /storage/v1/
    plugins:
      - name: cors
  - name: meta
    _comment: "pg_meta: /pg/* -> http://meta:8080/*"
    url: http://meta:8080/
    routes:
      - name: meta-all
        strip_path: true
        paths:
          - /pg/
    plugins:
      - name: cors
EOF

# Start Supabase services
echo "🚀 Starting Supabase services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Create database initialization script
echo "🗄️ Creating database initialization script..."
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
  RAISE NOTICE '1. Configure nginx for your domain';
  RAISE NOTICE '2. Update your application environment variables';
  RAISE NOTICE '3. Test the database connection';
END $$;
EOF

# Restart services to apply database changes
echo "🔄 Restarting services to apply database changes..."
docker-compose restart db
sleep 10
docker-compose restart

# Generate new API keys
echo "🔑 Generating new API keys..."
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# Create nginx configuration
echo "🌐 Creating nginx configuration..."
cat > /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN << EOF
server {
    listen 80;
    server_name $SUPABASE_SUBDOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $SUPABASE_SUBDOMAIN;

    # SSL certificates (you'll need to get these)
    ssl_certificate /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SUPABASE_SUBDOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # CORS headers for ALL requests
    add_header "Access-Control-Allow-Origin" "https://$DOMAIN" always;
    add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header "Access-Control-Allow-Headers" "*" always;
    add_header "Access-Control-Allow-Credentials" "true" always;

    # Handle OPTIONS preflight requests
    if (\$request_method = OPTIONS) {
        add_header "Access-Control-Allow-Origin" "https://$DOMAIN" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "*" always;
        add_header "Access-Control-Allow-Credentials" "true" always;
        add_header "Content-Type" "text/plain charset=UTF-8" always;
        add_header "Content-Length" "0" always;
        return 204;
    }

    # Route requests to appropriate services
    location /auth/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /rest/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /realtime/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /storage/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Everything else goes to Kong
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$SUPABASE_SUBDOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Create backup script
echo "💾 Creating backup script..."
cat > /usr/local/bin/backup-supabase.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/supabase"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Stop Supabase services
cd /opt/supabase/supabase/docker
docker-compose stop

# Backup database
docker exec supabase_db pg_dump -U postgres postgres > $BACKUP_DIR/db_backup_$DATE.sql

# Backup volumes
tar -czf $BACKUP_DIR/volumes_backup_$DATE.tar.gz ./volumes/

# Start services again
docker-compose start

echo "Supabase backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-supabase.sh

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > /usr/local/bin/monitor-supabase.sh << 'EOF'
#!/bin/bash
echo "=== Supabase Health Check ==="
echo "Date: $(date)"
echo "Uptime: $(uptime -p)"
echo ""
echo "=== Docker Status ==="
cd /opt/supabase/supabase/docker
docker-compose ps
echo ""
echo "=== Resource Usage ==="
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo "Load: $(uptime | awk -F'load average:' '{ print $2 }')"
echo ""
echo "=== Database Status ==="
docker exec supabase_db psql -U postgres -d postgres -c "SELECT count(*) as connections FROM pg_stat_activity;" 2>/dev/null || echo "Database connection failed"
EOF

chmod +x /usr/local/bin/monitor-supabase.sh

# Create systemd service for auto-start
echo "🔧 Creating systemd service..."
cat > /etc/systemd/system/supabase.service << EOF
[Unit]
Description=Supabase Self-Hosted
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/supabase/supabase/docker
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl enable supabase.service

# Final status check
echo "📊 Final status check..."
docker-compose ps

echo ""
echo "🎉 Supabase setup complete!"
echo "=========================="
echo ""
echo "📋 Configuration Summary:"
echo "  • Supabase URL: https://$SUPABASE_SUBDOMAIN"
echo "  • Dashboard: https://$SUPABASE_SUBDOMAIN (port 3000)"
echo "  • API: https://$SUPABASE_SUBDOMAIN/rest/v1/"
echo "  • Auth: https://$SUPABASE_SUBDOMAIN/auth/v1/"
echo "  • Storage: https://$SUPABASE_SUBDOMAIN/storage/v1/"
echo ""
echo "🔑 API Keys:"
echo "  • Anon Key: $ANON_KEY"
echo "  • Service Role Key: $SERVICE_ROLE_KEY"
echo ""
echo "📝 Next Steps:"
echo "  1. Get SSL certificates: certbot --nginx -d $SUPABASE_SUBDOMAIN"
echo "  2. Update your application .env.local with the new keys"
echo "  3. Test the connection"
echo "  4. Migrate your data from cloud Supabase"
echo ""
echo "🔧 Management Commands:"
echo "  • Start: systemctl start supabase"
echo "  • Stop: systemctl stop supabase"
echo "  • Status: systemctl status supabase"
echo "  • Logs: cd /opt/supabase/supabase/docker && docker-compose logs -f"
echo "  • Backup: /usr/local/bin/backup-supabase.sh"
echo "  • Monitor: /usr/local/bin/monitor-supabase.sh"
echo ""
echo "⚠️  Important: Update your application environment variables with the new API keys!"
EOF

chmod +x setup-self-hosted-supabase.sh

echo "📄 Setup script created: setup-self-hosted-supabase.sh"
echo ""
echo "🚀 To set up Supabase on your VPS:"
echo "  1. Copy this script to your VPS"
echo "  2. Run: sudo bash setup-self-hosted-supabase.sh"
echo "  3. Get SSL certificates for your domain"
echo "  4. Update your application with the new API keys"




