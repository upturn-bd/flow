# Stakeholder System - Quick Start Guide

## 🚀 For Developers

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    STAKEHOLDER SYSTEM                        │
└─────────────────────────────────────────────────────────────┘

Admin Flow:
  1. Admin Management → Company Configurations → Stakeholder Processes
  2. Create Process (Sequential/Independent)
  3. Add Steps (define fields, assign teams, set order)
  4. Activate Process

User Flow:
  1. Admin Management → Stakeholders
  2. Create New Lead (select process)
  3. Assigned team works on their step
  4. Complete step → Auto-advance (or allow any order)
  5. All steps done → Lead becomes Stakeholder
```

### Key Files

```
src/
├── hooks/
│   └── useStakeholders.tsx          # Main data hook (CRUD operations)
├── app/(home)/admin-management/
│   ├── company-configurations/
│   │   └── stakeholder-processes/   # Process management UI
│   │       ├── page.tsx             # Process list
│   │       └── [id]/page.tsx        # Process detail + steps
│   └── stakeholders/                # Stakeholder/Lead management
│       ├── page.tsx                 # List with filters
│       ├── new/page.tsx             # Create lead form
│       └── [id]/page.tsx            # Detail + step progression
├── components/
│   └── stakeholder-processes/
│       ├── ProcessForm.tsx          # Process create/edit modal
│       ├── StepManager.tsx          # Step CRUD + field builder
│       └── StepDataForm.tsx         # Dynamic step data entry
└── lib/
    ├── types/schemas.ts             # TypeScript interfaces
    └── constants/index.ts           # Permission modules

sql/
└── stakeholder_refactor_migration.sql  # Database setup
```

### Database Schema

```sql
stakeholder_processes
  ├── id, name, description
  ├── is_active, is_sequential, allow_rollback
  └── company_id, created_at, updated_at

stakeholder_process_steps
  ├── id, process_id, name, step_order
  ├── team_id (assigned team)
  ├── field_definitions (JSONB - dynamic fields)
  ├── version (for backward compatibility)
  └── use_date_range, start_date, end_date

stakeholders
  ├── id, name, address
  ├── contact_persons (JSONB array)
  ├── process_id, current_step_id, current_step_order
  ├── is_active, is_completed, completed_at
  └── company_id, created_by, created_at

stakeholder_step_data
  ├── id, stakeholder_id, step_id
  ├── data (JSONB - user-entered data)
  ├── field_definitions_snapshot (backward compat)
  ├── is_completed, completed_at, completed_by
  └── created_at, updated_at
```

### How Dynamic Fields Work

**Step Configuration (Admin):**
```typescript
// Admin defines fields for a step
const fieldDefinitions = {
  fields: [
    {
      key: "contact_method",
      label: "Contact Method",
      type: "text",
      required: true,
      placeholder: "How was contact made?",
    },
    {
      key: "interested",
      label: "Expressed Interest?",
      type: "boolean",
      required: true,
    },
    {
      key: "follow_up_date",
      label: "Follow Up Date",
      type: "date",
      required: false,
    },
  ],
};
```

**Step Data Entry (User):**
```typescript
// User fills dynamic form based on above definition
const stepData = {
  contact_method: "Phone call",
  interested: true,
  follow_up_date: "2025-11-01",
};

// Saved to stakeholder_step_data.data as JSONB
await completeStep(stakeholderId, stepId, stepData);
```

**Backward Compatibility:**
- When step is completed, `field_definitions_snapshot` stores current schema
- If admin later edits field definitions, old data remains valid
- Version number increments on step edits

### Hook Usage Examples

```typescript
import { useStakeholders } from "@/hooks/useStakeholders";

function MyComponent() {
  const {
    // State
    processes,
    stakeholders,
    loading,
    error,
    
    // Computed
    activeProcesses,
    leads,
    completedStakeholders,
    
    // Process operations
    fetchProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    
    // Step operations
    createProcessStep,
    updateProcessStep,
    reorderProcessSteps,
    
    // Stakeholder operations
    fetchStakeholders,
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    
    // Step data operations
    saveStepData,
    completeStep,
    fetchStakeholderStepData,
  } = useStakeholders();
  
  // Examples:
  
  // Create a process
  const handleCreateProcess = async () => {
    await createProcess({
      name: "Sales Pipeline",
      description: "Lead to customer conversion",
      is_active: true,
      is_sequential: true,
      allow_rollback: false,
    });
  };
  
  // Add a step
  const handleAddStep = async (processId: number) => {
    await createProcessStep({
      process_id: processId,
      name: "Initial Contact",
      step_order: 1,
      team_id: 5,
      field_definitions: {
        fields: [
          {
            key: "notes",
            label: "Contact Notes",
            type: "text",
            required: true,
          },
        ],
      },
    });
  };
  
  // Create a lead
  const handleCreateLead = async () => {
    await createStakeholder({
      name: "Acme Corp",
      address: "123 Main St",
      process_id: 1,
      contact_persons: [
        {
          name: "John Doe",
          email: "john@acme.com",
          phone: "+1234567890",
        },
      ],
      is_active: true,
    });
  };
  
  // Complete a step
  const handleCompleteStep = async (
    stakeholderId: number,
    stepId: number
  ) => {
    const formData = {
      notes: "Had great conversation, very interested!",
      contact_date: "2025-10-23",
    };
    
    await completeStep(stakeholderId, stepId, formData);
    // This will:
    // 1. Save data to stakeholder_step_data
    // 2. Mark step as completed
    // 3. Trigger auto-advance to next step (if sequential)
    // 4. Auto-complete stakeholder if all steps done
  };
  
  return <div>...</div>;
}
```

### Adding a New Field Type

To add a new field type (e.g., "number", "select", "textarea"):

**1. Update Type Definition:**
```typescript
// src/lib/types/schemas.ts
export type FieldType = "text" | "boolean" | "date" | "file" | "number";
```

**2. Update Constants:**
```typescript
// src/lib/constants/index.ts
export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "boolean", label: "Yes/No" },
  { value: "date", label: "Date" },
  { value: "file", label: "File Upload" },
  { value: "number", label: "Number" }, // Add this
];
```

**3. Update StepDataForm Renderer:**
```typescript
// src/components/stakeholder-processes/StepDataForm.tsx
const renderField = (field: FieldDefinition) => {
  switch (field.type) {
    // ...existing cases...
    
    case "number":
      return (
        <div key={field.key}>
          <label>{field.label}</label>
          <input
            type="number"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        </div>
      );
    
    default:
      return null;
  }
};
```

**4. Update StepManager Field Builder:**
```typescript
// src/components/stakeholder-processes/StepManager.tsx
// Add number-specific validation options if needed
```

### Permissions

**Permission Modules:**
- `stakeholder_processes` - Manage process definitions (admin only)
- `stakeholders` - Manage stakeholder/lead data

**Access Levels:**
- `can_read` - View stakeholders
- `can_write` - Create/edit stakeholders
- `can_delete` - Delete stakeholders

**RLS Policies:**
- Users can read all stakeholders in their company
- Users can write to stakeholders assigned to their team's current step
- Admins with stakeholder_processes permission can manage all processes

### Common Tasks

**Task: Add a process template**
```typescript
const SALES_TEMPLATE = {
  name: "Sales Lead Pipeline",
  steps: [
    { name: "Discovery", fields: [...] },
    { name: "Demo", fields: [...] },
    { name: "Proposal", fields: [...] },
    { name: "Negotiation", fields: [...] },
    { name: "Closed Won", fields: [...] },
  ],
};
```

**Task: Query stuck leads**
```sql
SELECT s.name, s.created_at, sps.name as current_step
FROM stakeholders s
JOIN stakeholder_process_steps sps ON sps.id = s.current_step_id
WHERE s.is_completed = FALSE
  AND s.created_at < NOW() - INTERVAL '30 days';
```

**Task: Get conversion rate**
```sql
SELECT 
  COUNT(*) FILTER (WHERE is_completed = TRUE) * 100.0 / COUNT(*) as conversion_rate
FROM stakeholders
WHERE company_id = YOUR_COMPANY_ID;
```

### Troubleshooting

**Issue: Steps not auto-advancing**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'auto_complete_stakeholder';

-- Check step completion
SELECT * FROM stakeholder_step_data 
WHERE stakeholder_id = X AND is_completed = TRUE;
```

**Issue: Permission denied**
```sql
-- Check team permissions
SELECT * FROM team_permissions 
WHERE team_id = X AND module = 'stakeholders';

-- Check user's teams
SELECT * FROM team_members WHERE employee_id = X;
```

**Issue: Field definitions not rendering**
```typescript
// Check JSONB structure
console.log(step.field_definitions);
// Should be: { fields: [...] }

// Not: [...]
```

---

## 🎓 Learning Path

1. **Read the Requirements** (User Q&A in tracker)
2. **Review the Schema** (sql/stakeholder_refactor_migration.sql)
3. **Explore the Hook** (src/hooks/useStakeholders.tsx)
4. **Study a Page** (src/app/.../stakeholders/page.tsx)
5. **Test the Flow** (STAKEHOLDER_TESTING_GUIDE.md)

---

## 📚 Additional Resources

- [Main Tracker](./STAKEHOLDER_REFACTOR_TRACKER.md) - Progress tracking
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Detailed docs
- [Testing Guide](./STAKEHOLDER_TESTING_GUIDE.md) - Complete test suite
- [Migration SQL](./sql/stakeholder_refactor_migration.sql) - Database setup

---

**Questions?** Check the implementation files or review the conversation summary in STAKEHOLDER_REFACTOR_TRACKER.md
