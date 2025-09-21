# Update Your Self-Hosted Supabase JWT Secret

## The Issue
Your application was using demo JWT tokens from Supabase's documentation instead of tokens signed with your instance's JWT secret. This causes "Invalid authentication credentials" errors.

## What I Fixed
1. ✅ Updated `.env.local` with properly signed JWT tokens
2. ✅ Removed hardcoded fallback tokens from `supabase.ts`
3. ✅ Generated new JWT tokens with correct issuer and expiration

## What You Need to Do
Update your self-hosted Supabase instance with this JWT secret:

```
JWT_SECRET=df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed
```

### How to Update (depending on your setup):

#### If using Docker Compose:
1. Edit your `docker-compose.yml` or `.env` file in your Supabase installation
2. Add or update: `JWT_SECRET=df180f53d2ac65309d8c40e190b112d75046d53dafd87b930fed843d11ddc44f75621fbdbfaad9aaa2c48e0dda66e48aaae065865de9c3cf305882de044232ed`
3. Restart your Supabase services: `docker-compose down && docker-compose up -d`

#### If using Kubernetes:
1. Update your ConfigMap or Secret with the new JWT_SECRET
2. Restart the auth service pods

#### If using other deployment methods:
1. Set the environment variable `JWT_SECRET` to the value above
2. Restart your Supabase auth service

## Test the Fix
After updating your Supabase instance:
1. Restart your Next.js application: `npm run dev`
2. Try logging in again at `/login`
3. The authentication should now work properly

## Create a Test User (if needed)
If you don't have any users in your database, you can create one through your Supabase dashboard or using SQL:

```sql
-- In your Supabase SQL editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('your_password', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated'
);
```

Replace `test@example.com` and `your_password` with your desired credentials.
