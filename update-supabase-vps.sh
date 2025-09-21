#!/bin/bash

# Update Supabase JWT Secret on VPS
# Run this script on your VPS where Supabase is hosted

echo "🔧 Updating Supabase JWT Secret on VPS..."

JWT_SECRET="df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed"

# Check if we're in a Supabase directory
if [ -f "docker-compose.yml" ] && grep -q "supabase" docker-compose.yml; then
    echo "✅ Found Supabase docker-compose.yml"
    
    # Backup current environment file
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        echo "📋 Backed up existing .env file"
    fi
    
    # Update or add JWT_SECRET
    if grep -q "JWT_SECRET=" .env 2>/dev/null; then
        # Update existing JWT_SECRET
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        echo "🔄 Updated existing JWT_SECRET in .env"
    else
        # Add JWT_SECRET
        echo "JWT_SECRET=$JWT_SECRET" >> .env
        echo "➕ Added JWT_SECRET to .env"
    fi
    
    echo "🔄 Restarting Supabase services..."
    docker-compose down
    docker-compose up -d
    
    echo "✅ Supabase services restarted with new JWT secret!"
    echo ""
    echo "🧪 Testing the auth endpoint..."
    sleep 5
    
    # Test the auth endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/v1/settings)
    if [ "$response" = "200" ]; then
        echo "✅ Supabase auth is responding correctly!"
    else
        echo "⚠️ Supabase auth returned status: $response"
        echo "Check the logs with: docker-compose logs auth"
    fi
    
else
    echo "❌ This doesn't appear to be a Supabase directory"
    echo "Please run this script in your Supabase installation directory"
    echo "Or manually add this to your Supabase .env file:"
    echo "JWT_SECRET=$JWT_SECRET"
fi

echo ""
echo "🎉 Next steps:"
echo "1. Update your Coolify environment variables with the new JWT tokens"
echo "2. Redeploy your Next.js application"
echo "3. Test authentication at https://www.healthscribe.pro/login"
