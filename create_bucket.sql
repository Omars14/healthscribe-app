-- Create audio-files bucket
INSERT INTO storage.buckets (id, name, owner, public, file_size_limit, allowed_mime_types)
VALUES ('audio-files', 'audio-files', '1'::uuid, true, 104857600, '{"audio/*","video/*"}');

-- Verify it exists
SELECT id, name, owner, public FROM storage.buckets WHERE name = 'audio-files';
