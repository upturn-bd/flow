# Stakeholder System - Testing & Deployment Guide

## 🚀 Deployment Checklist

### Step 1: Run Database Migration

**IMPORTANT: This migration will DROP all existing stakeholder data!**

Make sure you have a backup before proceeding.

```bash
# Connect to your Supabase database
# Option 1: Via Supabase CLI
supabase db reset # If you want to reset everything
# OR
# Option 2: Via psql or Supabase SQL Editor
# Copy and paste the contents of sql/stakeholder_refactor_migration.sql
```

**What the migration does:**
- ✅ Drops old tables: `stakeholder_issues`, `stakeholders`, `stakeholder_types`
- ✅ Adds `file_size_limit_mb` to companies table (default 10MB)
- ✅ Creates 4 new tables: `stakeholder_processes`, `stakeholder_process_steps`, `stakeholders`, `stakeholder_step_data`
- ✅ Creates indexes for performance
- ✅ Sets up RLS policies for team-based access
- ✅ Creates auto-completion trigger
- ✅ Updates team permissions with new modules

### Step 2: Verify Database Schema

Run these queries to verify the migration succeeded:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN (
  'stakeholder_processes', 
  'stakeholder_process_steps', 
  'stakeholders', 
  'stakeholder_step_data'
);

-- Check permissions are added
SELECT * FROM team_permissions 
WHERE module IN ('stakeholders', 'stakeholder_processes')
LIMIT 5;

-- Check file size limit column
SELECT file_size_limit_mb FROM companies LIMIT 1;
```

### Step 3: Test the System

Follow the testing workflow below to ensure everything works.

---

## 🧪 Testing Workflow

### Test 1: Process Creation (Admin Only)

**Location:** `/admin-management/company-configurations/stakeholder-processes`

**Steps:**
1. Navigate to the process management page
2. Click "Create New Process"
3. Fill in:
   - Name: "Sales Lead Pipeline"
   - Description: "Process for converting sales leads to customers"
   - Check "Active"
   - Select "Sequential" (ordered steps)
   - Check "Allow Rollback"
4. Click "Create Process"

**Expected Result:** Process appears in list with "Active" badge

---

### Test 2: Step Configuration

**Location:** Process detail page `/admin-management/company-configurations/stakeholder-processes/[id]`

**Steps:**
1. Click on the newly created process
2. In the "Process Steps" section, click "Add Step"
3. Create Step 1 - "Initial Contact":
   - Name: "Initial Contact"
   - Description: "First contact with the lead"
   - Order: 1
   - Assign Team: Select a team
   - Add Fields:
     * Text field: "contact_method" (required) - "How was contact made?"
     * Date field: "contact_date" (required) - "Date of first contact"
     * Boolean field: "interested" (required) - "Expressed interest?"
4. Click "Save Step"
5. Create Step 2 - "Needs Assessment":
   - Name: "Needs Assessment"
   - Order: 2
   - Assign Team: Select a team
   - Add Fields:
     * Text field: "requirements" (required) - "Key requirements identified"
     * File field: "proposal_doc" (optional) - "Proposal document"
6. Click "Save Step"
7. Create Step 3 - "Contract Signing":
   - Name: "Contract Signing"
   - Order: 3
   - Assign Team: Select a team
   - Add Fields:
     * Date field: "signing_date" (required) - "Contract signing date"
     * File field: "signed_contract" (required) - "Signed contract"

**Expected Result:** Three steps appear in order, each showing assigned team

---

### Test 3: Create a Lead (No Processes - Error Handling)

**Location:** `/admin-management/stakeholders/new`

**Steps:**
1. Deactivate all processes from the process management page
2. Navigate to `/admin-management/stakeholders/new`

**Expected Result:** 
- Should see error message: "No Stakeholder Processes Found"
- Should have button to "Go to Process Management"
- Should NOT show the form

**Cleanup:** Reactivate the "Sales Lead Pipeline" process

---

### Test 4: Create a Lead (Success Path)

**Location:** `/admin-management/stakeholders/new`

**Steps:**
1. Navigate to `/admin-management/stakeholders/new`
2. Fill in:
   - Name: "Acme Corporation"
   - Address: "123 Business St, Tech City"
   - Process: Select "Sales Lead Pipeline"
3. Add Contact Person:
   - Click "Add Contact"
   - Name: "John Doe"
   - Email: "john@acme.com"
   - Phone: "+1234567890"
4. Add another Contact Person:
   - Click "Add Contact"
   - Name: "Jane Smith"
   - Email: "jane@acme.com"
5. Click "Create Lead"

**Expected Result:** 
- Redirects to `/admin-management/stakeholders`
- "Acme Corporation" appears in list with "Lead" badge (blue)
- Current Step shows "Step 1: Initial Contact"
- Stats update: Active Leads count increases

---

### Test 5: View Lead Details

**Location:** `/admin-management/stakeholders/[id]`

**Steps:**
1. Click on "Acme Corporation" from the list
2. Verify the information displayed:
   - Name: "Acme Corporation"
   - Status: "Lead" badge (blue)
   - Process: "Sales Lead Pipeline"
   - Address shown in left sidebar
   - Both contact persons visible with clickable email/phone

**Expected Result:** All information displays correctly

---

### Test 6: Complete Step (Dynamic Form)

**Location:** Stakeholder detail page

**Steps:**
1. On the "Acme Corporation" detail page
2. Click "Work on Step" for "Initial Contact"
3. Fill in the dynamic form:
   - Contact Method: "Phone call"
   - Contact Date: Select today's date
   - Interested: Check the box
4. Click "Complete Step"

**Expected Result:**
- Form closes
- Step 1 shows green badge with checkmark
- Step 2 "Needs Assessment" becomes current (blue highlight)
- "Work on Step" button appears on Step 2

---

### Test 7: Save Draft (Partial Completion)

**Steps:**
1. Click "Work on Step" on Step 2 "Needs Assessment"
2. Fill in only:
   - Requirements: "CRM system with reporting"
3. Click "Save Draft"

**Expected Result:**
- Form closes
- Step 2 NOT marked as complete
- Can click "Work on Step" again
- Form repopulates with "CRM system with reporting"

---

### Test 8: Complete Final Step (Lead → Stakeholder)

**Steps:**
1. Complete Step 2:
   - Requirements: "CRM system with reporting"
   - File: Select any file (note: actual upload pending)
   - Click "Complete Step"
2. Complete Step 3:
   - Signing Date: Select a date
   - File: Select any file
   - Click "Complete Step"

**Expected Result:**
- All steps show green checkmarks
- Status badge changes from "Lead" (blue) to "Stakeholder" (green)
- "Completed" date appears in sidebar
- Stats update: Active Leads -1, Stakeholders +1

---

### Test 9: List Filtering

**Location:** `/admin-management/stakeholders`

**Steps:**
1. Create 2 more leads following Test 4
2. Complete one lead fully (Stakeholder)
3. Test filters:
   - Click "All" - Should show all 3 records
   - Click "Leads" - Should show 2 active leads
   - Click "Stakeholders" - Should show 1 completed stakeholder
4. Test search:
   - Type "Acme" in search box
   - Should filter to only "Acme Corporation"

**Expected Result:** Filtering and search work correctly

---

### Test 10: Edit Process with Existing Stakeholders

**Location:** Process detail page

**Steps:**
1. Go to the "Sales Lead Pipeline" process detail
2. Edit Step 2 - Add a new field:
   - Text field: "budget" (optional) - "Estimated budget"
3. Save the process
4. Create a new lead with this process
5. When working on Step 2, verify:
   - New field "budget" appears
   - Old stakeholders created before edit still work

**Expected Result:** 
- New field appears for new leads
- Old leads continue using their snapshot (backward compatibility)

---

### Test 11: Delete Stakeholder

**Steps:**
1. Navigate to a stakeholder detail page
2. Click "Delete" button
3. Confirm deletion in modal

**Expected Result:**
- Redirects to stakeholder list
- Record removed from list
- Stats updated

---

### Test 12: Independent Process (Non-Sequential)

**Steps:**
1. Create a new process called "Support Ticket Resolution"
2. Set it as "Independent" (NOT sequential)
3. Add 3 steps: "Triage", "Investigation", "Resolution"
4. Create a lead with this process
5. Verify you can complete steps in any order

**Expected Result:** All steps show "Work on Step" button simultaneously

---

## ⚠️ Known Limitations & TODO

### File Uploads
- **Status:** UI exists but backend integration pending
- **What's Needed:**
  1. Set up Supabase Storage bucket for stakeholder files
  2. Implement upload logic in `useStakeholders` hook
  3. Enforce `file_size_limit_mb` from companies table
  4. Generate and store file URLs in step data
  5. Add file download/preview functionality

### Backward Compatibility
- **Status:** Schema supports it via `field_definitions_snapshot`
- **What's Needed:**
  1. UI to show "This field was from an older version" notices
  2. Migration tool for admins to update old data to new schema
  3. Visual diff between current and snapshot definitions

### RLS Policies
- **Status:** Basic policies created in migration
- **What's Needed:**
  1. Test with different team assignments
  2. Verify team members can only edit their assigned steps
  3. Add company_id scoping to all queries in hook

### Notifications
- **Status:** Placeholder in hook (commented out)
- **What's Needed:**
  1. Fix NotificationType errors
  2. Implement notifications for:
     - New lead assigned to team
     - Step completed
     - Lead converted to stakeholder
     - Process changes affecting active leads

---

## 🐛 Troubleshooting

### "No stakeholder processes found" even after creating process
**Solution:** Ensure process is marked as "Active" and refresh the page

### Steps not appearing for stakeholder
**Solution:** Check that process has steps configured. Navigate to process detail and add steps.

### "Work on Step" button not appearing
**Solution:** 
- For sequential processes: Previous steps must be completed first
- For independent processes: Check if step is already completed
- Verify user has permission for the assigned team

### File upload shows "File upload integration pending"
**Solution:** This is expected - file upload backend is not yet implemented

### Stakeholder not auto-advancing to next step
**Solution:** Check database trigger `auto_complete_stakeholder` is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'auto_complete_stakeholder';
```

---

## 📊 Database Queries for Monitoring

### Check active leads vs stakeholders
```sql
SELECT 
  is_completed,
  COUNT(*) as count
FROM stakeholders
WHERE company_id = YOUR_COMPANY_ID
GROUP BY is_completed;
```

### View step completion rates
```sql
SELECT 
  sp.name as process_name,
  sps.name as step_name,
  COUNT(ssd.id) as completions
FROM stakeholder_process_steps sps
LEFT JOIN stakeholder_step_data ssd ON ssd.step_id = sps.id
JOIN stakeholder_processes sp ON sp.id = sps.process_id
WHERE sp.company_id = YOUR_COMPANY_ID
GROUP BY sp.name, sps.name
ORDER BY sp.name, sps.step_order;
```

### Find stuck leads (on same step > 30 days)
```sql
SELECT 
  s.name,
  s.created_at,
  sps.name as current_step,
  DATE_PART('day', NOW() - s.created_at) as days_on_step
FROM stakeholders s
JOIN stakeholder_process_steps sps ON sps.id = s.current_step_id
WHERE s.is_completed = FALSE
  AND DATE_PART('day', NOW() - s.created_at) > 30
ORDER BY days_on_step DESC;
```

---

## ✅ Post-Deployment Verification

Run this checklist after deployment:

- [ ] Database migration completed successfully
- [ ] All 4 tables created with proper schema
- [ ] Team permissions updated with new modules
- [ ] Can create process with steps
- [ ] Can create lead (stakeholder)
- [ ] Dynamic form renders correctly
- [ ] Step completion updates status
- [ ] Lead converts to stakeholder on final step
- [ ] Stats dashboard shows correct counts
- [ ] Search and filters work
- [ ] Edit/delete operations work
- [ ] RLS policies prevent unauthorized access
- [ ] Process edit preserves backward compatibility

---

## 🎯 Next Steps

1. **Implement File Uploads**
   - Set up Supabase Storage
   - Add upload/download handlers
   - Enforce size limits

2. **Add Notifications**
   - Fix type errors
   - Implement notification triggers
   - Add real-time updates

3. **Analytics Dashboard**
   - Lead conversion rate
   - Average time per step
   - Team performance metrics

4. **Mobile Optimization**
   - Responsive stakeholder detail page
   - Mobile-friendly step forms

5. **Export Functionality**
   - Export stakeholder list to CSV
   - Generate process reports
