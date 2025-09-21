#!/bin/bash

# ============================================
# FRESH COMPLETE SUPABASE SETUP - FROM SCRATCH
# ============================================

set -e  # Exit on any error

echo "🧹 STEP 1: COMPLETE SYSTEM CLEANUP"
echo "=================================="

# Stop all services
echo "Stopping all services..."
sudo systemctl stop postgresql 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Remove all Docker containers and networks
echo "Removing all Docker containers and networks..."
sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || true
sudo docker network rm $(sudo docker network ls -q) 2>/dev/null || true
sudo docker system prune -af

# Kill any remaining processes
echo "Killing remaining processes..."
sudo pkill -9 postgres 2>/dev/null || true
sudo pkill -9 node 2>/dev/null || true

# Clean up any leftover files
echo "Cleaning up directories..."
sudo rm -rf /var/lib/postgresql/data
sudo rm -rf /tmp/supabase-*

echo "✅ System cleanup complete!"
echo ""

echo "🐘 STEP 2: FRESH POSTGRESQL SETUP"
echo "================================"

# Create PostgreSQL data directory
sudo mkdir -p /var/lib/postgresql/data
sudo chown -R 999:999 /var/lib/postgresql/data

# Start fresh PostgreSQL container
echo "Starting fresh PostgreSQL..."
sudo docker run -d \
  --name supabase-postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -v /var/lib/postgresql/data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15

# Wait for database to be ready
echo "Waiting for PostgreSQL to start..."
sleep 20

# Test connection
echo "Testing database connection..."
sudo docker exec supabase-postgres psql -U postgres -d postgres -c "SELECT version();"

echo "✅ PostgreSQL setup complete!"
echo ""

echo "🔧 STEP 3: CREATE DATABASE SCHEMA"
echo "================================"

# Create the complete schema
sudo docker exec -i supabase-postgres psql -U postgres -d postgres << 'EOF'
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set search path
SET search_path TO public;

-- Create auth schema and tables
CREATE SCHEMA IF NOT EXISTS auth;

-- Auth users table
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aud varchar(255),
    role varchar(255),
    email varchar(255) UNIQUE,
    encrypted_password varchar(255),
    email_confirmed_at timestamptz DEFAULT now(),
    invited_at timestamptz,
    confirmation_token varchar(255),
    confirmation_sent_at timestamptz,
    recovery_token varchar(255),
    recovery_sent_at timestamptz,
    email_change_token_new varchar(255),
    email_change varchar(255),
    email_change_sent_at timestamptz,
    last_sign_in_at timestamptz,
    app_metadata jsonb DEFAULT '{}'::jsonb,
    user_metadata jsonb DEFAULT '{}'::jsonb,
    is_super_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    phone varchar(255),
    phone_confirmed_at timestamptz,
    confirmed_at timestamptz,
    email_change_token_current varchar(255),
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamptz,
    reauthentication_token varchar(255),
    reauthentication_sent_at timestamptz
);

-- Auth identities table
CREATE TABLE IF NOT EXISTS auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    email text GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED,
    id text NOT NULL,
    PRIMARY KEY (provider, id)
);

-- Create application tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    role text DEFAULT 'transcriptionist',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transcriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    transcription_text text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own user data" ON auth.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own identities" ON auth.identities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create own transcriptions" ON public.transcriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transcriptions" ON public.transcriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
END
$$;

-- Create test admin user
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    role,
    app_metadata
) VALUES (
    'admin@healthscribe.pro',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    'authenticated',
    '{"role": "admin"}'
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT id, email, 'Admin User', 'admin'
FROM auth.users
WHERE email = 'admin@healthscribe.pro'
ON CONFLICT (id) DO NOTHING;

-- Create a simple user for testing
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    role
) VALUES (
    'test@healthscribe.pro',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT id, email, 'Test User', 'transcriptionist'
FROM auth.users
WHERE email = 'test@healthscribe.pro'
ON CONFLICT (id) DO NOTHING;

EOF

echo "✅ Database schema created!"
echo ""

echo "🌐 STEP 4: SETUP SUPABASE SERVICES"
echo "================================"

# Create Supabase config
cat > docker-compose.supabase.yml << 'EOF'
version: '3.8'

services:
  supabase-auth:
    image: supabase/gotrue:latest
    ports:
      - "9999:9999"
    environment:
      GOTRUE_SITE_URL: https://healthscribe.pro
      GOTRUE_API_EXTERNAL_URL: https://healthscribe.pro
      API_EXTERNAL_URL: https://healthscribe.pro
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:your_secure_password@host.docker.internal:5432/postgres
      GOTRUE_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      GOTRUE_JWT_EXP: 3600
      GOTRUE_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_EXTERNAL_EMAIL_ENABLED: true
      GOTRUE_SMTP_HOST: smtp.gmail.com
      GOTRUE_SMTP_PORT: 587
      GOTRUE_SMTP_USER: your-email@gmail.com
      GOTRUE_SMTP_PASS: your-app-password
      GOTRUE_SMTP_ADMIN_EMAIL: admin@healthscribe.pro
    depends_on:
      - supabase-postgres
    networks:
      - supabase-network
    restart: unless-stopped

  supabase-rest:
    image: postgrest/postgrest:latest
    ports:
      - "3000:3000"
    environment:
      PGRST_DB_URI: postgres://postgres:your_secure_password@host.docker.internal:5432/postgres
      PGRST_DB_SCHEMA: public,auth
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: your-super-secret-jwt-token-with-at-least-32-characters-long
      PGRST_OPENAPI_SERVER_PROXY_URI: https://healthscribe.pro
    depends_on:
      - supabase-postgres
    networks:
      - supabase-network
    restart: unless-stopped

  supabase-storage:
    image: supabase/storage-api:latest
    ports:
      - "8000:8000"
    environment:
      ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU
      SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.8c8VKr5yQ8KqhQzKJ8YQH8YQK8YQH8YQK8YQH8YQK8Y
      POSTGREST_URL: http://supabase-rest:3000
      DATABASE_URL: postgres://postgres:your_secure_password@host.docker.internal:5432/postgres
      PGOPTIONS: "-c search_path=storage,public"
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
    volumes:
      - ./storage:/var/lib/storage
    depends_on:
      - supabase-postgres
      - supabase-rest
    networks:
      - supabase-network
    restart: unless-stopped

networks:
  supabase-network:
    driver: bridge
EOF

# Start Supabase services
echo "Starting Supabase services..."
sudo docker-compose -f docker-compose.supabase.yml up -d

echo "✅ Supabase services started!"
echo ""

echo "🔒 STEP 5: CONFIGURE NGINX"
echo "========================="

# Create Nginx config for main site
cat > /etc/nginx/sites-available/healthscribe.pro << 'EOF'
server {
    listen 80;
    server_name healthscribe.pro www.healthscribe.pro;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name healthscribe.pro www.healthscribe.pro;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/healthscribe.pro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthscribe.pro/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Proxy to Next.js app
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Proxy Supabase auth
    location /auth/ {
        proxy_pass http://localhost:9999/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;

        # CORS headers for auth
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Proxy Supabase REST API
    location /rest/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;

        # CORS headers for REST API
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, apikey' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Proxy Supabase Storage
    location /storage/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;

        # CORS headers for storage
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type, Accept, apikey' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/healthscribe.pro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Nginx configured!"
echo ""

echo "🚀 STEP 6: DEPLOY APPLICATION"
echo "============================"

# Navigate to app directory
cd /var/www/healthscribe

# Update environment variables
cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://healthscribe.pro
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.8c8VKr5yQ8KqhQzKJ8YQH8YQK8YQH8YQK8YQH8YQK8Y

# Database (for direct connections if needed)
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/postgres

# JWT Secret (must match Supabase)
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# Next.js Configuration
NEXTAUTH_URL=https://healthscribe.pro
NEXTAUTH_SECRET=your-nextauth-secret-here

# Application Settings
NODE_ENV=production
EOF

# Install dependencies and build
npm install
npm run build

# Start the application with PM2
pm2 start npm --name "healthscribe" -- start
pm2 save
pm2 startup

echo "✅ Application deployed!"
echo ""

echo "🧪 STEP 7: FINAL TESTING"
echo "======================="

# Wait for services to be ready
echo "Waiting for all services to be ready..."
sleep 30

# Test database connection
echo "Testing database..."
sudo docker exec supabase-postgres psql -U postgres -d postgres -c "SELECT COUNT(*) FROM auth.users;"

# Test Supabase services
echo "Testing Supabase auth service..."
curl -k https://healthscribe.pro/auth/v1/health

echo "Testing Supabase REST API..."
curl -k "https://healthscribe.pro/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-Qwv8Hdp7fsn3W0YpN81IU"

# Test application
echo "Testing application..."
curl -k https://healthscribe.pro

echo ""
echo "🎉 FRESH SETUP COMPLETE!"
echo "======================="
echo ""
echo "Your application should now be accessible at:"
echo "🌐 https://healthscribe.pro"
echo ""
echo "Test accounts:"
echo "👤 admin@healthscribe.pro / password123"
echo "👤 test@healthscribe.pro / password123"
echo ""
echo "To check service status:"
echo "pm2 status"
echo "sudo docker ps"
echo ""
echo "To view logs:"
echo "pm2 logs healthscribe"
echo "sudo docker logs supabase-postgres"
echo "sudo docker logs supabase-auth"
echo "sudo docker logs supabase-rest"



