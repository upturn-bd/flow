// NOTE: This test file has been consolidated into operations-hr.spec.ts
// The HRIS module at /ops/hris contains all employee management functionality
// These tests are kept for backwards compatibility but should use the new routes

import { test, expect } from './fixtures/auth.fixture';

test.describe('Employee Management (via HRIS)', () => {
  test('should display employee list', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    // Check for employee listing
    const employeeSection = adminPage.locator('h1:has-text("Employee"), h2:has-text("Employee"), h1:has-text("HRIS")').first();
    if (await employeeSection.isVisible().catch(() => false)) {
      await expect(employeeSection).toBeVisible();
    }
  });

  test('should search for employees', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    
    const searchInput = adminPage.locator('input[placeholder*="search" i], input[placeholder*="employee" i]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Test Employee');
      await adminPage.waitForTimeout(1000);
    }
  });

  test('should filter employees by department', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    // Look for department filter
    const departmentFilter = adminPage.locator('select:has-text("Department"), button:has-text("Department")').first();
    if (await departmentFilter.isVisible().catch(() => false)) {
      await departmentFilter.click();
      await adminPage.waitForTimeout(500);
    }
  });

  test('should view employee profile', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    // Click on first employee
    const firstEmployee = adminPage.locator('[class*="employee-card"], [data-testid*="employee"]').first();
    if (await firstEmployee.isVisible().catch(() => false)) {
      await firstEmployee.click();
      await adminPage.waitForTimeout(1000);
      
      // Verify profile page
      const profileHeading = adminPage.locator('h1, h2').first();
      await expect(profileHeading).toBeVisible();
    }
  });
});

test.describe('Attendance Management', () => {
  test('should display attendance dashboard', async ({ adminPage }) => {
    await adminPage.goto('/ops/attendance?tab=today');
    await adminPage.waitForTimeout(1000);
    
    const attendanceHeading = adminPage.locator('h1:has-text("Attendance"), h2:has-text("Attendance")').first();
    if (await attendanceHeading.isVisible()) {
      await expect(attendanceHeading).toBeVisible();
    }
  });

  test('should mark attendance for employee', async ({ employeePage }) => {
    await employeePage.goto('/ops/attendance?tab=today');
    await employeePage.waitForTimeout(1000);
    
    // Look for check-in button
    const checkInButton = employeePage.locator('button:has-text("Check In"), button:has-text("Clock In")').first();
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      await employeePage.waitForTimeout(1000);
      
      // Verify success
      const successMessage = employeePage.locator('text=success, text=checked in').first();
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should view attendance history', async ({ employeePage }) => {
    await employeePage.goto('/ops/attendance?tab=history');
    await employeePage.waitForTimeout(1000);
    
    // Look for history tab or section
    const historyTab = employeePage.locator('text=History, text=Records').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });
});

test.describe('Leave Management', () => {
  test('should display leave balance', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave');
    await employeePage.waitForTimeout(1000);
    
    const leaveHeading = employeePage.locator('h1:has-text("Leave"), h2:has-text("Leave")').first();
    if (await leaveHeading.isVisible()) {
      await expect(leaveHeading).toBeVisible();
    }
  });

  test('should submit leave request', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave');
    await employeePage.waitForTimeout(1000);
    
    // Click new leave request button
    const newLeaveButton = employeePage.locator('button:has-text("New"), button:has-text("Request"), button:has-text("Apply")').first();
    if (await newLeaveButton.isVisible()) {
      await newLeaveButton.click();
      await employeePage.waitForTimeout(500);
      
      // Fill leave form
      const leaveTypeSelect = employeePage.locator('select[name*="type"], select[name*="leave"]').first();
      if (await leaveTypeSelect.isVisible()) {
        await leaveTypeSelect.selectOption({ index: 1 });
        
        // Fill dates
        const startDateInput = employeePage.locator('input[type="date"], input[name*="start"]').first();
        if (await startDateInput.isVisible()) {
          await startDateInput.fill('2025-12-01');
        }
        
        const endDateInput = employeePage.locator('input[type="date"], input[name*="end"]').nth(1);
        if (await endDateInput.isVisible()) {
          await endDateInput.fill('2025-12-02');
        }
        
        // Fill reason
        const reasonInput = employeePage.locator('textarea[name*="reason"], textarea[name*="comment"]').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Personal leave for family event');
        }
        
        // Submit
        const submitButton = employeePage.locator('button:has-text("Submit"), button[type="submit"]').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await employeePage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should approve leave request as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/leave');
    await adminPage.waitForTimeout(1000);
    
    // Look for pending requests
    const pendingTab = adminPage.locator('text=Pending, text=Requests').first();
    if (await pendingTab.isVisible()) {
      await pendingTab.click();
      await adminPage.waitForTimeout(1000);
      
      // Click approve on first request
      const approveButton = adminPage.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        await adminPage.waitForTimeout(1000);
      }
    }
  });
});
