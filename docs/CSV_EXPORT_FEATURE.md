# CSV Export Feature Documentation

## Overview

The CSV export functionality allows administrators to export HRIS employee data and stakeholder information to CSV format for external analysis, reporting, and record-keeping.

## Features Implemented

### 1. **CSV Export Utility** (`src/lib/utils/csv-export.ts`)

A comprehensive utility module providing:
- **Employee/HRIS Data Export**: Export employee records with configurable fields
- **Stakeholder Data Export**: Export stakeholder and lead information
- **Generic Data Export**: Reusable function for exporting any data type
- **Proper CSV Formatting**: Handles special characters, commas, quotes, and newlines
- **Timestamp-based Filenames**: Automatic file naming with ISO timestamps

#### Employee Export Options
- Employee ID & Name (always included)
- Email Address
- Phone Number
- Department
- Designation
- Join Date
- Basic Salary (sensitive - off by default)

#### Stakeholder Export Options
- Stakeholder ID & Name (always included)
- Address
- Contact Persons (name, email, phone)
- Status (Lead/Permanent/Rejected)
- Process
- Key Account Manager (KAM)
- Stakeholder Type
- Created Date

### 2. **Data Export Center** (`/admin-management/data-export`)

A dedicated admin page for configuring and exporting data:
- **Interactive Configuration**: Checkbox UI to select fields to include
- **Real-time Preview**: Shows record counts before export
- **Visual Feedback**: Color-coded cards and icons
- **Data Privacy Notice**: Warning banner for sensitive data handling
- **Responsive Design**: Works on desktop and mobile devices

**Access**: Admin Management → Data Export (in Company Configurations section)

### 3. **Quick Export Buttons**

Added convenient export buttons to existing pages:

#### Stakeholders Page (`/admin-management/stakeholders`)
- Green "Export CSV" button in header
- Exports currently filtered/searched stakeholder list
- Includes all configured fields automatically
- Toast notifications for success/error feedback

#### Employee Finder Page (`/ops/hris`)
- Green "Export CSV" button in header
- Exports currently filtered employee list
- Excludes salary data by default (privacy)
- Respects current search and filter settings

## Usage Guide

### For Administrators

#### Method 1: Using the Data Export Center (Recommended)
1. Navigate to **Admin Management**
2. Click **Data Export** under Company Configurations
3. Select either "HRIS Employee Data" or "Stakeholder Data"
4. Configure fields to include/exclude using checkboxes
5. Click the export button
6. CSV file will download automatically

#### Method 2: Quick Export from List Pages
1. Navigate to the relevant page:
   - `/admin-management/stakeholders` for stakeholder data
   - `/ops/hris` for employee data
2. Apply filters or search terms as needed
3. Click the green **Export CSV** button
4. Filtered data exports immediately

### CSV File Format

**Filename Pattern**: `{datatype}_{YYYY-MM-DDTHH-mm-ss}.csv`

Examples:
- `employees_2025-11-07T14-30-45.csv`
- `stakeholders_2025-11-07T14-31-20.csv`

**Encoding**: UTF-8 with BOM for Excel compatibility

**Special Characters**: Properly escaped and quoted

## Data Privacy & Security

### Sensitive Data Handling
- **Salary Information**: Disabled by default in employee exports
- **Contact Information**: Configurable inclusion
- **Access Control**: Only admin role can access export features
- **No Server Storage**: CSV files generated client-side only

### Best Practices
1. Only export data when necessary
2. Secure CSV files with appropriate permissions
3. Delete exported files after use
4. Avoid sharing exports containing salary data
5. Use company-approved cloud storage if needed

## Technical Implementation

### Architecture
- **Client-side Export**: All CSV generation happens in the browser
- **No Backend Required**: Uses browser's download API
- **Type-safe**: Full TypeScript interfaces
- **Framework Integration**: Follows Next.js App Router patterns
- **Reusable Components**: Modular design for easy extension

### Code Structure
```
src/
├── lib/utils/
│   └── csv-export.ts              # Core export utilities
├── app/(home)/
│   ├── admin-management/
│   │   ├── data-export/
│   │   │   └── page.tsx          # Data Export Center
│   │   └── stakeholders/
│   │       └── page.tsx          # With export button
│   └── ops/hris/
│       └── page.tsx              # With export button
```

### Key Functions

#### `exportEmployeesToCSV(employees, options)`
Exports employee array to CSV with configurable fields.

**Parameters:**
- `employees`: Array of ExtendedEmployee objects
- `options`: EmployeeExportOptions object

#### `exportStakeholdersToCSV(stakeholders, options)`
Exports stakeholder array to CSV with configurable fields.

**Parameters:**
- `stakeholders`: Array of Stakeholder objects  
- `options`: StakeholderExportOptions object

#### `exportGenericDataToCSV(data, columns, filename)`
Generic export function for custom data structures.

**Parameters:**
- `data`: Array of any objects
- `columns`: Array of column definitions
- `filename`: Base filename (timestamp added automatically)

## Future Enhancements

Potential improvements for future versions:

1. **Additional Data Types**
   - Leave requests history
   - Attendance logs
   - Project data
   - Task assignments
   - Payroll records

2. **Advanced Features**
   - Excel (.xlsx) format support
   - PDF export
   - Scheduled/automated exports
   - Email delivery of exports
   - Custom date range filtering

3. **Data Transformation**
   - Aggregation and summarization
   - Custom calculated fields
   - Multi-sheet exports
   - Pivot table generation

4. **Audit & Compliance**
   - Export activity logging
   - User tracking (who exported what)
   - Data retention policies
   - GDPR compliance features

## Troubleshooting

### CSV not downloading
- Check browser popup blocker settings
- Ensure data is loaded before export
- Try a different browser

### Special characters appear incorrectly
- Open CSV in a UTF-8 compatible editor
- In Excel: Use "Data > From Text/CSV" import

### Missing records
- Verify filters are not too restrictive
- Check pagination - export only shows current filtered set
- Refresh data before exporting

## Support

For issues or feature requests related to CSV export:
1. Check this documentation first
2. Review console for error messages
3. Contact the development team with:
   - Browser and version
   - Steps to reproduce
   - Screenshot if applicable
   - Sample data (without sensitive info)
