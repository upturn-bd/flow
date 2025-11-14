import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/sign-in');
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'annonymous.sakibulhasan@gmail.com');
  await page.fill('input[type="password"]', 'Test@flow1234');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for successful navigation
  await page.waitForURL((url) => 
    url.pathname.includes('/home') || url.pathname.includes('/ops'),
    { timeout: 20000 }
  );
  
  // Verify we're logged in
  await expect(page).toHaveURL(/\/(home|ops)/);
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
});
