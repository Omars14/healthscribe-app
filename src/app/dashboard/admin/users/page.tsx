'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AdminRouteGuard } from '@/components/admin-route-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, 
  Shield, 
  Edit, 
  UserCheck, 
  Search, 
  Filter, 
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  UserX,
  Activity,
  Clock
} from 'lucide-react';
import { AdminUser, UserFilters, UserStats, UserStatus } from '@/types/admin';
import { UserRole } from '@/types/review';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/lib/hooks/use-debounce';

export default function AdminUsersPage() {
  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  // Dialogs
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [editorAssignDialog, setEditorAssignDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [bulkActionDialog, setBulkActionDialog] = useState<{ open: boolean; action: string }>({ open: false, action: '' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: () => void; title: string; description: string }>({
    open: false,
    action: () => {},
    title: '',
    description: ''
  });

  // Dialog form state
  const [newRole, setNewRole] = useState<UserRole>('transcriptionist');
  const [selectedEditorId, setSelectedEditorId] = useState<string>('');
  const [editors, setEditors] = useState<{ id: string; name: string; email: string }[]>([]);

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    try {
      const filters: UserFilters = {
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
        page: currentPage,
        pageSize
      };

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.isActive !== undefined) queryParams.append('isActive', String(filters.isActive));
      queryParams.append('page', String(filters.page));
      queryParams.append('pageSize', String(filters.pageSize));
      queryParams.append('includeStats', currentPage === 1 ? 'true' : 'false');

      const response = await fetch(`/api/admin/users?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.users);
      if (data.stats) {
        setStats(data.stats);
      }
      setTotalPages(Math.ceil(data.total / pageSize));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, currentPage, pageSize]);

  // Fetch editors for assignment
  const fetchEditors = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?role=editor&pageSize=100');
      const data = await response.json();
      
      if (response.ok && data.users) {
        setEditors(data.users.map((u: AdminUser) => ({
          id: u.id,
          name: u.full_name || u.email,
          email: u.email
        })));
      }
    } catch (error) {
      console.error('Error fetching editors:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchEditors();
  }, [fetchEditors]);

  // Handle user role change
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }

      toast.success('User role updated successfully');
      fetchUsers();
      setRoleChangeDialog({ open: false, user: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  // Handle editor assignment
  const handleEditorAssignment = async (userId: string, editorId: string | null) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedEditorId: editorId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign editor');
      }

      toast.success('Editor assigned successfully');
      fetchUsers();
      setEditorAssignDialog({ open: false, user: null });
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign editor');
    }
  };

  // Handle user deactivation
  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate user');
      }

      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, payload: any) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          ...payload
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk action failed');
      }

      toast.success(`Successfully updated ${result.updated_count} users`);
      if (result.error_count > 0) {
        toast.warning(`Failed to update ${result.error_count} users`);
      }

      setSelectedUsers(new Set());
      fetchUsers();
      setBulkActionDialog({ open: false, action: '' });
    } catch (error: any) {
      toast.error(error.message || 'Bulk action failed');
    }
  };

  // Get user status
  const getUserStatus = (user: AdminUser): { status: UserStatus; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } => {
    if (!user.is_active) {
      return { status: 'inactive', label: 'Inactive', variant: 'destructive' };
    }
    if (!user.email_confirmed_at) {
      return { status: 'pending_confirmation', label: 'Pending', variant: 'outline' };
    }
    if (!user.last_sign_in_at) {
      return { status: 'never_logged_in', label: 'Never logged in', variant: 'secondary' };
    }
    
    const lastActive = user.last_active || user.last_sign_in_at;
    const daysSinceActive = lastActive 
      ? Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceActive && daysSinceActive <= 30) {
      return { status: 'active', label: 'Active', variant: 'default' };
    }

    return { status: 'inactive', label: `Inactive ${daysSinceActive} days`, variant: 'secondary' };
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Toggle all users selection
  const toggleAllUsers = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  return (
    <AdminRouteGuard>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header with stats */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
            </div>
            <Button 
              onClick={() => { setRefreshing(true); fetchUsers(); }}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_users} active, {stats.inactive_users} inactive
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.admins_count}</div>
                  <p className="text-xs text-muted-foreground">System administrators</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Editors</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.editors_count}</div>
                  <p className="text-xs text-muted-foreground">Content reviewers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transcriptionists</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.transcriptionists_count}</div>
                  <p className="text-xs text-muted-foreground">Content creators</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Filters and actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Users</CardTitle>
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedUsers.size} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'role' })}>
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'editor' })}>
                        Assign Editor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setBulkActionDialog({ open: true, action: 'deactivate' })}>
                        Deactivate Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="transcriptionist">Transcriptionist</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedUsers.size === users.length && users.length > 0}
                            onCheckedChange={toggleAllUsers}
                          />
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned Editor</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const status = getUserStatus(user);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUsers.has(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.full_name || 'No name'}</div>
                                <div className="text-sm text-muted-foreground">{user.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                user.role === 'admin' ? 'default' :
                                user.role === 'editor' ? 'secondary' : 'outline'
                              }>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.assigned_editor_name || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Activity className="h-3 w-3" />
                                  {user.transcription_count} transcriptions
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {user.last_active 
                                    ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                                    : 'Never'
                                  }
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setNewRole(user.role);
                                      setRoleChangeDialog({ open: true, user });
                                    }}
                                  >
                                    Change Role
                                  </DropdownMenuItem>
                                  {user.role === 'transcriptionist' && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedEditorId(user.assigned_editor_id || '');
                                        setEditorAssignDialog({ open: true, user });
                                      }}
                                    >
                                      Assign Editor
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => {
                                      setConfirmDialog({
                                        open: true,
                                        title: 'Deactivate User',
                                        description: `Are you sure you want to deactivate ${user.email}? They will no longer be able to access the system.`,
                                        action: () => handleDeactivateUser(user.id)
                                      });
                                    }}
                                  >
                                    Deactivate User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Role Change Dialog */}
        <Dialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {roleChangeDialog.user?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="transcriptionist">Transcriptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleChangeDialog({ open: false, user: null })}>
                Cancel
              </Button>
              <Button onClick={() => roleChangeDialog.user && handleRoleChange(roleChangeDialog.user.id, newRole)}>
                Update Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editor Assignment Dialog */}
        <Dialog open={editorAssignDialog.open} onOpenChange={(open) => setEditorAssignDialog({ open, user: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Editor</DialogTitle>
              <DialogDescription>
                Assign an editor to {editorAssignDialog.user?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Editor</Label>
                <Select value={selectedEditorId} onValueChange={setSelectedEditorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an editor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No editor</SelectItem>
                    {editors.map((editor) => (
                      <SelectItem key={editor.id} value={editor.id}>
                        {editor.name} ({editor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditorAssignDialog({ open: false, user: null })}>
                Cancel
              </Button>
              <Button 
                onClick={() => editorAssignDialog.user && handleEditorAssignment(
                  editorAssignDialog.user.id, 
                  selectedEditorId || null
                )}
              >
                Assign Editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Dialog */}
        <Dialog open={bulkActionDialog.open} onOpenChange={(open) => setBulkActionDialog({ open, action: '' })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {bulkActionDialog.action === 'role' && 'Bulk Role Change'}
                {bulkActionDialog.action === 'editor' && 'Bulk Editor Assignment'}
                {bulkActionDialog.action === 'deactivate' && 'Bulk Deactivation'}
              </DialogTitle>
              <DialogDescription>
                This action will affect {selectedUsers.size} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {bulkActionDialog.action === 'role' && (
                <div className="space-y-2">
                  <Label>New Role</Label>
                  <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="transcriptionist">Transcriptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {bulkActionDialog.action === 'editor' && (
                <div className="space-y-2">
                  <Label>Select Editor</Label>
                  <Select value={selectedEditorId} onValueChange={setSelectedEditorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an editor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No editor</SelectItem>
                      {editors.map((editor) => (
                        <SelectItem key={editor.id} value={editor.id}>
                          {editor.name} ({editor.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {bulkActionDialog.action === 'deactivate' && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Warning</p>
                    <p className="text-muted-foreground">
                      Deactivating users will immediately revoke their access to the system. 
                      This action can be reversed by reactivating the users later.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkActionDialog({ open: false, action: '' })}>
                Cancel
              </Button>
              <Button 
                variant={bulkActionDialog.action === 'deactivate' ? 'destructive' : 'default'}
                onClick={() => {
                  if (bulkActionDialog.action === 'role') {
                    handleBulkAction('role', { role: newRole });
                  } else if (bulkActionDialog.action === 'editor') {
                    handleBulkAction('editor', { editorId: selectedEditorId || null });
                  } else if (bulkActionDialog.action === 'deactivate') {
                    handleBulkAction('deactivate', { isActive: false });
                  }
                }}
              >
                {bulkActionDialog.action === 'deactivate' ? 'Deactivate Users' : 'Apply Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog({ ...confirmDialog, open: false });
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminRouteGuard>
  );
}
