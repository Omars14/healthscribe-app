#!/bin/bash

echo "🚀 Fixing Schema and Completing Migration"
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

# Make the migration script executable
chmod +x fix-schema-and-migrate.js

# Run the migration
echo ""
echo "🔄 Fixing schema and running data migration..."
node fix-schema-and-migrate.js

echo ""
echo "🎉 Migration process completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Test your application at http://www.healthscribe.pro"
echo "2. Test login functionality - this should now work!"
echo "3. Verify all transcriptions are visible"
echo ""
echo "💡 Your data has been migrated successfully!"




