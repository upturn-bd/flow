# SQL Files Cleanup Guide

## ✅ Files to KEEP

### Main Setup File
- **`setup_team_permissions_system.sql`** ⭐ **NEW - USE THIS ONE**
  - Complete, consolidated setup script
  - Creates tables, RLS policies, functions, default teams
  - Migrates existing data
  - Fixed all circular dependency issues
  - This is the ONLY file you need to run on a fresh database

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
├── setup_team_permissions_system.sql    ← Main setup (RUN THIS)
├── check_team_data.sql                  ← Verify data
├── verify_team_permissions_schema.sql   ← Verify schema
├── accounts_table.sql                   ← Other features
├── notifications_table.sql
├── payroll_system.sql
└── stakeholder_system.sql
```

## 🚀 How to Use

### For Fresh Database Setup:
1. Run `setup_team_permissions_system.sql`
2. Verify with `check_team_data.sql`
3. Done! ✅

### For Existing Database:
The main setup script uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT` clauses, so it's safe to run on existing databases. It will:
- Create missing tables
- Preserve existing teams and data
- Update RLS policies to fixed versions
- Ensure all companies have default teams

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
