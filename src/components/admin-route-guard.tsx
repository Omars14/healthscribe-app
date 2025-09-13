'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminRouteGuard({ children, redirectTo = '/dashboard' }: AdminRouteGuardProps) {
  const { userProfile, loading, session } = useAuth();
  const router = useRouter();
  const [adminCheckStatus, setAdminCheckStatus] = useState<'checking' | 'admin' | 'denied' | 'error'>('checking');
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Enhanced localhost detection
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost') ||
     window.location.port === '3000' ||
     window.location.port === '3001' ||
     window.location.port === '3002');
  
  // Additional server-side admin check
  const checkAdminAccess = async () => {
    if (!session?.access_token) {
      console.log('🔧 AdminRouteGuard: No session token available');
      setDebugInfo('No session token');
      setAdminCheckStatus('denied');
      return;
    }

    try {
      console.log('🔧 AdminRouteGuard: Making server-side admin check...');
      const response = await fetch('/api/admin/check-user-role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log('🔧 AdminRouteGuard: Server response:', data);

      if (response.ok && data.role === 'admin') {
        console.log('✅ AdminRouteGuard: Server confirmed admin access');
        setDebugInfo(`Admin confirmed: ${data.email}`);
        setAdminCheckStatus('admin');
      } else {
        console.log('❌ AdminRouteGuard: Server denied admin access:', data);
        setDebugInfo(`Access denied: ${data.error || 'Not admin'}`);
        setAdminCheckStatus('denied');
        toast.error('Access denied. Admin privileges required.');
        setTimeout(() => router.push(redirectTo), 1500);
      }
    } catch (error) {
      console.error('❌ AdminRouteGuard: Server check failed:', error);
      setDebugInfo('Server check failed');
      setAdminCheckStatus('error');
    }
  };

  useEffect(() => {
    console.log('🔧 AdminRouteGuard: Status check - localhost:', isLocalhost, 'loading:', loading, 'userProfile:', userProfile?.email, 'role:', userProfile?.role);
    setDebugInfo(`Localhost: ${isLocalhost}, Loading: ${loading}, Profile: ${userProfile?.email || 'none'}, Role: ${userProfile?.role || 'none'}`);

    // For localhost development, allow admin access but still show debug info
    if (isLocalhost) {
      console.log('🔧 AdminRouteGuard: Localhost development mode - allowing admin access');
      setAdminCheckStatus('admin');
      setDebugInfo('Localhost bypass enabled');
      return;
    }

    // Wait for auth to finish loading
    if (loading) {
      console.log('🔧 AdminRouteGuard: Still loading authentication...');
      setAdminCheckStatus('checking');
      return;
    }

    // No session means not logged in
    if (!session) {
      console.log('🔧 AdminRouteGuard: No session found, redirecting to login');
      setDebugInfo('No session - redirecting to login');
      toast.error('Please log in to access this page.');
      router.push('/login');
      return;
    }

    // Check admin access via server API (more reliable than client-side profile)
    checkAdminAccess();
  }, [loading, userProfile?.role, session?.access_token, isLocalhost]); // Only include essential dependencies

  // Show loading state
  if (adminCheckStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Verifying Admin Access</h3>
            <p className="text-sm text-muted-foreground mb-4">Please wait while we check your permissions...</p>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded font-mono">
              {debugInfo}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (adminCheckStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-800">Access Check Failed</h3>
            <p className="text-sm text-muted-foreground mb-4">Unable to verify admin access. Please try again.</p>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded font-mono mb-4">
              {debugInfo}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied state
  if (adminCheckStatus === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-800">Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-4">You don't have admin privileges to access this area.</p>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded font-mono mb-4">
              {debugInfo}
            </div>
            <button
              onClick={() => router.push(redirectTo)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin access confirmed - show success briefly then render children
  if (adminCheckStatus === 'admin') {
    console.log('✅ AdminRouteGuard: Rendering admin content');
    return (
      <>
        {/* Debug info for development */}
        {isLocalhost && (
          <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2 text-xs font-mono">
            <CheckCircle className="inline h-4 w-4 mr-2" />
            Admin Access: {debugInfo}
          </div>
        )}
        {children}
      </>
    );
  }

  return null;
}
