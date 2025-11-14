# Playwright E2E Tests for Upturn Flow

This directory contains comprehensive End-to-End (E2E) tests for the Upturn Flow HRIS platform using Playwright.

**🎉 Updated Test Suite - All Tests Revised & Routes Corrected!**

## � Test Coverage Summary

| Metric | Value |
|--------|-------|
| **Total Test Files** | 10 |
| **Total Test Cases** | 160+ |
| **Features Covered** | 14+ modules |
| **Browsers Tested** | Chromium, Firefox |
| **Routes Fixed** | All updated to `/ops/*` |

## �📁 Test Structure

```
tests/
├── fixtures/
│   └── auth.fixture.ts              # ✅ FIXED - Authentication fixtures for Admin/Manager/Employee
├── helpers/
│   └── test-utils.ts                # Test utilities and helpers
├── auth.spec.ts                     # ✅ REVISED - 12 tests for authentication flows
├── workflow-and-services.spec.ts    # ✨ NEW - 50+ tests for Task, Project, Attendance, Leave, Notice
├── services-management.spec.ts      # ✨ NEW - 40+ tests for Requisition, Settlement, Complaint, Payroll
├── operations-hr.spec.ts            # ✨ NEW - 40+ tests for Onboarding, Offboarding, HRIS, Stakeholder Issues
├── employee-management.spec.ts      # ✅ UPDATED - Routes fixed to /ops/hris
├── payroll.spec.ts                  # ✅ UPDATED - Routes fixed to /ops/payroll
├── operations.spec.ts               # ✅ UPDATED - Routes fixed to /ops/complaint
├── project-management.spec.ts       # ✅ Updated
├── general.spec.ts                  # ✅ Accessibility & Performance tests
├── smoke-and-visual.spec.ts         # ✅ Critical user journeys
├── TEST_COVERAGE_REPORT.md          # 📄 Detailed coverage documentation
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites

1. Ensure Playwright is installed:
```bash
npm install -D @playwright/test
```

2. Install browser binaries:
```bash
npx playwright install chromium firefox
```

### Configuration

Before running tests, update the test credentials in `tests/fixtures/auth.fixture.ts`:

```typescript
export const TEST_USERS = {
  admin: {
    email: 'your-admin@email.com',
    password: 'YourPassword',
    role: 'Admin'
  },
  manager: {
    email: 'your-manager@email.com',
    password: 'YourPassword',
    role: 'Manager'
  },
  employee: {
    email: 'your-employee@email.com',
    password: 'YourPassword',
    role: 'Employee'
  }
};
```

## 🧪 Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for debugging)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test tests/auth.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project="Mobile Chrome"
```

### Debug a specific test
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

## 📋 Test Coverage

### 1. Authentication (`auth.spec.ts`)
- ✅ Display login page
- ✅ Validation errors for empty fields
- ✅ Invalid email format handling
- ✅ Incorrect credentials handling
- ✅ Successful login (Admin/Manager/Employee)
- ✅ Password visibility toggle
- ✅ Logout functionality
- ✅ Password reset flow
- ✅ Registration flow (if available)

### 2. Employee Management (`employee-management.spec.ts`)
- ✅ Display employee list
- ✅ Search employees
- ✅ Filter by department
- ✅ View employee profile
- ✅ Attendance dashboard
- ✅ Mark attendance (check-in/out)
- ✅ View attendance history
- ✅ Display leave balance
- ✅ Submit leave request
- ✅ Approve leave request (Admin)

### 3. Payroll Management (`payroll.spec.ts`)
- ✅ Display payroll dashboard (Admin)
- ✅ Generate payroll
- ✅ View payroll history
- ✅ Adjust employee salary
- ✅ Export payroll report
- ✅ View own payslip (Employee)
- ✅ Download payslip
- ✅ View payroll history (Employee)
- ✅ Data isolation (employees can't see others' payroll)
- ✅ View salary change log

### 4. Project Management (`project-management.spec.ts`)
- ✅ Display project management page
- ✅ Show create new project tab (Admin only)
- ✅ Create new project
- ✅ View ongoing projects
- ✅ View completed projects
- ✅ Filter and search projects
- ✅ View project details
- ✅ View project milestones
- ✅ Role-based access control

### 5. Operations (`operations.spec.ts`)
- **Complaints:**
  - ✅ Display complaint page
  - ✅ Submit new complaint
  - ✅ View complaint details
  - ✅ Resolve complaint (Admin)
  
- **Requisitions:**
  - ✅ Display requisition page
  - ✅ Submit new requisition
  - ✅ Approve requisition (Admin)
  
- **Notices:**
  - ✅ Display notice board
  - ✅ Create notice (Admin)
  - ✅ View notice details
  
- **Tasks:**
  - ✅ Display task page
  - ✅ Create new task
  - ✅ Mark task as complete

### 6. General Tests (`general.spec.ts`)
- **Responsive Design:**
  - ✅ Mobile device display
  - ✅ Tablet device display
  - ✅ Mobile navigation menu
  
- **Accessibility:**
  - ✅ Heading hierarchy
  - ✅ Accessible form labels
  - ✅ Keyboard navigation
  
- **Performance:**
  - ✅ Page load time
  - ✅ Console error monitoring
  
- **Navigation:**
  - ✅ Navigate through sections
  - ✅ State persistence
  
- **Error Handling:**
  - ✅ 404 page handling
  - ✅ Network error handling
  
- **Security:**
  - ✅ Redirect unauthenticated users
  - ✅ Secure password input
  - ✅ XSS prevention
  
- **Search:**
  - ✅ Platform-wide search

## 🎯 Test Fixtures

The `auth.fixture.ts` provides pre-authenticated page contexts for different user roles:

- `authenticatedPage` - Basic authenticated context
- `adminPage` - Pre-logged in as Admin
- `managerPage` - Pre-logged in as Manager
- `employeePage` - Pre-logged in as Employee

Usage:
```typescript
import { test, expect } from './fixtures/auth.fixture';

test('admin only feature', async ({ adminPage }) => {
  await adminPage.goto('/admin-only-route');
  // Test admin-specific functionality
});
```

## 🔧 Configuration

The `playwright.config.ts` file contains:
- Test directory: `./tests`
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox
- Mobile devices: Pixel 5, iPhone 12
- Automatic dev server startup
- Trace collection on failure
- Screenshots on failure
- Video recording on failure

## 📊 CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries (2 retries on CI)
- Sequential execution on CI
- HTML report generation
- Fail on `test.only` in source code

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 🐛 Debugging Tips

1. **Use UI Mode:**
   ```bash
   npm run test:e2e:ui
   ```
   This provides a visual interface to step through tests.

2. **Use Playwright Inspector:**
   ```bash
   npx playwright test --debug
   ```

3. **Generate Code:**
   ```bash
   npx playwright codegen http://localhost:3000
   ```
   This opens a browser and records your actions as test code.

4. **View Traces:**
   When a test fails, traces are automatically captured. View them with:
   ```bash
   npx playwright show-trace trace.zip
   ```

5. **Slow Down Tests:**
   Add `slowMo` in the config to see what's happening:
   ```typescript
   use: {
     slowMo: 1000, // Slow down by 1 second
   }
   ```

## 📝 Best Practices

1. **Use data-testid attributes** in your components for stable selectors:
   ```tsx
   <button data-testid="submit-button">Submit</button>
   ```

2. **Avoid hard-coded waits** - use Playwright's auto-waiting:
   ```typescript
   // Bad
   await page.waitForTimeout(5000);
   
   // Good
   await page.waitForSelector('[data-testid="result"]');
   await page.waitForLoadState('networkidle');
   ```

3. **Create reusable helpers** for common actions:
   ```typescript
   async function login(page: Page, email: string, password: string) {
     await page.fill('input[type="email"]', email);
     await page.fill('input[type="password"]', password);
     await page.click('button[type="submit"]');
   }
   ```

4. **Test user journeys**, not just individual pages.

5. **Keep tests independent** - each test should be able to run in isolation.

## 🔄 Updating Tests

When adding new features to the platform:

1. Create a new test file or add to existing ones
2. Use appropriate fixtures for authentication
3. Follow the existing pattern and naming conventions
4. Update this README with new test coverage
5. Run tests locally before committing
6. Ensure tests pass in CI

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing#playwright)

## 🆘 Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if the dev server is running
- Verify network connectivity

### Browser not launching
- Run `npx playwright install` to reinstall browsers
- Check system requirements

### Flaky tests
- Use proper wait strategies
- Avoid `waitForTimeout` when possible
- Enable trace to debug: `trace: 'on'`

## 📞 Support

For issues or questions:
1. Check the Playwright documentation
2. Review test traces and screenshots
3. Consult the team lead or senior developer
