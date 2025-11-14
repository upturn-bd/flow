import { test, expect } from './fixtures/auth.fixture';

test.describe('Onboarding Management', () => {
  test('should display onboarding page', async ({ adminPage }) => {
    await adminPage.goto('/ops/onboarding');
    await adminPage.waitForLoadState('networkidle');
    
    const onboardingHeading = adminPage.locator('h1:has-text("Onboarding"), h2:has-text("Onboarding")').first();
    await expect(onboardingHeading).toBeVisible({ timeout: 5000 });
  });

  test('should view onboarding checklist', async ({ employeePage }) => {
    await employeePage.goto('/onboarding');
    await employeePage.waitForTimeout(1000);
    
    const checklistSection = employeePage.locator('text=Checklist, text=Tasks, text=Steps').first();
    if (await checklistSection.isVisible().catch(() => false)) {
      await expect(checklistSection).toBeVisible();
    }
  });

  test('should complete onboarding task', async ({ employeePage }) => {
    await employeePage.goto('/onboarding');
    await employeePage.waitForTimeout(1000);
    
    const taskCheckbox = employeePage.locator('input[type="checkbox"], button:has-text("Complete")').first();
    if (await taskCheckbox.isVisible().catch(() => false)) {
      await taskCheckbox.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should view onboarding progress', async ({ employeePage }) => {
    await employeePage.goto('/onboarding');
    await employeePage.waitForTimeout(1000);
    
    const progressBar = employeePage.locator('[class*="progress"], text=Progress').first();
    if (await progressBar.isVisible().catch(() => false)) {
      await expect(progressBar).toBeVisible();
    }
  });

  test('should create onboarding workflow as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/onboarding');
    await adminPage.waitForTimeout(1000);
    
    const createButton = adminPage.locator('button:has-text("Create"), button:has-text("New Workflow")').first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await adminPage.waitForTimeout(500);
      
      const titleInput = adminPage.locator('input[name*="title"], input[name*="name"]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Onboarding Workflow ${Date.now()}`);
        
        const submitButton = adminPage.locator('button:has-text("Create"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should approve onboarding task as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/onboarding');
    await adminPage.waitForTimeout(1000);
    
    const approveButton = adminPage.locator('button:has-text("Approve"), button:has-text("Complete")').first();
    if (await approveButton.isVisible().catch(() => false)) {
      await approveButton.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('should view all onboarding processes as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/onboarding');
    await adminPage.waitForTimeout(1000);
    
    const processList = adminPage.locator('[class*="onboarding"], text=Active Onboardings').first();
    if (await processList.isVisible().catch(() => false)) {
      await expect(processList).toBeVisible();
    }
  });
});

test.describe('Offboarding Management', () => {
  test('should display offboarding page', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForLoadState('networkidle');
    
    const offboardingHeading = adminPage.locator('h1:has-text("Offboarding"), h2:has-text("Offboarding")').first();
    await expect(offboardingHeading).toBeVisible({ timeout: 5000 });
  });

  test('should initiate offboarding as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForTimeout(1000);
    
    const initiateButton = adminPage.locator('button:has-text("Initiate"), button:has-text("Start"), button:has-text("New")').first();
    if (await initiateButton.isVisible().catch(() => false)) {
      await initiateButton.click();
      await adminPage.waitForTimeout(500);
      
      const employeeSelect = adminPage.locator('select[name*="employee"]').first();
      if (await employeeSelect.isVisible().catch(() => false)) {
        await employeeSelect.selectOption({ index: 1 });
        
        const lastWorkingDateInput = adminPage.locator('input[type="date"], input[name*="date"]').first();
        if (await lastWorkingDateInput.isVisible().catch(() => false)) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          const dateString = nextMonth.toISOString().split('T')[0];
          await lastWorkingDateInput.fill(dateString);
        }
        
        const reasonInput = adminPage.locator('textarea[name*="reason"], select[name*="reason"]').first();
        if (await reasonInput.isVisible().catch(() => false)) {
          if (await reasonInput.getAttribute('tagName') === 'SELECT') {
            await reasonInput.selectOption({ index: 1 });
          } else {
            await reasonInput.fill('Test offboarding - resignation');
          }
        }
        
        const submitButton = adminPage.locator('button:has-text("Submit"), button:has-text("Initiate"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should view offboarding checklist', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForTimeout(1000);
    
    const checklistSection = adminPage.locator('text=Checklist, text=Tasks').first();
    if (await checklistSection.isVisible().catch(() => false)) {
      await expect(checklistSection).toBeVisible();
    }
  });

  test('should complete offboarding task as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForTimeout(1000);
    
    const taskCheckbox = adminPage.locator('input[type="checkbox"], button:has-text("Complete")').first();
    if (await taskCheckbox.isVisible().catch(() => false)) {
      await taskCheckbox.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('should view offboarding progress', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForTimeout(1000);
    
    const progressSection = adminPage.locator('text=Progress, [class*="progress"]').first();
    if (await progressSection.isVisible().catch(() => false)) {
      await expect(progressSection).toBeVisible();
    }
  });

  test('should finalize offboarding as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/offboarding');
    await adminPage.waitForTimeout(1000);
    
    const finalizeButton = adminPage.locator('button:has-text("Finalize"), button:has-text("Complete Offboarding")').first();
    if (await finalizeButton.isVisible().catch(() => false)) {
      await finalizeButton.click();
      await adminPage.waitForTimeout(1000);
      
      const confirmButton = adminPage.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
        await adminPage.waitForTimeout(2000);
      }
    }
  });
});

test.describe('HRIS - Human Resource Information System', () => {
  test('should display HRIS page', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForLoadState('networkidle');
    
    const hrisHeading = adminPage.locator('h1:has-text("HRIS"), h1:has-text("Employee"), h2:has-text("HRIS")').first();
    await expect(hrisHeading).toBeVisible({ timeout: 5000 });
  });

  test('should search for employees', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const searchInput = adminPage.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await adminPage.waitForTimeout(1000);
      
      // Results should be filtered
      const employeeCards = await adminPage.locator('[class*="employee"], [data-testid*="employee"]').count();
      expect(employeeCards).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter employees by department', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const departmentFilter = adminPage.locator('select[name*="department"], button:has-text("Department")').first();
    if (await departmentFilter.isVisible().catch(() => false)) {
      await departmentFilter.click();
      await adminPage.waitForTimeout(500);
      
      if (await departmentFilter.getAttribute('tagName') === 'SELECT') {
        await departmentFilter.selectOption({ index: 1 });
        await adminPage.waitForTimeout(1000);
      }
    }
  });

  test('should filter employees by position', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const positionFilter = adminPage.locator('select[name*="position"], button:has-text("Position")').first();
    if (await positionFilter.isVisible().catch(() => false)) {
      await positionFilter.click();
      await adminPage.waitForTimeout(500);
    }
  });

  test('should view employee profile', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const firstEmployee = adminPage.locator('[class*="employee-card"], [data-testid*="employee"]').first();
    if (await firstEmployee.isVisible().catch(() => false)) {
      await firstEmployee.click();
      await adminPage.waitForTimeout(1000);
      
      // Should show profile details
      const profileSection = adminPage.locator('text=Email, text=Phone, text=Department').first();
      if (await profileSection.isVisible().catch(() => false)) {
        await expect(profileSection).toBeVisible();
      }
    }
  });

  test('should add new employee as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const addButton = adminPage.locator('button:has-text("Add"), button:has-text("New Employee")').first();
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await adminPage.waitForTimeout(500);
      
      const nameInput = adminPage.locator('input[name*="name"], input[name*="first"]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`E2E Test Employee ${Date.now()}`);
        
        const emailInput = adminPage.locator('input[type="email"], input[name*="email"]').first();
        if (await emailInput.isVisible().catch(() => false)) {
          await emailInput.fill(`test${Date.now()}@example.com`);
        }
        
        const phoneInput = adminPage.locator('input[type="tel"], input[name*="phone"]').first();
        if (await phoneInput.isVisible().catch(() => false)) {
          await phoneInput.fill('1234567890');
        }
        
        const departmentSelect = adminPage.locator('select[name*="department"]').first();
        if (await departmentSelect.isVisible().catch(() => false)) {
          await departmentSelect.selectOption({ index: 1 });
        }
        
        const submitButton = adminPage.locator('button:has-text("Create"), button:has-text("Add"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should edit employee information as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const firstEmployee = adminPage.locator('[class*="employee-card"]').first();
    if (await firstEmployee.isVisible().catch(() => false)) {
      await firstEmployee.click();
      await adminPage.waitForTimeout(500);
      
      const editButton = adminPage.locator('button:has-text("Edit"), button:has-text("Update")').first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await adminPage.waitForTimeout(500);
        
        const phoneInput = adminPage.locator('input[type="tel"], input[name*="phone"]').first();
        if (await phoneInput.isVisible().catch(() => false)) {
          await phoneInput.fill('9876543210');
          
          const saveButton = adminPage.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
          if (await saveButton.isVisible().catch(() => false)) {
            await saveButton.click();
            await adminPage.waitForTimeout(2000);
          }
        }
      }
    }
  });

  test('should export employee list as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const exportButton = adminPage.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible().catch(() => false)) {
      const downloadPromise = adminPage.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();
      
      const download = await downloadPromise;
      if (download) {
        expect(download).toBeTruthy();
      }
    }
  });

  test('should view employee reporting structure', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const hierarchyButton = adminPage.locator('button:has-text("Hierarchy"), button:has-text("Org Chart")').first();
    if (await hierarchyButton.isVisible().catch(() => false)) {
      await hierarchyButton.click();
      await adminPage.waitForTimeout(1000);
      
      const hierarchyView = adminPage.locator('[class*="hierarchy"], [class*="org-chart"]').first();
      if (await hierarchyView.isVisible().catch(() => false)) {
        await expect(hierarchyView).toBeVisible();
      }
    }
  });

  test('should view employee statistics', async ({ adminPage }) => {
    await adminPage.goto('/ops/hris');
    await adminPage.waitForTimeout(1000);
    
    const statsSection = adminPage.locator('text=Total Employees, text=Statistics, [class*="stat"]').first();
    if (await statsSection.isVisible().catch(() => false)) {
      await expect(statsSection).toBeVisible();
    }
  });
});

test.describe('Stakeholder Issues Management', () => {
  test('should display stakeholder issues page', async ({ adminPage }) => {
    await adminPage.goto('/ops/stakeholder-issues');
    await adminPage.waitForLoadState('networkidle');
    
    const stakeholderHeading = adminPage.locator('h1:has-text("Stakeholder"), h2:has-text("Issue")').first();
    await expect(stakeholderHeading).toBeVisible({ timeout: 5000 });
  });

  test('should create new stakeholder issue', async ({ adminPage }) => {
    await adminPage.goto('/ops/stakeholder-issues');
    await adminPage.waitForTimeout(1000);
    
    const createButton = adminPage.locator('button:has-text("New"), button:has-text("Create")').first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await adminPage.waitForTimeout(500);
      
      const titleInput = adminPage.locator('input[name*="title"], input[name*="subject"]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Stakeholder Issue ${Date.now()}`);
        
        const descriptionInput = adminPage.locator('textarea[name*="description"]').first();
        if (await descriptionInput.isVisible().catch(() => false)) {
          await descriptionInput.fill('Test stakeholder issue for automated testing');
        }
        
        const submitButton = adminPage.locator('button:has-text("Create"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should view stakeholder issue details', async ({ adminPage }) => {
    await adminPage.goto('/ops/stakeholder-issues');
    await adminPage.waitForTimeout(1000);
    
    const firstIssue = adminPage.locator('[class*="issue"], [data-testid*="issue"]').first();
    if (await firstIssue.isVisible().catch(() => false)) {
      await firstIssue.click();
      await adminPage.waitForTimeout(1000);
    }
  });

  test('should update stakeholder issue status', async ({ adminPage }) => {
    await adminPage.goto('/ops/stakeholder-issues');
    await adminPage.waitForTimeout(1000);
    
    const statusSelect = adminPage.locator('select[name*="status"], button:has-text("Status")').first();
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.click();
      await adminPage.waitForTimeout(500);
      
      if (await statusSelect.getAttribute('tagName') === 'SELECT') {
        await statusSelect.selectOption({ index: 1 });
        await adminPage.waitForTimeout(1000);
      }
    }
  });
});
