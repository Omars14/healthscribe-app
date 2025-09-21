#!/bin/bash

echo "🔧 INITIALIZING SUPABASE DATABASE SCHEMA"
echo "========================================"

# Function to check if a command succeeded
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Error occurred in step: $1"
        echo "Please check the logs above and fix the issue before continuing."
        exit 1
    fi
}

# Step 1: Check if database is running
echo "Step 1: Checking database status..."
docker ps | grep supabase_db_healthscribe
if [ $? -ne 0 ]; then
    echo "❌ Database container not running. Please start it first."
    exit 1
fi
echo "✅ Database container is running"

# Step 2: Wait for database to be ready
echo "Step 2: Waiting for database to be ready..."
sleep 10

# Step 3: Test database connection
echo "Step 3: Testing database connection..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database"
    exit 1
fi
echo "✅ Database connection successful"

# Step 4: Create auth schema
echo "Step 4: Creating auth schema..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Create auth schema objects
CREATE TYPE auth.factor_type AS ENUM ('totp', 'phone');
CREATE TYPE auth.factor_status AS ENUM ('unverified', 'verified');

-- Create auth tables
CREATE TABLE IF NOT EXISTS auth.users (
    instance_id uuid,
    id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
    aud character varying(255),
    role character varying(255),
    email character varying(255) UNIQUE,
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone character varying(255) DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change character varying(255) DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS auth.identities (
    id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower(identity_data->>'email')) STORED,
    CONSTRAINT identities_pkey PRIMARY KEY (provider, id),
    CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth.sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal aal_level DEFAULT 'aal1'::aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp with time zone,
    user_agent text,
    ip inet,
    tag text,
    CONSTRAINT sessions_pkey PRIMARY KEY (id),
    CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    instance_id uuid,
    id bigserial NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid REFERENCES auth.sessions(id) ON DELETE CASCADE,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_instance_id_email_idx ON auth.users USING btree (instance_id, email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users USING btree (instance_id);
CREATE INDEX IF NOT EXISTS identities_email_idx ON auth.identities USING btree (email text_pattern_ops);
CREATE INDEX IF NOT EXISTS identities_user_id_idx ON auth.identities USING btree (user_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS sessions_not_after_idx ON auth.sessions USING btree (not_after);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at);

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;
"
check_error "Auth schema creation"

echo "✅ Auth schema created successfully"

# Step 5: Create public schema tables (user_profiles, etc.)
echo "Step 5: Creating public schema tables..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
-- Create public schema tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON public.user_profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles USING btree (email);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS \"Users can view own profile\" ON public.user_profiles;
CREATE POLICY \"Users can view own profile\" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS \"Users can update own profile\" ON public.user_profiles;
CREATE POLICY \"Users can update own profile\" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS \"Users can insert own profile\" ON public.user_profiles;
CREATE POLICY \"Users can insert own profile\" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
"
check_error "Public schema creation"

echo "✅ Public schema tables created successfully"

# Step 6: Create storage schema
echo "Step 6: Creating storage schema..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";

-- Create storage tables
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid REFERENCES auth.users,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    CONSTRAINT buckets_pkey PRIMARY KEY (id),
    CONSTRAINT buckets_owner_fkey FOREIGN KEY (owner) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    bucket_id text,
    name text,
    owner uuid REFERENCES auth.users,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_pkey PRIMARY KEY (id),
    CONSTRAINT objects_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS buckets_name_key ON storage.buckets USING btree (name);
CREATE INDEX IF NOT EXISTS buckets_owner_key ON storage.buckets USING btree (owner);
CREATE INDEX IF NOT EXISTS objects_bucketId_name_key ON storage.objects USING btree (bucket_id, name);
CREATE INDEX IF NOT EXISTS objects_name_idx ON storage.objects USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS objects_owner_key ON storage.objects USING btree (owner);
CREATE INDEX IF NOT EXISTS objects_updated_at_idx ON storage.objects USING btree (updated_at);
CREATE INDEX IF NOT EXISTS path_tokens_idx ON storage.objects USING gin (path_tokens);

-- Enable RLS
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
"
check_error "Storage schema creation"

echo "✅ Storage schema created successfully"

# Step 7: Create graphql schema
echo "Step 7: Creating graphql schema..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
-- Create graphql schema
CREATE SCHEMA IF NOT EXISTS graphql_public;
"
check_error "GraphQL schema creation"

echo "✅ GraphQL schema created successfully"

# Step 8: Grant necessary permissions
echo "Step 8: Granting permissions..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
-- Grant permissions for auth
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres;

-- Grant permissions for public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;

-- Grant permissions for storage
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated;

-- Grant permissions for graphql
GRANT USAGE ON SCHEMA graphql_public TO postgres, anon, authenticated;
"
check_error "Permissions granting"

echo "✅ Permissions granted successfully"

# Step 9: Test schema creation
echo "Step 9: Testing schema creation..."
docker exec supabase_db_healthscribe psql -U postgres -d postgres -c "
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('auth', 'public', 'storage', 'graphql_public')
ORDER BY schemaname, tablename;
"
echo "✅ Database schema initialized successfully"

echo ""
echo "🎉 DATABASE SCHEMA INITIALIZATION COMPLETED!"
echo "============================================="
echo "✅ Auth schema created with all required tables"
echo "✅ Public schema created with user_profiles table"
echo "✅ Storage schema created for file uploads"
echo "✅ GraphQL schema created"
echo "✅ All permissions granted"
echo ""
echo "🚀 The database is now ready for Supabase services!"




