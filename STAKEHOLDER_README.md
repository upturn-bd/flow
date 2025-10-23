# 🎯 Stakeholder Management System

A complete process-based stakeholder and lead management system for the Flow HRIS platform.

## 📖 Overview

This system allows organizations to manage stakeholders (customers, partners, vendors) through customizable, multi-step workflows. Leads progress through defined processes until they become full stakeholders.

### Key Concepts

- **Process**: A workflow with multiple ordered or independent steps (e.g., "Sales Pipeline", "Vendor Onboarding")
- **Step**: An individual stage in a process with dynamic fields and team assignments
- **Lead**: A stakeholder record in progress (incomplete process)
- **Stakeholder**: A lead that has completed all process steps
- **Dynamic Fields**: Admin-defined form fields (text, boolean, date, file) for each step

## ✨ Features

### For Admins
- ✅ Create unlimited custom processes (sequential or independent)
- ✅ Define steps with custom fields, team assignments, and validation
- ✅ Edit processes while preserving old data (backward compatibility)
- ✅ Activate/deactivate processes
- ✅ Configure rollback for sequential processes
- ✅ Set file size limits per company

### For Users
- ✅ Create leads and assign to processes
- ✅ Work on assigned steps with dynamic forms
- ✅ Save drafts or complete steps
- ✅ Track progress through visual step indicators
- ✅ Manage multiple contact persons per stakeholder
- ✅ Search and filter leads/stakeholders
- ✅ View completion statistics

### Technical Features
- ✅ JSONB-based dynamic field definitions
- ✅ Automatic step progression (sequential processes)
- ✅ Team-based access control via RLS policies
- ✅ Field definition snapshots for version control
- ✅ Database triggers for auto-completion
- ✅ TypeScript type safety throughout
- ✅ Responsive UI with Tailwind CSS

## 🚀 Quick Start

### 1. Deploy the Database

```sql
-- Run the migration (WARNING: Drops old stakeholder tables!)
\i sql/stakeholder_refactor_migration.sql
```

This creates:
- `stakeholder_processes` - Process definitions
- `stakeholder_process_steps` - Step configurations
- `stakeholders` - Main entity (leads → stakeholders)
- `stakeholder_step_data` - Step completion data

### 2. Create Your First Process

1. Navigate to **Admin Management → Company Configurations → Stakeholder Processes**
2. Click **"Create New Process"**
3. Configure:
   - Name: "Sales Lead Pipeline"
   - Type: Sequential (ordered steps)
   - Allow Rollback: Yes/No
4. Click **"Create Process"**

### 3. Add Steps

1. Open the newly created process
2. Click **"Add Step"** for each stage:
   
   **Step 1: Discovery**
   - Assign Team: Sales Team
   - Add Fields:
     - Text: "discovery_notes" (required)
     - Date: "discovery_date" (required)
     - Boolean: "qualified" (required)

   **Step 2: Demo**
   - Assign Team: Sales Team
   - Add Fields:
     - Date: "demo_date" (required)
     - Text: "demo_feedback" (optional)
     - Boolean: "interested" (required)

   **Step 3: Proposal**
   - Assign Team: Sales Team
   - Add Fields:
     - File: "proposal_doc" (required)
     - Date: "proposal_sent_date" (required)

   **Step 4: Contract**
   - Assign Team: Legal Team
   - Add Fields:
     - File: "signed_contract" (required)
     - Date: "signing_date" (required)

### 4. Create a Lead

1. Navigate to **Admin Management → Stakeholders**
2. Click **"Add New Lead"**
3. Fill in:
   - Name: "Acme Corporation"
   - Address: "123 Main St"
   - Process: "Sales Lead Pipeline"
   - Add contact persons
4. Click **"Create Lead"**

The lead is automatically assigned to Step 1 (Discovery).

### 5. Work Through Steps

1. Click on the lead to view details
2. Click **"Work on Step"** for the current step
3. Fill in the dynamic form fields
4. Choose:
   - **"Save Draft"** - Save without completing
   - **"Complete Step"** - Mark as done and advance

When all steps are complete, the lead automatically becomes a **Stakeholder**.

## 📁 File Structure

```
src/
├── app/(home)/admin-management/
│   ├── company-configurations/stakeholder-processes/
│   │   ├── page.tsx                 # Process list
│   │   └── [id]/page.tsx            # Process detail + step management
│   └── stakeholders/
│       ├── page.tsx                 # Stakeholder/lead list
│       ├── new/page.tsx             # Create lead form
│       └── [id]/page.tsx            # Detail + step progression
│
├── components/stakeholder-processes/
│   ├── ProcessForm.tsx              # Process create/edit modal
│   ├── StepManager.tsx              # Step CRUD + field builder
│   └── StepDataForm.tsx             # Dynamic step data entry form
│
├── hooks/
│   └── useStakeholders.tsx          # Main data hook
│
└── lib/
    ├── types/schemas.ts             # TypeScript interfaces
    └── constants/index.ts           # Permission modules

sql/
└── stakeholder_refactor_migration.sql  # Database migration

docs/
├── STAKEHOLDER_REFACTOR_TRACKER.md     # Progress tracker
├── IMPLEMENTATION_SUMMARY.md           # Technical documentation
├── STAKEHOLDER_TESTING_GUIDE.md        # Complete test suite
└── STAKEHOLDER_QUICK_START.md          # Developer guide
```

## 🗄️ Database Schema

### stakeholder_processes
Defines workflows/pipelines

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar | Process name |
| description | text | Process description |
| company_id | integer | Company FK |
| is_active | boolean | Active status |
| is_sequential | boolean | Ordered steps? |
| allow_rollback | boolean | Can go back? |

### stakeholder_process_steps
Individual steps in a process

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| process_id | integer | Process FK |
| name | varchar | Step name |
| step_order | integer | Position in sequence |
| team_id | integer | Assigned team FK |
| field_definitions | jsonb | Dynamic field config |
| version | integer | Schema version |

### stakeholders
Main entity (leads/stakeholders)

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| name | varchar | Company/person name |
| address | text | Full address |
| contact_persons | jsonb | Array of contacts |
| process_id | integer | Process FK |
| current_step_id | integer | Current step FK |
| is_completed | boolean | All steps done? |
| company_id | integer | Company FK |

### stakeholder_step_data
Step completion records

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| stakeholder_id | integer | Stakeholder FK |
| step_id | integer | Step FK |
| data | jsonb | User-entered data |
| field_definitions_snapshot | jsonb | Schema at completion |
| is_completed | boolean | Step completed? |
| completed_by | varchar | Employee who completed |

## 🔐 Permissions

### Permission Modules
- `stakeholder_processes` - Manage process definitions (admin)
- `stakeholders` - Manage stakeholder/lead data

### RLS Policies
- ✅ Users can read all stakeholders in their company
- ✅ Users can write stakeholders assigned to their team's current step
- ✅ Company-scoped queries enforced at database level
- ✅ Step data isolated by team assignments

## 🎨 UI Components

### Stats Dashboard
Shows real-time counts:
- Active Leads
- Completed Stakeholders
- Total Records

### List View
- Search by name
- Filter tabs (All/Leads/Stakeholders)
- Status badges (Lead vs Stakeholder)
- Current step indicators
- Click to view details

### Detail View
- Two-column layout
- Contact information with clickable links
- Visual step progression
- "Work on Step" button for current step
- Completed data display
- Edit/Delete actions

### Dynamic Forms
- Automatically generated from field definitions
- Supports: text, boolean, date, file
- Real-time validation
- Save draft functionality
- File upload UI (backend pending)

## 📊 Workflow Types

### Sequential Processes
Steps must be completed in order:
1. Complete Step 1
2. Auto-advance to Step 2
3. Complete Step 2
4. Auto-advance to Step 3
5. ... and so on

**With Rollback:**
- Can go back to previous steps
- Re-editing updates existing data

### Independent Processes
Steps can be completed in any order:
- All steps available simultaneously
- Complete as needed
- When all done → Stakeholder

## 🧪 Testing

See [STAKEHOLDER_TESTING_GUIDE.md](./STAKEHOLDER_TESTING_GUIDE.md) for:
- ✅ 12 comprehensive test scenarios
- ✅ Expected results for each test
- ✅ Error handling verification
- ✅ Database verification queries
- ✅ Troubleshooting tips

## 🛠️ Development

### Adding a New Field Type

1. Update type definition:
```typescript
// src/lib/types/schemas.ts
export type FieldType = "text" | "boolean" | "date" | "file" | "number";
```

2. Add to constants:
```typescript
// src/lib/constants/index.ts
export const FIELD_TYPES = [..., { value: "number", label: "Number" }];
```

3. Implement renderer:
```typescript
// src/components/stakeholder-processes/StepDataForm.tsx
case "number":
  return <input type="number" ... />;
```

### Hook Usage

```typescript
const {
  stakeholders,
  leads,
  completedStakeholders,
  createStakeholder,
  completeStep,
} = useStakeholders();

// Create lead
await createStakeholder({ name: "...", process_id: 1, ... });

// Complete step
await completeStep(stakeholderId, stepId, { field1: "value" });
```

See [STAKEHOLDER_QUICK_START.md](./STAKEHOLDER_QUICK_START.md) for more examples.

## 🚧 Known Limitations

### File Uploads
- ✅ UI is ready
- ⏳ Backend Supabase Storage integration pending
- ⏳ File size enforcement pending
- Current status: Shows "File upload integration pending" message

### Notifications
- ⏳ Temporarily removed from hook (type errors)
- ⏳ Need to implement:
  - New lead assigned to team
  - Step completed
  - Lead converted to stakeholder

### Backward Compatibility
- ✅ Schema supports it via snapshots
- ⏳ UI display for field changes pending
- ⏳ Migration tool for updating old data

## 📈 Analytics (Future)

Planned features:
- Conversion rate (Leads → Stakeholders)
- Average time per step
- Team performance metrics
- Bottleneck identification
- Process efficiency reports

## 🤝 Contributing

### Before Making Changes
1. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
2. Check [STAKEHOLDER_REFACTOR_TRACKER.md](./STAKEHOLDER_REFACTOR_TRACKER.md)
3. Test changes following [STAKEHOLDER_TESTING_GUIDE.md](./STAKEHOLDER_TESTING_GUIDE.md)

### Code Standards
- Follow existing TypeScript patterns
- Use pure TypeScript validation (no Zod)
- Maintain company_id scoping in all queries
- Add RLS policies for new tables
- Document breaking changes

## 📚 Documentation

- **[STAKEHOLDER_REFACTOR_TRACKER.md](./STAKEHOLDER_REFACTOR_TRACKER.md)** - Progress and status
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details
- **[STAKEHOLDER_TESTING_GUIDE.md](./STAKEHOLDER_TESTING_GUIDE.md)** - Testing workflow
- **[STAKEHOLDER_QUICK_START.md](./STAKEHOLDER_QUICK_START.md)** - Developer reference

## 📞 Support

For questions or issues:
1. Check the documentation files above
2. Review error logs in browser console
3. Check Supabase logs for database errors
4. Verify RLS policies for permission issues

## 📝 License

Part of the Flow HRIS system - Internal use only

---

**Version:** 1.0  
**Status:** 85% Complete - Ready for Testing  
**Last Updated:** October 23, 2025
