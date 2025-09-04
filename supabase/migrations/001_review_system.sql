-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');

-- Create enum for review status
CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');

-- Create user_profiles table to store role and additional user info
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'transcriptionist',
  assigned_editor_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create reviews table for tracking review requests
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status review_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0, -- 0 = normal, 1 = high, 2 = urgent
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  editor_notes TEXT,
  original_text TEXT, -- Store original before edits
  edited_text TEXT,   -- Store edited version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create review_comments table for communication between transcriptionist and editor
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  timestamp_reference DECIMAL, -- Reference to audio timestamp if needed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create audit_log table for tracking all changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add review-related columns to transcriptions table
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS review_status review_status DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES reviews(id),
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_version TEXT,
ADD COLUMN IF NOT EXISTS transcriptionist_id UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_assigned_to ON reviews(assigned_to);
CREATE INDEX idx_reviews_requested_by ON reviews(requested_by);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_assigned_editor ON user_profiles(assigned_editor_id);
CREATE INDEX idx_transcriptions_review_status ON transcriptions(review_status);

-- Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Editors can view their assigned transcriptionists" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND up.role = 'editor'
      AND user_profiles.assigned_editor_id = auth.uid()
    )
  );

-- Create RLS policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review requests" ON reviews
  FOR SELECT USING (
    requested_by = auth.uid() OR 
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Transcriptionists can create review requests" ON reviews
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'transcriptionist'
    )
  );

CREATE POLICY "Editors can update reviews assigned to them" ON reviews
  FOR UPDATE USING (
    assigned_to = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'editor'
    )
  );

-- Create RLS policies for review_comments
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their reviews" ON review_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_comments.review_id
      AND (r.requested_by = auth.uid() OR r.assigned_to = auth.uid())
    )
  );

CREATE POLICY "Users can add comments to their reviews" ON review_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_comments.review_id
      AND (r.requested_by = auth.uid() OR r.assigned_to = auth.uid())
    )
  );

-- Create function to automatically assign editor based on transcriptionist
CREATE OR REPLACE FUNCTION assign_editor_to_review()
RETURNS TRIGGER AS $$
BEGIN
  -- If no editor is assigned, get the transcriptionist's assigned editor
  IF NEW.assigned_to IS NULL THEN
    SELECT assigned_editor_id INTO NEW.assigned_to
    FROM user_profiles
    WHERE id = NEW.requested_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign editor
CREATE TRIGGER auto_assign_editor
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION assign_editor_to_review();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log audit trail
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_data)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for important tables
CREATE TRIGGER audit_reviews
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_transcriptions
  AFTER UPDATE ON transcriptions
  FOR EACH ROW
  WHEN (OLD.transcription_text IS DISTINCT FROM NEW.transcription_text 
    OR OLD.final_version IS DISTINCT FROM NEW.final_version)
  EXECUTE FUNCTION create_audit_log();

-- Insert default admin and sample users (optional, for testing)
-- You can remove this section in production
/*
INSERT INTO user_profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'name', 'transcriptionist'
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
*/
