# ✅ Test Suite Action Items

## Immediate Next Steps

### 1. Run the Test Suite
```bash
cd flow
npm run test:e2e
```

**Expected Outcome**: Tests will run against local dev server. Some may fail due to:
- Missing UI elements
- Timing issues
- Test data not existing
- Selector mismatches

### 2. Review Results
```bash
# View the HTML report
npx playwright show-report
```

Check for:
- [ ] How many tests passed?
- [ ] Which tests failed?
- [ ] Are failures due to selectors or logic?
- [ ] Any timeout issues?

### 3. Fix Failing Tests (If Any)

Common fixes needed:
```typescript
// If element selector not found:
// 1. Use Playwright Inspector to find correct selector
npx playwright test --debug auth.spec.ts

// 2. Adjust selector in test file
// Change from:
const button = page.locator('button:has-text("Submit")');
// To:
const button = page.locator('button:has-text("Submit"), button[type="submit"]');

// If timing issues:
// Add explicit waits:
await page.waitForLoadState('networkidle');
await page.waitForSelector('h1');
```

---

## Quick Test Commands

### Run Individual Suites
```bash
# Auth tests only (fastest to verify setup)
npx playwright test auth.spec.ts

# Workflow tests
npx playwright test workflow-and-services.spec.ts

# Services tests
npx playwright test services-management.spec.ts

# HR operations tests
npx playwright test operations-hr.spec.ts
```

### Debug Mode
```bash
# Open Playwright Inspector
npx playwright test auth.spec.ts --debug

# Run in headed mode (see browser)
npx playwright test auth.spec.ts --headed

# Run in UI mode (best for development)
npx playwright test --ui
```

---

## Test Verification Checklist

### Phase 1: Basic Verification ✅
- [ ] Playwright is installed
- [ ] Browsers are installed (chromium, firefox)
- [ ] `.env.local` has test credentials
- [ ] Dev server starts successfully
- [ ] Test user exists in Supabase
- [ ] Test user can login manually

### Phase 2: Auth Tests ✅
- [ ] `auth.spec.ts` passes all tests
- [ ] Login fixture works (adminPage, employeePage)
- [ ] Session persists correctly
- [ ] Redirects work after login

### Phase 3: Feature Tests 🔄
- [ ] Workflow tests pass (tasks, projects, attendance, leave, notice)
- [ ] Services tests pass (requisition, settlement, complaint, payroll)
- [ ] HR operations tests pass (onboarding, offboarding, hris)
- [ ] Legacy tests pass (employee-management, payroll, operations)

### Phase 4: Quality Tests 🔄
- [ ] General tests pass (responsive, accessibility, performance)
- [ ] Smoke tests pass (critical user journeys)
- [ ] Visual regression tests pass
- [ ] Project management tests pass

---

## Common Issues & Solutions

### Issue 1: "Test user email/password not found"
**Solution**:
```bash
# Check .env.local exists in flow/ directory
cat .env.local | grep TEST_USER

# If missing, create:
echo "TEST_USER_EMAIL=admin@example.com" >> .env.local
echo "TEST_USER_PASSWORD=YourPassword123!" >> .env.local
```

### Issue 2: "Cannot find page at /ops/tasks"
**Solution**:
- Navigate manually to verify route exists
- Check if page requires authentication
- Ensure dev server is running
- Check for typos in route

### Issue 3: "Timeout: element not visible"
**Solution**:
```typescript
// Increase timeout
test.setTimeout(60000); // 60 seconds

// Add explicit wait
await page.waitForTimeout(2000);

// Wait for specific state
await page.waitForLoadState('networkidle');
```

### Issue 4: "Selector not found"
**Solution**:
```bash
# Use Playwright Inspector to find selector
npx playwright test --debug

# Or codegen to record actions
npx playwright codegen http://localhost:3000
```

---

## Optimization Tips

### Selective Test Execution
```bash
# Run only @smoke tagged tests
npx playwright test --grep "@smoke"

# Run only admin tests
npx playwright test --grep "admin"

# Skip slow tests
npx playwright test --grep-invert "@slow"
```

### Parallel Execution
```bash
# Run tests in parallel (faster)
npx playwright test --workers 4

# Run serially (slower but more stable)
npx playwright test --workers 1
```

### Test Filters
```bash
# Run specific test by name
npx playwright test -g "should login successfully"

# Run specific file
npx playwright test auth.spec.ts

# Run multiple files
npx playwright test auth.spec.ts workflow-and-services.spec.ts
```

---

## CI/CD Setup

### GitHub Actions (Already Configured)
Tests will run automatically on:
- Pull requests to `main`
- Pushes to `main`
- Manual workflow dispatch

**Configuration File**: `.github/workflows/playwright.yml`

### Manual Trigger
1. Go to GitHub repo
2. Click "Actions" tab
3. Select "Playwright Tests" workflow
4. Click "Run workflow"

---

## Test Data Management

### Current State
- Tests create data dynamically (using timestamps)
- No cleanup implemented
- Tests may leave data in database

### Recommended Improvement
```typescript
// Add cleanup hooks
test.afterEach(async () => {
  // Clean up test data
  // Delete created records
});

// Or use test database
// - Separate Supabase project for testing
// - Reset database before each test run
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Single test | < 30s | Most tests should complete quickly |
| Full suite | < 10 min | 160+ tests across 2 browsers |
| Auth tests | < 1 min | Critical path, should be fast |
| Smoke tests | < 2 min | Quick sanity checks |

---

## Documentation Reference

### Quick Links
- **Setup Guide**: `../PLAYWRIGHT_SETUP.md`
- **Coverage Report**: `TEST_COVERAGE_REPORT.md`
- **Revision Summary**: `REVISION_SUMMARY.md`
- **Test README**: `README.md`

### Playwright Docs
- Main docs: https://playwright.dev
- API reference: https://playwright.dev/docs/api/class-playwright
- Best practices: https://playwright.dev/docs/best-practices

---

## Success Indicators

You'll know the tests are working when:
- ✅ Dev server starts automatically
- ✅ Browser opens and navigates to app
- ✅ Login succeeds automatically
- ✅ Tests navigate through features
- ✅ Most tests pass (100% not expected initially)
- ✅ HTML report shows results
- ✅ Screenshots captured on failures

---

## Next Actions After Tests Run

### If Most Tests Pass (80%+) ✅
1. Fix failing tests one by one
2. Update selectors if needed
3. Add missing test data
4. Document any issues
5. Commit changes

### If Many Tests Fail (< 50%) ⚠️
1. Check dev server is running
2. Verify test user credentials
3. Manually test login flow
4. Check Supabase connection
5. Review console errors
6. Use Playwright Inspector to debug

### If All Tests Fail ❌
1. Verify environment setup
2. Check .env.local file
3. Test database connection
4. Review error messages
5. Start with just auth.spec.ts
6. Build up from there

---

## Contact & Support

**Internal Resources**:
- Check documentation files in `/tests` directory
- Review test examples in existing spec files
- Use Playwright UI mode for debugging

**External Resources**:
- Playwright Discord: https://aka.ms/playwright/discord
- Stack Overflow: Tag with `playwright`
- GitHub Issues: https://github.com/microsoft/playwright/issues

---

**Ready to run! 🚀**

```bash
cd flow && npm run test:e2e
```

---

*Last Updated: January 2025*
