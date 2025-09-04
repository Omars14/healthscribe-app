import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { bulkUpdateUsers } from '@/lib/admin-service';
import { BulkUpdatePayload } from '@/types/admin';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload: BulkUpdatePayload = await request.json();

    if (!payload.userIds || payload.userIds.length === 0) {
      return NextResponse.json({ error: 'No users selected' }, { status: 400 });
    }

    const result = await bulkUpdateUsers(payload);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update users' },
      { status: 500 }
    );
  }
}
