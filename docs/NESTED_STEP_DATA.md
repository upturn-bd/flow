# Nested Step Data Feature

## Overview

The nested step data feature allows stakeholder process steps to collect structured hierarchical data. Each field can now have nested sub-fields, enabling complex data collection scenarios.

## Key Features

1. **Nested Fields for All Field Types**: Every field type (text, boolean, date, file, geolocation, dropdown, multi-select) can have nested fields.

2. **Multi-Select Option-Specific Nested Fields**: Each option in a multi-select field can have its own unique set of nested fields.

3. **Backward Compatibility**: The system maintains compatibility with existing data in the legacy format.

4. **Recursive Nesting**: Nested fields can theoretically be nested further (though UI currently supports one level).

## Data Structure

### Legacy Format (Still Supported)
```json
{
  "field_key": "simple value"
}
```

### New Nested Format
```json
{
  "field_key": {
    "type": "text",
    "value": "main value",
    "nested": {
      "nested_field_key": {
        "type": "text",
        "value": "nested value",
        "nested": {}
      }
    }
  }
}
```

### Multi-Select with General Nested Fields
```json
{
  "multi_select_field": {
    "type": "multi_select",
    "value": ["option1", "option2"],
    "nested": {
      "general_nested_field": {
        "type": "text",
        "value": "applies to all selected options",
        "nested": {}
      }
    }
  }
}
```

### Multi-Select with Per-Option Nested Data
```json
{
  "multi_select_field": {
    "type": "multi_select",
    "value": ["option1", "option2"],
    "nested": {
      "option1_nested": {
        "nested_field1": {
          "type": "text",
          "value": "data specific to option1",
          "nested": {}
        }
      },
      "option2_nested": {
        "nested_field1": {
          "type": "text",
          "value": "data specific to option2",
          "nested": {}
        }
      }
    }
  }
}
```

## Usage

### Configuring Nested Fields in StepManager

1. **Navigate to Process Configuration**: Go to Admin → Config → Stakeholder Processes
2. **Edit or Create a Process Step**: Click on "Add Step" or edit an existing step
3. **Add Fields**: Add your main fields as usual
4. **Configure Nested Fields**:
   - Click the "List" icon (📋) on any field to open the nested fields panel
   - Click "Add Nested Field" to add nested fields to that field
   - Configure the nested field's label, type, and whether it's required

### Configuring Multi-Select Option-Specific Nested Fields

1. **Create a Multi-Select Field**: Add a field with type "Multi-Select"
2. **Add Options**: Click the dropdown icon to expand and add options
3. **Configure Option Nested Fields**:
   - Click the "Nested" button next to any option (shows count of nested fields)
   - Click "Add" to add nested fields specific to that option
   - Configure the nested fields (label, type, required)

### Filling Out Forms with Nested Data

When filling out stakeholder step data:

1. **Standard Fields**: Fill out the main field value as usual
2. **General Nested Fields**: If a field has nested fields, they appear below with indentation and a left border
3. **Multi-Select Nested Fields**: 
   - First select options from the multi-select dropdown
   - If options have nested fields, they appear as individual cards below
   - Each card shows the option name and its specific nested fields
4. **Validation**: Required nested fields are validated when completing the step

## API/Type Definitions

### FieldDefinition
```typescript
interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation?: FieldValidation;
  placeholder?: string;
  helpText?: string;
  options?: DropdownOption[];
  nested?: FieldDefinition[];  // New: nested field definitions
}
```

### DropdownOption
```typescript
interface DropdownOption {
  label: string;
  value: string;
  nested?: FieldDefinition[];  // New: option-specific nested fields
}
```

### NestedFieldValue
```typescript
interface NestedFieldValue {
  type: FieldType;
  value: any;
  nested?: Record<string, NestedFieldValue>;
}
```

## Validation

Validation rules for nested fields:

1. **Required Field Validation**: If a nested field is marked as required, it must have a value
2. **Type Validation**: Values must match the field type (handled by form inputs)
3. **Multi-Select Option Validation**: Required nested fields for selected options must be filled
4. **Error Display**: 
   - Nested field errors show below the input
   - Multi-select option nested errors show within the option card
   - Error keys follow format: `parent_key.nested_key` or `parent_key.option_value_nested.nested_key`

## Example Use Cases

### Use Case 1: Contact Person with Details
Main field: "Contact Person Name" (text)
Nested fields:
- "Phone Number" (text, required)
- "Email" (text, required)
- "Alternative Contact" (text)

### Use Case 2: Equipment Selection with Specifications
Main field: "Equipment Type" (multi-select with options: "Laptop", "Monitor", "Keyboard")
Option "Laptop" nested fields:
- "Brand" (text, required)
- "RAM Size" (text, required)
- "Storage Size" (text, required)

Option "Monitor" nested fields:
- "Screen Size" (text, required)
- "Resolution" (text, required)

### Use Case 3: Document with Metadata
Main field: "Document Upload" (file)
Nested fields:
- "Document Type" (dropdown, required)
- "Issue Date" (date, required)
- "Expiry Date" (date)
- "Notes" (text)

## Migration Guide

Existing data in the legacy format will continue to work. When a field with nested definitions encounters legacy data:

1. The legacy value is automatically wrapped in the new format
2. Nested fields are initialized as empty
3. Users can then fill in the nested fields
4. Once saved, the data is stored in the new nested format

No database migration is required as the data is stored in JSONB format.

## Technical Notes

### Component Updates

1. **StepManager.tsx**: 
   - Added nested field configuration UI in FieldEditor
   - Added option-specific nested field configuration for multi-select

2. **StepDataForm.tsx**:
   - Added helpers: `handleNestedFieldChange`, `handleMultiSelectNestedChange`
   - Added renderers: `renderNestedFields`, `renderNestedFieldInput`, `renderOptionNestedFieldInput`
   - Updated validation to handle nested fields recursively
   - Backward compatible initialization logic

3. **schemas.ts**:
   - Extended `FieldDefinition` with `nested` property
   - Extended `DropdownOption` with `nested` property
   - Added `NestedFieldValue` interface

### Performance Considerations

- Nested field rendering is efficient with React's reconciliation
- Validation runs recursively but is optimized to only check required fields
- Data structure is stored as JSONB in PostgreSQL, which is efficient for querying

### Limitations

- Current UI supports one level of nesting (though data structure supports infinite recursion)
- File upload in nested fields inherits the same file size limit as parent (10MB)
- Geolocation nested fields use the same picker component

## Future Enhancements

Potential future improvements:

1. Support for deeper nesting levels in UI
2. Conditional nested fields (show/hide based on parent value)
3. Copy nested field configurations between steps
4. Import/export nested field templates
5. Nested field dependency validation
