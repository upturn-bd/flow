-- ============================================================================
-- Verify Team Permissions Schema
-- ============================================================================
-- This script verifies that all tables and constraints exist correctly
-- ============================================================================

-- Check if tables exist
SELECT 
    '==============================================',
    'Checking tables...' as check_type;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('teams', 'team_members', 'team_permissions', 'permissions')
ORDER BY table_name;

-- Check foreign key constraints
SELECT 
    '==============================================',
    'Checking foreign key constraints...' as check_type;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'team_permissions'
ORDER BY tc.constraint_name;

-- Check if permissions table has data
SELECT 
    '==============================================',
    'Checking permissions data...' as check_type;

SELECT 
    category,
    COUNT(*) as permission_count
FROM permissions
GROUP BY category
ORDER BY category;

-- Check team_permissions structure
SELECT 
    '==============================================',
    'Checking team_permissions columns...' as check_type;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'team_permissions'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    '==============================================',
    'Checking RLS policies...' as check_type;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename IN ('teams', 'team_members', 'team_permissions', 'permissions')
ORDER BY tablename, policyname;
