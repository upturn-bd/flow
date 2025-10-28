# Stakeholder Issue Tracking System

This document provides an overview of the stakeholder issue tracking system implementation.

## Overview

The stakeholder issue tracking system is a ticketing system integrated with the process-based stakeholder management system. It allows employees to create, track, and resolve issues for stakeholders they are assigned to manage.

## Features

### 1. Issue Management
- Create, update, and delete issues for stakeholders
- Three status levels: **Pending**, **In Progress**, **Resolved**
- Four priority levels: **Low**, **Medium**, **High**, **Urgent**
- File attachment support (up to 10 files, 10MB each)
- Rich text descriptions

### 2. Issue Handler Assignment
- Each stakeholder can have an assigned **issue handler** (employee)
- Issue handlers can view all issues for stakeholders they manage
- Dedicated interface in operations-and-services section

### 3. Access Control
- **Admin users**: Can view and manage all issues via stakeholder detail pages
- **Issue handlers**: Can view and manage issues for their assigned stakeholders
- Row-level security (RLS) ensures data access is restricted to company scope

## Database Schema

### Tables

#### `stakeholder_issues`
```sql
CREATE TABLE stakeholder_issues (
  id SERIAL PRIMARY KEY,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  attachments JSONB DEFAULT '[]',
  company_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES employees(id)
);
```

#### Updated `stakeholders` table
Added field:
- `issue_handler_id UUID` - References employees(id)

### File Storage

Issue attachments are stored in the `stakeholder-documents` storage bucket with the following structure:
```
{company_id}/stakeholder-issues/{stakeholder_id}/{timestamp}_{filename}
```

Attachment metadata is stored in JSONB format:
```json
{
  "path": "file/path/in/storage",
  "originalName": "document.pdf",
  "size": 12345,
  "type": "application/pdf",
  "uploadedAt": "2025-10-27T..."
}
```

## TypeScript Interfaces

### StakeholderIssue
```typescript
interface StakeholderIssue {
  id?: number;
  stakeholder_id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  attachments: StakeholderIssueAttachment[];
  company_id: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  // Joined data
  stakeholder?: Stakeholder;
  creator?: { id: string; name: string; email?: string; };
  resolver?: { id: string; name: string; email?: string; };
}
```

### StakeholderIssueAttachment
```typescript
interface StakeholderIssueAttachment {
  path: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
}
```

## API/Hooks

### useStakeholderIssues

Main hook for managing stakeholder issues:

```typescript
const {
  // Data
  issues,
  loading,
  error,
  processingId,
  
  // Computed
  pendingIssues,
  inProgressIssues,
  resolvedIssues,
  highPriorityIssues,
  
  // Operations
  fetchIssues,
  fetchIssueById,
  fetchIssuesByHandler,
  createIssue,
  updateIssue,
  deleteIssue,
  deleteAttachment,
  getAttachmentUrl,
} = useStakeholderIssues();
```

#### Key Methods

**fetchIssues(stakeholderId?: number)**
- Fetches all issues for a specific stakeholder or all issues if no ID provided
- Returns: `Promise<StakeholderIssue[]>`

**fetchIssuesByHandler(handlerId?: string)**
- Fetches all issues for stakeholders managed by a specific employee
- Uses current user if no handlerId provided
- Returns: `Promise<StakeholderIssue[]>`

**createIssue(issueData: StakeholderIssueFormData)**
- Creates a new issue with optional file attachments
- Automatically uploads files to Supabase Storage
- Returns: `Promise<StakeholderIssue>`

**updateIssue(issueId: number, issueData: Partial<StakeholderIssueFormData>)**
- Updates an existing issue
- Can add additional file attachments
- Auto-sets resolved_at and resolved_by when status changes to 'Resolved'
- Returns: `Promise<StakeholderIssue>`

**deleteIssue(issueId: number)**
- Deletes an issue and all associated file attachments
- Returns: `Promise<boolean>`

**getAttachmentUrl(filePath: string)**
- Generates a signed URL for downloading an attachment (1-hour expiry)
- Returns: `Promise<string | null>`

## User Interfaces

### 1. Admin Interface

**Location**: `/admin-management/stakeholders/[id]` (Issues tab)

Features:
- Tab-based interface with "Process Steps" and "Issues" tabs
- Create, view, edit, and delete issues
- Download issue attachments
- Full CRUD operations for all issues of a stakeholder

### 2. Operations Interface

**Location**: `/operations-and-services/stakeholder-issues`

Features:
- View all issues for stakeholders the employee is assigned as issue handler
- Filter by status (Pending/In Progress/Resolved)
- Filter by priority (Low/Medium/High/Urgent)
- Search by title, description, or stakeholder name
- Statistics dashboard showing counts by status and priority
- Update issue status and details
- Download attachments

### 3. Stakeholder Creation Form

**Location**: `/admin-management/stakeholders/new`

Features:
- Issue Handler dropdown field
- Select from all employees in the company
- Optional field - stakeholders can be created without an issue handler

## Validation

Issues are validated using pure TypeScript functions:

```typescript
validateStakeholderIssue(data: Partial<StakeholderIssueFormData>): ValidationError[]
```

Validation rules:
- Title: Required, max 255 characters
- Status: Required, must be one of: Pending, In Progress, Resolved
- Priority: Required, must be one of: Low, Medium, High, Urgent
- Description: Optional, max 5000 characters
- Attachments: Max 10 files, each max 10MB

## Security

### Row-Level Security (RLS)

All stakeholder_issues operations are protected by RLS policies:

```sql
-- Users can only access issues for stakeholders in their company
CREATE POLICY stakeholder_issues_select_policy ON stakeholder_issues
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );
```

Similar policies exist for INSERT, UPDATE, and DELETE operations.

### File Upload Security

- Files are uploaded to a company-scoped storage bucket
- Signed URLs expire after 1 hour
- File size and count limits are enforced client-side and should be enforced server-side via storage policies

## Migration

To set up the issue tracking system, run the migration:

```bash
psql -h your-db-host -U postgres -d your-database -f sql/stakeholder_issue_tracking.sql
```

This will:
1. Add `issue_handler_id` column to stakeholders table
2. Create `stakeholder_issues` table
3. Create indexes for performance
4. Set up RLS policies
5. Add update triggers

## Usage Examples

### Creating an Issue

```typescript
const { createIssue } = useStakeholderIssues();

await createIssue({
  stakeholder_id: 123,
  title: "Payment issue with invoice #1234",
  description: "Customer reports incorrect amount on invoice",
  status: "Pending",
  priority: "High",
  attachments: [file1, file2], // File objects from input
});
```

### Fetching Issues for Current User's Stakeholders

```typescript
const { fetchIssuesByHandler, issues } = useStakeholderIssues();

useEffect(() => {
  fetchIssuesByHandler(); // Fetches for current user
}, [fetchIssuesByHandler]);
```

### Updating Issue Status

```typescript
const { updateIssue } = useStakeholderIssues();

await updateIssue(issueId, {
  status: "Resolved",
  // resolved_at and resolved_by are set automatically
});
```

### Downloading an Attachment

```typescript
const { getAttachmentUrl } = useStakeholderIssues();

const handleDownload = async (attachment) => {
  const url = await getAttachmentUrl(attachment.path);
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

## Future Enhancements

Potential improvements for the issue tracking system:

1. **Email Notifications**: Notify issue handlers when new issues are created
2. **Comments/Activity Log**: Add ability to comment on issues
3. **SLA Tracking**: Track time to resolution and set SLA targets
4. **Custom Fields**: Allow companies to define custom fields for issues
5. **Issue Templates**: Pre-defined templates for common issue types
6. **Bulk Operations**: Update status of multiple issues at once
7. **Advanced Reporting**: Analytics dashboard for issue trends
8. **Integration**: Link issues to process steps or transactions

## Testing

To test the issue tracking system:

1. Create a stakeholder with an assigned issue handler
2. Navigate to the stakeholder detail page
3. Switch to the "Issues" tab
4. Create a new issue with attachments
5. Log in as the assigned issue handler
6. Navigate to `/operations-and-services/stakeholder-issues`
7. Verify the issue appears and can be updated
8. Test file upload/download functionality
9. Test filtering and search capabilities

## Troubleshooting

### Issues not appearing
- Verify the user's company_id matches the stakeholder's company_id
- Check RLS policies are enabled on stakeholder_issues table
- Verify the issue handler is correctly assigned to the stakeholder

### File upload failures
- Check storage bucket permissions
- Verify file size is under 10MB
- Ensure stakeholder-documents bucket exists
- Check Supabase storage quota

### Performance issues
- Ensure indexes exist on frequently queried columns
- Consider pagination for large issue lists
- Use proper eager loading with joins to minimize queries

## Support

For issues or questions about the stakeholder issue tracking system, contact the development team or refer to the main Flow HRIS documentation.
