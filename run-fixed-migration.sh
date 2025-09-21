#!/bin/bash

echo "🚀 Run Fixed Migration with Column Mapping"
echo "=========================================="
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

# Make script executable
chmod +x fixed-migration-with-mapping.js

# Run the fixed migration
echo ""
echo "🔄 Running fixed migration with proper column mapping..."
node fixed-migration-with-mapping.js

echo ""
echo "🎉 Fixed migration process finished!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - this should now work!"
echo "3. Verify all transcriptions are visible"
echo ""
echo "💡 Your login issue should now be completely fixed!"




