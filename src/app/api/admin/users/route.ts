import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🚀 Admin API: Fetching users...')

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin API: Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Supabase client (only one declaration)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🚀 Admin API: Executing Supabase query...')

    // Get all users first
    const { data: basicUsers, error: basicError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (basicError) {
      console.error('❌ Admin API: Basic users query error:', basicError)
      return NextResponse.json({ error: basicError.message }, { status: 500 });
    }

    console.log('✅ Admin API: Successfully fetched', basicUsers?.length || 0, 'users (basic query)')

    // Get transcription statistics for each user
    const usersWithStats = await Promise.all(
      (basicUsers || []).map(async (user) => {
        try {
          // Get transcription count and total duration for this user
          const { data: transcriptions, error: transError } = await supabase
            .from('transcriptions')
            .select('*')  // Get all fields to see what's available
            .eq('user_id', user.id)

          console.log(`📊 User ${user.id} - First transcription sample:`, transcriptions?.[0])

          if (transError) {
            console.warn('⚠️ Could not fetch transcriptions for user:', user.id, transError)
            return {
              ...user,
              total_transcriptions: 0,
              total_hours: 0,
              last_activity: user.updated_at || user.created_at
            }
          }

          console.log(`📊 User ${user.id}: Found ${transcriptions?.length || 0} transcriptions`)

          const totalTranscriptions = transcriptions?.length || 0

          // Calculate total duration - use actual duration if available, otherwise estimate from file size
          let actualDurationCount = 0;
          let estimatedDurationCount = 0;

          const totalDuration = transcriptions?.reduce((sum, t) => {
            // First try to use actual duration if available
            const duration = t.duration;
            if (typeof duration === 'number' && !isNaN(duration)) {
              actualDurationCount++;
              return sum + duration;
            }

            // Fallback: Estimate duration from file size using typical audio bitrate
            // Assuming ~128kbps bitrate for audio files (common for medical recordings)
            if (t.file_size && typeof t.file_size === 'number') {
              const estimatedDuration = (t.file_size * 8) / (128 * 1024); // seconds
              estimatedDurationCount++;
              return sum + estimatedDuration;
            }

            return sum;
          }, 0) || 0

          const totalHours = Math.round((totalDuration / 3600) * 10) / 10 // Convert seconds to hours, round to 1 decimal

          console.log(`📊 User ${user.id}: Total duration: ${totalDuration}s (${totalHours}h) - ${actualDurationCount} actual, ${estimatedDurationCount} estimated`)

          // Find most recent activity
          const lastActivity = transcriptions && transcriptions.length > 0
            ? transcriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : user.updated_at || user.created_at

          return {
            ...user,
            total_transcriptions: totalTranscriptions,
            total_hours: totalHours,
            last_activity: lastActivity
          }
        } catch (err) {
          console.warn('⚠️ Error calculating stats for user:', user.id, err)
          return {
            ...user,
            total_transcriptions: 0,
            total_hours: 0,
            last_activity: user.updated_at || user.created_at
          }
        }
      })
    )

    console.log('✅ Admin API: Successfully fetched', usersWithStats.length, 'users with statistics')

    // Sort users based on the requested field
    const sortedUsers = [...usersWithStats].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'total_transcriptions':
          aValue = a.total_transcriptions || 0
          bValue = b.total_transcriptions || 0
          break
        case 'total_hours':
          aValue = a.total_hours || 0
          bValue = b.total_hours || 0
          break
        case 'last_activity':
          aValue = new Date(a.last_activity || a.updated_at || a.created_at).getTime()
          bValue = new Date(b.last_activity || b.updated_at || b.created_at).getTime()
          break
        case 'created_at':
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // Calculate overall statistics
    const stats = {
      total_users: sortedUsers.length,
      active_users: sortedUsers.filter(u => u.is_active !== false).length,
      admin_users: sortedUsers.filter(u => u.role === 'admin').length,
      transcriptionist_users: sortedUsers.filter(u => u.role === 'transcriptionist').length,
      total_transcriptions: sortedUsers.reduce((sum, u) => sum + (u.total_transcriptions || 0), 0),
      total_hours: Math.round(sortedUsers.reduce((sum, u) => sum + (u.total_hours || 0), 0) * 10) / 10
    }

    return NextResponse.json({
      users: sortedUsers,
      total: sortedUsers.length,
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