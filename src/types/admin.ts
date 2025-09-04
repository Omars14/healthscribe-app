import { UserRole } from './review';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  assigned_editor_id: string | null;
  assigned_editor_name: string | null;
  is_active: boolean;
  last_active: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  transcription_count: number;
  review_count: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole | '';
  isActive?: boolean | '';
  page?: number;
  pageSize?: number;
}

export interface UserStats {
  total_users: number;
  admins_count: number;
  editors_count: number;
  transcriptionists_count: number;
  active_users: number;
  inactive_users: number;
  users_last_30_days: number;
}

export interface BulkUpdatePayload {
  userIds: string[];
  role?: UserRole;
  editorId?: string | null;
  isActive?: boolean;
}

export interface BulkUpdateResult {
  updated_count: number;
  error_count: number;
}

export type UserStatus = 'active' | 'inactive' | 'never_logged_in' | 'pending_confirmation';

export interface AdminApiError {
  message: string;
  code?: string;
  details?: any;
}
