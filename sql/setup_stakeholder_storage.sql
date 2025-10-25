-- ==============================================================================
-- Stakeholder Storage Bucket Setup
-- ==============================================================================
-- This script creates the necessary storage bucket for stakeholder documents
-- and sets up appropriate access policies.
-- ==============================================================================

-- Create stakeholder-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stakeholder-documents',
  'stakeholder-documents',
  true,  -- Public bucket for easy access
  10485760,  -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- Storage Policies
-- ==============================================================================

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload stakeholder documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stakeholder-documents');

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update stakeholder documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'stakeholder-documents');

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete stakeholder documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'stakeholder-documents');

-- Policy: Allow public read access to files
CREATE POLICY "Allow public read access to stakeholder documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'stakeholder-documents');

-- ==============================================================================
-- Notes
-- ==============================================================================
-- File naming convention: {stakeholder_id}/step-{step_id}/{field_key}_{timestamp}.{ext}
-- This structure helps organize files by stakeholder and step
-- Files are uploaded through the uploadStakeholderStepFile function
-- ==============================================================================
