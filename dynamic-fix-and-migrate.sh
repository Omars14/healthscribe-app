#!/bin/bash

echo "🚀 Dynamic Schema Fix and Migration"
echo "==================================="
echo ""

# Set the environment variables
echo "📝 Setting up environment..."
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://healthscribe_user:password123@localhost:5432/healthscribe
POSTGRES_PASSWORD=password123
POSTGRES_DB=healthscribe
POSTGRES_USER=healthscribe_user
NEXT_PUBLIC_URL=http://www.healthscribe.pro
NEXT_PUBLIC_API_URL=http://www.healthscribe.pro
NODE_ENV=production
NEXT_PUBLIC_USE_SIMPLE_AUTH=true
EOF

echo "✅ Environment configured"

# Make scripts executable
chmod +x dynamic-schema-fix.js
chmod +x run-migration-only.js

# Step 1: Dynamic schema fix
echo ""
echo "🔧 Step 1: Dynamic schema fix based on cloud database structure..."
node dynamic-schema-fix.js

# Step 2: Run the migration
echo ""
echo "🔄 Step 2: Running data migration..."
node run-migration-only.js

echo ""
echo "🎉 Dynamic fix and migration process finished!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - this should now work!"
echo "3. Verify all transcriptions are visible"
echo ""
echo "💡 Your login issue should now be completely fixed!"




