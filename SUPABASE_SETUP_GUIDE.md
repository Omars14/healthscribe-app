# Supabase Setup Guide for Medical Transcription System

## 🎯 Overview

This guide covers setting up Supabase for your medical transcription system. You have two main options:

### Option A: Supabase Cloud (Recommended)
- Managed service with excellent performance
- Built-in authentication and storage
- Easy scaling and monitoring
- Free tier available

### Option B: Self-Hosted Supabase
- Full control over your data
- No vendor lock-in
- Custom configurations
- Higher maintenance overhead

---

## 🚀 Option A: Supabase Cloud Setup (Recommended)

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Create New Project

1. Click **"New Project"**
2. Choose your organization
3. Fill in project details:
   - **Name**: `medical-transcription`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest to your users
4. Click **"Create Project"**

### Step 3: Get Project Credentials

Wait for the project to be created (2-3 minutes), then:

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Database Setup

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the entire contents of each migration file in order:

#### Migration 1: Core Database Schema
```sql
-- Copy the entire contents of supabase/migrations/001_review_system.sql
```

#### Migration 2: Admin Role Management
```sql
-- Copy the entire contents of supabase/migrations/002_admin_role_management_simplified.sql
```

#### Migration 3: Medical Transcription Features
```sql
-- Copy the entire contents of supabase-medical-migration.sql
```

### Step 5: Storage Setup

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket:
   - **Name**: `audio-files`
   - **Public bucket**: `OFF` (for security)
3. Click on the bucket and go to **Policies**
4. Add these policies:

#### Policy 1: Upload Policy
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload audio files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');
```

#### Policy 2: View Policy
```sql
-- Allow users to view their own uploaded files
CREATE POLICY "Users can view their own audio files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### Policy 3: Delete Policy
```sql
-- Allow users to delete their own files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 6: Authentication Setup

1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `https://your-domain.com`
   - **Redirect URLs**: `https://your-domain.com/auth/callback`
3. Enable email confirmation if desired

### Step 7: Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Other required variables
NEXT_PUBLIC_URL=https://your-domain.com
N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/medical-transcribe-v2
```

---

## 🏠 Option B: Self-Hosted Supabase Setup

### Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 1: Clone Supabase Repository

```bash
git clone https://github.com/supabase/supabase
cd supabase/docker
```

### Step 2: Configuration

Create a `.env` file:

```env
# Database
POSTGRES_PASSWORD=your-super-secret-password
POSTGRES_DB=postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432

# JWT Secret (generate a random string)
JWT_SECRET=your-jwt-secret-here

# API Keys
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URLs
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Start Supabase

```bash
docker-compose up -d
```

### Step 4: Database Migrations

1. Connect to the database:
```bash
docker exec -it supabase_db psql -U postgres
```

2. Run the migration files in order (same as cloud setup)

### Step 5: Storage Configuration

For self-hosted Supabase, you'll need to configure MinIO for storage:

1. Access MinIO at `http://localhost:9000`
2. Create a bucket named `audio-files`
3. Configure storage policies via the database

---

## 🔧 Database Migration Scripts

### Combined Migration Script

If you prefer to run everything at once, use this combined script:

```sql
-- ============================================
-- Combined Medical Transcription Database Setup
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'transcriptionist');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'transcriptionist',
  assigned_editor_id UUID REFERENCES auth.users(id),
  last_active TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status review_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  editor_notes TEXT,
  original_text TEXT,
  edited_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create document_templates table
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

-- Create transcription_edits table
CREATE TABLE IF NOT EXISTS transcription_edits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  edited_text TEXT NOT NULL,
  edit_type VARCHAR(50),
  edited_by UUID REFERENCES auth.users(id),
  edit_reason TEXT,
  changes_made JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcription_metrics table
CREATE TABLE IF NOT EXISTS transcription_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  metric_type VARCHAR(50),
  duration_ms INTEGER,
  document_type VARCHAR(100),
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to transcriptions table
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS review_status review_status,
ADD COLUMN IF NOT EXISTS review_id UUID,
ADD COLUMN IF NOT EXISTS is_final BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_version TEXT,
ADD COLUMN IF NOT EXISTS transcriptionist_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS formatted_text TEXT,
ADD COLUMN IF NOT EXISTS formatting_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
ADD COLUMN IF NOT EXISTS formatting_prompt TEXT,
ADD COLUMN IF NOT EXISTS is_formatted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS final_text TEXT,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_assigned_to ON reviews(assigned_to);
CREATE INDEX IF NOT EXISTS idx_reviews_requested_by ON reviews(requested_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_assigned_editor ON user_profiles(assigned_editor_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_transcriptions_review_status ON transcriptions(review_status);
CREATE INDEX IF NOT EXISTS idx_document_type ON transcriptions(document_type);
CREATE INDEX IF NOT EXISTS idx_is_formatted ON transcriptions(is_formatted);
CREATE INDEX IF NOT EXISTS idx_status_formatted ON transcriptions(status, is_formatted);
CREATE INDEX IF NOT EXISTS idx_transcription_edits_id ON transcription_edits(transcription_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON transcription_metrics(metric_type, created_at);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Document templates are viewable by all authenticated users" ON document_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own transcription edits" ON transcription_edits FOR SELECT TO authenticated USING (transcription_id IN (SELECT id FROM transcriptions WHERE user_id = auth.uid()));

-- Insert default document templates
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

-- Create helper functions
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

-- Create views
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

-- Grant permissions
GRANT SELECT ON transcriptions_with_format TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Medical transcription database setup complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '✅ Tables created: user_profiles, reviews, document_templates, transcription_edits, transcription_metrics';
  RAISE NOTICE '✅ Columns added to transcriptions table';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Row Level Security enabled';
  RAISE NOTICE '✅ 8 medical document templates inserted';
  RAISE NOTICE '✅ Helper functions and views created';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Configure storage bucket policies in Supabase dashboard';
  RAISE NOTICE '2. Set up authentication in your application';
  RAISE NOTICE '3. Test the database connection';
  RAISE NOTICE '4. Import and configure n8n workflows';
END $$;
```

---

## 🧪 Testing Your Database Setup

### Test Queries

Run these queries in your Supabase SQL Editor to verify everything is working:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'reviews', 'document_templates', 'transcription_edits', 'transcription_metrics');

-- Check document templates
SELECT COUNT(*) FROM document_templates;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'reviews', 'document_templates');

-- Test the view
SELECT * FROM transcriptions_with_format LIMIT 5;
```

### Connection Test

Create a simple test file to verify your database connection:

```javascript
// test-db-connection.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error)
    } else {
      console.log('✅ Database connection successful!')
      console.log('📋 Document templates found:', data.length)
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err)
  }
}

testConnection()
```

---

## 🔐 Security Best Practices

### For Cloud Supabase

1. **API Keys**: Never commit them to version control
2. **RLS Policies**: Always enable Row Level Security
3. **Service Role Key**: Only use in server-side code
4. **Environment Variables**: Use different keys for different environments

### For Self-Hosted Supabase

1. **Network Security**: Restrict database access to your application servers
2. **SSL/TLS**: Always use encrypted connections
3. **Backup Strategy**: Regular automated backups
4. **Monitoring**: Set up monitoring and alerting
5. **Updates**: Keep Supabase and dependencies updated

---

## 📊 Monitoring & Maintenance

### Cloud Supabase Monitoring

1. **Dashboard**: Use the Supabase dashboard for metrics
2. **Logs**: Monitor authentication and database logs
3. **Performance**: Track query performance and usage
4. **Storage**: Monitor storage usage and costs

### Self-Hosted Monitoring

```bash
# Check Supabase services
docker ps

# View logs
docker logs supabase_db
docker logs supabase_api

# Monitor disk usage
df -h

# Database size
docker exec supabase_db psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"
```

---

## 🚨 Troubleshooting

### Common Issues

#### Connection Issues
```sql
-- Check if your IP is allowed (for self-hosted)
-- Verify environment variables are correct
-- Check firewall settings
```

#### RLS Policy Issues
```sql
-- Test policies with authenticated user
-- Check auth.uid() is working correctly
-- Verify JWT tokens are valid
```

#### Migration Errors
```sql
-- Check for duplicate objects
-- Verify dependencies exist
-- Run migrations in correct order
```

### Getting Help

1. **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
2. **Community Forums**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
3. **GitHub Issues**: Report bugs and feature requests

---

## 🎯 Summary

You've successfully set up Supabase for your medical transcription system!

**Cloud Setup (Recommended):**
- ✅ Supabase project created
- ✅ Database migrations run
- ✅ Storage bucket configured
- ✅ RLS policies applied
- ✅ Document templates loaded

**Self-Hosted Setup:**
- ✅ Docker containers running
- ✅ Database initialized
- ✅ Migrations applied
- ✅ Storage configured

**Next Steps:**
1. Configure your application environment variables
2. Set up n8n workflows
3. Test the complete system
4. Configure monitoring and backups

Your database is now ready to handle medical transcription workflows! 🩺
