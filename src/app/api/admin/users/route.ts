import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { listUsers, getUserStats } from '@/lib/admin-service';
import { UserFilters } from '@/types/admin';

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: UserFilters = {
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') as any || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '50')
    };

    // Get users and stats
    const [usersData, stats] = await Promise.all([
      listUsers(filters),
      searchParams.get('includeStats') === 'true' ? getUserStats() : null
    ]);

    return NextResponse.json({
      ...usersData,
      stats
    });
  } catch (error: any) {
    console.error('Error in admin users API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
