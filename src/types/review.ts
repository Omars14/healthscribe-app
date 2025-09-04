export type UserRole = 'admin' | 'editor' | 'transcriptionist';

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';

export type ReviewPriority = 0 | 1 | 2; // 0 = normal, 1 = high, 2 = urgent

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  assigned_editor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  transcription_id: string;
  requested_by: string;
  assigned_to: string | null;
  status: ReviewStatus;
  priority: ReviewPriority;
  requested_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  editor_notes: string | null;
  original_text: string | null;
  edited_text: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  transcription?: any;
  requester?: UserProfile;
  editor?: UserProfile;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  comment: string;
  timestamp_reference: number | null;
  created_at: string;
  // Relations
  user?: UserProfile;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}
