#!/bin/bash

echo "🔧 FINAL HEALTHSCRIBE PRO COMPLETE FIX SCRIPT"
echo "============================================="
echo ""

cd /var/www/healthscribe

echo "📋 SCRIPT STARTED AT: $(date)"
echo "📋 WORKING DIRECTORY: $(pwd)"
echo ""

# Step 1: Fix JSX Syntax Errors
echo "1️⃣ STEP 1: FIXING JSX SYNTAX ERRORS..."
echo "-------------------------------------"

# Fix dashboard layout
cat > src/app/dashboard/layout.tsx << 'EOF'
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">Healthscribe Pro</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-white">
                <span className="text-sm">{userProfile?.email || user?.email || 'User'}</span>
              </div>
              <Button
                onClick={() => signOut()}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
EOF

# Fix forgot-password page
cat > src/app/forgot-password/page.tsx << 'EOF'
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 rounded-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password</h1>
          <p className="text-blue-200/80">Password reset functionality coming soon</p>
        </div>
        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-300 hover:text-blue-200 text-sm">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}
EOF

echo "✅ JSX syntax errors fixed!"
echo ""

# Step 2: Clean and Build
echo "2️⃣ STEP 2: CLEANING AND BUILDING APPLICATION..."
echo "---------------------------------------------"

# Clean previous build
rm -rf .next

# Build application
echo "Building Next.js application..."
npm run build

BUILD_SUCCESS=$?

if [ $BUILD_SUCCESS -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""

    # Step 3: Start Application
    echo "3️⃣ STEP 3: STARTING NEXT.JS APPLICATION..."
    echo "---------------------------------------"

    # Stop any existing process
    pm2 stop healthscribe 2>/dev/null || true
    pm2 delete healthscribe 2>/dev/null || true

    # Start new process
    pm2 start npm --name healthscribe -- start -- -p 3000

    if [ $? -eq 0 ]; then
        echo "✅ Next.js application started successfully!"
        echo "   - Process name: healthscribe"
        echo "   - Port: 3000"
        echo ""

        # Step 4: Fix Nginx
        echo "4️⃣ STEP 4: FIXING NGINX CONFIGURATION..."
        echo "--------------------------------------"

        # Make script executable
        chmod +x fix-nginx-final.sh

        # Run nginx fix
        ./fix-nginx-final.sh

        NGINX_SUCCESS=$?

        if [ $NGINX_SUCCESS -eq 0 ]; then
            echo "✅ Nginx configuration updated successfully!"
            echo ""

            # Step 5: Test Services
            echo "5️⃣ STEP 5: TESTING ALL SERVICES..."
            echo "--------------------------------"

            echo "Waiting for services to stabilize..."
            sleep 5

            echo ""
            echo "🧪 Testing dashboard API..."
            DASHBOARD_API=$(curl -s -k https://healthscribe.pro/api/dashboard/stats | head -3)
            echo "$DASHBOARD_API"

            echo ""
            echo "🧪 Testing homepage..."
            HOMEPAGE=$(curl -s -k https://healthscribe.pro | head -3)
            echo "$HOMEPAGE"

            echo ""
            echo "🧪 Testing auth service..."
            AUTH_SERVICE=$(curl -s -k https://healthscribe.pro/auth/v1/health | head -3)
            echo "$AUTH_SERVICE"

            echo ""
            echo "🧪 Testing workspace transcriptions API..."
            WORKSPACE_API=$(curl -s -k "https://healthscribe.pro/api/workspace-transcriptions?userId=625d7540-ab35-4fee-8817-6d0b32644869" | head -3)
            echo "$WORKSPACE_API"

            echo ""
            echo "🎉 FINAL STATUS REPORT"
            echo "===================="

            # Check if services are working
            if echo "$DASHBOARD_API" | grep -q "stats"; then
                echo "✅ Dashboard API: WORKING"
            else
                echo "❌ Dashboard API: FAILED"
            fi

            if echo "$HOMEPAGE" | grep -q "DOCTYPE"; then
                echo "✅ Homepage: WORKING"
            else
                echo "❌ Homepage: FAILED"
            fi

            if echo "$AUTH_SERVICE" | grep -q "status"; then
                echo "✅ Auth Service: WORKING"
            else
                echo "❌ Auth Service: FAILED"
            fi

            if echo "$WORKSPACE_API" | grep -q "transcriptions"; then
                echo "✅ Workspace API: WORKING"
            else
                echo "❌ Workspace API: FAILED"
            fi

            echo ""
            echo "🎯 ACCESS YOUR DASHBOARD:"
            echo "========================"
            echo "🌐 https://healthscribe.pro/dashboard"
            echo ""
            echo "📊 Expected features:"
            echo "   - User authentication working"
            echo "   - 19 transcriptions displayed"
            echo "   - Charts and statistics"
            echo "   - All navigation functional"
            echo ""
            echo "📞 If you encounter any issues:"
            echo "   - Check browser console for errors"
            echo "   - Clear browser cache and reload"
            echo "   - Contact support if problems persist"

        else
            echo "❌ Nginx configuration failed!"
            exit 1
        fi

    else
        echo "❌ Failed to start Next.js application!"
        exit 1
    fi

else
    echo "❌ Build failed! Please check the errors above."
    echo ""
    echo "🔧 COMMON FIXES:"
    echo "   1. Check if all dependencies are installed: npm install"
    echo "   2. Clear node_modules and reinstall: rm -rf node_modules && npm install"
    echo "   3. Check for syntax errors in the files mentioned above"
    echo ""
    echo "📋 If you need help fixing the build errors, please share the exact error messages."
    exit 1
fi

echo ""
echo "📋 SCRIPT COMPLETED AT: $(date)"
echo "📋 Thank you for using Healthscribe Pro!"

