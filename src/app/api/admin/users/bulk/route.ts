import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bulkUpdateUsers } from '@/lib/admin-service';
import { BulkUpdatePayload } from '@/types/admin';

export async function POST(request: NextRequest) {
  console.log('🚀 Admin Bulk API: Processing bulk user update...')
  
  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin Bulk API: Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // For localhost development, skip auth check (same pattern as other admin APIs)
    const isLocalhost = process.env.NODE_ENV === 'development'
    
    if (!isLocalhost) {
      // Production authentication would go here
      // For now, we'll allow all requests in development
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
