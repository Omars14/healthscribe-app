-- Medical Transcription System Database Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Enhance existing transcriptions table
-- ============================================

ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS formatted_text TEXT,
ADD COLUMN IF NOT EXISTS formatting_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
ADD COLUMN IF NOT EXISTS formatting_prompt TEXT,
ADD COLUMN IF NOT EXISTS is_formatted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS final_text TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_type ON transcriptions(document_type);
CREATE INDEX IF NOT EXISTS idx_is_formatted ON transcriptions(is_formatted);
CREATE INDEX IF NOT EXISTS idx_status_formatted ON transcriptions(status, is_formatted);

-- ============================================
-- 2. Create document templates table
-- ============================================

CREATE TABLE IF NOT EXISTS document_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  formatting_instructions TEXT NOT NULL,
  structure_template JSONB,
  example_output TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default medical document templates
INSERT INTO document_templates (document_type, display_name, formatting_instructions) VALUES
('consultation', 'Consultation Note', 'Format as a consultation note with: CHIEF COMPLAINT, HISTORY OF PRESENT ILLNESS, PAST MEDICAL HISTORY, MEDICATIONS, ALLERGIES, PHYSICAL EXAMINATION, ASSESSMENT, and PLAN sections.'),
('surgery_report', 'Surgery Report', 'Format as an operative report with: PREOPERATIVE DIAGNOSIS, POSTOPERATIVE DIAGNOSIS, PROCEDURE PERFORMED, SURGEON, ASSISTANT, ANESTHESIA, INDICATIONS, FINDINGS, TECHNIQUE, and ESTIMATED BLOOD LOSS sections.'),
('discharge_summary', 'Discharge Summary', 'Format with: ADMISSION DATE, DISCHARGE DATE, ADMITTING DIAGNOSIS, DISCHARGE DIAGNOSIS, HOSPITAL COURSE, DISCHARGE MEDICATIONS, DISCHARGE INSTRUCTIONS, and FOLLOW-UP sections.'),
('progress_note', 'Progress Note', 'Format as SOAP note with clear sections: SUBJECTIVE (patient complaints and symptoms), OBJECTIVE (vital signs and exam findings), ASSESSMENT (diagnosis and clinical impression), and PLAN (treatment and next steps).'),
('radiology_report', 'Radiology Report', 'Format with: INDICATION, TECHNIQUE, COMPARISON, FINDINGS (organized by anatomical region), and IMPRESSION sections.'),
('pathology_report', 'Pathology Report', 'Format with: SPECIMEN IDENTIFICATION, GROSS DESCRIPTION, MICROSCOPIC DESCRIPTION, SPECIAL STAINS, and DIAGNOSIS sections.'),
('emergency_note', 'Emergency Department Note', 'Format with: CHIEF COMPLAINT, HPI, REVIEW OF SYSTEMS, PAST MEDICAL HISTORY, MEDICATIONS, ALLERGIES, PHYSICAL EXAM, ED COURSE, MEDICAL DECISION MAKING, and DISPOSITION sections.'),
('procedure_note', 'Procedure Note', 'Format with: PROCEDURE, INDICATION, CONSENT, PREPARATION, TECHNIQUE, FINDINGS, COMPLICATIONS, and POST-PROCEDURE INSTRUCTIONS sections.')
ON CONFLICT (document_type) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  formatting_instructions = EXCLUDED.formatting_instructions,
  updated_at = NOW();

-- ============================================
-- 3. Create transcription edits history table
-- ============================================

CREATE TABLE IF NOT EXISTS transcription_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  edited_text TEXT NOT NULL,
  edit_type VARCHAR(50), -- 'manual', 'ai_format', 'review', 'correction'
  edited_by UUID REFERENCES auth.users(id),
  edit_reason TEXT,
  changes_made JSONB, -- Track specific changes
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick history lookups
CREATE INDEX IF NOT EXISTS idx_transcription_edits_id ON transcription_edits(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_edits_version ON transcription_edits(transcription_id, version);

-- ============================================
-- 4. Enable Row Level Security
-- ============================================

-- Enable RLS on new tables
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_edits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create RLS Policies
-- ============================================

-- Document templates - everyone can read
CREATE POLICY "Document templates are viewable by all authenticated users"
  ON document_templates FOR SELECT
  TO authenticated
  USING (true);

-- Document templates - only admins can modify
CREATE POLICY "Only admins can modify document templates"
  ON document_templates FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Transcription edits - users can view their own
CREATE POLICY "Users can view their own transcription edits"
  ON transcription_edits FOR SELECT
  TO authenticated
  USING (
    transcription_id IN (
      SELECT id FROM transcriptions 
      WHERE user_id = auth.uid()
    )
  );

-- Transcription edits - users can create for their own transcriptions
CREATE POLICY "Users can create edits for their own transcriptions"
  ON transcription_edits FOR INSERT
  TO authenticated
  WITH CHECK (
    transcription_id IN (
      SELECT id FROM transcriptions 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. Create helper functions
-- ============================================

-- Function to get the latest formatted version
CREATE OR REPLACE FUNCTION get_latest_transcription_version(p_transcription_id UUID)
RETURNS TABLE (
  text_content TEXT,
  version INTEGER,
  edit_type VARCHAR(50),
  edited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(te.edited_text, t.final_text, t.formatted_text, t.transcription_text) as text_content,
    COALESCE(te.version, t.version) as version,
    te.edit_type,
    COALESCE(te.created_at, t.reviewed_at, t.completed_at) as edited_at
  FROM transcriptions t
  LEFT JOIN LATERAL (
    SELECT * FROM transcription_edits
    WHERE transcription_id = p_transcription_id
    ORDER BY version DESC
    LIMIT 1
  ) te ON true
  WHERE t.id = p_transcription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save a new version
CREATE OR REPLACE FUNCTION save_transcription_version(
  p_transcription_id UUID,
  p_text TEXT,
  p_edit_type VARCHAR(50),
  p_edit_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_version INTEGER;
  v_edit_id UUID;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_new_version
  FROM transcription_edits
  WHERE transcription_id = p_transcription_id;
  
  -- Insert new version
  INSERT INTO transcription_edits (
    transcription_id,
    edited_text,
    edit_type,
    edited_by,
    edit_reason,
    version
  ) VALUES (
    p_transcription_id,
    p_text,
    p_edit_type,
    auth.uid(),
    p_edit_reason,
    v_new_version
  ) RETURNING id INTO v_edit_id;
  
  -- Update main table version
  UPDATE transcriptions
  SET 
    version = v_new_version,
    final_text = p_text,
    reviewed_at = NOW(),
    reviewed_by = auth.uid()
  WHERE id = p_transcription_id;
  
  RETURN v_edit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Create views for easier querying
-- ============================================

-- View for transcriptions with formatting status
CREATE OR REPLACE VIEW transcriptions_with_format AS
SELECT 
  t.*,
  dt.display_name as document_type_name,
  dt.formatting_instructions,
  CASE 
    WHEN t.final_text IS NOT NULL THEN 'reviewed'
    WHEN t.formatted_text IS NOT NULL THEN 'formatted'
    WHEN t.transcription_text IS NOT NULL THEN 'transcribed'
    ELSE 'pending'
  END as processing_stage,
  (
    SELECT COUNT(*) 
    FROM transcription_edits 
    WHERE transcription_id = t.id
  ) as edit_count
FROM transcriptions t
LEFT JOIN document_templates dt ON t.document_type = dt.document_type;

-- Grant access to the view
GRANT SELECT ON transcriptions_with_format TO authenticated;

-- ============================================
-- 8. Update triggers for timestamps
-- ============================================

-- Trigger to update updated_at on document_templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Create storage policies for medical documents
-- ============================================

-- Note: Run these in the Supabase dashboard under Storage policies
-- as they cannot be run via SQL

-- Example storage policy for medical audio files:
-- INSERT INTO storage.policies (bucket_id, name, definition, check_expression)
-- VALUES (
--   'audio-files',
--   'Medical audio upload policy',
--   'authenticated',
--   'bucket_id = ''audio-files'' AND auth.role() = ''authenticated'''
-- );

-- ============================================
-- 10. Analytics and monitoring
-- ============================================

-- Create a table for tracking performance metrics
CREATE TABLE IF NOT EXISTS transcription_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  metric_type VARCHAR(50), -- 'upload_time', 'transcription_time', 'formatting_time'
  duration_ms INTEGER,
  document_type VARCHAR(100),
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON transcription_metrics(metric_type, created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_document_type ON transcription_metrics(document_type);

-- ============================================
-- Verification Query - Run this to check setup
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Medical transcription database setup complete!';
  RAISE NOTICE 'Tables created: document_templates, transcription_edits, transcription_metrics';
  RAISE NOTICE 'Columns added to transcriptions table';
  RAISE NOTICE 'RLS policies configured';
  RAISE NOTICE 'Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure storage bucket policies in Supabase dashboard';
  RAISE NOTICE '2. Set up Gemini API credentials in n8n';
  RAISE NOTICE '3. Import the medical workflow JSON in n8n';
  RAISE NOTICE '4. Update your Vercel environment variables';
END $$;
