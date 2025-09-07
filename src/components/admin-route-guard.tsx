'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AdminRouteGuard({ children, redirectTo = '/dashboard' }: AdminRouteGuardProps) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  // For localhost development, bypass admin checks
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));
  
  useEffect(() => {
    console.log('🔧 AdminRouteGuard: Debug - isLocalhost:', isLocalhost, 'loading:', loading, 'userProfile:', userProfile);

    if (isLocalhost) {
      console.log('🔧 AdminRouteGuard: Localhost development mode - allowing admin access');
      return; // Skip all auth checks for localhost
    }

    if (!loading && userProfile) {
      console.log('🔧 AdminRouteGuard: User profile found:', userProfile);
      if (userProfile.role !== 'admin') {
        console.log('🔧 AdminRouteGuard: User is not admin, role:', userProfile.role);
        toast.error('Access denied. Admin privileges required.');
        router.push(redirectTo);
      } else {
        console.log('🔧 AdminRouteGuard: User is admin, allowing access');
      }
    } else if (!loading && !userProfile) {
      console.log('🔧 AdminRouteGuard: No user profile found, redirecting to login');
      toast.error('Please log in to access this page.');
      router.push('/login');
    } else if (loading) {
      console.log('🔧 AdminRouteGuard: Still loading authentication...');
    }
  }, [loading, userProfile, router, redirectTo, isLocalhost]);

  // For localhost, always render children
  if (isLocalhost) {
    console.log('🔧 AdminRouteGuard: Localhost bypass - rendering admin content');
    return <>{children}</>;
  }

  // Show loading spinner while checking auth (production only)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not admin (production only)
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
