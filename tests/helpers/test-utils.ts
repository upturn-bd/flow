import { Page, expect } from '@playwright/test';

/**
 * Common test helpers and utilities
 */

/**
 * Wait for element to be visible and return it
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return page.locator(selector);
  } catch (error) {
    throw new Error(`Element "${selector}" not found within ${timeout}ms`);
  }
}

/**
 * Fill form field with retry logic
 */
export async function fillField(page: Page, selector: string, value: string) {
  const field = await waitForElement(page, selector);
  await field.clear();
  await field.fill(value);
  await page.waitForTimeout(100); // Small delay for stability
}

/**
 * Click button with retry logic
 */
export async function clickButton(page: Page, selector: string) {
  const button = await waitForElement(page, selector);
  await button.click();
  await page.waitForTimeout(300); // Wait for click to register
}

/**
 * Select option from dropdown
 */
export async function selectOption(page: Page, selector: string, value: string | number) {
  const select = await waitForElement(page, selector);
  if (typeof value === 'number') {
    await select.selectOption({ index: value });
  } else {
    await select.selectOption(value);
  }
}

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  await fillField(page, 'input[type="email"]', email);
  await fillField(page, 'input[type="password"]', password);
  await clickButton(page, 'button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/operations-and-services/**', { timeout: 10000 });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]').first();
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/', { timeout: 5000 });
  }
}

/**
 * Navigate to specific section
 */
export async function navigateTo(page: Page, section: string) {
  const link = page.locator(`a:has-text("${section}"), a[href*="${section.toLowerCase()}"]`).first();
  
  if (await link.isVisible()) {
    await link.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Take screenshot with custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `screenshots/${name}-${Date.now()}.png`, fullPage: true });
}

/**
 * Check if toast/notification appears
 */
export async function expectToast(page: Page, message: string) {
  const toast = page.locator(`text=${message}, [role="alert"]:has-text("${message}")`).first();
  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Check if success message appears
 */
export async function expectSuccess(page: Page) {
  const successIndicator = page.locator('text=success, text=successful, [class*="success"]').first();
  await expect(successIndicator).toBeVisible({ timeout: 5000 });
}

/**
 * Check if error message appears
 */
export async function expectError(page: Page, errorMessage?: string) {
  if (errorMessage) {
    const error = page.locator(`text=${errorMessage}`).first();
    await expect(error).toBeVisible({ timeout: 5000 });
  } else {
    const errorIndicator = page.locator('text=error, text=failed, [class*="error"], [role="alert"]').first();
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for common loading indicators to disappear
  const loadingIndicators = [
    '[class*="loading"]',
    '[class*="spinner"]',
    'text=Loading...',
    '[data-testid="loading"]'
  ];
  
  for (const indicator of loadingIndicators) {
    try {
      await page.waitForSelector(indicator, { state: 'hidden', timeout: 1000 });
    } catch {
      // Indicator not found or already hidden
    }
  }
  
  await page.waitForLoadState('networkidle');
}

/**
 * Scroll element into view
 */
export async function scrollToElement(page: Page, selector: string) {
  const element = await waitForElement(page, selector);
  await element.scrollIntoViewIfNeeded();
}

/**
 * Upload file to input
 */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = await waitForElement(page, selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Get table data
 */
export async function getTableData(page: Page, tableSelector: string) {
  const table = await waitForElement(page, tableSelector);
  const rows = await table.locator('tr').all();
  
  const data = [];
  for (const row of rows) {
    const cells = await row.locator('td, th').allTextContents();
    data.push(cells);
  }
  
  return data;
}

/**
 * Check if element exists (without waiting)
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    return await element.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}

/**
 * Get text content of element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await waitForElement(page, selector);
  return (await element.textContent()) || '';
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes('login') && !url.endsWith('/');
}

/**
 * Clear local storage and cookies
 */
export async function clearBrowserData(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
  await page.route(url, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, urlPattern: string) {
  await page.waitForResponse(response => 
    response.url().includes(urlPattern) && response.status() === 200
  );
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    phone: `+1555${timestamp.toString().slice(-7)}`,
    company: `Test Company ${timestamp}`,
    randomString: Math.random().toString(36).substring(7)
  };
}

/**
 * Format date for input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
