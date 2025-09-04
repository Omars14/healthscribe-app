'use client'

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugAuthPage() {
  const { user, userProfile, loading } = useAuth();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDirectFromDb = async () => {
    setRefreshing(true);
    try {
      if (!user) {
        setDbError('No user logged in');
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setDbError(error.message);
        setDbProfile(null);
      } else {
        setDbProfile(data);
        setDbError(null);
      }
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDirectFromDb();
    }
  }, [user]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Authentication Debug</h1>
        <p className="text-muted-foreground">Diagnostic information for troubleshooting authentication issues</p>
      </div>

      <div className="space-y-6">
        {/* Auth User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Auth User (Supabase Auth)
            </CardTitle>
            <CardDescription>Information from Supabase authentication</CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">User ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{user.id}</code>
                  
                  <span className="font-medium">Email:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{user.email}</code>
                  
                  <span className="font-medium">Created:</span>
                  <span>{new Date(user.created_at).toLocaleString()}</span>
                  
                  <span className="font-medium">Confirmed:</span>
                  <span>{user.email_confirmed_at ? 
                    <Badge variant="default" className="h-5">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Yes
                    </Badge> : 
                    <Badge variant="secondary">No</Badge>
                  }</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>No authenticated user found</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Profile from Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Context User Profile
            </CardTitle>
            <CardDescription>Profile from AuthContext (used by components)</CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Profile ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{userProfile.id}</code>
                  
                  <span className="font-medium">Email:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{userProfile.email}</code>
                  
                  <span className="font-medium">Role:</span>
                  <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                    {userProfile.role}
                  </Badge>
                  
                  <span className="font-medium">Full Name:</span>
                  <span>{userProfile.full_name || 'Not set'}</span>
                  
                  <span className="font-medium">Assigned Editor:</span>
                  <span>{userProfile.assigned_editor_id || 'None'}</span>
                  
                  <span className="font-medium">Created:</span>
                  <span>{new Date(userProfile.created_at).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>No user profile in context</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Direct Database Query */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Direct Database Query</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchDirectFromDb}
                disabled={refreshing}
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refetch
              </Button>
            </CardTitle>
            <CardDescription>Profile fetched directly from user_profiles table</CardDescription>
          </CardHeader>
          <CardContent>
            {dbError ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Error: {dbError}</span>
              </div>
            ) : dbProfile ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">Profile ID:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{dbProfile.id}</code>
                  
                  <span className="font-medium">Email:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">{dbProfile.email}</code>
                  
                  <span className="font-medium">Role:</span>
                  <Badge variant={dbProfile.role === 'admin' ? 'default' : 'secondary'}>
                    {dbProfile.role}
                  </Badge>
                  
                  <span className="font-medium">Is Active:</span>
                  <span>{dbProfile.is_active ? 'Yes' : 'No'}</span>
                  
                  <span className="font-medium">Last Active:</span>
                  <span>{dbProfile.last_active ? new Date(dbProfile.last_active).toLocaleString() : 'Never'}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>No profile found in database</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card className={userProfile?.role === 'admin' ? 'border-green-500' : 'border-orange-500'}>
          <CardHeader>
            <CardTitle>Diagnosis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user && userProfile && dbProfile && (
                <>
                  {userProfile.role === dbProfile.role ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Context and database roles match: <strong>{userProfile.role}</strong></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Role mismatch! Context: <strong>{userProfile.role}</strong>, Database: <strong>{dbProfile.role}</strong></span>
                    </div>
                  )}

                  {userProfile.role === 'admin' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>You have admin privileges ✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>You do NOT have admin privileges. Current role: <strong>{userProfile.role}</strong></span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <Button onClick={handleRefresh} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              
              {userProfile?.role === 'admin' && (
                <Button 
                  onClick={() => window.location.href = '/dashboard/admin/users'} 
                  className="w-full"
                  variant="default"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Go to Admin Panel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
