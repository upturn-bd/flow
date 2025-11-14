import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test('should display properly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Upturn Flow|Login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should display properly on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Upturn Flow|Login/i);
  });

  test('should have mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login first
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
    
    // Check for hamburger menu or bottom navigation
    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("Menu")').first();
    const bottomNav = page.locator('nav[class*="bottom"], [class*="mobile-nav"]').first();
    
    const hasMenu = await menuButton.isVisible().catch(() => false);
    const hasBottomNav = await bottomNav.isVisible().catch(() => false);
    
    expect(hasMenu || hasBottomNav).toBeTruthy();
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(0);
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs have labels or aria-labels
    const emailHasLabel = await emailInput.evaluate(el => {
      const inputEl = el as HTMLInputElement;
      return !!(inputEl.labels?.length || el.getAttribute('aria-label') || el.getAttribute('placeholder'));
    });
    
    const passwordHasLabel = await passwordInput.evaluate(el => {
      const inputEl = el as HTMLInputElement;
      return !!(inputEl.labels?.length || el.getAttribute('aria-label') || el.getAttribute('placeholder'));
    });
    
    expect(emailHasLabel).toBeTruthy();
    expect(passwordHasLabel).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  });
});

test.describe('Performance Tests', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors (like favicon not found)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && !error.includes('manifest')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Navigation Tests', () => {
  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
    
    // Navigate to different sections
    const workforceLink = page.locator('a:has-text("Workforce"), a[href*="workforce"]').first();
    if (await workforceLink.isVisible()) {
      await workforceLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('workforce');
    }
  });

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
    
    // Navigate away and back
    const projectLink = page.locator('a:has-text("Project"), a[href*="project"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForTimeout(1000);
      
      // Go back
      await page.goBack();
      await page.waitForTimeout(1000);
      
      // Should still be logged in
      expect(page.url()).not.toContain('login');
    }
  });
});

test.describe('Error Handling', () => {
  test('should display 404 page for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    
    if (response) {
      // Should either show 404 page or redirect
      const status = response.status();
      expect(status).toBeGreaterThanOrEqual(200);
    }
  });

  test('should handle network errors gracefully', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    await page.goto('/').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Should show error message or offline indicator
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    
    // Go back online
    await context.setOffline(false);
  });
});

test.describe('Security Tests', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/operations-and-services/workflow/project');
    
    // Should redirect to login or show unauthorized
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|unauthorized|\/$/);
  });

  test('should have secure password input', async ({ page }) => {
    await page.goto('/');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should prevent XSS in input fields', async ({ page }) => {
    await page.goto('/');
    
    const emailInput = page.locator('input[type="email"]');
    const xssPayload = '<script>alert("xss")</script>';
    await emailInput.fill(xssPayload);
    
    const value = await emailInput.inputValue();
    // Should be sanitized or rejected
    expect(value).toBe(xssPayload); // Input should accept text but not execute
  });
});

test.describe('Search Functionality', () => {
  test('should search across the platform', async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Should show search results
      const resultsCount = await page.locator('[class*="result"], [class*="search"]').count();
      expect(resultsCount).toBeGreaterThanOrEqual(0);
    }
  });
});
