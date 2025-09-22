# Payroll System Documentation

## Overview

The payroll system is integrated into the existing Flow HRIS application, providing automated payroll generation, management, and tracking functionality. The system follows the established patterns and conventions of the codebase.

## Key Features

### 1. Database Schema
- **Modified `grades` table**: Added `basic_salary` field for salary information
- **New `payrolls` table**: Stores payroll records with grade name snapshots
- **Modified `companies` table**: Added payroll configuration fields
- **Row Level Security (RLS)**: Proper access controls for payroll data

### 2. Grade Name Snapshots
- Payroll records store `grade_name` as a string snapshot instead of `grade_id`
- This ensures historical payroll data remains intact even if grade names change
- Basic salary is also stored as a snapshot for historical accuracy

### 3. User Interface
- **History Tab First**: Employees see their payroll history as the default tab
- **Supervisor Requests**: Dedicated tab for supervisors to manage payroll approvals
- **Adjustments System**: Full support for payroll adjustments with reasons
- **Status Tracking**: Visual indicators for Paid, Pending, and Adjusted statuses

### 4. Automated Generation
- **Edge Function**: `generate_payroll` function runs on scheduled basis
- **Company Configuration**: Configurable payroll generation day per company
- **Employee Filtering**: Only generates for approved employees with grade assignments

### 5. Notification System
- **Status Updates**: Employees notified when payroll status changes
- **Supervisor Alerts**: Supervisors notified of pending payroll approvals
- **Adjustment Notifications**: Detailed notifications when payroll is adjusted

## File Structure

```
src/
├── app/(home)/operations-and-services/
│   ├── page.tsx                              # Updated with payroll service
│   └── services/payroll/
│       └── page.tsx                          # Main payroll service page
├── components/operations-and-services/payroll/
│   ├── PayrollHistory.tsx                    # Employee payroll history (default tab)
│   └── PayrollRequests.tsx                   # Supervisor payroll management
├── hooks/
│   └── usePayroll.tsx                        # Payroll data management hook
├── lib/
│   ├── types/schemas.ts                      # Updated with Payroll interfaces
│   ├── utils/notifications.ts                # Added payroll notification templates
│   └── validation/schemas/payroll.ts         # Payroll validation functions
├── sql/
│   └── payroll_system.sql                    # Database schema and RLS policies
└── supabase/functions/generate_payroll/
    └── index.ts                              # Automated payroll generation
```

## Database Schema

### Payrolls Table
```sql
CREATE TABLE payrolls (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  grade_name VARCHAR(255) NOT NULL,        -- Snapshot of grade name
  basic_salary DECIMAL(12,2) NOT NULL,     -- Snapshot of basic salary  
  adjustments JSONB DEFAULT '[]',          -- Array of PayrollAdjustment objects
  total_amount DECIMAL(12,2) NOT NULL,
  generation_date DATE NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  status VARCHAR(20) DEFAULT 'Pending',
  supervisor_id UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Companies Table Updates
```sql
ALTER TABLE companies 
ADD COLUMN payroll_generation_day INTEGER DEFAULT 1,
ADD COLUMN fiscal_year_start DATE DEFAULT '2024-01-01',
ADD COLUMN pay_frequency VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN live_payroll_enabled BOOLEAN DEFAULT false;
```

### Grades Table Updates
```sql
ALTER TABLE grades 
ADD COLUMN basic_salary DECIMAL(12,2) DEFAULT 0.00;
```

## TypeScript Interfaces

### Payroll Interface
```typescript
interface Payroll {
  id?: number;
  employee_id: string;
  grade_name: string;              // Snapshot of grade name
  basic_salary: number;            // Snapshot of basic salary
  adjustments: PayrollAdjustment[]; // Array of adjustments
  total_amount: number;
  generation_date: string;
  company_id: number;
  status: 'Paid' | 'Pending' | 'Adjusted';
  supervisor_id: string;
  created_at?: string;
  updated_at?: string;
}
```

### PayrollAdjustment Interface
```typescript
interface PayrollAdjustment {
  type: string;                    // Description of adjustment
  amount: number;                  // Positive for additions, negative for deductions
}
```

## Hook Usage

### usePayroll Hook
```typescript
const {
  payrolls,
  loading,
  error,
  payrollStats,
  fetchPayrollHistory,
  fetchSupervisedPayrolls,
  updatePayrollStatus,
  clearError,
} = usePayroll();

// Fetch employee's own payroll history
await fetchPayrollHistory(employeeId);

// Fetch payrolls supervised by current user
await fetchSupervisedPayrolls(supervisorId);

// Update payroll status with adjustments
await updatePayrollStatus(payrollId, 'Adjusted', adjustments);
```

## Security & Access Control

### Row Level Security Policies
- **Employee Access**: Can only view their own payroll records
- **Supervisor Access**: Can view and manage payrolls of their supervisees
- **Admin Access**: Full company-wide payroll access
- **Update Permissions**: Only supervisors can update payroll status

### Data Validation
- Comprehensive validation for payroll data
- Adjustment validation with type and amount checks
- Calculation validation to ensure data integrity
- Error handling with user-friendly messages

## Automated Generation

### Edge Function Scheduling
The `generate_payroll` function should be scheduled to run daily using Supabase Cron:

```sql
SELECT cron.schedule(
  'daily-payroll-generation',
  '0 9 * * *', -- Run at 9:00 AM daily
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/generate_payroll',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}',
    body:='{}'
  ) as request_id;
  $$
);
```

### Generation Logic
1. Check companies with `live_payroll_enabled = true`
2. Filter by `payroll_generation_day` matching current day of month  
3. Fetch eligible employees (approved, with grade assignments)
4. Generate payroll records with grade name and salary snapshots
5. Send notifications to employees and supervisors

## Notification Integration

### Notification Types
- **Payroll Generated**: Employee notification when payroll is created
- **Payroll Adjusted**: Employee notification when supervisor makes adjustments
- **Payroll Paid**: Employee notification when payroll is marked as paid
- **Supervisor Pending**: Supervisor notification for pending approvals

### Usage Example
```typescript
await createPayrollNotification(
  employeeId,
  'adjusted',
  {
    gradeName: 'Senior Developer',
    newAmount: 75000,
    adjustmentReason: 'Performance bonus'
  },
  {
    referenceId: payrollId,
    actionUrl: '/operations-and-services/services/payroll'
  }
);
```

## Usage Workflow

### Employee Workflow
1. Access Operations & Services → Payroll
2. View **History tab** (default) to see all payroll records
3. See status indicators (Paid, Pending, Adjusted)
4. View adjustment details and amounts
5. Receive notifications for status changes

### Supervisor Workflow
1. Access Operations & Services → Payroll → **Requests tab**
2. View pending payrolls for supervised employees
3. Add adjustments (bonuses, deductions) with reasons
4. Mark payrolls as Paid or Adjusted
5. System sends notifications to employees automatically

### Admin Workflow
1. Configure company payroll settings (generation day, frequency)
2. Enable/disable live payroll generation
3. Monitor payroll generation through edge function logs
4. Access all company payroll data through RLS policies

## Future Enhancements

1. **Bulk Operations**: Process multiple payrolls simultaneously
2. **Tax Calculations**: Integration with tax calculation services
3. **Reporting**: Comprehensive payroll reports and analytics
4. **Export Features**: PDF/Excel export of payroll data
5. **Approval Workflows**: Multi-level approval processes
6. **Payslip Generation**: Automated payslip creation and distribution