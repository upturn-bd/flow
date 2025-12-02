import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../tests/.auth/user.json');

/**
 * Global Setup - Authenticate Once
 * 
 * This setup runs once before all tests and saves the authentication state.
 * All tests will reuse this authenticated state without logging in again.
 */
setup('authenticate', async ({ page }) => {
    console.log('🔐 Starting authentication process...');

    // Ensure .auth directory exists
    const authDir = path.dirname(authFile);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
        console.log('📁 Created .auth directory');
    }

    // Navigate to login page
    console.log('📄 Navigating to login page...');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for login form to be ready
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    console.log('✓ Login page loaded');

    // Fill in login credentials using data-testid selectors
    console.log('✍️ Filling in credentials...');
    const emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="email-input"]')).first();
    const passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="password-input"]')).first();
    
    await emailInput.fill('annonymous.sakibulhasan@gmail.com');
    await passwordInput.fill('Test@flow1234');

    // Click login button
    console.log('🔘 Clicking login button...');
    const loginButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="login-button"]')).first();
    await loginButton.click();

    // Wait for navigation after login - with multiple fallback options
    console.log('⏳ Waiting for successful authentication...');
    try {
        // Try waiting for common post-login pages
        await Promise.race([
            page.waitForURL('**/ops/**', { timeout: 10000 }),
            page.waitForURL('**/home**', { timeout: 10000 }),
            page.waitForURL('**/dashboard**', { timeout: 10000 }),
        ]);
    } catch {
        console.log('⚠️ URL pattern not matched, checking for auth indicators...');
    }

    // Wait for page to settle
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify authentication by checking for authenticated elements
    console.log('✅ Verifying authentication state...');
    const authIndicators = [
        page.locator('button:has-text("Log Out")'),
        page.locator('button:has-text("Logout")'),
        page.locator('[data-testid="user-menu"]'),
        page.locator('text=Welcome'),
        page.locator('nav').filter({ hasText: /home|dashboard|profile/i }),
    ];

    let isAuthenticated = false;
    for (const indicator of authIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
            isAuthenticated = true;
            console.log(`✓ Found auth indicator: ${await indicator.textContent().catch(() => 'element')}`);
            break;
        }
    }

    // Also check if we're NOT on login page
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
        isAuthenticated = true;
        console.log(`✓ Redirected from login page to: ${currentUrl}`);
    }

    if (!isAuthenticated) {
        // Take a screenshot for debugging
        await page.screenshot({ path: '.auth/failed-login.png', fullPage: true });
        throw new Error('❌ Authentication failed - could not verify logged in state. Check .auth/failed-login.png for details.');
    }

    console.log('✅ Authentication verified successfully!');

    // Save authentication state to file
    await page.context().storageState({ path: authFile });

    console.log(`💾 Auth state saved to: ${authFile}`);
    console.log('🎉 Setup complete! All tests will use this authenticated state.');
});
