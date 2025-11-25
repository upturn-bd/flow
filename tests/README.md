# Task Management E2E Test Suite

Comprehensive end-to-end testing for the Task Management system in `/ops/tasks`.

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

### 1. Navigation and UI Tests
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
