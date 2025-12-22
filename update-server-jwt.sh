#!/bin/bash
# Script to update Supabase JWT secret on the server
# Upload this to your server and run it

JWT_SECRET="df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed"

echo "🔧 Updating Supabase JWT Secret"
echo "================================"
echo ""

# Find Supabase containers
echo "📋 Finding Supabase containers..."
CONTAINERS=$(docker ps --filter "name=supabase" --format "{{.Names}}")

if [ -z "$CONTAINERS" ]; then
    echo "❌ No Supabase containers found!"
    echo "   Please make sure Supabase is running"
    exit 1
fi

echo "✅ Found Supabase containers:"
echo "$CONTAINERS"
echo ""

# Find Supabase docker-compose directory
echo "🔍 Looking for Supabase configuration..."
SUPABASE_DIRS=(
    "/opt/supabase/supabase/docker"
    "/root/supabase/docker"
    "/home/*/supabase/docker"
    "/opt/supabase"
    "/root/supabase"
)

SUPABASE_DIR=""
for dir in "${SUPABASE_DIRS[@]}"; do
    if [ -f "$dir/docker-compose.yml" ]; then
        SUPABASE_DIR="$dir"
        echo "✅ Found Supabase at: $SUPABASE_DIR"
        break
    fi
done

if [ -z "$SUPABASE_DIR" ]; then
    echo "❌ Could not find Supabase docker-compose.yml"
    echo ""
    echo "Please manually update the JWT_SECRET in your Supabase configuration:"
    echo "  JWT_SECRET=$JWT_SECRET"
    exit 1
fi

# Backup current configuration
echo ""
echo "💾 Creating backup..."
cp "$SUPABASE_DIR/.env" "$SUPABASE_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Update JWT_SECRET in .env file
echo ""
echo "📝 Updating JWT_SECRET in .env..."
if grep -q "^JWT_SECRET=" "$SUPABASE_DIR/.env"; then
    # Replace existing JWT_SECRET
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$SUPABASE_DIR/.env"
    echo "✅ Updated existing JWT_SECRET"
else
    # Add JWT_SECRET if it doesn't exist
    echo "JWT_SECRET=$JWT_SECRET" >> "$SUPABASE_DIR/.env"
    echo "✅ Added JWT_SECRET"
fi

# Show the updated value
echo ""
echo "Current JWT_SECRET configuration:"
grep "JWT_SECRET" "$SUPABASE_DIR/.env"

# Restart Supabase services
echo ""
echo "🔄 Restarting Supabase services..."
cd "$SUPABASE_DIR"
docker-compose down
sleep 2
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo ""
echo "✅ Service status:"
docker-compose ps

echo ""
echo "=" * 80
echo "🎉 JWT Secret updated successfully!"
echo "=" * 80
echo ""
echo "Next steps:"
echo "  1. Wait 30 seconds for all services to be fully ready"
echo "  2. Test authentication from your application"
echo "  3. Check logs if there are issues: docker-compose logs -f auth"
echo ""
