# E2E Test Suite with Global Authentication

Comprehensive end-to-end testing with persistent authentication for all test suites.

## 🔐 Authentication Setup

This project uses **global authentication** - you only login ONCE and all tests reuse the authenticated state.

### How It Works

1. **Setup Phase**: `auth.setup.ts` runs ONCE before all tests
2. **Login**: Logs in with test credentials and saves auth state to `.auth/user.json`
3. **Test Execution**: All tests automatically use the saved authentication
4. **No Re-login**: Tests run without logging in repeatedly

### Benefits
- ⚡ **Faster test execution** - No repeated logins
- 🔄 **Consistent state** - All tests use same authentication
- 🛡️ **More reliable** - Reduces auth-related flakiness
- 🎯 **Better isolation** - Focus on testing features, not login

## Running Tests

### Basic Commands

```bash
# Run all tests (authentication happens automatically on first run)
npm test

# Run tests in UI mode (great for debugging)
npm run test:ui

# Run tests in headed mode (see the browser)
npm run test:headed

# Run specific test file
npm test project-management.spec.ts

# Debug mode (step through tests)
npm run test:debug

# View test report
npm run test:report
```

### Re-authenticating

If you need to login again (e.g., credentials changed, session expired):

```bash
# Delete the auth file and run tests again
rm -rf .auth/user.json
npm test
```

Or on Windows PowerShell:
```powershell
Remove-Item -Path .auth\user.json -Force
npm test
```

## Overview

This test suite provides complete coverage of the Task Management functionality including:

- ✅ **Navigation & UI Rendering** - Page load, layout, and component visibility
- ✅ **Tab Navigation** - Switching between Ongoing, Completed, and Archived tabs
- ✅ **Task Creation** - Creating tasks with validation and error handling
- ✅ **Task Viewing** - Displaying task lists and individual task details
- ✅ **Task Updates** - Editing tasks and changing status
- ✅ **Task Deletion** - Deleting tasks with confirmation
- ✅ **Filtering & Search** - Finding tasks by various criteria
- ✅ **Pagination** - Loading more tasks
- ✅ **Error Handling** - Network errors, validation errors, unauthorized access
- ✅ **Responsive Design** - Mobile, tablet, and desktop viewports
- ✅ **Accessibility** - Keyboard navigation and ARIA labels
- ✅ **Performance** - Load times and responsiveness

## Test Files

```
tests/
├── task-management.spec.ts    # Main test suite
├── helpers/
│   ├── auth.ts                # Authentication helpers
│   └── test-utils.ts          # Common test utilities
└── README.md                  # This file
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Task Management Tests Only
```bash
npx playwright test task-management
```

### Run in UI Mode (Interactive)
```bash
npm run test:ui
```

### Run in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Run in Debug Mode
```bash
npm run test:debug
```

### View Test Report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── auth.setup.ts              # ⭐ Global authentication (runs once)
├── project-management.spec.ts # Project tests
├── task-management.spec.ts    # Task tests
└── README.md                  # This file
.auth/
└── user.json                  # 🔒 Saved authentication state (auto-generated)
```

### Authentication File Structure

The `auth.setup.ts` file:
- Runs before all test suites
- Logs in with test credentials
- Saves cookies and local storage to `.auth/user.json`
- All test projects depend on this setup

Test projects in `playwright.config.ts`:
```typescript
{
  name: 'chromium',
  use: {
    storageState: '.auth/user.json', // ← Uses saved auth
  },
  dependencies: ['setup'], // ← Waits for auth setup
}
```
- Page loads correctly
- All tabs are visible
- Create Task button is present
- Icons display properly

### 2. Tab Navigation Tests
- Switch between tabs
- URL updates correctly
- Tab state persists on reload
- Archived tab shows coming soon message

### 3. Task Creation Tests
- Open/close create modal
- Form validation
- Successful task creation
- Error handling
- Date validation
- Form data preservation

### 4. Task Viewing Tests
- Display task lists
- Show task details
- Navigate to/from task details
- Empty state handling

### 5. Task Update Tests
- Mark tasks as completed
- Edit task details
- Handle update failures

### 6. Task Deletion Tests
- Delete tasks successfully
- Confirmation dialogs
- Handle deletion failures

### 7. Filtering and Search Tests
- Filter by priority
- Search by title
- No results handling

### 8. Pagination Tests
- Load more functionality
- Hide button when all loaded

### 9. Error Handling Tests
- Network failures
- Unauthorized access
- Invalid task IDs

### 10. Responsive Design Tests
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1920x1080)

### 11. Accessibility Tests
- Keyboard navigation
- ARIA labels
- Focus management

### 12. Performance Tests
- Page load time
- Interaction responsiveness

## Environment Variables

Create a `.env` file in the project root with test credentials:

```env
# Test User Credentials
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=password123

TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123

TEST_MANAGER_EMAIL=manager@example.com
TEST_MANAGER_PASSWORD=manager123

# Base URL (optional, defaults to http://localhost:3000)
BASE_URL=http://localhost:3000
```

## Prerequisites

Before running tests:

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Ensure database is seeded** with test data (if applicable)

3. **Create test users** in your authentication system

## Test Data

The test suite uses the following test data:

```typescript
const TEST_TASK = {
  title: 'E2E Test Task',
  description: 'This is a test task created by automated E2E tests',
  priority: 'high',
  startDate: '2024-11-24',
  endDate: '2024-12-01',
};
```

## Helper Functions

### Authentication (`helpers/auth.ts`)

```typescript
import { login, logout, setupAuth } from './helpers/auth';

// Login as default user
await login(page);

// Login as specific user
await login(page, { email: 'admin@example.com', password: 'admin123' });

// Logout
await logout(page);

// Setup auth in beforeEach
await setupAuth(page);
```

### Test Utilities (`helpers/test-utils.ts`)

```typescript
import { 
  waitForToast, 
  fillField, 
  clickElement,
  waitForLoading 
} from './helpers/test-utils';

// Wait for success toast
await waitForToast(page, 'Task created successfully', 'success');

// Fill form field
await fillField(page, 'input[name="title"]', 'My Task');

// Click element
await clickElement(page, 'button:has-text("Submit")');

// Wait for loading to complete
await waitForLoading(page);
```

## Debugging Tests

### Visual Debugging
```bash
npm run test:ui
```

### Debug Mode
```bash
npm run test:debug
```

### Screenshots
Tests automatically take screenshots on failure. Find them in:
```
test-results/
└── [test-name]/
    └── test-failed-1.png
```

### Video Recording
Playwright automatically records videos of test runs. Find them in:
```
test-results/
└── [test-name]/
    └── video.webm
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm test
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. **Use Data Test IDs**
Add `data-testid` attributes to important elements:
```tsx
<button data-testid="create-task-button">Create Task</button>
```

### 2. **Avoid Hard-Coded Waits**
Use Playwright's built-in waiting mechanisms:
```typescript
// ❌ Bad
await page.waitForTimeout(5000);

// ✅ Good
await expect(page.locator('text=Success')).toBeVisible();
```

### 3. **Clean Up After Tests**
Delete test data created during tests:
```typescript
test.afterEach(async ({ page }) => {
  // Clean up test tasks
  await deleteTestTasks(page);
});
```

### 4. **Use Page Object Model**
For complex pages, create page objects:
```typescript
class TaskPage {
  constructor(private page: Page) {}
  
  async createTask(task: Task) {
    await this.page.click('[data-testid="create-task"]');
    // ...
  }
}
```

### 5. **Parallel Execution**
Tests run in parallel by default. Ensure tests are independent:
```typescript
test.describe.configure({ mode: 'parallel' });
```

## Troubleshooting

### ❌ Tests Ask for Login Every Time

**Problem**: Tests keep asking you to login on each run

**Solutions**:
1. Check that `.auth/user.json` exists after running tests
   ```bash
   ls -la .auth/
   ```

2. Verify `playwright.config.ts` has correct configuration:
   ```typescript
   storageState: '.auth/user.json'
   dependencies: ['setup']
   ```

3. Ensure setup project is configured:
   ```typescript
   { name: 'setup', testMatch: /.*\.setup\.ts/ }
   ```

4. Delete auth file and re-run to generate fresh auth:
   ```bash
   rm -rf .auth/user.json && npm test
   ```

### ❌ Authentication Fails

**Problem**: Setup fails to authenticate

**Solutions**:
1. Check the screenshot at `.auth/failed-login.png` for visual debugging
2. Verify test credentials in `auth.setup.ts` are correct
3. Ensure the login page structure hasn't changed
4. Check if Supabase/backend is running properly
5. Try logging in manually with the test credentials

### ❌ Tests Fail After Authentication

**Problem**: Auth works but tests fail

**Solutions**:
1. Session may have expired (Supabase tokens expire)
   ```bash
   rm .auth/user.json && npm test
   ```

2. Check if test user has proper permissions
3. Verify database has required test data
4. Run tests more frequently to keep session active

### ❌ Auth File Not Being Used

**Problem**: `.auth/user.json` exists but tests still login

**Solutions**:
1. Check test is using correct project (chromium, firefox, webkit)
2. Verify `storageState` path is correct in config
3. Ensure dependencies are set up correctly
4. Clear Playwright cache:
   ```bash
   npx playwright clean
   ```

### Tests Failing Locally

1. **Check if dev server is running**
   ```bash
   npm run dev
   ```

2. **Verify test user credentials**
   Check `.env` file has correct credentials

3. **Clear browser data**
   ```bash
   npx playwright clean
   ```

4. **Update Playwright**
   ```bash
   npm install -D @playwright/test@latest
   npx playwright install
   ```

### Flaky Tests

If tests are flaky:

1. **Increase timeouts**
   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

2. **Add explicit waits**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use retry logic**
   ```typescript
   test.describe.configure({ retries: 2 });
   ```

## Coverage Report

To see which parts of the application are tested:

```bash
# Run tests with coverage
npx playwright test --reporter=html

# View report
npm run test:report
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Add descriptive test names
3. Include error handling tests
4. Test both success and failure cases
5. Update this README if adding new test categories

## Test Metrics

Current test coverage:

- **Total Tests**: 50+
- **Test Suites**: 12
- **Average Duration**: ~2-3 minutes
- **Success Rate**: Target 100%

## Support

For issues or questions:

1. Check the [Playwright Documentation](https://playwright.dev)
2. Review existing test examples
3. Contact the QA team

---

**Last Updated**: November 24, 2024
**Playwright Version**: 1.56.1
**Node Version**: 20.x
