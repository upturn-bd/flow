# Stakeholder File Upload Implementation

## Overview

This document describes the complete file upload integration for the stakeholder process steps feature. Files can now be uploaded as part of step data, and are properly stored in Supabase storage.

## Architecture

### Storage Structure

Files are stored in the `stakeholder-documents` Supabase storage bucket with the following naming convention:

```
{stakeholder_id}/step-{step_id}/{field_key}_{timestamp}.{extension}
```

**Example:**
```
123/step-5/contract_document_1729900000000.pdf
```

This structure provides:
- Easy organization by stakeholder
- Clear separation by process step
- No naming conflicts (timestamp-based)
- Simple cleanup when deleting stakeholders

### File Upload Flow

#### 1. Draft Save (Files Uploaded, Step Not Completed)

When a user clicks "Save Draft":
1. Files are immediately uploaded to Supabase storage
2. File paths are stored in the step data
3. Step is marked as `is_completed: false`
4. User can continue editing later

#### 2. Step Completion (All Fields Validated)

When a user clicks "Complete Step":
1. Form validation ensures all required fields are filled
2. Files are uploaded if not already uploaded
3. File paths are stored in the step data
4. Step is marked as `is_completed: true`
5. If process is sequential, the stakeholder moves to the next step
6. If all steps are complete, stakeholder is marked as completed

## Components

### 1. File Upload Utility (`/src/lib/utils/files.ts`)

**New Functions:**

```typescript
// Upload a stakeholder step file
uploadStakeholderStepFile(
  file: File,
  stakeholderId: number,
  stepId: number,
  fieldKey: string,
  bucketName?: string
): Promise<{ uploadedFilePath?: string; publicUrl?: string; error?: string }>

// Get public URL for a stored file
getPublicFileUrl(
  filePath: string,
  bucketName?: string
): string

// Delete a file from storage
deleteFile(
  filePath: string,
  bucketName?: string
): Promise<{ success: boolean; error?: string }>
```

### 2. useStakeholders Hook (`/src/hooks/useStakeholders.tsx`)

**Updated `saveStepData` function:**
- Processes form data before saving
- Detects file fields from step definitions
- Uploads File objects to storage
- Stores file paths in the database
- Preserves existing file paths for already uploaded files

### 3. StepDataForm Component (`/src/components/stakeholder-processes/StepDataForm.tsx`)

**Enhanced Features:**
- File size validation (max 10MB)
- File type validation (PDF, DOC, DOCX, JPG, PNG)
- Visual file upload UI with drag-and-drop area
- File preview with name and remove option
- Upload status tracking
- Error handling with user-friendly messages

**UI States:**
- Empty state: Shows upload area with instructions
- File selected: Shows file name with remove button
- Uploaded file: Shows file name with view link
- Error state: Shows error message

### 4. Stakeholder Detail Page (`/src/app/(home)/admin-management/stakeholders/[id]/page.tsx`)

**Display Features:**
- Detects file fields in completed step data
- Renders clickable links for uploaded files
- Opens files in new tab
- Shows download icon for better UX

## Database Schema

### stakeholder_step_data Table

```sql
{
  id: number,
  stakeholder_id: number,
  step_id: number,
  data: {
    // File fields store the path in storage
    "contract_document": "123/step-5/contract_document_1729900000000.pdf",
    "id_proof": "123/step-5/id_proof_1729900000000.jpg",
    // Other field types store their values directly
    "client_name": "John Doe",
    "approved": true
  },
  field_definitions_snapshot: {...}, // Field definitions at time of save
  step_version: number,
  is_completed: boolean,
  completed_at: timestamp,
  completed_by: uuid,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Storage Setup

### Required Supabase Configuration

Run the SQL migration in `/sql/setup_stakeholder_storage.sql` to:

1. Create the `stakeholder-documents` bucket
2. Set file size limit to 10MB
3. Configure allowed MIME types
4. Set up access policies:
   - Authenticated users can upload/update/delete
   - Public read access for viewing files

### Storage Policies

```sql
-- Upload access
CREATE POLICY "Allow authenticated users to upload stakeholder documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'stakeholder-documents');

-- Read access
CREATE POLICY "Allow public read access to stakeholder documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'stakeholder-documents');

-- Update/Delete access
-- (See migration file for full policies)
```

## Usage Examples

### Defining a File Field in Process Step

```typescript
{
  key: "contract_document",
  label: "Contract Document",
  type: "file",
  required: true,
  placeholder: "Upload signed contract (PDF)"
}
```

### Saving Draft with Files

User selects a file → Clicks "Save Draft" → File is uploaded → Path stored in DB → User can edit later

### Completing Step with Files

User fills all fields → Selects files → Clicks "Complete Step" → Validation passes → Files uploaded → Step completed → Process advances

### Viewing Uploaded Files

On detail page → Completed steps show file links → Click to view/download → Opens in new tab

## Error Handling

### File Upload Errors

- **File too large:** "File size must be less than 10MB"
- **Invalid file type:** Rejected by file input accept attribute
- **Upload failed:** Shows specific error from Supabase
- **Network error:** Generic "Upload failed" message

### Form Validation Errors

- Required file fields must have a file selected
- Validation runs before step completion
- Errors displayed inline below each field

## Best Practices

### For Developers

1. Always use `uploadStakeholderStepFile()` for stakeholder files
2. Check field type before rendering file UI
3. Handle both File objects and file paths (strings)
4. Show loading states during upload
5. Provide clear error messages

### For Users

1. Upload files as early as possible (draft saves)
2. Keep files under 10MB
3. Use supported file formats
4. Name files descriptively
5. Verify file uploaded before completing step

## Security Considerations

1. **Authentication Required:** Only authenticated users can upload
2. **File Size Limit:** 10MB maximum prevents abuse
3. **MIME Type Validation:** Only allowed file types accepted
4. **Public Access:** Files are publicly readable (consider RLS if needed)
5. **Path Sanitization:** Field keys are sanitized in file paths

## Future Enhancements

### Potential Improvements

1. **Multiple Files per Field:** Support array of files
2. **File Versioning:** Track file changes over time
3. **Thumbnail Preview:** Show image thumbnails
4. **Drag & Drop:** Enhanced drag-and-drop UX
5. **Progress Indicators:** Show upload progress bars
6. **File Metadata:** Store file size, type, upload date
7. **Compression:** Automatic image compression
8. **Virus Scanning:** Integrate file scanning service

### Database Enhancements

1. **File Audit Trail:** Track who uploaded/modified files
2. **File Metadata Table:** Separate table for file information
3. **Cleanup Jobs:** Automatically remove orphaned files
4. **Storage Quotas:** Per-company storage limits

## Troubleshooting

### Files Not Uploading

1. Check Supabase storage bucket exists
2. Verify storage policies are configured
3. Check network connectivity
4. Verify file size < 10MB
5. Check browser console for errors

### Files Not Displaying

1. Verify file path is stored in step data
2. Check public URL generation
3. Verify storage bucket is public
4. Check file exists in storage

### Permission Errors

1. Verify user is authenticated
2. Check storage policies
3. Verify bucket permissions
4. Check RLS policies on stakeholder tables

## Related Files

- `/src/lib/utils/files.ts` - File upload utilities
- `/src/hooks/useStakeholders.tsx` - Stakeholder data management
- `/src/components/stakeholder-processes/StepDataForm.tsx` - Step form UI
- `/src/app/(home)/admin-management/stakeholders/[id]/page.tsx` - Detail view
- `/sql/setup_stakeholder_storage.sql` - Storage bucket setup

## Testing Checklist

- [ ] Create process step with file field
- [ ] Upload file in draft mode
- [ ] Save draft and verify file persists
- [ ] Complete step with file upload
- [ ] View uploaded file on detail page
- [ ] Download/view file in new tab
- [ ] Test file size validation (>10MB)
- [ ] Test file type restrictions
- [ ] Test removing uploaded file
- [ ] Test re-uploading different file
- [ ] Test multiple file fields in one step
- [ ] Test file upload error handling
- [ ] Test network failure during upload
- [ ] Verify file paths in database
- [ ] Verify files in Supabase storage bucket
