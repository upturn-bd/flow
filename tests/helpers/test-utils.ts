import { Page, expect, Locator } from '@playwright/test';

/**
 * Common Test Utilities
 * 
 * Reusable helper functions for E2E tests
 */

/**
 * Wait for an element to be visible with custom timeout
 * @param locator - Playwright locator
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForVisible(locator: Locator, timeout = 5000) {
    await expect(locator).toBeVisible({ timeout });
}

/**
 * Wait for an element to be hidden
 * @param locator - Playwright locator
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForHidden(locator: Locator, timeout = 5000) {
    await expect(locator).not.toBeVisible({ timeout });
}

/**
 * Fill a form field with retry logic
 * @param page - Playwright page
 * @param selector - Field selector
 * @param value - Value to fill
 */
export async function fillField(page: Page, selector: string, value: string) {
    const field = page.locator(selector).first();
    await field.waitFor({ state: 'visible', timeout: 5000 });
    await field.clear();
    await field.fill(value);

    // Verify the value was set
    const actualValue = await field.inputValue();
    if (actualValue !== value) {
        // Retry once
        await field.clear();
        await field.fill(value);
    }
}

/**
 * Click an element with retry logic
 * @param page - Playwright page
 * @param selector - Element selector
 */
export async function clickElement(page: Page, selector: string) {
    const element = page.locator(selector).first();
    await element.waitFor({ state: 'visible', timeout: 5000 });
    await element.click();
}

/**
 * Wait for a toast/notification message
 * @param page - Playwright page
 * @param message - Expected message text (partial match)
 * @param type - Type of notification (success, error, info, warning)
 */
export async function waitForToast(
    page: Page,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success'
) {
    const toast = page.locator(`[role="alert"]:has-text("${message}")`)
        .or(page.locator(`.toast:has-text("${message}")`))
        .or(page.locator(`[data-testid="toast"]:has-text("${message}")`))
        .or(page.locator(`text=${message}`).locator('..').locator('[role="alert"]'));

    await expect(toast).toBeVisible({ timeout: 10000 });

    return toast;
}

/**
 * Wait for loading to complete
 * @param page - Playwright page
 */
export async function waitForLoading(page: Page) {
    // Wait for common loading indicators to disappear
    const loadingIndicators = [
        page.locator('[data-testid="loading"]'),
        page.locator('.loading'),
        page.locator('.spinner'),
        page.locator('text=Loading...'),
    ];

    for (const indicator of loadingIndicators) {
        if (await indicator.isVisible().catch(() => false)) {
            await indicator.waitFor({ state: 'hidden', timeout: 10000 });
        }
    }

    // Also wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
}

/**
 * Take a screenshot with a descriptive name
 * @param page - Playwright page
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
        path: `screenshots/${name}-${timestamp}.png`,
        fullPage: true,
    });
}

/**
 * Scroll to an element
 * @param page - Playwright page
 * @param selector - Element selector
 */
export async function scrollToElement(page: Page, selector: string) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
}

/**
 * Wait for URL to match pattern
 * @param page - Playwright page
 * @param pattern - URL pattern (glob or regex)
 * @param timeout - Timeout in milliseconds
 */
export async function waitForURL(page: Page, pattern: string | RegExp, timeout = 5000) {
    await page.waitForURL(pattern, { timeout });
}

/**
 * Get all text content from elements matching selector
 * @param page - Playwright page
 * @param selector - Element selector
 */
export async function getAllText(page: Page, selector: string): Promise<string[]> {
    const elements = page.locator(selector);
    const count = await elements.count();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
        const text = await elements.nth(i).textContent();
        if (text) texts.push(text.trim());
    }

    return texts;
}

/**
 * Check if element exists (without waiting)
 * @param page - Playwright page
 * @param selector - Element selector
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
    return await page.locator(selector).count() > 0;
}

/**
 * Wait for element count to match expected value
 * @param page - Playwright page
 * @param selector - Element selector
 * @param expectedCount - Expected number of elements
 * @param timeout - Timeout in milliseconds
 */
export async function waitForElementCount(
    page: Page,
    selector: string,
    expectedCount: number,
    timeout = 5000
) {
    await page.waitForFunction(
        ({ sel, count }) => document.querySelectorAll(sel).length === count,
        { sel: selector, count: expectedCount },
        { timeout }
    );
}

/**
 * Select option from dropdown (works with both select and custom dropdowns)
 * @param page - Playwright page
 * @param dropdownSelector - Dropdown selector
 * @param optionText - Option text to select
 */
export async function selectDropdownOption(
    page: Page,
    dropdownSelector: string,
    optionText: string
) {
    const dropdown = page.locator(dropdownSelector).first();

    // Check if it's a native select element
    const tagName = await dropdown.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'select') {
        await dropdown.selectOption({ label: optionText });
    } else {
        // Custom dropdown
        await dropdown.click();
        await page.waitForTimeout(300);
        await page.click(`text=${optionText}`);
    }
}

/**
 * Upload a file to a file input
 * @param page - Playwright page
 * @param inputSelector - File input selector
 * @param filePath - Path to file to upload
 */
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
    const fileInput = page.locator(inputSelector);
    await fileInput.setInputFiles(filePath);
}

/**
 * Clear all cookies and local storage
 * @param page - Playwright page
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
 * @param page - Playwright page
 * @param url - URL pattern to mock
 * @param response - Response data
 * @param status - HTTP status code
 */
export async function mockAPIResponse(
    page: Page,
    url: string | RegExp,
    response: any,
    status = 200
) {
    await page.route(url, route => {
        route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(response),
        });
    });
}

/**
 * Wait for API call to complete
 * @param page - Playwright page
 * @param urlPattern - URL pattern to wait for
 */
export async function waitForAPICall(page: Page, urlPattern: string | RegExp) {
    await page.waitForResponse(response => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
            return url.includes(urlPattern);
        }
        return urlPattern.test(url);
    });
}

/**
 * Retry an action until it succeeds or max retries reached
 * @param action - Action to retry
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Delay between retries in milliseconds
 */
export async function retryAction<T>(
    action: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await action();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError || new Error('Retry failed');
}

/**
 * Generate random string for test data
 * @param length - Length of string
 */
export function randomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate random email for testing
 */
export function randomEmail(): string {
    return `test-${randomString(8)}@example.com`;
}

/**
 * Format date for input fields
 * @param date - Date object
 */
export function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get today's date formatted for input
 */
export function getTodayFormatted(): string {
    return formatDateForInput(new Date());
}

/**
 * Get date N days from now formatted for input
 * @param days - Number of days from today
 */
export function getFutureDateFormatted(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDateForInput(date);
}

/**
 * Intercept console errors and warnings
 * @param page - Playwright page
 */
export async function captureConsoleMessages(page: Page) {
    const messages: { type: string; text: string }[] = [];

    page.on('console', msg => {
        messages.push({
            type: msg.type(),
            text: msg.text(),
        });
    });

    return messages;
}

/**
 * Check for console errors
 * @param page - Playwright page
 * @param ignorePatterns - Patterns to ignore
 */
export async function checkForConsoleErrors(
    page: Page,
    ignorePatterns: RegExp[] = []
): Promise<string[]> {
    const errors: string[] = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            const shouldIgnore = ignorePatterns.some(pattern => pattern.test(text));

            if (!shouldIgnore) {
                errors.push(text);
            }
        }
    });

    return errors;
}

/**
 * Wait for animations to complete
 * @param page - Playwright page
 * @param duration - Expected animation duration in ms
 */
export async function waitForAnimations(page: Page, duration = 500) {
    await page.waitForTimeout(duration);
}

/**
 * Check if page has any accessibility violations
 * Note: Requires @axe-core/playwright to be installed
 * @param page - Playwright page
 */
export async function checkAccessibility(page: Page) {
    // This is a placeholder - implement with axe-core if needed
    // const results = await new AxeBuilder({ page }).analyze();
    // return results.violations;
    return [];
}
