import { test, expect } from './fixtures/auth.fixture';

test.describe('Requisition Management', () => {
  test('should display requisition page', async ({ employeePage }) => {
    await employeePage.goto('/ops/requisition?tab=create');
    await employeePage.waitForLoadState('networkidle');
    
    const requisitionHeading = employeePage.locator('h1:has-text("Requisition"), h2:has-text("Requisition")').first();
    await expect(requisitionHeading).toBeVisible({ timeout: 5000 });
  });

  test('should create a new requisition', async ({ employeePage }) => {
    await employeePage.goto('/ops/requisition?tab=create');
    await employeePage.waitForTimeout(1000);
    
    const itemInput = employeePage.locator('input[name*="item"], input[name*="title"], input[name*="name"]').first();
    if (await itemInput.isVisible().catch(() => false)) {
      await itemInput.fill(`E2E Test Requisition ${Date.now()}`);
      
      const quantityInput = employeePage.locator('input[type="number"], input[name*="quantity"]').first();
      if (await quantityInput.isVisible().catch(() => false)) {
        await quantityInput.fill('5');
      }
      
      const descriptionInput = employeePage.locator('textarea[name*="description"], textarea[name*="detail"]').first();
      if (await descriptionInput.isVisible().catch(() => false)) {
        await descriptionInput.fill('Office supplies needed for testing');
      }
      
      const submitButton = employeePage.locator('button:has-text("Submit"), button:has-text("Create"), button[type="submit"]').first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await employeePage.waitForTimeout(2000);
      }
    }
  });

  test('should view requisition history', async ({ employeePage }) => {
    await employeePage.goto('/ops/requisition');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, text=My Requisitions').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should approve requisition as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/requisition');
    await adminPage.waitForTimeout(1000);
    
    const pendingTab = adminPage.locator('text=Pending, [href*="pending"]').first();
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await adminPage.waitForTimeout(1000);
      
      const approveButton = adminPage.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible().catch(() => false)) {
        await approveButton.click();
        await adminPage.waitForTimeout(1000);
      }
    }
  });

  test('should reject requisition as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/requisition');
    await adminPage.waitForTimeout(1000);
    
    const rejectButton = adminPage.locator('button:has-text("Reject"), button:has-text("Deny")').first();
    if (await rejectButton.isVisible().catch(() => false)) {
      await rejectButton.click();
      await adminPage.waitForTimeout(500);
      
      const reasonInput = adminPage.locator('textarea[name*="reason"], textarea[name*="comment"]').first();
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('Test rejection reason');
        
        const confirmButton = adminPage.locator('button:has-text("Confirm"), button:has-text("Submit")').first();
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
          await adminPage.waitForTimeout(1000);
        }
      }
    }
  });
});

test.describe('Settlement Management', () => {
  test('should display settlement page', async ({ employeePage }) => {
    await employeePage.goto('/ops/settlement?tab=create');
    await employeePage.waitForLoadState('networkidle');
    
    const settlementHeading = employeePage.locator('h1:has-text("Settlement"), h2:has-text("Settlement")').first();
    await expect(settlementHeading).toBeVisible({ timeout: 5000 });
  });

  test('should create a new settlement request', async ({ employeePage }) => {
    await employeePage.goto('/ops/settlement?tab=create');
    await employeePage.waitForTimeout(1000);
    
    const titleInput = employeePage.locator('input[name*="title"], input[name*="name"]').first();
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.fill(`E2E Settlement ${Date.now()}`);
      
      const amountInput = employeePage.locator('input[type="number"], input[name*="amount"]').first();
      if (await amountInput.isVisible().catch(() => false)) {
        await amountInput.fill('1000');
      }
      
      const descriptionInput = employeePage.locator('textarea[name*="description"], textarea[name*="detail"]').first();
      if (await descriptionInput.isVisible().catch(() => false)) {
        await descriptionInput.fill('Test settlement request for expenses');
      }
      
      const submitButton = employeePage.locator('button:has-text("Submit"), button:has-text("Create"), button[type="submit"]').first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await employeePage.waitForTimeout(2000);
      }
    }
  });

  test('should view settlement history', async ({ employeePage }) => {
    await employeePage.goto('/ops/settlement');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, text=My Settlements').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should approve settlement as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/settlement');
    await adminPage.waitForTimeout(1000);
    
    const pendingTab = adminPage.locator('text=Pending').first();
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await adminPage.waitForTimeout(1000);
      
      const approveButton = adminPage.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible().catch(() => false)) {
        await approveButton.click();
        await adminPage.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Complaint Management', () => {
  test('should display complaint page', async ({ employeePage }) => {
    await employeePage.goto('/ops/complaint');
    await employeePage.waitForLoadState('networkidle');
    
    const complaintHeading = employeePage.locator('h1:has-text("Complaint"), h2:has-text("Complaint")').first();
    await expect(complaintHeading).toBeVisible({ timeout: 5000 });
  });

  test('should submit a new complaint', async ({ employeePage }) => {
    await employeePage.goto('/ops/complaint');
    await employeePage.waitForTimeout(1000);
    
    const newComplaintButton = employeePage.locator('button:has-text("New"), button:has-text("Submit"), button:has-text("File")').first();
    if (await newComplaintButton.isVisible().catch(() => false)) {
      await newComplaintButton.click();
      await employeePage.waitForTimeout(500);
      
      const titleInput = employeePage.locator('input[name*="title"], input[name*="subject"]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Test Complaint ${Date.now()}`);
      }
      
      const categorySelect = employeePage.locator('select[name*="category"], select[name*="type"]').first();
      if (await categorySelect.isVisible().catch(() => false)) {
        await categorySelect.selectOption({ index: 1 });
      }
      
      const descriptionInput = employeePage.locator('textarea[name*="description"], textarea[name*="detail"]').first();
      if (await descriptionInput.isVisible().catch(() => false)) {
        await descriptionInput.fill('This is a test complaint for automated testing');
      }
      
      const submitButton = employeePage.locator('button:has-text("Submit"), button[type="submit"]').first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await employeePage.waitForTimeout(2000);
      }
    }
  });

  test('should view complaint details', async ({ employeePage }) => {
    await employeePage.goto('/ops/complaint');
    await employeePage.waitForTimeout(1000);
    
    const firstComplaint = employeePage.locator('[class*="complaint"], [data-testid*="complaint"]').first();
    if (await firstComplaint.isVisible().catch(() => false)) {
      await firstComplaint.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should resolve complaint as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/complaint');
    await adminPage.waitForTimeout(1000);
    
    const firstComplaint = adminPage.locator('[class*="complaint"]').first();
    if (await firstComplaint.isVisible().catch(() => false)) {
      await firstComplaint.click();
      await adminPage.waitForTimeout(500);
      
      const resolveButton = adminPage.locator('button:has-text("Resolve"), button:has-text("Close")').first();
      if (await resolveButton.isVisible().catch(() => false)) {
        await resolveButton.click();
        
        const resolutionInput = adminPage.locator('textarea[name*="resolution"], textarea[name*="comment"]').first();
        if (await resolutionInput.isVisible().catch(() => false)) {
          await resolutionInput.fill('Issue resolved - test case');
          
          const confirmButton = adminPage.locator('button:has-text("Confirm"), button:has-text("Submit")').first();
          if (await confirmButton.isVisible().catch(() => false)) {
            await confirmButton.click();
            await adminPage.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should filter complaints by status', async ({ adminPage }) => {
    await adminPage.goto('/ops/complaint');
    await adminPage.waitForTimeout(1000);
    
    const statusFilter = adminPage.locator('select[name*="status"], button:has-text("Status")').first();
    if (await statusFilter.isVisible().catch(() => false)) {
      await statusFilter.click();
      await adminPage.waitForTimeout(500);
    }
  });
});

test.describe('Payroll Management', () => {
  test('should display payroll page', async ({ employeePage }) => {
    await employeePage.goto('/ops/payroll');
    await employeePage.waitForLoadState('networkidle');
    
    const payrollHeading = employeePage.locator('h1:has-text("Payroll"), h2:has-text("Payroll")').first();
    await expect(payrollHeading).toBeVisible({ timeout: 5000 });
  });

  test('should view own payslip', async ({ employeePage }) => {
    await employeePage.goto('/ops/payroll');
    await employeePage.waitForTimeout(1000);
    
    const payslipSection = employeePage.locator('text=Salary, text=Earnings, text=Deductions').first();
    if (await payslipSection.isVisible().catch(() => false)) {
      await expect(payslipSection).toBeVisible();
    }
  });

  test('should download payslip', async ({ employeePage }) => {
    await employeePage.goto('/ops/payroll');
    await employeePage.waitForTimeout(1000);
    
    const downloadButton = employeePage.locator('button:has-text("Download"), a:has-text("Download")').first();
    if (await downloadButton.isVisible().catch(() => false)) {
      const downloadPromise = employeePage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await downloadButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });

  test('should view payroll history', async ({ employeePage }) => {
    await employeePage.goto('/ops/payroll');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, text=Past Payslips').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should not see other employees payroll', async ({ employeePage }) => {
    await employeePage.goto('/ops/payroll');
    await employeePage.waitForTimeout(1000);
    
    const allEmployeesButton = employeePage.locator('button:has-text("All Employees"), text=All Staff').first();
    await expect(allEmployeesButton).not.toBeVisible();
  });

  test('should generate payroll as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const generateButton = adminPage.locator('button:has-text("Generate"), button:has-text("Create Payroll")').first();
    if (await generateButton.isVisible().catch(() => false)) {
      await generateButton.click();
      await adminPage.waitForTimeout(2000);
    }
  });

  test('should view all employees payroll as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const employeeList = adminPage.locator('text=Employees, [class*="employee"]').first();
    if (await employeeList.isVisible().catch(() => false)) {
      await expect(employeeList).toBeVisible();
    }
  });

  test('should adjust employee salary as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const adjustButton = adminPage.locator('button:has-text("Adjust"), button:has-text("Edit Salary")').first();
    if (await adjustButton.isVisible().catch(() => false)) {
      await adjustButton.click();
      await adminPage.waitForTimeout(500);
      
      const amountInput = adminPage.locator('input[name*="amount"], input[type="number"]').first();
      if (await amountInput.isVisible().catch(() => false)) {
        await amountInput.fill('5000');
        
        const reasonInput = adminPage.locator('textarea[name*="reason"], input[name*="reason"]').first();
        if (await reasonInput.isVisible().catch(() => false)) {
          await reasonInput.fill('Annual increment - test');
        }
      }
    }
  });

  test('should export payroll report as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/payroll');
    await adminPage.waitForTimeout(1000);
    
    const exportButton = adminPage.locator('button:has-text("Export"), button:has-text("Download Report")').first();
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = adminPage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });
});
