import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Update user (role, status, etc.)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🔧 Admin API: Updating user', id);

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin API: Missing environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const userId = id;
    const body = await request.json();

    console.log('🔧 Admin API: Update request for user', userId, 'with body:', body);

    // Handle role update
    if (body.role !== undefined) {
      console.log('🔧 Admin API: Updating user role to:', body.role);
      const { error: roleError } = await supabase
        .from('user_profiles')
        .update({
          role: body.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (roleError) {
        console.error('❌ Admin API: Role update error:', roleError);
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }
    }

    // Handle status update
    if (body.is_active !== undefined) {
      console.log('🔧 Admin API: Updating user active status to:', body.is_active);
      const { error: statusError } = await supabase
        .from('user_profiles')
        .update({
          is_active: body.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (statusError) {
        console.error('❌ Admin API: Status update error:', statusError);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
      }
    }

    // Handle action-based updates
    if (body.action === 'update_role' && body.role) {
      console.log('🔧 Admin API: Action-based role update to:', body.role);
      const { error: actionRoleError } = await supabase
        .from('user_profiles')
        .update({
          role: body.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (actionRoleError) {
        console.error('❌ Admin API: Action role update error:', actionRoleError);
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }
    }

    if (body.action === 'update_status' && body.is_active !== undefined) {
      console.log('🔧 Admin API: Action-based status update to:', body.is_active);
      const { error: actionStatusError } = await supabase
        .from('user_profiles')
        .update({
          is_active: body.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (actionStatusError) {
        console.error('❌ Admin API: Action status update error:', actionStatusError);
        return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
      }
    }

    console.log('✅ Admin API: Successfully updated user', userId);
    return NextResponse.json({ success: true, message: 'User updated successfully' });

  } catch (error: any) {
    console.error('❌ Admin API: Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Deactivate user (DELETE method)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log('🔧 Admin API: Deactivating user', id);

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin API: Missing environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const userId = id;

    // Deactivate user
    const { error: deactivateError } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (deactivateError) {
      console.error('❌ Admin API: Deactivate error:', deactivateError);
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

    console.log('✅ Admin API: Successfully deactivated user', userId);
    return NextResponse.json({ success: true, message: 'User deactivated successfully' });

  } catch (error: any) {
    console.error('❌ Admin API: Error deactivating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to deactivate user' },
      { status: 500 }
    );
  }
}
