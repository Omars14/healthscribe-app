# Admin User Management Documentation

## Overview

The Admin User Management system provides comprehensive tools for administrators to manage user accounts, roles, and permissions in the medical transcription platform.

## Features

### 1. User Roles
The system supports three distinct user roles:

- **Admin**: Full system access, can manage all users and settings
- **Editor**: Can review and edit transcriptions, assigned to specific transcriptionists
- **Transcriptionist**: Creates and manages transcriptions, can be assigned to an editor

### 2. Core Capabilities

#### User Management
- View all users with detailed information
- Search and filter users by name, email, role, or status
- Pagination for large user lists
- Real-time user activity tracking

#### Role Management
- Change user roles (admin, editor, transcriptionist)
- Assign editors to transcriptionists
- Bulk role updates for multiple users

#### Account Management
- Activate/deactivate user accounts
- Track user login history and activity
- Monitor transcription and review counts

#### Bulk Operations
- Select multiple users for batch operations
- Bulk role changes
- Bulk editor assignments
- Bulk account deactivation

## Security

### Database-Level Security
All admin functions are protected at the database level using:
- Row Level Security (RLS) policies
- SECURITY DEFINER functions with admin checks
- Audit logging for all administrative actions

### Application-Level Security
- Admin route guard component checks user role
- API endpoints verify admin privileges
- Service role key used only for server-side operations

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Database Migration
Run the admin migration SQL in your Supabase dashboard:
```bash
supabase/migrations/002_admin_role_management.sql
```

### 3. Initial Admin Setup
1. Create your first user account via the signup page
2. Manually update the user role in Supabase dashboard:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 4. Access Admin Panel
Navigate to `/dashboard/admin/users` when logged in as an admin.

## Usage Guide

### Accessing the Admin Panel
1. Log in with an admin account
2. Navigate to `/dashboard/admin/users`
3. The AdminRouteGuard will verify your permissions

### Managing Users

#### Searching and Filtering
- Use the search bar to find users by name or email
- Filter by role: Admin, Editor, or Transcriptionist
- Filter by status: Active or Inactive
- Results update in real-time with debounced search

#### Individual User Actions
1. Click the actions menu (three dots) for any user
2. Available actions:
   - **Change Role**: Update the user's system role
   - **Assign Editor**: Link a transcriptionist to an editor
   - **Deactivate User**: Soft-delete the user account

#### Bulk Actions
1. Select users using checkboxes
2. Click "Bulk Actions" button
3. Choose from:
   - Change role for all selected users
   - Assign the same editor to multiple transcriptionists
   - Deactivate multiple accounts

### User Statistics
The dashboard displays real-time statistics:
- Total user count
- Breakdown by role
- Active vs inactive users
- Recent activity metrics

## API Endpoints

### GET /api/admin/users
Fetch users with filters and pagination
```typescript
Query Parameters:
- search: string (optional)
- role: 'admin' | 'editor' | 'transcriptionist' (optional)
- isActive: boolean (optional)
- page: number (default: 1)
- pageSize: number (default: 50)
- includeStats: boolean (optional)
```

### PATCH /api/admin/users/[id]
Update a single user
```typescript
Body:
{
  role?: UserRole;
  assignedEditorId?: string | null;
}
```

### DELETE /api/admin/users/[id]
Deactivate a user account

### POST /api/admin/users/bulk
Perform bulk operations
```typescript
Body:
{
  userIds: string[];
  role?: UserRole;
  editorId?: string | null;
  isActive?: boolean;
}
```

## Database Functions

The following PostgreSQL functions power the admin features:

- `admin_list_users()`: Fetch users with detailed information
- `admin_update_user_role()`: Change a user's role
- `admin_assign_editor()`: Link transcriptionist to editor
- `admin_bulk_update_users()`: Update multiple users
- `admin_get_user_stats()`: Get system statistics
- `admin_deactivate_user()`: Soft-delete user account

All functions include:
- Admin role verification
- Audit logging
- Error handling
- Transaction safety

## Troubleshooting

### Common Issues

#### "Unauthorized: Admin access required"
- Verify the user has admin role in user_profiles table
- Check that authentication token is valid
- Ensure RLS policies are properly configured

#### "Cannot remove the last admin"
- System prevents removing admin role from the last admin user
- Create another admin account before changing roles

#### "Failed to fetch users"
- Check SUPABASE_SERVICE_ROLE_KEY is set correctly
- Verify database migrations have been applied
- Check Supabase service status

### Debugging Tips
1. Check browser console for detailed error messages
2. Review Supabase logs for database errors
3. Verify API endpoints are returning expected data
4. Check audit_log table for action history

## Best Practices

### Security
- Never expose service role key to client-side code
- Regularly audit admin access logs
- Use strong passwords for admin accounts
- Enable 2FA when available

### Performance
- Use pagination for large user lists
- Implement search debouncing (300ms default)
- Cache editor lists for assignment dropdowns
- Use database indexes for common queries

### User Experience
- Provide clear feedback for all actions
- Use confirmation dialogs for destructive operations
- Show loading states during async operations
- Display helpful error messages

## Future Enhancements

Planned improvements for the admin system:

1. **Advanced Filtering**
   - Date range filters for activity
   - Multiple role selection
   - Custom user attributes

2. **Reporting**
   - User activity reports
   - Role distribution charts
   - Login frequency analytics

3. **Automation**
   - Scheduled user deactivation
   - Automatic role assignments
   - Bulk user import/export

4. **Security**
   - Two-factor authentication
   - Session management
   - IP-based access controls

5. **Audit Trail**
   - Detailed action history
   - Change comparison views
   - Export audit logs

## Support

For issues or questions:
1. Check this documentation
2. Review the codebase comments
3. Check Supabase dashboard logs
4. Contact the development team

Remember: With great power comes great responsibility. Admin actions affect all users, so always double-check before making changes.
