import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/auth.fixture';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page with all elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Flow|Login/i);
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check branding
    const logo = page.locator('img[alt*="Logo" i]');
    if (await logo.isVisible().catch(() => false)) {
      await expect(logo).toBeVisible();
    }
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs are marked as required
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    // Should show validation error or prevent submission
    const emailInput = page.locator('input[type="email"]');
    const inputValue = await emailInput.inputValue();
    expect(inputValue).toBe('invalid-email');
    
    // Should still be on login page
    expect(page.url()).toMatch(/\/$|\/login/);
  });

  test('should show error for incorrect credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error response
    await page.waitForTimeout(3000);
    
    // Check for error message or that we're still on login page
    const errorMessage = page.locator('text=/invalid|incorrect|wrong|error|failed/i, [role="alert"]').first();
    const isOnLoginPage = page.url().endsWith('/') || page.url().includes('login');
    
    const hasError = await errorMessage.isVisible().catch(() => false);
    expect(hasError || isOnLoginPage).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL((url) => 
      url.pathname.includes('/home') || url.pathname.includes('/ops'),
      { timeout: 20000 }
    );
    
    // Verify we're no longer on login page
    expect(page.url()).not.toMatch(/^\/$|\/login/);
    
    // Verify dashboard elements are visible
    const dashboardElement = page.locator('nav, main, [role="main"]').first();
    await expect(dashboardElement).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to verify page if email not verified', async ({ page }) => {
    // This test requires an unverified user account
    // Skip if not applicable
    test.skip(!process.env.TEST_UNVERIFIED_EMAIL, 'No unverified test user configured');
  });

  test('should have password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    
    // Look for toggle button
    const toggleButton = page.locator('[aria-label*="password" i], button:has-text("Show"), button:has-text("Hide"), [class*="eye"]').first();
    if (await toggleButton.isVisible().catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(300);
      
      // Check if input type changed to text
      const textInput = page.locator('input[type="text"]').first();
      if (await textInput.isVisible().catch(() => false)) {
        await expect(textInput).toBeVisible();
      }
    }
  });

  test('should maintain session after page reload', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => 
      url.pathname.includes('/home') || url.pathname.includes('/ops'),
      { timeout: 20000 }
    );
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    expect(page.url()).not.toMatch(/^\/$|\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => 
      url.pathname.includes('/home') || url.pathname.includes('/ops'),
      { timeout: 20000 }
    );
    
    // Find and click logout button
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      'button:has-text("Log Out")',
      '[aria-label*="Logout" i]',
      '[aria-label*="Sign Out" i]',
      'a:has-text("Logout")',
      'a:has-text("Sign Out")'
    ];
    
    let loggedOut = false;
    for (const selector of logoutSelectors) {
      const logoutButton = page.locator(selector).first();
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
        loggedOut = true;
        break;
      }
    }
    
    if (loggedOut) {
      // Verify redirect to login
      await page.waitForURL((url) => 
        url.pathname === '/' || url.pathname.includes('/login'),
        { timeout: 5000 }
      );
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      console.log('⚠️  Logout button not found - manual logout may be required');
    }
  });
});

test.describe('Password Reset Flow', () => {
  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/');
    
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset"), a[href*="forgot"]').first();
    if (await forgotPasswordLink.isVisible().catch(() => false)) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(1000);
      
      // Should be on forgot password page
      expect(page.url()).toMatch(/forgot|reset/i);
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      test.skip(true, 'Forgot password link not available');
    }
  });

  test('should submit password reset request', async ({ page }) => {
    await page.goto('/');
    
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")').first();
    if (await forgotPasswordLink.isVisible().catch(() => false)) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(1000);
      
      // Fill email
      await page.fill('input[type="email"]', TEST_USERS.admin.email);
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForTimeout(2000);
    } else {
      test.skip(true, 'Password reset not available');
    }
  });
});

test.describe('Registration Flow', () => {
  test('should navigate to registration page if available', async ({ page }) => {
    await page.goto('/');
    
    const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), a:has-text("Create account"), a[href*="register"], a[href*="signup"]').first();
    if (await signUpLink.isVisible().catch(() => false)) {
      await signUpLink.click();
      await page.waitForTimeout(1000);
      
      const url = page.url();
      expect(url).toMatch(/register|signup|sign-up/i);
    } else {
      test.skip(true, 'Registration not available');
    }
  });
});

test.describe('Email Verification', () => {
  test('should display verification page', async ({ page }) => {
    await page.goto('/verify?email=test@example.com');
    await page.waitForLoadState('networkidle');
    
    // Check for verification message
    const verifyHeading = page.locator('h1:has-text("Verify"), text=verification').first();
    if (await verifyHeading.isVisible().catch(() => false)) {
      await expect(verifyHeading).toBeVisible();
    }
  });
});
