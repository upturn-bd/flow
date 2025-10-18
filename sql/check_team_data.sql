-- ============================================================================
-- CHECK TEAM DATA IN DATABASE
-- ============================================================================
-- This script checks if there's actual data in the teams tables
-- ============================================================================

-- Check teams
SELECT 
    '==============================================',
    'TEAMS' as section;

SELECT 
    id,
    name,
    description,
    company_id,
    is_default,
    created_at
FROM teams
ORDER BY id;

-- Check team_members
SELECT 
    '==============================================',
    'TEAM MEMBERS' as section;

SELECT 
    tm.id,
    tm.team_id,
    t.name as team_name,
    tm.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    tm.joined_at
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
LEFT JOIN employees e ON e.id = tm.employee_id
ORDER BY tm.team_id, tm.id;

-- Check permissions master list
SELECT 
    '==============================================',
    'PERMISSIONS (Master List)' as section;

SELECT 
    id,
    module_name,
    display_name,
    category
FROM permissions
ORDER BY category, module_name;

-- Check team_permissions
SELECT 
    '==============================================',
    'TEAM PERMISSIONS' as section;

SELECT 
    tp.id,
    tp.team_id,
    t.name as team_name,
    p.module_name,
    tp.can_read,
    tp.can_write,
    tp.can_delete,
    tp.can_approve,
    tp.can_comment
FROM team_permissions tp
JOIN teams t ON t.id = tp.team_id
JOIN permissions p ON p.id = tp.permission_id
ORDER BY tp.team_id, p.module_name;

-- Count summary
SELECT 
    '==============================================',
    'SUMMARY COUNTS' as section;

SELECT 
    'Teams' as table_name,
    COUNT(*) as count
FROM teams
UNION ALL
SELECT 
    'Team Members' as table_name,
    COUNT(*) as count
FROM team_members
UNION ALL
SELECT 
    'Permissions (Master)' as table_name,
    COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
    'Team Permissions' as table_name,
    COUNT(*) as count
FROM team_permissions;
