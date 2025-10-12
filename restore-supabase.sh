#!/bin/bash
set -e

echo "============================================"
echo "STEP 1: Check Current State"
echo "============================================"

# Check if Supabase directory exists
if [ -d "/opt/supabase" ]; then
  echo "✅ Found /opt/supabase"
  cd /opt/supabase/docker
elif [ -d "/data/supabase" ]; then
  echo "✅ Found /data/supabase"
  cd /data/supabase/docker
else
  echo "❌ Supabase not found, will install..."
  
  echo ""
  echo "============================================"
  echo "STEP 2: Installing Supabase"
  echo "============================================"
  
  cd /opt
  git clone --depth 1 https://github.com/supabase/supabase
  cd supabase/docker
  
  echo "✅ Cloned Supabase repository"
fi

echo ""
echo "============================================"
echo "STEP 3: Configure Environment"
echo "============================================"

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  cp .env.example .env
  
  # Generate JWT secret
  JWT_SECRET=$(openssl rand -base64 32)
  
  # Update .env with proper values
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
  sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=Nomar123|" .env
  sed -i "s|SITE_URL=.*|SITE_URL=https://healthscribe.pro|" .env
  sed -i "s|API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://supabase.healthscribe.pro|" .env
  sed -i "s|SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=https://supabase.healthscribe.pro|" .env
  
  echo "✅ Created and configured .env"
else
  echo "✅ .env file exists"
fi

# Show current JWT secret for application config
JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d= -f2)
echo "JWT Secret: $JWT_SECRET"

echo ""
echo "============================================"
echo "STEP 4: Start Supabase Services"
echo "============================================"

# Stop any existing services
docker-compose down 2>/dev/null || true

# Start services
echo "Starting Supabase services..."
docker-compose up -d

echo "⏳ Waiting 30 seconds for services to start..."
sleep 30

echo ""
echo "============================================"
echo "STEP 5: Verify Services"
echo "============================================"

docker-compose ps

echo ""
echo "============================================"
echo "STEP 6: Check Auth Service"
echo "============================================"

# Wait for auth to be ready
for i in {1..10}; do
  if curl -s http://localhost:8000/auth/v1/health | grep -q "ok"; then
    echo "✅ Auth service is healthy!"
    break
  else
    echo "⏳ Waiting for auth service... ($i/10)"
    sleep 3
  fi
done

echo ""
echo "✅ Supabase restoration complete!"

# Get the JWT secret and anon key
echo ""
echo "============================================"
echo "IMPORTANT: APPLICATION CONFIGURATION"
echo "============================================"

ANON_KEY=$(grep "ANON_KEY=" .env | cut -d= -f2)
SERVICE_KEY=$(grep "SERVICE_ROLE_KEY=" .env | cut -d= -f2)

echo ""
echo "Update your application .env.local with:"
echo "NEXT_PUBLIC_SUPABASE_URL=https://supabase.healthscribe.pro"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY"

