import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateUserRole, assignEditor, deactivateUser } from '@/lib/admin-service';
import { UserRole } from '@/types/review';

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to check admin authorization
async function checkAdminAuth() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, status: 401, message: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { authorized: false, status: 403, message: 'Forbidden: Admin access required' };
  }

  return { authorized: true, user };
}

// Update user (role, editor assignment, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const userId = params.id;
    const body = await request.json();

    // Handle role update
    if (body.role !== undefined) {
      await updateUserRole(userId, body.role as UserRole);
    }

    // Handle editor assignment
    if (body.assignedEditorId !== undefined) {
      await assignEditor(userId, body.assignedEditorId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Deactivate user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const userId = params.id;
    await deactivateUser(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
