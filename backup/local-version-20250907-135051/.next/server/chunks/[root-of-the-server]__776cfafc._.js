module.exports = {

"[project]/.next-internal/server/app/api/admin/users/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/url [external] (url, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}}),
"[externals]/punycode [external] (punycode, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[project]/src/lib/admin-service.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "assignEditor": ()=>assignEditor,
    "bulkUpdateUsers": ()=>bulkUpdateUsers,
    "createAdminClient": ()=>createAdminClient,
    "deactivateUser": ()=>deactivateUser,
    "getEditors": ()=>getEditors,
    "getOverallUploadStats": ()=>getOverallUploadStats,
    "getUserStats": ()=>getUserStats,
    "getUserUploadStats": ()=>getUserUploadStats,
    "listUsers": ()=>listUsers,
    "updateUserRole": ()=>updateUserRole
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
function createAdminClient() {
    const supabaseUrl = ("TURBOPACK compile-time value", "https://yaznemrwbingjwqutbvb.supabase.co");
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for admin client');
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
/**
 * Process sorted users and return formatted result
 */ async function processSortedUsers(adminClient, sortedUserIds, transcriptionCounts, offset, pageSize) {
    const paginatedUserIds = sortedUserIds.slice(offset, offset + pageSize);
    const { data: users, error: fetchError } = await adminClient.from('user_profiles').select(`
      id,
      email,
      full_name,
      role,
      assigned_editor_id,
      is_active,
      last_active,
      created_at,
      updated_at
    `).in('id', paginatedUserIds);
    if (fetchError) {
        console.error('Error fetching sorted users:', fetchError);
        throw fetchError;
    }
    // Get editor information for users who have assigned editors
    const usersWithEditors = (users || []).filter((user)=>user.assigned_editor_id);
    let editorMap = {};
    if (usersWithEditors.length > 0) {
        const editorIds = usersWithEditors.map((user)=>user.assigned_editor_id);
        const { data: editors, error: editorError } = await adminClient.from('user_profiles').select('id, full_name, email').in('id', editorIds);
        if (!editorError && editors) {
            editors.forEach((editor)=>{
                editorMap[editor.id] = {
                    full_name: editor.full_name,
                    email: editor.email
                };
            });
        }
    }
    // Sort the database results to match the sorted user IDs order
    const sortedUsers = paginatedUserIds.map((userId)=>{
        const user = (users || []).find((u)=>u.id === userId);
        if (!user) return null;
        const transcriptionCount = transcriptionCounts[user.id] || 0;
        console.log(`🔧 processSortedUsers - User ${user.id}: transcription_count = ${transcriptionCount}`);
        const editor = editorMap[user.assigned_editor_id || ''];
        return {
            ...user,
            transcription_count: transcriptionCount,
            review_count: 0,
            assigned_editor_name: editor?.full_name || editor?.email || null,
            last_sign_in_at: null,
            email_confirmed_at: null
        };
    }).filter(Boolean);
    // Debug: Log final sorted order
    console.log('🔧 processSortedUsers - Final sorted users:');
    sortedUsers.forEach((user, index)=>{
        console.log(`🔧 processSortedUsers - Position ${index + 1}: ${user.id} - ${user.transcription_count} transcriptions`);
    });
    return {
        users: sortedUsers,
        total: sortedUserIds.length
    };
}
/**
 * Sort users by activity (transcription count) with proper pagination
 */ async function sortByActivity(adminClient, filters, page, pageSize) {
    const { search = null, role = null, isActive = null, sortDirection = 'desc' // Default to descending for activity
     } = filters;
    const offset = (page - 1) * pageSize;
    try {
        // First, get all user IDs that match the filters
        let userQuery = adminClient.from('user_profiles').select('id');
        // Apply filters
        if (role && role !== '') {
            userQuery = userQuery.eq('role', role);
        }
        if (isActive !== null && isActive !== '') {
            userQuery = userQuery.eq('is_active', isActive);
        }
        if (search) {
            userQuery = userQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        const { data: filteredUsers, error: userError } = await userQuery;
        if (userError) throw userError;
        const userIds = (filteredUsers || []).map((u)=>u.id);
        if (userIds.length === 0) {
            return {
                users: [],
                total: 0
            };
        }
        // Get transcription counts for all filtered users
        const { data: transcriptionData, error: transcriptionError } = await adminClient.from('transcriptions').select('user_id').in('user_id', userIds).eq('status', 'completed');
        if (transcriptionError) {
            console.error('Error fetching transcriptions for sorting:', transcriptionError);
            // Fallback: assume all users have 0 transcriptions
            const transcriptionCounts = {};
            userIds.forEach((id)=>transcriptionCounts[id] = 0);
            const sortedUserIds = userIds.sort((a, b)=>{
                return sortDirection === 'asc' ? 0 - 0 : 0 - 0; // All equal
            });
            return await processSortedUsers(adminClient, sortedUserIds, transcriptionCounts, offset, pageSize);
        }
        // Count transcriptions per user
        const transcriptionCounts = {};
        (transcriptionData || []).forEach((t)=>{
            transcriptionCounts[t.user_id] = (transcriptionCounts[t.user_id] || 0) + 1;
        });
        // Debug: Log transcription counts
        console.log('🔧 sortByActivity - Transcription counts:', transcriptionCounts);
        console.log('🔧 sortByActivity - User IDs:', userIds);
        console.log('🔧 sortByActivity - Sort direction:', sortDirection);
        // Create a sorted list of user IDs by transcription count
        const sortedUserIds = [
            ...userIds
        ].sort((a, b)=>{
            const aCount = transcriptionCounts[a] || 0;
            const bCount = transcriptionCounts[b] || 0;
            const result = sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
            console.log(`🔧 sortByActivity - Comparing ${a}(${aCount}) vs ${b}(${bCount}): ${result}`);
            return result;
        });
        console.log('🔧 sortByActivity - Final sorted user IDs:', sortedUserIds);
        return await processSortedUsers(adminClient, sortedUserIds, transcriptionCounts, offset, pageSize);
    } catch (error) {
        console.error('Error in sortByActivity:', error);
        throw error;
    }
}
async function listUsers(filters = {}) {
    const adminClient = createAdminClient();
    const { search = null, role = null, isActive = null, page = 1, pageSize = 50, sortField = null, sortDirection = 'asc' } = filters;
    // Ensure page is at least 1 to prevent negative offset
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * pageSize;
    try {
        // Get user profiles with pagination (without problematic joins)
        let query = adminClient.from('user_profiles').select(`
        id,
        email,
        full_name,
        role,
        assigned_editor_id,
        is_active,
        last_active,
        created_at,
        updated_at
      `);
        // Apply filters first (before sorting)
        if (role && role !== '') {
            query = query.eq('role', role);
        }
        if (isActive !== null && isActive !== '') {
            query = query.eq('is_active', isActive);
        }
        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        // Apply sorting (before pagination for database-level sorting)
        if (sortField) {
            let ascending = sortDirection === 'asc';
            switch(sortField){
                case 'name':
                    query = query.order('full_name', {
                        ascending,
                        nullsFirst: false
                    });
                    break;
                case 'role':
                    query = query.order('role', {
                        ascending
                    });
                    break;
                case 'status':
                    query = query.order('is_active', {
                        ascending
                    });
                    break;
                case 'created_at':
                    query = query.order('created_at', {
                        ascending
                    });
                    break;
                case 'activity':
                    // For activity sorting, we need a more complex approach
                    // We'll use a subquery to get transcription counts and sort by them
                    return await sortByActivity(adminClient, filters, safePage, pageSize);
                default:
                    query = query.order('created_at', {
                        ascending: false
                    });
            }
        } else {
            // Default sorting by created_at desc
            query = query.order('created_at', {
                ascending: false
            });
        }
        // Apply pagination after sorting
        query = query.range(offset, offset + pageSize - 1);
        const { data, error } = await query;
        if (error) {
            console.error('Error listing users:', error);
            throw new Error(error.message);
        }
        // Use a more efficient approach with a single query that includes transcription counts
        // First, get all users
        const userIds = (data || []).map((user)=>user.id);
        // Get transcription counts
        let transcriptionCounts = {};
        if (userIds.length > 0) {
            const { data: transcriptions, error: transcriptionError } = await adminClient.from('transcriptions').select('user_id').in('user_id', userIds).eq('status', 'completed');
            if (!transcriptionError && transcriptions) {
                transcriptions.forEach((t)=>{
                    transcriptionCounts[t.user_id] = (transcriptionCounts[t.user_id] || 0) + 1;
                });
            }
        }
        // Get editor information for users who have assigned editors
        const usersWithEditors = (data || []).filter((user)=>user.assigned_editor_id);
        let editorMap = {};
        if (usersWithEditors.length > 0) {
            const editorIds = usersWithEditors.map((user)=>user.assigned_editor_id);
            const { data: editors, error: editorError } = await adminClient.from('user_profiles').select('id, full_name, email').in('id', editorIds);
            if (!editorError && editors) {
                editors.forEach((editor)=>{
                    editorMap[editor.id] = {
                        full_name: editor.full_name,
                        email: editor.email
                    };
                });
            }
        }
        // Process the data to include transcription counts and editor names
        const processedUsers = (data || []).map((user)=>{
            const editor = editorMap[user.assigned_editor_id || ''];
            return {
                ...user,
                transcription_count: transcriptionCounts[user.id] || 0,
                review_count: 0,
                assigned_editor_name: editor?.full_name || editor?.email || null,
                last_sign_in_at: null,
                email_confirmed_at: null // Not available in current schema
            };
        });
        // Get total count for pagination (without pagination)
        let countQuery = adminClient.from('user_profiles').select('*', {
            count: 'exact',
            head: true
        });
        if (role && role !== '') {
            countQuery = countQuery.eq('role', role);
        }
        if (isActive !== null && isActive !== '') {
            countQuery = countQuery.eq('is_active', isActive);
        }
        if (search) {
            countQuery = countQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        const { count } = await countQuery;
        return {
            users: processedUsers,
            total: count || 0
        };
    } catch (error) {
        console.error('Failed to list users:', error);
        throw error;
    }
}
async function updateUserRole(userId, newRole) {
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
async function assignEditor(transcriptionistId, editorId) {
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
async function bulkUpdateUsers(payload) {
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
        return data?.[0] || {
            updated_count: 0,
            error_count: 0
        };
    } catch (error) {
        console.error('Failed to bulk update users:', error);
        throw error;
    }
}
async function getUserStats() {
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
async function deactivateUser(userId) {
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
async function getEditors() {
    const adminClient = createAdminClient();
    try {
        const { data, error } = await adminClient.from('user_profiles').select('id, email, full_name').eq('role', 'editor').eq('is_active', true).order('full_name');
        if (error) {
            console.error('Error fetching editors:', error);
            throw new Error(error.message);
        }
        return (data || []).map((editor)=>({
                id: editor.id,
                name: editor.full_name || editor.email,
                email: editor.email
            }));
    } catch (error) {
        console.error('Failed to fetch editors:', error);
        throw error;
    }
}
async function getUserUploadStats(timeRange) {
    const adminClient = createAdminClient();
    try {
        // Calculate date filter based on time range
        let dateFilter = '';
        if (timeRange && timeRange !== 'all') {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            const date = new Date();
            date.setDate(date.getDate() - days);
            dateFilter = date.toISOString();
        }
        // Get all transcriptions first
        let transcriptionQuery = adminClient.from('transcriptions').select('id, user_id, file_size, created_at, status').eq('status', 'completed');
        if (dateFilter) {
            transcriptionQuery = transcriptionQuery.gte('created_at', dateFilter);
        }
        const { data: transcriptions, error } = await transcriptionQuery;
        if (error) {
            console.error('Error fetching upload stats:', error);
            throw new Error(error.message);
        }
        // Get unique user IDs
        const userIds = [
            ...new Set((transcriptions || []).map((t)=>t.user_id))
        ];
        // Fetch user information
        const { data: users, error: userError } = await adminClient.from('user_profiles').select('id, email, full_name, role').in('id', userIds);
        if (userError) {
            console.error('Error fetching users for upload stats:', userError);
            throw new Error(userError.message);
        }
        // Create user map
        const userMap = new Map();
        (users || []).forEach((user)=>{
            userMap.set(user.id, user);
        });
        // Group by user and calculate stats
        const userStats = new Map();
        (transcriptions || []).forEach((transcription)=>{
            const userId = transcription.user_id;
            const user = userMap.get(userId);
            if (user && !userStats.has(userId)) {
                userStats.set(userId, {
                    userId,
                    email: user.email,
                    fullName: user.full_name || user.email,
                    role: user.role,
                    totalUploads: 0,
                    totalFileSize: 0,
                    totalFileSizeMB: 0,
                    totalAudioMinutes: 0,
                    lastUpload: null,
                    uploadsThisPeriod: 0,
                    fileSizeThisPeriod: 0,
                    fileSizeThisPeriodMB: 0,
                    audioMinutesThisPeriod: 0
                });
            }
            const stats = userStats.get(userId);
            // Calculate estimated audio duration (rough estimate: ~128kbps = ~1MB per 8 minutes)
            const fileSizeMB = (transcription.file_size || 0) / (1024 * 1024);
            const estimatedMinutes = Math.round(fileSizeMB * 8); // Rough estimate
            const audioDurationSeconds = transcription.audio_duration_seconds || estimatedMinutes * 60;
            // Update totals
            stats.totalUploads += 1;
            stats.totalFileSize += transcription.file_size || 0;
            stats.totalFileSizeMB = parseFloat((stats.totalFileSize / (1024 * 1024)).toFixed(2));
            stats.totalAudioMinutes += Math.round(audioDurationSeconds / 60);
            // Update last upload date
            const uploadDate = new Date(transcription.created_at);
            if (!stats.lastUpload || uploadDate > new Date(stats.lastUpload)) {
                stats.lastUpload = transcription.created_at;
            }
            // Update period stats if we're filtering by time range
            if (dateFilter) {
                stats.uploadsThisPeriod += 1;
                stats.fileSizeThisPeriod += transcription.file_size || 0;
                stats.fileSizeThisPeriodMB = parseFloat((stats.fileSizeThisPeriod / (1024 * 1024)).toFixed(2));
                stats.audioMinutesThisPeriod += Math.round(audioDurationSeconds / 60);
            }
        });
        // If no date filter, get all-time stats for period fields too
        if (!dateFilter) {
            for (const stats of userStats.values()){
                stats.uploadsThisPeriod = stats.totalUploads;
                stats.fileSizeThisPeriod = stats.totalFileSize;
                stats.fileSizeThisPeriodMB = stats.totalFileSizeMB;
                stats.audioMinutesThisPeriod = stats.totalAudioMinutes;
            }
        }
        return Array.from(userStats.values()).sort((a, b)=>b.totalUploads - a.totalUploads);
    } catch (error) {
        console.error('Failed to get user upload stats:', error);
        throw error;
    }
}
async function getOverallUploadStats() {
    const adminClient = createAdminClient();
    try {
        // Get all completed transcriptions
        const { data: allTranscriptions, error: allError } = await adminClient.from('transcriptions').select('user_id, file_size, created_at').eq('status', 'completed');
        if (allError) {
            throw new Error(allError.message);
        }
        // Get transcriptions from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: recentTranscriptions, error: recentError } = await adminClient.from('transcriptions').select('id').eq('status', 'completed').gte('created_at', sevenDaysAgo.toISOString());
        if (recentError) {
            throw new Error(recentError.message);
        }
        // Get transcriptions from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: monthTranscriptions, error: monthError } = await adminClient.from('transcriptions').select('id').eq('status', 'completed').gte('created_at', thirtyDaysAgo.toISOString());
        if (monthError) {
            throw new Error(monthError.message);
        }
        const transcriptions = allTranscriptions || [];
        const totalUploads = transcriptions.length;
        const totalFileSize = transcriptions.reduce((sum, t)=>sum + (t.file_size || 0), 0);
        const totalFileSizeGB = parseFloat((totalFileSize / (1024 * 1024 * 1024)).toFixed(2));
        // Calculate total audio minutes
        const totalAudioMinutes = transcriptions.reduce((sum, t)=>{
            const fileSizeMB = (t.file_size || 0) / (1024 * 1024);
            const estimatedMinutes = Math.round(fileSizeMB * 8); // Rough estimate
            const audioDurationSeconds = t.audio_duration_seconds || estimatedMinutes * 60;
            return sum + Math.round(audioDurationSeconds / 60);
        }, 0);
        // Get unique users
        const uniqueUsers = new Set(transcriptions.map((t)=>t.user_id));
        const totalUsers = uniqueUsers.size;
        // Calculate averages
        const averageUploadsPerUser = totalUsers > 0 ? Math.round(totalUploads / totalUsers) : 0;
        const averageFileSizeMB = totalUploads > 0 ? parseFloat((totalFileSize / (1024 * 1024) / totalUploads).toFixed(2)) : 0;
        const averageAudioMinutesPerUser = totalUsers > 0 ? Math.round(totalAudioMinutes / totalUsers) : 0;
        // Find top uploader
        const userUploadCounts = new Map();
        transcriptions.forEach((t)=>{
            userUploadCounts.set(t.user_id, (userUploadCounts.get(t.user_id) || 0) + 1);
        });
        let topUploader = null;
        if (userUploadCounts.size > 0) {
            const topUserId = Array.from(userUploadCounts.entries()).sort(([, a], [, b])=>b - a)[0][0];
            const { data: userData } = await adminClient.from('user_profiles').select('email, full_name').eq('id', topUserId).single();
            if (userData) {
                topUploader = {
                    email: userData.email,
                    fullName: userData.full_name || userData.email,
                    uploads: userUploadCounts.get(topUserId)
                };
            }
        }
        return {
            totalUploads,
            totalUsers,
            totalFileSize,
            totalFileSizeGB,
            totalAudioMinutes,
            averageUploadsPerUser,
            averageFileSizeMB,
            averageAudioMinutesPerUser,
            uploadsLast7Days: (recentTranscriptions || []).length,
            uploadsLast30Days: (monthTranscriptions || []).length,
            topUploader
        };
    } catch (error) {
        console.error('Failed to get overall upload stats:', error);
        throw error;
    }
}
}),
"[project]/src/app/api/admin/users/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "GET": ()=>GET
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/admin-service.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(request) {
    try {
        // Check authentication
        const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])();
        const supabaseUrl = ("TURBOPACK compile-time value", "https://yaznemrwbingjwqutbvb.supabase.co") || '';
        const supabaseAnonKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhem5lbXJ3YmluZ2p3cXV0YnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjA0MzAsImV4cCI6MjA3MTAzNjQzMH0.uluQzD4-m91tUq0gOrUNOfR9rlN0Ry4tAPlxp-PWrIo") || '';
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Try multiple ways to get the auth token
        let fullAuthToken = null;
        // Method 1: Try the main cookie
        const mainToken = cookieStore.get('sb-yaznemrwbingjwqutbvb-auth-token')?.value;
        if (mainToken && mainToken.length > 100) {
            fullAuthToken = mainToken;
        }
        // Method 2: Try to reconstruct from parts
        if (!fullAuthToken) {
            const authToken0 = cookieStore.get('sb-yaznemrwbingjwqutbvb-auth-token.0')?.value;
            const authToken1 = cookieStore.get('sb-yaznemrwbingjwqutbvb-auth-token.1')?.value;
            if (authToken0 && authToken1) {
                fullAuthToken = `${authToken0}.${authToken1}`;
            } else if (authToken0) {
                fullAuthToken = authToken0;
            }
        }
        // Method 3: Check Authorization header as fallback
        if (!fullAuthToken) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                fullAuthToken = authHeader.substring(7);
            }
        }
        if (!fullAuthToken) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No auth token',
                message: 'Please log in first at /login'
            }, {
                status: 401
            });
        }
        // Create a minimal client for auth verification
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });
        const { data: { user }, error } = await supabase.auth.getUser(fullAuthToken);
        if (error || !user) {
            console.log('Authentication failed:', {
                error: error?.message,
                hasUser: !!user
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Use admin client for database operations
        const adminClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createAdminClient"])();
        // Check if user is admin
        const { data: profile, error: profileError } = await adminClient.from('user_profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'admin') {
            console.log('Admin check failed:', {
                userId: user.id,
                role: profile?.role
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden: Admin access required'
            }, {
                status: 403
            });
        }
        // Parse query parameters
        const searchParams = request.nextUrl.searchParams;
        const rawPage = parseInt(searchParams.get('page') || '1');
        const rawPageSize = parseInt(searchParams.get('pageSize') || '50');
        const filters = {
            search: searchParams.get('search') || undefined,
            role: searchParams.get('role') || undefined,
            isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
            page: Math.max(1, rawPage),
            pageSize: Math.max(1, rawPageSize),
            sortField: searchParams.get('sortField') || undefined,
            sortDirection: searchParams.get('sortDirection') || undefined
        };
        // Handle different types of requests
        const requestType = searchParams.get('type');
        if (requestType === 'upload-stats') {
            // Get upload statistics
            const timeRange = searchParams.get('timeRange');
            const userStats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserUploadStats"])(timeRange);
            const overallStats = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getOverallUploadStats"])();
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                userStats,
                overallStats
            });
        }
        // Get users and stats
        const [usersData, stats] = await Promise.all([
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["listUsers"])(filters),
            searchParams.get('includeStats') === 'true' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserStats"])() : null
        ]);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ...usersData,
            stats
        });
    } catch (error) {
        console.error('Error in admin users API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__776cfafc._.js.map