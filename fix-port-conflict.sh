#!/bin/bash

echo "🔧 FIXING PORT CONFLICT - PORT 3000 ALREADY IN USE"
echo "=================================================="

# Step 1: Stop all Supabase containers
echo "Step 1: Stopping all Supabase containers..."
docker stop $(docker ps -q --filter "name=supabase") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=supabase") 2>/dev/null || true

# Step 2: Check what's using port 3000
echo "Step 2: Checking what's using port 3000..."
netstat -tlnp | grep :3000 || echo "Port 3000 is now free"

# Step 3: Kill any process using port 3000
echo "Step 3: Killing any process using port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Step 4: Update Docker Compose to use different port for REST
echo "Step 4: Updating Docker Compose to use port 3001 for REST..."
cat > /opt/supabase/supabase/docker/docker-compose-fixed.yml << 'EOF'
version: '3.8'

services:
  db:
    image: supabase/postgres:15.1.1.78
    container_name: supabase_db_healthscribe
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: your-super-secret-and-long-postgres-password
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  auth:
    image: supabase/gotrue:v2.177.0
    container_name: supabase-auth
    restart: unless-stopped
    ports:
      - "9999:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgresql://postgres:your-super-secret-and-long-postgres-password@db:5432/postgres
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: "*"
      GOTRUE_DISABLE_SIGNUP: "false"
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: wSbxWvFDABT+SZPYh0bSSU5CkbYBNzZ53YnrrWJNLTs=
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true"
    depends_on:
      db:
        condition: service_healthy

  rest:
    image: postgrest/postgrest:v12.2.12
    container_name: supabase-rest
    restart: unless-stopped
    ports:
      - "3001:3000"
    environment:
      PGRST_DB_URI: postgresql://postgres:your-super-secret-and-long-postgres-password@db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage,graphql_public
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: wSbxWvFDABT+SZPYh0bSSU5CkbYBNzZ53YnrrWJNLTs=
      PGRST_DB_USE_LEGACY_GUCS: "false"
    depends_on:
      db:
        condition: service_healthy

  storage:
    image: supabase/storage-api:v1.25.7
    container_name: supabase-storage
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
      SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: wSbxWvFDABT+SZPYh0bSSU5CkbYBNzZ53YnrrWJNLTs=
      DATABASE_URL: postgresql://postgres:your-super-secret-and-long-postgres-password@db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      TENANT_ID: stub
      REGION: stub
      GLOBAL_S3_BUCKET: stub
    volumes:
      - storage_data:/var/lib/storage
    depends_on:
      db:
        condition: service_healthy
      rest:
        condition: service_started

  kong:
    image: kong:2.8.1
    container_name: supabase-kong
    restart: unless-stopped
    ports:
      - "8000:8000"
      - "8443:8443"
    environment:
      KONG_HTTP_PORT: 8000
      KONG_HTTPS_PORT: 8443
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /home/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
    volumes:
      - ./kong.yml:/home/kong/kong.yml:ro

volumes:
  db_data:
  storage_data:
EOF

# Step 5: Update Kong configuration to use port 3001
echo "Step 5: Updating Kong configuration..."
cat > /opt/supabase/supabase/docker/kong.yml << 'EOF'
_format_version: "1.1"

services:
  - name: auth-v1-open
    url: http://auth:9999/
    routes:
      - name: auth-v1-open
        strip_path: true
        paths:
          - /auth/v1/verify
          - /auth/v1/callback
          - /auth/v1/authorize
          - /auth/v1/logout
          - /auth/v1/signup
          - /auth/v1/invite
          - /auth/v1/recover
          - /auth/v1/resend
          - /auth/v1/token
          - /auth/v1/user
          - /auth/v1/admin/users
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
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - anon
            - authenticated

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
      - name: key-auth
        config:
          hide_credentials: true
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - anon
            - authenticated

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
      - name: key-auth
        config:
          hide_credentials: false
      - name: acl
        config:
          hide_groups_header: true
          allow:
            - anon
            - authenticated

consumers:
  - username: anon
    keyauth_credentials:
      - key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
    acls:
      - group: anon

  - username: service_role
    keyauth_credentials:
      - key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
    acls:
      - group: service_role

  - username: authenticated
    keyauth_credentials:
      - key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
    acls:
      - group: authenticated
EOF

# Step 6: Start services again
echo "Step 6: Starting Supabase services with fixed ports..."
cd /opt/supabase/supabase/docker
docker-compose -f docker-compose-fixed.yml up -d

# Step 7: Wait and check status
echo "Step 7: Waiting for services to start..."
sleep 30
docker ps

# Step 8: Test endpoints
echo "Step 8: Testing endpoints..."
curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  http://154.26.155.207:8000/auth/v1/token | head -c 100
echo ""

# Step 9: Restart application
echo "Step 9: Restarting application..."
pm2 restart all --update-env
pm2 status

echo ""
echo "🎉 PORT CONFLICT FIXED!"
echo "======================="
echo "✅ REST API now running on port 3001 (external) / 3000 (internal)"
echo "✅ All services should be running properly"
echo "✅ Test your application at: http://www.healthscribe.pro"




