# Step Status Field Feature

## Overview
This feature adds an optional status field to stakeholder process steps, allowing teams to track the progress of each step with configurable dropdown options.

## How It Works

### 1. Configuring Step Status Field

When creating or editing a process step in **Admin > Config > Stakeholder Processes**:

1. Check the **"Enable Step Status"** checkbox
2. Customize the status field label (default: "Status")
3. Add status options by:
   - Entering an option label (e.g., "In Progress", "Completed", "On Hold")
   - Clicking "Add" or pressing Enter
   - Options are automatically given a value based on the label
4. Remove unwanted options using the "Remove" button

### 2. Using Step Status During Data Entry

When team members work on stakeholder steps:

1. The status dropdown appears at the top of the step data form
2. Users can select from the configured options
3. The status is saved along with other step data
4. The status is optional - users can leave it blank

### 3. Viewing Step Status

On the **Admin > Stakeholders** page:

- **Desktop View**: Status appears below the step name in the "Current Step" column as a green badge
- **Mobile View**: Status appears below the step name in the step card

## Technical Implementation

### Database
- Column: `stakeholder_process_steps.status_field` (JSONB)
- Structure: `{enabled: boolean, label: string, options: [{label: string, value: string}]}`
- Migration: `sql/add_step_status_field.sql`

### Data Storage
- Status values are stored in `stakeholder_step_data.data` with the key `__step_status`
- The value matches one of the configured option values

### Type Definitions
```typescript
interface StakeholderProcessStep {
  // ... other fields
  status_field?: {
    enabled: boolean;
    label?: string;
    options?: DropdownOption[];
  };
}
```

## Example Use Cases

1. **Client Onboarding**: Track whether documentation is "Pending", "In Review", or "Approved"
2. **Verification Steps**: Monitor if verification is "Not Started", "In Progress", or "Completed"
3. **Quality Checks**: Indicate if a step is "Passed", "Failed", or "Needs Review"

## Migration Instructions

To enable this feature in your database:

```bash
psql -d your_database -f sql/add_step_status_field.sql
```

## Future Enhancements

Potential improvements could include:
- Color customization for different status options
- Required status field validation
- Status history tracking
- Conditional logic based on status values
