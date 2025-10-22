DROP POLICY IF EXISTS "Service role can read all profiles" ON public.user_profiles;
CREATE POLICY "Service role can read all profiles"
  ON public.user_profiles FOR SELECT
  USING (auth.role() = 'service_role' OR auth.uid() = id);
