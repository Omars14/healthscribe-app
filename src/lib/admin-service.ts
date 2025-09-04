import { createClient } from '@supabase/supabase-js';
import { AdminUser, UserFilters, UserStats, BulkUpdatePayload, BulkUpdateResult, AdminApiError } from '@/types/admin';
import { UserRole } from '@/types/review';

/**
 * Create an admin client with service role key for privileged operations
 * This should only be used in server-side code (API routes, server actions)
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * List all users with filters and pagination
 */
export async function listUsers(filters: UserFilters = {}): Promise<{ users: AdminUser[]; total: number }> {
  const adminClient = createAdminClient();
  
  const { 
    search = null, 
    role = null, 
    isActive = null,
    page = 1,
    pageSize = 50
  } = filters;

  const offset = (page - 1) * pageSize;

  try {
    const { data, error } = await adminClient.rpc('admin_list_users', {
      search_query: search || null,
      role_filter: role && role !== '' ? role : null,
      is_active_filter: isActive !== '' ? isActive : null,
      page_size: pageSize,
      page_offset: offset
    });

    if (error) {
      console.error('Error listing users:', error);
      throw new Error(error.message);
    }

    // Get total count for pagination
    const { count } = await adminClient
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .match(
        Object.fromEntries(
          Object.entries({
            role: role && role !== '' ? role : undefined,
            is_active: isActive !== '' ? isActive : undefined
          }).filter(([_, v]) => v !== undefined)
        )
      );

    return {
      users: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Failed to list users:', error);
    throw error;
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const adminClient = createAdminClient();

  try {
    const { error } = await adminClient.rpc('admin_update_user_role', {
      user_id: userId,
      new_role: newRole
    });

    if (error) {
      console.error('Error updating user role:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
}

/**
 * Assign an editor to a transcriptionist
 */
export async function assignEditor(transcriptionistId: string, editorId: string | null): Promise<void> {
  const adminClient = createAdminClient();

  try {
    const { error } = await adminClient.rpc('admin_assign_editor', {
      transcriptionist_id: transcriptionistId,
      editor_id: editorId
    });

    if (error) {
      console.error('Error assigning editor:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Failed to assign editor:', error);
    throw error;
  }
}

/**
 * Bulk update multiple users
 */
export async function bulkUpdateUsers(payload: BulkUpdatePayload): Promise<BulkUpdateResult> {
  const adminClient = createAdminClient();

  try {
    const { data, error } = await adminClient.rpc('admin_bulk_update_users', {
      user_ids: payload.userIds,
      update_role: payload.role || null,
      update_editor_id: payload.editorId !== undefined ? payload.editorId : null,
      update_is_active: payload.isActive !== undefined ? payload.isActive : null
    });

    if (error) {
      console.error('Error bulk updating users:', error);
      throw new Error(error.message);
    }

    return data?.[0] || { updated_count: 0, error_count: 0 };
  } catch (error) {
    console.error('Failed to bulk update users:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const adminClient = createAdminClient();

  try {
    const { data, error } = await adminClient.rpc('admin_get_user_stats');

    if (error) {
      console.error('Error getting user stats:', error);
      throw new Error(error.message);
    }

    return data?.[0] || {
      total_users: 0,
      admins_count: 0,
      editors_count: 0,
      transcriptionists_count: 0,
      active_users: 0,
      inactive_users: 0,
      users_last_30_days: 0
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    throw error;
  }
}

/**
 * Deactivate a user (soft delete)
 */
export async function deactivateUser(userId: string): Promise<void> {
  const adminClient = createAdminClient();

  try {
    const { error } = await adminClient.rpc('admin_deactivate_user', {
      user_id: userId
    });

    if (error) {
      console.error('Error deactivating user:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    throw error;
  }
}

/**
 * Get all editors for assignment dropdown
 */
export async function getEditors(): Promise<{ id: string; name: string; email: string }[]> {
  const adminClient = createAdminClient();

  try {
    const { data, error } = await adminClient
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('role', 'editor')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching editors:', error);
      throw new Error(error.message);
    }

    return (data || []).map(editor => ({
      id: editor.id,
      name: editor.full_name || editor.email,
      email: editor.email
    }));
  } catch (error) {
    console.error('Failed to fetch editors:', error);
    throw error;
  }
}
