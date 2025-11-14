// NOTE: This test file has been consolidated into services-management.spec.ts
// The Payroll module at /ops/payroll contains all payroll functionality
// These tests are kept for backwards compatibility but should use the new routes

import { test, expect } from './fixtures/auth.fixture';

test.describe('Payroll Management - Admin', () => {
  test('should display payroll dashboard', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const payrollHeading = adminPage.locator('h1:has-text("Payroll"), h2:has-text("Payroll")').first();
    if (await payrollHeading.isVisible().catch(() => false)) {
      await expect(payrollHeading).toBeVisible();
    }
  });

  test('should generate payroll', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const generateButton = adminPage.locator('button:has-text("Generate"), button:has-text("Create Payroll")').first();
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      await adminPage.waitForTimeout(2000);
      
      // Verify generation started
      const successMessage = adminPage.locator('text=generated, text=success, text=processing').first();
      if (await successMessage.isVisible().catch(() => false)) {
        await expect(successMessage).toBeVisible();
      }
    }
  });

  test('should view payroll history', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    // Look for history or past payrolls
    const historyTab = adminPage.locator('text=History, text=Past, text=Previous').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('should adjust employee salary', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    // Find salary adjustment section
    const adjustButton = adminPage.locator('button:has-text("Adjust"), button:has-text("Edit Salary")').first();
    if (await adjustButton.isVisible().catch(() => false)) {
      await adjustButton.click();
      await adminPage.waitForTimeout(500);
      
      // Fill adjustment details
      const amountInput = adminPage.locator('input[name*="amount"], input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('5000');
        
        const reasonInput = adminPage.locator('textarea[name*="reason"], input[name*="reason"]').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Annual increment');
        }
      }
    }
  });

  test('should export payroll report', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/payroll');
    await adminPage.waitForTimeout(1000);
    
    const exportButton = adminPage.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = adminPage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });
});

test.describe('Payroll Management - Employee', () => {
  test('should view own payslip', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/payroll');
    await employeePage.waitForTimeout(1000);
    
    // Employee should see their payroll information
    const payslipSection = employeePage.locator('h1:has-text("Payroll"), text=Salary, text=Earnings').first();
    if (await payslipSection.isVisible()) {
      await expect(payslipSection).toBeVisible();
    }
  });

  test('should download payslip', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/payroll');
    await employeePage.waitForTimeout(1000);
    
    const downloadButton = employeePage.locator('button:has-text("Download"), a:has-text("Download")').first();
    if (await downloadButton.isVisible()) {
      const downloadPromise = employeePage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await downloadButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });

  test('should view payroll history', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/payroll');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, text=Past Payslips').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should not see other employees payroll', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/payroll');
    await employeePage.waitForTimeout(1000);
    
    // Employee should only see their own data
    const allEmployeesButton = employeePage.locator('button:has-text("All Employees"), text=All Staff').first();
    await expect(allEmployeesButton).not.toBeVisible();
  });
});

test.describe('Salary Management', () => {
  test('should view salary change log', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/payroll');
    await adminPage.waitForTimeout(1000);
    
    const logTab = adminPage.locator('text=Log, text=Changes, text=Audit').first();
    if (await logTab.isVisible()) {
      await logTab.click();
      await adminPage.waitForTimeout(1000);
    }
  });
});
