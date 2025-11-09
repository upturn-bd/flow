-- ==============================================================================
-- Update Stakeholder Storage Bucket MIME Types
-- ==============================================================================
-- This script updates the stakeholder-documents bucket to allow more file types
-- ==============================================================================

-- Update the bucket to allow all file types (or specific ones you need)
UPDATE storage.buckets
SET allowed_mime_types = NULL  -- NULL means allow all file types
WHERE id = 'stakeholder-documents';

-- Alternatively, if you want to keep restrictions but add more types:
-- UPDATE storage.buckets
-- SET allowed_mime_types = ARRAY[
--   'application/pdf',
--   'application/msword',
--   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--   'application/vnd.ms-excel',
--   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
--   'application/vnd.ms-powerpoint',
--   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
--   'application/zip',
--   'application/x-zip-compressed',
--   'text/plain',
--   'text/csv',
--   'image/jpeg',
--   'image/png',
--   'image/jpg',
--   'image/gif',
--   'image/webp'
-- ]
-- WHERE id = 'stakeholder-documents';

-- ==============================================================================
-- Verify the update
-- ==============================================================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'stakeholder-documents';
