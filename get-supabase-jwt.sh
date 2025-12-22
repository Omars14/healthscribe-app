#!/bin/bash
# Script to retrieve Supabase JWT secret and generate valid tokens

echo "🔍 Retrieving Supabase JWT configuration from server..."
echo ""

# Try to find the JWT secret from Docker containers
echo "Checking Supabase Auth container..."
JWT_SECRET=$(docker exec supabase-auth env 2>/dev/null | grep JWT_SECRET | cut -d '=' -f2)

if [ -z "$JWT_SECRET" ]; then
    echo "Checking Kong container..."
    JWT_SECRET=$(docker exec supabase-kong env 2>/dev/null | grep JWT_SECRET | cut -d '=' -f2)
fi

if [ -z "$JWT_SECRET" ]; then
    echo "Checking other Supabase containers..."
    for container in $(docker ps --filter "name=supabase" --format "{{.Names}}"); do
        echo "  Checking $container..."
        SECRET=$(docker exec $container env 2>/dev/null | grep JWT_SECRET | cut -d '=' -f2)
        if [ ! -z "$SECRET" ]; then
            JWT_SECRET="$SECRET"
            break
        fi
    done
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Could not find JWT_SECRET in Docker containers"
    echo ""
    echo "Trying to find docker-compose.yml or .env files..."
    
    # Common Supabase installation paths
    SEARCH_PATHS=(
        "/root/supabase"
        "/opt/supabase"
        "/home/*/supabase"
        "."
    )
    
    for path in "${SEARCH_PATHS[@]}"; do
        if [ -f "$path/.env" ]; then
            echo "  Found .env at $path/.env"
            SECRET=$(grep "JWT_SECRET" "$path/.env" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            if [ ! -z "$SECRET" ]; then
                JWT_SECRET="$SECRET"
                break
            fi
        fi
        if [ -f "$path/docker-compose.yml" ]; then
            echo "  Found docker-compose.yml at $path/docker-compose.yml"
            SECRET=$(grep "JWT_SECRET" "$path/docker-compose.yml" | grep -v "#" | cut -d ':' -f2 | tr -d ' ' | tr -d '"' | tr -d "'")
            if [ ! -z "$SECRET" ]; then
                JWT_SECRET="$SECRET"
                break
            fi
        fi
    done
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Could not automatically find JWT_SECRET"
    echo ""
    echo "Please manually find the JWT_SECRET from your Supabase installation:"
    echo "  1. Check docker-compose.yml in your Supabase directory"
    echo "  2. Check .env file in your Supabase directory"
    echo "  3. Check environment variables in Supabase containers"
    echo ""
    echo "Once found, use it with this Python script to generate tokens:"
    echo "  python3 generate-jwt.py <YOUR_JWT_SECRET>"
    exit 1
fi

echo "✅ Found JWT_SECRET!"
echo "   Secret (first 20 chars): ${JWT_SECRET:0:20}..."
echo ""

# Generate tokens using Python
echo "🔧 Generating new JWT tokens..."
python3 - <<EOF
import jwt
import json
from datetime import datetime, timedelta

jwt_secret = "$JWT_SECRET"

# Generate anon key
anon_payload = {
    "iss": "supabase",
    "iat": int(datetime.now().timestamp()),
    "exp": int((datetime.now() + timedelta(days=365*100)).timestamp()),
    "role": "anon"
}
anon_token = jwt.encode(anon_payload, jwt_secret, algorithm="HS256")

# Generate service_role key
service_payload = {
    "iss": "supabase",
    "iat": int(datetime.now().timestamp()),
    "exp": int((datetime.now() + timedelta(days=365*100)).timestamp()),
    "role": "service_role"
}
service_token = jwt.encode(service_payload, jwt_secret, algorithm="HS256")

print("")
print("✅ Tokens generated successfully!")
print("")
print("=" * 80)
print("Add these to your .env.production and .env.local files:")
print("=" * 80)
print("")
print(f"NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_token}")
print(f"SUPABASE_SERVICE_ROLE_KEY={service_token}")
print("")
print("=" * 80)
EOF

echo ""
echo "✅ Done! Update your environment files with the tokens above."
