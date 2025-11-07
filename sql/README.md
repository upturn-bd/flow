# SQL Files Cleanup Guide

## ✅ Files to KEEP

### Main Setup File
- **`setup_team_permissions_system.sql`** ⭐ **NEW - USE THIS ONE**
  - Complete, consolidated setup script
  - Creates tables, RLS policies, functions, default teams
  - Migrates existing data
  - Fixed all circular dependency issues
  - This is the ONLY file you need to run on a fresh database

### 🆕 Auto-Assign Trigger (CRITICAL FOR NEW USERS)
- **`auto_assign_new_employees_to_team.sql`** ⚡ **RUN THIS AFTER MAIN SETUP**
  - Automatically adds new employees to default teams
  - Fixes "User has no permissions - no team membership" error
  - Backfills existing approved employees without teams
  - **MUST RUN THIS** or new users won't be able to access the app!

### Utility Files (Keep for reference/debugging)
- **`check_team_data.sql`**
  - Useful for verifying data after setup
  - Check teams, members, permissions counts
  
- **`verify_team_permissions_schema.sql`**
  - Verify database schema is correct
  - Check foreign keys, indexes, RLS policies

### Other System Files (Not related to teams)
- `accounts_table.sql` - Account management
- `notifications_table.sql` - Notifications system
- `payroll_system.sql` - Payroll features
- `stakeholder_system.sql` - Stakeholder management

## ❌ Files to DELETE (Obsolete/Redundant)

### Superseded by setup_team_permissions_system.sql
- ~~`teams_permissions_system.sql`~~ - Old version, had RLS issues
- ~~`complete_permissions_setup.sql`~~ - Emergency fix script, no longer needed
- ~~`migrate_roles_to_teams.sql`~~ - Migration logic now in main setup
- ~~`fix_rls_complete.sql`~~ - RLS fixes now in main setup
- ~~`fix_team_permissions_rls.sql`~~ - RLS fixes now in main setup
- ~~`force_cleanup_has_permission.sql`~~ - Cleanup script, no longer needed
- ~~`create_get_user_permissions.sql`~~ - Function now in main setup
- ~~`grant_admin_permissions.sql`~~ - Permissions now handled in main setup
- ~~`debug_permissions.sql`~~ - Debug script, use check_team_data.sql instead

## 📋 Recommended File Structure

```
sql/
├── setup_team_permissions_system.sql           ← 1. Main setup (RUN FIRST)
├── auto_assign_new_employees_to_team.sql      ← 2. Auto-assign trigger (RUN SECOND) ⚡
├── check_team_data.sql                         ← 3. Verify data
├── verify_team_permissions_schema.sql          ← 4. Verify schema
├── accounts_table.sql                          ← Other features
├── notifications_table.sql
├── payroll_system.sql
└── stakeholder_system.sql
```

## 🚀 How to Use

### For Fresh Database Setup:
1. Run `setup_team_permissions_system.sql`
2. **Run `auto_assign_new_employees_to_team.sql`** ⚡ (Critical!)
3. Verify with `check_team_data.sql`
4. Done! ✅

### For Existing Database (IMPORTANT - READ THIS):
If you see the error **"User has no permissions - no team membership"** when new users sign up:

**Quick Fix:**
1. Open your Supabase Dashboard
2. Go to SQL Editor → New Query
3. Copy and paste the entire contents of `auto_assign_new_employees_to_team.sql`
4. Run the query
5. This will:
   - Create an automatic trigger for new employees
   - Backfill any existing approved employees who aren't in teams yet
   - Fix the "unauthorized" redirect issue

### Running SQL Files:

**Option 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project → SQL Editor
2. Click "New Query"
3. Copy and paste the SQL file contents
4. Click "Run"

**Option 2: Supabase CLI**
```bash
supabase db execute -f sql/setup_team_permissions_system.sql
supabase db execute -f sql/auto_assign_new_employees_to_team.sql
```

**Option 3: Shell Script**
```bash
./sql/run_auto_assign_setup.sh
```

## 📝 What Changed

### Major Improvements in v2.0:
1. **Fixed RLS Circular Dependencies** 
   - Uses `SECURITY DEFINER` functions to avoid infinite recursion
   - `user_can_manage_teams()` and `user_can_delete_teams()` helper functions

2. **Consolidated Setup**
   - One file instead of 5+ separate scripts
   - Automatic migration of existing role-based users
   - Proper error handling and conflict resolution

3. **Better Default Permissions**
   - Administrators: Full access to everything
   - Managers: Read/write most things, approve workflows, no admin access
   - Employees: Read/write own data, submit requests, comment

## 🗑️ Cleanup Commands

To delete obsolete files:

```bash
cd sql/
rm teams_permissions_system.sql
rm complete_permissions_setup.sql
rm migrate_roles_to_teams.sql
rm fix_rls_complete.sql
rm fix_team_permissions_rls.sql
rm force_cleanup_has_permission.sql
rm create_get_user_permissions.sql
rm grant_admin_permissions.sql
rm debug_permissions.sql
```

## ✅ After Cleanup

You should have:
- 1 main setup file (setup_team_permissions_system.sql)
- 2 utility files (check_team_data.sql, verify_team_permissions_schema.sql)
- 4 other feature files (accounts, notifications, payroll, stakeholders)

Total: **7 files** instead of **14 files**

---

**Last Updated:** October 18, 2025
**Version:** 2.0 (RLS Fixed)
