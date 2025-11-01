# Stakeholder Type System

## Overview

The Stakeholder Type System provides a flexible categorization mechanism for stakeholders in the Flow HRIS system. Types allow organizations to classify stakeholders (clients, vendors, partners, investors, etc.) for better organization and filtering.

## Features

- **Multi-tenant Support**: Each company has its own set of stakeholder types
- **Type Management**: Full CRUD operations for stakeholder types
- **Active/Inactive Status**: Control which types are available for selection
- **Optional Assignment**: Types are optional for stakeholders - not all stakeholders need a type
- **Integration**: Seamlessly integrated with the existing process-based stakeholder system

## Database Schema

### stakeholder_types Table

```sql
CREATE TABLE stakeholder_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  CONSTRAINT unique_stakeholder_type_name_per_company UNIQUE(name, company_id)
);
```

**Key Features:**
- Company isolation via `company_id`
- Unique type names per company
- Active/inactive flag for soft deletion
- Audit fields for tracking changes

### stakeholders Table Update

Added optional foreign key to stakeholder types:

```sql
ALTER TABLE stakeholders 
ADD COLUMN stakeholder_type_id INTEGER REFERENCES stakeholder_types(id) ON DELETE SET NULL;
```

**Note:** `ON DELETE SET NULL` ensures that deleting a type doesn't delete stakeholders - it just removes their type assignment.

## Row Level Security (RLS)

The system implements RLS policies to ensure:
1. Users can only view types from their company
2. Only users with `stakeholder_processes` write permission can manage types
3. All queries are automatically filtered by company_id

```sql
-- View policy
CREATE POLICY "Users can view company stakeholder types" ON stakeholder_types
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Manage policy
CREATE POLICY "Admins can manage stakeholder types" ON stakeholder_types
  FOR ALL
  USING (
    has_permission(auth.uid(), 'stakeholder_processes', 'can_write')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );
```

## Frontend Implementation

### 1. Type Management Interface

Located in: `src/components/admin-management/stakeholder-types/StakeholderTypeManagementView.tsx`

**Access:** Admin > Company Configurations > Advanced Settings > Stakeholder Types

**Features:**
- View all types (including inactive)
- Create new types
- Edit existing types
- Toggle active/inactive status
- Delete types (with confirmation)

**Example Usage:**
```tsx
import StakeholderTypeManagementView from '@/components/admin-management/stakeholder-types/StakeholderTypeManagementView';

// In Advanced Settings Tab
<StakeholderTypeManagementView />
```

### 2. useStakeholderTypes Hook

Located in: `src/hooks/useStakeholderTypes.tsx`

**API:**

```typescript
const {
  stakeholderTypes,           // All types
  activeStakeholderTypes,     // Only active types
  loading,
  error,
  processingId,
  
  // Operations
  fetchStakeholderTypes,      // (includeInactive = false) => Promise<StakeholderType[]>
  fetchStakeholderTypeById,   // (typeId: number) => Promise<StakeholderType | null>
  createStakeholderType,      // (data: StakeholderTypeFormData) => Promise<StakeholderType>
  updateStakeholderType,      // (id: number, data: Partial<StakeholderTypeFormData>) => Promise<StakeholderType>
  deleteStakeholderType,      // (id: number) => Promise<boolean>
} = useStakeholderTypes();
```

**Example:**
```typescript
import { useStakeholderTypes } from '@/hooks/useStakeholderTypes';

function MyComponent() {
  const { activeStakeholderTypes, fetchStakeholderTypes } = useStakeholderTypes();
  
  useEffect(() => {
    fetchStakeholderTypes(); // Fetches only active types by default
  }, [fetchStakeholderTypes]);
  
  return (
    <select>
      <option value="">No type</option>
      {activeStakeholderTypes.map(type => (
        <option key={type.id} value={type.id}>
          {type.name}
        </option>
      ))}
    </select>
  );
}
```

### 3. Type Selection in Forms

The stakeholder creation form (`src/app/(home)/admin-management/stakeholders/new/page.tsx`) includes a type dropdown:

```typescript
const { activeStakeholderTypes, fetchStakeholderTypes } = useStakeholderTypes();

// In form
<select name="stakeholder_type_id" value={formData.stakeholder_type_id}>
  <option value="">None (No type selected)</option>
  {activeStakeholderTypes.map((type) => (
    <option key={type.id} value={type.id}>
      {type.name}
    </option>
  ))}
</select>
```

### 4. Type Display

**In Stakeholder List:**
```tsx
{stakeholder.stakeholder_type ? (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    {stakeholder.stakeholder_type.name}
  </span>
) : (
  <span className="text-gray-400">—</span>
)}
```

**In Stakeholder Detail:**
```tsx
{stakeholder.stakeholder_type && (
  <div className="flex items-start gap-3">
    <FileText className="text-gray-400 mt-0.5" size={18} />
    <div>
      <p className="text-sm font-medium text-gray-700">Type</p>
      <p className="text-sm text-gray-600 mt-0.5">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {stakeholder.stakeholder_type.name}
        </span>
      </p>
      {stakeholder.stakeholder_type.description && (
        <p className="text-xs text-gray-500 mt-1">
          {stakeholder.stakeholder_type.description}
        </p>
      )}
    </div>
  </div>
)}
```

## TypeScript Interfaces

### StakeholderType

```typescript
export interface StakeholderType {
  id?: number;
  name: string;
  description?: string;
  company_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}
```

### Updated Stakeholder Interface

```typescript
export interface Stakeholder {
  // ... existing fields
  stakeholder_type_id?: number; // Optional type ID
  
  // Joined data
  stakeholder_type?: StakeholderType; // Populated type object
}
```

### Form Data

```typescript
export interface StakeholderTypeFormData {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface StakeholderFormData {
  name: string;
  address?: string;
  contact_persons: ContactPerson[];
  process_id: number;
  stakeholder_type_id?: number; // Optional type selection
  is_active: boolean;
  issue_handler_id?: string;
}
```

## Validation

Validation is handled in `src/lib/validation/schemas/stakeholders.ts`:

```typescript
export function validateStakeholderType(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Stakeholder type name is required' });
  } else if (data.name.trim().length > 255) {
    errors.push({ field: 'name', message: 'Stakeholder type name must be less than 255 characters' });
  }

  // Description validation (optional)
  if (data.description && (typeof data.description !== 'string' || data.description.length > 500)) {
    errors.push({ field: 'description', message: 'Description must be a string with maximum 500 characters' });
  }

  return errors;
}
```

## Migration Guide

### Running the Migration

1. **Execute the SQL migration:**
   ```bash
   psql -h your-host -U your-user -d your-database -f sql/add_stakeholder_types.sql
   ```

2. **The migration will:**
   - Create the `stakeholder_types` table
   - Add `stakeholder_type_id` column to `stakeholders` table
   - Create indexes for performance
   - Set up RLS policies
   - Add update triggers

### Sample Data (Optional)

Uncomment the sample data section in the migration to add default types:

```sql
INSERT INTO stakeholder_types (name, description, company_id, created_by) VALUES
  ('Client', 'External clients and customers', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Vendor', 'Suppliers and service providers', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Partner', 'Business partners and collaborators', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)),
  ('Investor', 'Financial stakeholders and investors', 1, (SELECT id FROM employees WHERE company_id = 1 LIMIT 1))
ON CONFLICT (name, company_id) DO NOTHING;
```

## Usage Examples

### Creating a Stakeholder with Type

```typescript
await createStakeholder({
  name: "TechCorp Solutions",
  address: "123 Business Street",
  stakeholder_type_id: 1, // Client type
  process_id: 2,
  contact_persons: [
    {
      name: "John Doe",
      email: "john@techcorp.com",
      phone: "+1234567890"
    }
  ],
  is_active: true,
  issue_handler_id: "employee-uuid"
});
```

### Filtering Stakeholders by Type

While the current implementation doesn't include type filtering in the UI, you can easily add it:

```typescript
const { searchStakeholders } = useStakeholders();

// In your search function, modify the query in useStakeholders hook:
let query = supabase
  .from("stakeholders")
  .select("*, stakeholder_type:stakeholder_types(*)")
  .eq("company_id", company_id);

// Add type filter
if (filterTypeId) {
  query = query.eq("stakeholder_type_id", filterTypeId);
}
```

## Best Practices

1. **Type Naming**: Use clear, business-relevant names (Client, Vendor, Partner, etc.)
2. **Descriptions**: Add helpful descriptions to guide users in type selection
3. **Active Status**: Use the active flag instead of deleting types to preserve historical data
4. **Optional Assignment**: Types should remain optional - not all stakeholders need categorization
5. **Company Isolation**: Always verify company_id in queries to maintain multi-tenancy

## Troubleshooting

### Type Not Showing in Dropdown

**Problem:** Type created but not appearing in stakeholder form dropdown.

**Solution:** Check if the type is marked as active:
```sql
SELECT * FROM stakeholder_types WHERE company_id = ? AND is_active = false;
```

### Permission Issues

**Problem:** Unable to create/edit types.

**Solution:** Verify the user has `stakeholder_processes` write permission:
```sql
SELECT has_permission('user-uuid', 'stakeholder_processes', 'can_write');
```

### Company Isolation

**Problem:** Seeing types from other companies.

**Solution:** Verify RLS policies are enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'stakeholder_types';
```

## Future Enhancements

Potential improvements for the type system:

1. **Type-Based Workflows**: Different processes for different types
2. **Type Statistics**: Dashboard showing stakeholder distribution by type
3. **Type Filtering**: Filter stakeholder list by type
4. **Custom Fields per Type**: Type-specific data fields
5. **Type Colors**: Custom color coding for visual differentiation
6. **Type Icons**: Icon selection for better visual identification
7. **Type Hierarchies**: Parent-child type relationships

## Related Documentation

- [Stakeholder Process System](./sql/stakeholder_refactor_migration.sql)
- [Stakeholder Issue Tracking](./docs/STAKEHOLDER_ISSUE_TRACKING.md)
- [Stakeholder File Upload](./docs/STAKEHOLDER_FILE_UPLOAD.md)
- [Stakeholder Transactions](./STAKEHOLDER_TRANSACTIONS_IMPLEMENTATION.md)

## Version History

- **v1.0.0** (2025-11-01): Initial implementation of stakeholder type system
  - Basic CRUD operations
  - Company isolation
  - Active/inactive status
  - Integration with stakeholder forms and displays
