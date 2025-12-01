# Test Performance Optimization Guide

## Problem
Tests were slow because each test created a new browser context, causing a "refresh" effect and slow initial navigation.

## Solution: Persistent Page Pattern

### Pattern Implementation

For test suites that can run serially (don't need isolation between tests), use this pattern:

```typescript
test.describe('Your Test Suite Name', () => {
    // Enable serial execution
    test.describe.configure({ mode: 'serial' });

    // Declare persistent page variable
    let page: Page;

    // Create page once before all tests
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ 
            storageState: 'tests/.auth/user.json' 
        });
        page = await context.newPage();
        // Navigate once
        await navigateToProjects(page);
    });

    // Clean up after all tests
    test.afterAll(async () => {
        await page.close();
    });

    // Tests use the persistent page (no ({ page }) parameter)
    test('your test', async () => {
        // Use page directly
        await expect(page.locator('h1')).toBeVisible();
    });
});
```

### Benefits

1. **Faster Execution**: Browser context created once, not per test
2. **No "Refresh" Effect**: Same page reused across tests
3. **Faster Navigation**: Initial page load happens once
4. **Better Resource Usage**: Less memory/CPU thrashing

### Speed Improvements

- **Before**: Each test = 5-10 seconds (new context + navigation)
- **After**: First test = 5 seconds, subsequent tests = 1-2 seconds

### Applied To

✅ Project Management - Navigation and UI
✅ Project Management - Tab Navigation  
✅ Project Management - Project Creation

### Still Need To Apply

The following test suites in `project-management.spec.ts` still use the old pattern and should be updated:

- Project Management - Project Viewing
- Project Management - Project Updating
- Project Management - Project Deletion
- Project Management - Project Completion
- Project Management - Pagination

### When NOT to Use

Don't use persistent page when:
- Tests modify global state that affects other tests
- Tests need complete isolation
- Tests run different user roles/permissions
- Tests involve authentication changes

### Additional Optimizations Applied

1. **Playwright Config** (`playwright.config.ts`):
   - Timeout: 60 seconds (was 30)
   - Workers limited to 4 (prevents resource contention)
   - Navigation timeout: 30 seconds
   - Action timeout: 15 seconds

2. **Navigation Helper** (`navigateToProjects`):
   - Changed from `networkidle` to `domcontentloaded` (faster)
   - Wait for specific selector instead of general page load

3. **Authentication** (`auth.setup.ts`):
   - Runs once before all tests
   - Auth state saved and reused
   - No repeated logins

## Next Steps

To complete the optimization:

1. Apply persistent page pattern to remaining test suites
2. Monitor test execution times
3. Consider grouping related tests into same suite for maximum reuse

## Monitoring Performance

Check test duration with:
```powershell
bun playwright test --reporter=list
```

Look for tests that still take >5 seconds after the first test in a suite.
