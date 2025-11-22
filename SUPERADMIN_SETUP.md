# Superadmin System Setup Guide

This guide explains how to set up and use the Superadmin system for managing the Flow HRIS platform.

## Overview

The Superadmin system provides a dedicated interface at `/sa` for SaaS owners and administrators to manage:
- Companies and their settings
- Countries and Industries (reference data)
- Teams across all companies
- Team members and permissions
- Superadmin user access

## Database Setup

### Step 1: Run the SQL Migration

Execute the SQL migration script to create the necessary database tables and functions:

```sql
-- Run this in your Supabase SQL editor or psql
\i sql/superadmin_system.sql
```

This script will:
- Create the `superadmins` table
- Set up Row Level Security (RLS) policies
- Create helper functions (`is_superadmin`, `get_superadmin_info`)
- Add necessary indexes for performance

### Step 2: Add Your First Superadmin

After running the migration, you need to manually add at least one superadmin user to bootstrap the system:

```sql
-- Replace with your actual user ID (from auth.users table)
INSERT INTO superadmins (user_id, employee_id, is_active, notes)
VALUES (
  'your-user-uuid-here',
  'your-employee-uuid-here', -- optional, can be NULL
  true,
  'Initial superadmin setup'
);
```

To find your user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
```

## Features

### 1. Dashboard (`/sa`)
- Overview statistics for all companies, employees, countries, industries
- Quick access to all management sections

### 2. Companies Management (`/sa/companies`)
- Create, edit, and delete companies
- Configure company settings:
  - Industry and country
  - Payroll settings
  - Feature flags (divisions, live absent tracking, etc.)
- Search and filter companies

### 3. Countries Management (`/sa/countries`)
- Manage the list of countries available in the system
- Add or remove countries as needed
- Used for company registration

### 4. Industries Management (`/sa/industries`)
- Manage the list of industries available in the system
- Add or remove industries as needed
- Used for company categorization

### 5. Teams Management (`/sa/teams`)
- Select a company to manage its teams
- View all teams with member counts
- Access team details for member and permission management

#### Team Detail Page (`/sa/teams/[companyId]/[teamId]`)
- **Team Members**: Add or remove employees from the team
- **Permissions**: Configure granular permissions for the team:
  - Read, Write, Delete, Approve, Comment permissions
  - Organized by module categories (workflow, services, operations, admin)

### 6. Superadmin Users Management (`/sa/users`)
- View all users with superadmin access
- Add new superadmins:
  1. Select a company
  2. Search and select an employee from that company
  3. Add optional notes
- Remove superadmin access from users
- Toggle active/inactive status

## Security

### Middleware Protection

The superadmin routes are protected by middleware that:
1. Checks if the user is authenticated
2. Calls the `is_superadmin` RPC function to verify superadmin status
3. Redirects unauthorized users to `/unauthorized`

### Row Level Security (RLS)

The `superadmins` table has strict RLS policies:
- Only active superadmins can view superadmin records
- Only active superadmins can insert, update, or delete superadmin records
- Non-superadmins have no access to the table

### Access Control

Superadmins have:
- Full access to all companies' data
- Ability to manage teams and permissions across companies
- Access to platform-wide reference data (countries, industries)
- Control over who has superadmin access

## User Search Pattern

The superadmin system uses the unified user search pattern from `src/lib/utils/user-search.ts`:
- Users are searchable by: **name**, **email**, and **designation**
- Search is case-insensitive and matches partial strings
- Consistent across all employee selection interfaces

## Navigation

Superadmins can:
- Access the superadmin panel via `/sa`
- Return to the main app by clicking "Exit to App →" in the navigation
- All superadmin pages share a common navigation bar

## Best Practices

1. **Limit Superadmin Access**: Only grant superadmin access to trusted platform administrators
2. **Use Notes**: When granting superadmin access, add notes explaining why and when
3. **Regular Audits**: Periodically review the superadmin user list and remove access when no longer needed
4. **Company Selection**: When managing teams or adding superadmins, always select the correct company first
5. **Permissions Management**: Be careful when granting team permissions, especially delete and approve rights

## Troubleshooting

### Cannot Access `/sa` Routes
- Ensure you're logged in
- Verify you exist in the `superadmins` table with `is_active = true`
- Check the browser console for middleware errors

### Cannot See Employees When Adding to Team
- Ensure the correct company is selected
- Verify employees exist for that company
- Check that you have proper database permissions

### Permission Changes Not Saving
- Verify network connectivity
- Check browser console for errors
- Ensure the `team_permissions` table has proper RLS policies

## Database Schema Reference

### superadmins Table
```sql
- id: SERIAL PRIMARY KEY
- user_id: UUID (references auth.users)
- employee_id: UUID (references employees, optional)
- granted_by: UUID (references auth.users)
- granted_at: TIMESTAMP WITH TIME ZONE
- notes: TEXT
- is_active: BOOLEAN
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE
```

### Helper Functions

#### `is_superadmin(user_id UUID)`
Returns `BOOLEAN` - whether the user is an active superadmin

#### `get_superadmin_info(user_id UUID)`
Returns superadmin details if the user is an active superadmin

## Support

For issues or questions about the superadmin system, contact the development team or refer to the main project documentation.
