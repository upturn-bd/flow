import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Verifies Authentication Works
 * 
 * This simple test verifies that:
 * 1. Authentication was successful
 * 2. We can access protected pages
 * 3. Auth state persists across tests
 */

test.describe('Authentication Smoke Test', () => {
  test('should be authenticated and access protected pages', async ({ page }) => {
    console.log('🧪 Testing authentication state...');

    // Navigate to a protected page
    await page.goto('/ops/project');
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/.*login.*/);
    console.log('✓ Not redirected to login page');

    // Should see authenticated content
    const authIndicators = [
      page.locator('button:has-text("Log Out")'),
      page.locator('button:has-text("Logout")'),
      page.locator('nav'),
    ];

    let found = false;
    for (const indicator of authIndicators) {
      if (await indicator.isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }

    expect(found).toBeTruthy();
    console.log('✓ Found authenticated indicators');

    // Should not see login form
    const loginForm = page.locator('form:has(input[type="email"]):has(input[type="password"])');
    await expect(loginForm).not.toBeVisible();
    console.log('✓ No login form visible');

    console.log('✅ Authentication working correctly!');
  });

  test('should maintain auth across multiple page navigations', async ({ page }) => {
    console.log('🧪 Testing auth persistence...');

    // Navigate to different protected pages
    const protectedPages = [
      '/ops/project',
      '/home',
    ];

    for (const pagePath of protectedPages) {
      await page.goto(pagePath);
      
      // Should not be on login page
      await expect(page).not.toHaveURL(/.*login.*/);
      console.log(`✓ Accessed ${pagePath} without re-login`);
    }

    console.log('✅ Auth persists across navigation!');
  });

  test('should have valid session cookies', async ({ page, context }) => {
    console.log('🧪 Testing session cookies...');

    // Get all cookies
    const cookies = await context.cookies();
    
    // Should have session cookies
    expect(cookies.length).toBeGreaterThan(0);
    console.log(`✓ Found ${cookies.length} cookies`);

    // Check for common auth cookie patterns
    const authCookies = cookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') ||
      cookie.name.includes('supabase')
    );

    expect(authCookies.length).toBeGreaterThan(0);
    console.log(`✓ Found ${authCookies.length} auth-related cookies`);
    console.log(`  Cookies: ${authCookies.map(c => c.name).join(', ')}`);

    console.log('✅ Valid session cookies present!');
  });
});
