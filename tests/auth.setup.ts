import { test as setup } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Global Setup - Authenticate Once
 * 
 * This setup runs once before all tests and saves the authentication state.
 * All tests will reuse this authenticated state without logging in again.
 */
setup('authenticate', async ({ page }) => {
    console.log('🔐 Authenticating user...');

    // Navigate to login page
    await page.goto('/login');

    // Fill in login credentials
    await page.fill('[data-testid="email-input"]', 'annonymous.sakibulhasan@gmail.com');
    await page.fill('[data-testid="password-input"]', 'Test@flow1234');

    // Click login button
    await page.click('[data-testid="login-button"]');

    // Wait for successful login - adjust the URL pattern based on where you redirect after login
    await page.waitForURL('**/ops/**', { timeout: 15000 }).catch(async () => {
        // If not redirected to /ops, try waiting for home page
        await page.waitForURL('/', { timeout: 5000 });
    });

    // Wait a bit for auth to fully settle
    await page.waitForTimeout(2000);

    // Verify we're logged in by checking for a common authenticated element
    const isLoggedIn = await page.locator('[data-testid="user-menu"]')
        .or(page.locator('Dashboard'))
        .or(page.locator('button:has-text("Logout")'))
        .isVisible()
        .catch(() => false);

    if (!isLoggedIn) {
        throw new Error('❌ Authentication failed - could not verify logged in state');
    }

    console.log('✅ Authentication successful!');

    // Save authentication state to file
    await page.context().storageState({ path: authFile });

    console.log(`💾 Auth state saved to: ${authFile}`);
});
