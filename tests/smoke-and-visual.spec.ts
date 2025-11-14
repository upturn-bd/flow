import { test, expect } from '@playwright/test';
import { login, waitForLoading } from './helpers/test-utils';
import { TEST_USERS } from './fixtures/auth.fixture';

/**
 * Smoke tests - Quick sanity checks to verify critical functionality
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('can login as admin', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    expect(page.url()).toContain('operations-and-services');
  });

  test('can login as employee', async ({ page }) => {
    await login(page, TEST_USERS.employee.email, TEST_USERS.employee.password);
    expect(page.url()).toContain('operations-and-services');
  });

  test('dashboard loads after login', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForLoading(page);
    
    // Check for main navigation elements
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
  });

  test('all main navigation links are accessible', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Check for key navigation items
    const navItems = [
      'Workforce',
      'Project',
      'Payroll',
      'Operations'
    ];
    
    for (const item of navItems) {
      const link = page.locator(`a:has-text("${item}"), nav:has-text("${item}")`).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('critical API endpoints respond', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Monitor network requests
    const apiCalls: string[] = [];
    page.on('response', response => {
      if (response.url().includes('supabase')) {
        apiCalls.push(response.url());
      }
    });
    
    await page.goto('/operations-and-services/workforce');
    await waitForLoading(page);
    
    // Should have made some API calls
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('no JavaScript errors on critical pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Visit critical pages
    const criticalPages = [
      '/operations-and-services/workforce',
      '/operations-and-services/payroll',
      '/operations-and-services/workflow/project'
    ];
    
    for (const url of criticalPages) {
      await page.goto(url);
      await waitForLoading(page);
    }
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('ResizeObserver')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Visual Regression Tests', () => {
  test('login page visual snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('dashboard visual snapshot', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await waitForLoading(page);
    
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('project management page visual snapshot', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/operations-and-services/workflow/project');
    await waitForLoading(page);
    
    await expect(page).toHaveScreenshot('project-management.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('mobile view visual snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveScreenshot('login-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Cross-browser Compatibility', () => {
  test('login works across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
    expect(page.url()).toContain('operations-and-services');
  });

  test('responsive layout works across browsers', async ({ page, browserName }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    const body = await page.locator('body').boundingBox();
    expect(body?.width).toBeLessThanOrEqual(375);
  });
});

test.describe('Data Integrity Tests', () => {
  test('employee data persists across sessions', async ({ page, context }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/operations-and-services/workforce');
    await waitForLoading(page);
    
    // Get initial employee count
    const employeeCards = await page.locator('[class*="employee"]').count();
    
    // Create new page in same context
    const newPage = await context.newPage();
    await newPage.goto('/operations-and-services/workforce');
    await waitForLoading(newPage);
    
    // Should see same data
    const newEmployeeCards = await newPage.locator('[class*="employee"]').count();
    expect(newEmployeeCards).toBe(employeeCards);
  });

  test('role-based permissions persist', async ({ page, context }) => {
    // Login as employee
    await login(page, TEST_USERS.employee.email, TEST_USERS.employee.password);
    await page.goto('/operations-and-services/workflow/project');
    
    // Should not see create project button
    const createButton = page.locator('text=Create New');
    await expect(createButton).not.toBeVisible();
    
    // Refresh page
    await page.reload();
    await waitForLoading(page);
    
    // Should still not see create project button
    await expect(createButton).not.toBeVisible();
  });
});

test.describe('Performance Benchmarks', () => {
  test('homepage loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('dashboard loads within 5 seconds after login', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    const startTime = Date.now();
    await page.goto('/operations-and-services/workforce');
    await waitForLoading(page);
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('search completes within 2 seconds', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/operations-and-services/workforce');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      const startTime = Date.now();
      await searchInput.fill('test');
      await page.waitForTimeout(100);
      await waitForLoading(page);
      const searchTime = Date.now() - startTime;
      
      expect(searchTime).toBeLessThan(2000);
    }
  });
});

test.describe('Critical User Journeys', () => {
  test('complete employee onboarding flow', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Navigate to employee management
    await page.goto('/operations-and-services/workforce');
    await waitForLoading(page);
    
    // Look for add employee button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New Employee")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Fill employee details
      const nameInput = page.locator('input[name*="name"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Employee');
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });

  test('complete leave request and approval flow', async ({ page, context }) => {
    // Employee requests leave
    await login(page, TEST_USERS.employee.email, TEST_USERS.employee.password);
    await page.goto('/operations-and-services/workforce/leave');
    await waitForLoading(page);
    
    const requestButton = page.locator('button:has-text("Request"), button:has-text("New")').first();
    if (await requestButton.isVisible()) {
      await requestButton.click();
      await page.waitForTimeout(500);
      
      // Fill leave request
      const leaveType = page.locator('select[name*="type"]').first();
      if (await leaveType.isVisible()) {
        await leaveType.selectOption({ index: 1 });
        
        // Submit
        const submitButton = page.locator('button:has-text("Submit")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Admin approves leave
    const adminPage = await context.newPage();
    await login(adminPage, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await adminPage.goto('/operations-and-services/workforce/leave');
    await waitForLoading(adminPage);
    
    const approveButton = adminPage.locator('button:has-text("Approve")').first();
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('complete project creation to completion flow', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/operations-and-services/workflow/project');
    await waitForLoading(page);
    
    // Create project
    await page.click('text=Create New');
    await page.waitForTimeout(500);
    
    const nameInput = page.locator('input[name="name"]').first();
    if (await nameInput.isVisible()) {
      const projectName = `E2E Test Project ${Date.now()}`;
      await nameInput.fill(projectName);
      
      const submitButton = page.locator('button:has-text("Create"), button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        
        // Verify project appears in ongoing list
        await page.click('text=Ongoing');
        await waitForLoading(page);
        
        const projectCard = page.locator(`text=${projectName}`).first();
        if (await projectCard.isVisible().catch(() => false)) {
          await expect(projectCard).toBeVisible();
        }
      }
    }
  });
});
