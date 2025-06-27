# Enhanced Query Capabilities for useBaseEntity

This document explains the enhanced query capabilities added to `useBaseEntity` and demonstrates how to use them with practical examples.

## Overview

The `useBaseEntity` hook has been extended with powerful query capabilities that support:
- Flexible filtering with multiple operators (eq, neq, gt, gte, lt, lte, like, ilike, in, contains, is)
- Complex queries with AND/OR conditions
- Custom sorting and pagination
- Single item queries
- Date range queries
- Full Supabase query builder access

## New Methods

### `fetchItemsWithQuery(queryConfig: EnhancedQueryOptions): Promise<T[]>`

Fetch multiple items with custom query filters and options.

### `fetchSingleWithQuery(queryConfig: EnhancedQueryOptions): Promise<T | null>`

Fetch a single item with custom query filters and options.

## Query Configuration

```typescript
interface EnhancedQueryOptions {
  filters?: QueryFilters;
  options?: QueryOptions;
}

interface QueryFilters {
  eq?: Record<string, any>;        // Equal to
  neq?: Record<string, any>;       // Not equal to
  gt?: Record<string, any>;        // Greater than
  gte?: Record<string, any>;       // Greater than or equal
  lt?: Record<string, any>;        // Less than
  lte?: Record<string, any>;       // Less than or equal
  like?: Record<string, any>;      // Pattern matching (case sensitive)
  ilike?: Record<string, any>;     // Pattern matching (case insensitive)
  in?: Record<string, any[]>;      // Value in array
  contains?: Record<string, any>;  // Contains value
  is?: Record<string, any>;        // Null checks
  or?: string;                     // OR conditions
  and?: string;                    // AND conditions
}

interface QueryOptions {
  select?: string;                 // Fields to select
  orderBy?: { column: string; ascending?: boolean }[];
  limit?: number;                  // Limit results
  offset?: number;                 // Offset for pagination
}
```

## Usage Examples

### 1. Basic Equal Query

```typescript
// Get attendance for a specific date
const attendance = await fetchSingleWithQuery({
  filters: {
    eq: { attendance_date: '2024-01-15' }
  }
});
```

### 2. Date Range Query

```typescript
// Get attendance for last week
const lastWeekAttendance = await fetchItemsWithQuery({
  filters: {
    gte: { attendance_date: '2024-01-08' },
    lte: { attendance_date: '2024-01-14' }
  },
  options: {
    orderBy: [{ column: 'attendance_date', ascending: true }]
  }
});
```

### 3. Multiple Filters

```typescript
// Get late check-ins for a specific employee
const lateCheckIns = await fetchItemsWithQuery({
  filters: {
    eq: { employee_id: 'EMP001' },
    gt: { check_in_time: '09:00:00' },
    eq: { tag: 'present' }
  },
  options: {
    orderBy: [{ column: 'attendance_date', ascending: false }],
    limit: 10
  }
});
```

### 4. Pattern Matching

```typescript
// Find employees with names containing 'john' (case insensitive)
const employees = await fetchItemsWithQuery({
  filters: {
    ilike: { name: '%john%' }
  }
});
```

### 5. Array Queries

```typescript
// Get attendance for multiple employees
const multipleEmployees = await fetchItemsWithQuery({
  filters: {
    in: { employee_id: ['EMP001', 'EMP002', 'EMP003'] }
  }
});
```

### 6. Null Checks

```typescript
// Get attendance records without check-out time
const activeAttendance = await fetchItemsWithQuery({
  filters: {
    is: { check_out_time: null }
  }
});
```

### 7. Complex OR Conditions

```typescript
// Get attendance where tag is either 'late' or 'absent'
const problematicAttendance = await fetchItemsWithQuery({
  filters: {
    or: 'tag.eq.late,tag.eq.absent'
  }
});
```

## Enhanced useAttendance Hook

The `useAttendance` hook now includes convenience methods:

```typescript
const {
  // Enhanced methods
  getAttendanceForDate,
  getTodaysAttendance,
  getAttendanceForDateRange,
  getAttendanceByTag,
  
  // Base entity methods
  fetchItemsWithQuery,
  fetchSingleWithQuery,
  
  // State
  today,
  todayLoading,
  items,
  loading
} = useAttendances();
```

### Usage Examples

```typescript
// Get today's attendance
const todayAttendance = await getTodaysAttendance('EMP001');

// Get attendance for a specific date
const specificDate = await getAttendanceForDate('2024-01-15', 'EMP001');

// Get attendance for date range
const weekAttendance = await getAttendanceForDateRange(
  '2024-01-08',
  '2024-01-14',
  'EMP001'
);

// Get all 'late' attendance records
const lateAttendance = await getAttendanceByTag('late');
```

## Benefits

1. **Flexible Querying**: Support for all common database operations
2. **Type Safety**: Full TypeScript support with proper typing
3. **Performance**: Direct Supabase queries without unnecessary data transfer
4. **Maintainability**: Consistent API across all entities
5. **Extensibility**: Easy to add new query types and operators
6. **Scoping**: Automatic company/user/department scoping when configured

## Best Practices

1. **Use Specific Queries**: Prefer `fetchSingleWithQuery` for single records
2. **Add Indexes**: Ensure database indexes exist for frequently queried fields
3. **Limit Results**: Use `limit` to prevent large data transfers
4. **Order Results**: Always specify ordering for consistent results
5. **Handle Errors**: Wrap queries in try-catch blocks
6. **Cache Results**: Consider caching for frequently accessed data

## Migration from Old API

### Before
```typescript
// Limited to basic filtering
const result = await api.getAll('attendance_records', {
  filters: { employee_id: 'EMP001' }
});
```

### After
```typescript
// Full query capabilities
const result = await fetchItemsWithQuery({
  filters: {
    eq: { employee_id: 'EMP001' },
    gte: { attendance_date: '2024-01-01' }
  },
  options: {
    orderBy: [{ column: 'attendance_date', ascending: false }],
    limit: 50
  }
});
```

## Troubleshooting

1. **No Results**: Check filter values and field names
2. **Type Errors**: Ensure filter values match database field types
3. **Performance Issues**: Add database indexes for filtered fields
4. **Scoping Issues**: Verify company/user scoping configuration

For more examples, see `examples/AttendanceQueryExamples.tsx`.
