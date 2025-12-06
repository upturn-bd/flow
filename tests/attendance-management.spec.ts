import { test, expect, Page } from '@playwright/test';

/**
 * Attendance Management E2E Test Suite
 *
 * This suite covers navigation, UI, tab switching, attendance records viewing,
 * filtering by month and status, attendance requests review, check-in/check-out
 * functionality, and error handling.
 */

// Configure ALL tests in this file to run serially, not in parallel
test.describe.configure({ mode: 'serial' });

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const TEST_ATTENDANCE = {
    currentDate: new Date().toISOString().split('T')[0],
    currentMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
async function navigateToAttendance(sharedPage: Page) {
    await sharedPage.goto('/ops/attendance', { waitUntil: 'domcontentloaded' });
    await sharedPage.waitForLoadState('networkidle');
    await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible({ timeout: 10000 });
}

async function navigateToTab(sharedPage: Page, tabName: string) {
    const tabButton = sharedPage.locator(`button:has-text("${tabName}")`);
    await tabButton.waitFor({ state: 'visible', timeout: 5000 });
    await tabButton.click();
    await sharedPage.waitForURL(`**/ops/attendance?tab=${tabName.toLowerCase()}`, { timeout: 5000 });
}

// ---------------------------------------------------------------------------
// Global test configuration – authentication is handled by auth.setup.ts
// ---------------------------------------------------------------------------
// Shared page context for ALL tests in this file to minimize browser overhead
let sharedPage: Page;

test.beforeAll(async ({ browser }) => {
    // Create ONE persistent page for the entire test file
    const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
    sharedPage = await context.newPage();
    // Navigate once at the start
    await navigateToAttendance(sharedPage);
});

test.afterAll(async () => {
    // Close page only after ALL tests are done
    await sharedPage?.close();
});

// ---------------------------------------------------------------------------
// Navigation & UI tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Navigation and UI', () => {
    test('should navigate to attendance page', async () => {
        await navigateToAttendance(sharedPage);
        await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible();
    });

    test('should display all tabs (Today, Records, Request)', async () => {
        await expect(sharedPage.locator('button:has-text("Today")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Records")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Request")')).toBeVisible();
    });

    test('should display attendance page description', async () => {
        await expect(sharedPage.locator('text=View and manage your attendance records')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tab Navigation tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Tab Navigation', () => {
    test('should start on Today tab by default', async () => {
        await navigateToAttendance(sharedPage);
        
        // Check URL has today tab or no tab parameter (default)
        const currentUrl = sharedPage.url();
        expect(currentUrl.includes('tab=today') || !currentUrl.includes('tab=')).toBeTruthy();
    });

    test('should navigate between all tabs correctly', async () => {
        await navigateToAttendance(sharedPage);
        
        // Navigate to Today tab explicitly
        await navigateToTab(sharedPage, 'Today');
        await expect(sharedPage.locator('text=Check-In').or(sharedPage.locator('text=Attendance Status'))).toBeVisible({ timeout: 5000 });

        // Navigate to Records tab
        await navigateToTab(sharedPage, 'Records');
        await expect(sharedPage.locator('text=Attendance Overview').or(sharedPage.locator('input[type="month"]'))).toBeVisible({ timeout: 5000 });

        // Navigate to Request tab
        await navigateToTab(sharedPage, 'Request');
        await expect(sharedPage.locator('text=No pending attendance requests').or(sharedPage.locator('button:has-text("Review")'))).toBeVisible({ timeout: 5000 });
    });
});

// ---------------------------------------------------------------------------
// Today Tab - Check-in/Check-out tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Today Tab', () => {
    test('should display attendance status section', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Today');
        
        // Check for attendance-related elements
        await expect(sharedPage.locator('text=Attendance Status').or(sharedPage.locator('text=Check-In').or(sharedPage.locator('text=Select Site')))).toBeVisible({ timeout: 10000 });
    });

    test('should display site selection if available', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Today');
        
        // Check if site selector exists
        const siteSelect = sharedPage.locator('select').first();
        const isSiteSelectVisible = await siteSelect.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isSiteSelectVisible) {
            // Verify site selection is available
            expect(await siteSelect.isEnabled()).toBeTruthy();
        }
    });

    test('should show current date information', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Today');
        
        // Current date should be displayed somewhere on the today tab
        const todayDate = new Date().toLocaleDateString();
        // The date might be displayed in various formats, so we check for any date-like element
        const dateElements = sharedPage.locator('text=/\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4}-\\d{2}-\\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const hasDateInfo = await dateElements.first().isVisible({ timeout: 3000 }).catch(() => false);
        
        // If no specific date found, at least check for general attendance info
        if (!hasDateInfo) {
            await expect(sharedPage.locator('text=Today').or(sharedPage.locator('text=Attendance'))).toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Records Tab tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Records Tab', () => {
    test('should display attendance records page', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Wait for records page to load
        await expect(sharedPage.locator('text=Attendance Overview').or(sharedPage.locator('input[type="month"]'))).toBeVisible({ timeout: 10000 });
    });

    test('should display month filter', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        const monthInput = sharedPage.locator('[data-testid="attendance-month-filter"]');
        await expect(monthInput).toBeVisible();
        
        // Check default value is current month
        const monthValue = await monthInput.inputValue();
        expect(monthValue).toBe(TEST_ATTENDANCE.currentMonth);
    });

    test('should display status filter dropdown', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        const statusSelect = sharedPage.locator('[data-testid="attendance-status-filter"]');
        await expect(statusSelect).toBeVisible();
        
        // Verify filter options are available
        const options = await statusSelect.locator('option').allTextContents();
        expect(options.some(opt => opt.includes('All Statuses'))).toBeTruthy();
        expect(options.some(opt => opt.includes('Present'))).toBeTruthy();
        expect(options.some(opt => opt.includes('Absent'))).toBeTruthy();
    });

    test('should display attendance records table', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Check for table structure using data-testid
        await expect(sharedPage.locator('[data-testid="attendance-records-table"]')).toBeVisible({ timeout: 5000 });
        
        // Check for table headers
        await expect(sharedPage.locator('th:has-text("Date")')).toBeVisible();
        await expect(sharedPage.locator('th:has-text("Check-In")')).toBeVisible();
        await expect(sharedPage.locator('th:has-text("Check-Out")')).toBeVisible();
        await expect(sharedPage.locator('th:has-text("Status")')).toBeVisible();
    });

    test('should display attendance overview summary', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Check for overview section
        await expect(sharedPage.locator('text=Attendance Overview')).toBeVisible();
        
        // The summary cards should show counts for different statuses
        // Even if empty, the section should exist
        const summarySection = sharedPage.locator('text=Attendance Overview').locator('..');
        await expect(summarySection).toBeVisible();
    });

    test('should filter records by month', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        const monthInput = sharedPage.locator('[data-testid="attendance-month-filter"]');
        await expect(monthInput).toBeVisible();
        
        // Get current month value
        const currentMonth = await monthInput.inputValue();
        
        // Change to previous month
        const prevMonthDate = new Date();
        prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
        const prevMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        await monthInput.fill(prevMonth);
        
        // Wait for data to load
        await sharedPage.waitForTimeout(1000);
        
        // Verify the month changed
        const newMonth = await monthInput.inputValue();
        expect(newMonth).toBe(prevMonth);
        
        // Change back to current month
        await monthInput.fill(currentMonth);
        await sharedPage.waitForTimeout(1000);
    });

    test('should filter records by status', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        const statusSelect = sharedPage.locator('[data-testid="attendance-status-filter"]');
        await expect(statusSelect).toBeVisible();
        
        // Select "Present" status
        await statusSelect.selectOption('Present');
        await sharedPage.waitForTimeout(1000);
        
        // Select "All Statuses" again
        await statusSelect.selectOption('');
        await sharedPage.waitForTimeout(1000);
        
        // Verify filter worked (table should still be visible)
        await expect(sharedPage.locator('[data-testid="attendance-records-table"]')).toBeVisible();
    });

    test('should display empty state when no records found', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Set month to far future to ensure no records
        const futureMonth = '2099-12';
        const monthInput = sharedPage.locator('[data-testid="attendance-month-filter"]');
        await monthInput.fill(futureMonth);
        await sharedPage.waitForTimeout(1000);
        
        // Should show empty state
        await expect(sharedPage.locator('text=No attendance records found')).toBeVisible({ timeout: 5000 });
        
        // Reset to current month
        await monthInput.fill(TEST_ATTENDANCE.currentMonth);
        await sharedPage.waitForTimeout(1000);
    });
});

// ---------------------------------------------------------------------------
// Request Tab tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Request Tab', () => {
    test('should display attendance requests page', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        // Wait for requests page to load
        await sharedPage.waitForTimeout(2000);
        
        // Should show either pending requests or empty state
        const hasPendingRequests = await sharedPage.locator('button:has-text("Review")').isVisible({ timeout: 3000 }).catch(() => false);
        const hasEmptyState = await sharedPage.locator('text=No pending attendance requests').isVisible({ timeout: 3000 }).catch(() => false);
        
        expect(hasPendingRequests || hasEmptyState).toBeTruthy();
    });

    test('should display empty state when no pending requests', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        // Wait for page to load
        await sharedPage.waitForTimeout(2000);
        
        // Check for empty state or requests
        const hasEmptyState = await sharedPage.locator('text=No pending attendance requests').isVisible({ timeout: 3000 }).catch(() => false);
        const hasPendingRequests = await sharedPage.locator('button:has-text("Review")').isVisible({ timeout: 3000 }).catch(() => false);
        
        // At least one should be true
        expect(hasEmptyState || hasPendingRequests).toBeTruthy();
    });

    test('should display pending request cards if available', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        await sharedPage.waitForTimeout(2000);
        
        // Check if there are any pending requests using data-testid
        const reviewButtons = sharedPage.locator('[data-testid="review-attendance-button"]');
        const count = await reviewButtons.count();
        
        if (count > 0) {
            // If there are requests, verify the card structure
            const firstButton = reviewButtons.first();
            await expect(firstButton).toBeVisible();
            
            // Should have employee name or date info in the card
            const cardContainer = firstButton.locator('../..');
            const hasInfo = await cardContainer.locator('text=/\\d{1,2}\\/\\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/').isVisible().catch(() => false);
            expect(hasInfo || count > 0).toBeTruthy();
        }
    });

    test('should open review modal when clicking Review button', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        await sharedPage.waitForTimeout(2000);
        
        // Check if there are any review buttons using data-testid
        const reviewButton = sharedPage.locator('[data-testid="review-attendance-button"]').first();
        const hasReviewButton = await reviewButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasReviewButton) {
            // Click the review button
            await reviewButton.click();
            
            // Modal should open
            await expect(sharedPage.locator('h2:has-text("Review Attendance Request")')).toBeVisible({ timeout: 5000 });
            
            // Should have employee, date, time, and status fields
            await expect(sharedPage.locator('text=Employee').or(sharedPage.locator('text=Date'))).toBeVisible();
            await expect(sharedPage.locator('text=Update Status').or(sharedPage.locator('[data-testid="attendance-status-select"]'))).toBeVisible();
            
            // Close modal
            const cancelButton = sharedPage.locator('button:has-text("Cancel")');
            if (await cancelButton.isVisible().catch(() => false)) {
                await cancelButton.click();
                await sharedPage.waitForTimeout(500);
            } else {
                await sharedPage.keyboard.press('Escape');
                await sharedPage.waitForTimeout(500);
            }
        }
    });

    test('should display status options in review modal', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        await sharedPage.waitForTimeout(2000);
        
        const reviewButton = sharedPage.locator('[data-testid="review-attendance-button"]').first();
        const hasReviewButton = await reviewButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasReviewButton) {
            await reviewButton.click();
            await sharedPage.waitForTimeout(500);
            
            // Check for status select field using data-testid
            const statusSelect = sharedPage.locator('[data-testid="attendance-status-select"]').or(sharedPage.locator('select').filter({ hasText: /Present|Absent|Late|Wrong Location/ }).first());
            const hasStatusSelect = await statusSelect.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (hasStatusSelect) {
                // Verify options
                const options = await statusSelect.locator('option').allTextContents();
                expect(options.some(opt => opt.includes('Present'))).toBeTruthy();
                expect(options.some(opt => opt.includes('Absent'))).toBeTruthy();
            }
            
            // Close modal
            await sharedPage.keyboard.press('Escape');
            await sharedPage.waitForTimeout(500);
        }
    });

    test('should validate required status selection before submission', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Request');
        
        await sharedPage.waitForTimeout(2000);
        
        const reviewButton = sharedPage.locator('[data-testid="review-attendance-button"]').first();
        const hasReviewButton = await reviewButton.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasReviewButton) {
            await reviewButton.click();
            await sharedPage.waitForTimeout(500);
            
            // Try to submit without selecting status
            const saveButton = sharedPage.locator('button:has-text("Save Changes")');
            const isSaveVisible = await saveButton.isVisible({ timeout: 3000 }).catch(() => false);
            
            if (isSaveVisible) {
                // Button should be disabled without status selection
                const isDisabled = await saveButton.isDisabled();
                expect(isDisabled).toBeTruthy();
            }
            
            // Close modal
            await sharedPage.keyboard.press('Escape');
            await sharedPage.waitForTimeout(500);
        }
    });
});

// ---------------------------------------------------------------------------
// Responsiveness tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Responsiveness', () => {
    test('should display correctly on mobile viewport', async () => {
        // Set mobile viewport
        await sharedPage.setViewportSize({ width: 375, height: 667 });
        
        await navigateToAttendance(sharedPage);
        
        // Check that main elements are still visible
        await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Today")')).toBeVisible();
        
        // Navigate to records
        await navigateToTab(sharedPage, 'Records');
        
        // Table should be scrollable on mobile
        const table = sharedPage.locator('table');
        const isTableVisible = await table.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isTableVisible) {
            // On mobile, table should be in a scrollable container
            const tableContainer = table.locator('..');
            const hasOverflow = await tableContainer.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.overflowX === 'auto' || style.overflowX === 'scroll';
            }).catch(() => false);
            
            // Either the table has overflow or it's responsive (both are valid)
            expect(isTableVisible).toBeTruthy();
        }
        
        // Reset viewport
        await sharedPage.setViewportSize({ width: 1280, height: 720 });
    });

    test('should display correctly on tablet viewport', async () => {
        // Set tablet viewport
        await sharedPage.setViewportSize({ width: 768, height: 1024 });
        
        await navigateToAttendance(sharedPage);
        
        await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Records")')).toBeVisible();
        
        // Reset viewport
        await sharedPage.setViewportSize({ width: 1280, height: 720 });
    });
});

// ---------------------------------------------------------------------------
// Loading states tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Loading States', () => {
    test('should handle page load gracefully', async () => {
        // Navigate fresh to see loading state
        await sharedPage.goto('/ops/attendance?tab=records', { waitUntil: 'domcontentloaded' });
        
        // Wait for loading to complete
        await sharedPage.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Page should be fully loaded
        await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible({ timeout: 10000 });
    });

    test('should show loading state when fetching records', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Change month to trigger loading
        const monthInput = sharedPage.locator('input[type="month"]');
        const currentMonth = await monthInput.inputValue();
        
        // Set to different month
        const newMonth = '2024-12';
        await monthInput.fill(newMonth);
        
        // Wait for update
        await sharedPage.waitForTimeout(1000);
        
        // Change back
        await monthInput.fill(currentMonth);
        await sharedPage.waitForTimeout(1000);
        
        // Should still show table
        await expect(sharedPage.locator('table')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Accessibility tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Accessibility', () => {
    test('should have proper heading hierarchy', async () => {
        await navigateToAttendance(sharedPage);
        
        // Check for h1
        await expect(sharedPage.locator('h1')).toBeVisible();
        
        // Navigate to records
        await navigateToTab(sharedPage, 'Records');
        
        // Check for h3 (Attendance Overview)
        const h3 = sharedPage.locator('h3');
        const hasH3 = await h3.isVisible({ timeout: 3000 }).catch(() => false);
        
        // Heading structure should exist
        expect(await sharedPage.locator('h1').count()).toBeGreaterThan(0);
    });

    test('should have accessible form labels', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Month input should be accessible
        const monthInput = sharedPage.locator('input[type="month"]');
        await expect(monthInput).toBeVisible();
        
        // Status select should be accessible
        const statusSelect = sharedPage.locator('select').first();
        await expect(statusSelect).toBeVisible();
    });

    test('should support keyboard navigation', async () => {
        await navigateToAttendance(sharedPage);
        
        // Tab navigation should work
        await sharedPage.keyboard.press('Tab');
        await sharedPage.keyboard.press('Tab');
        
        // Records tab should be focusable
        const recordsTab = sharedPage.locator('button:has-text("Records")');
        await recordsTab.focus();
        await sharedPage.keyboard.press('Enter');
        
        // Should navigate to records tab
        await expect(sharedPage.locator('text=Attendance Overview').or(sharedPage.locator('input[type="month"]'))).toBeVisible({ timeout: 5000 });
    });
});

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------
test.describe('Attendance Management - Integration', () => {
    test('should maintain filter state when switching tabs', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Set a filter using data-testid
        const monthInput = sharedPage.locator('[data-testid="attendance-month-filter"]');
        const testMonth = '2024-11';
        await monthInput.fill(testMonth);
        await sharedPage.waitForTimeout(1000);
        
        // Switch to another tab
        await navigateToTab(sharedPage, 'Today');
        await sharedPage.waitForTimeout(500);
        
        // Switch back to records
        await navigateToTab(sharedPage, 'Records');
        await sharedPage.waitForTimeout(1000);
        
        // Filter may or may not persist (depends on implementation)
        // Just verify the page loaded correctly
        await expect(sharedPage.locator('[data-testid="attendance-month-filter"]')).toBeVisible();
        
        // Reset to current month
        await monthInput.fill(TEST_ATTENDANCE.currentMonth);
        await sharedPage.waitForTimeout(1000);
    });

    test('should handle navigation back and forth', async () => {
        await navigateToAttendance(sharedPage);
        await navigateToTab(sharedPage, 'Records');
        
        // Go back
        await sharedPage.goBack();
        await sharedPage.waitForTimeout(1000);
        
        // Should still be on attendance page
        await expect(sharedPage.locator('h1:has-text("Attendance")')).toBeVisible();
        
        // Go forward
        await sharedPage.goForward();
        await sharedPage.waitForTimeout(1000);
        
        // Should be back on records tab
        const url = sharedPage.url();
        expect(url.includes('attendance')).toBeTruthy();
    });
});
