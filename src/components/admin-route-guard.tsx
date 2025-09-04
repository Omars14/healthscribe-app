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

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        router.push(redirectTo);
      }
    } else if (!loading && !userProfile) {
      toast.error('Please log in to access this page.');
      router.push('/login');
    }
  }, [loading, userProfile, router, redirectTo]);

  // Show loading spinner while checking auth
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

  // Don't render children if not admin
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
