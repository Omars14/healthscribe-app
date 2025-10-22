-- Create audio-files bucket with proper UUID
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES ('00000000-0000-0000-0000-000000000001', 'audio-files', '00000000-0000-0000-0000-000000000001'::uuid, true, 104857600, '{"audio/*","video/*"}');

-- Verify it exists
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';
