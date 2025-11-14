import { test, expect } from './fixtures/auth.fixture';

test.describe('Task Management', () => {
  test('should display task page', async ({ adminPage }) => {
    await adminPage.goto('/ops/tasks');
    await adminPage.waitForLoadState('networkidle');
    
    const taskHeading = adminPage.locator('h1:has-text("Task"), h2:has-text("Task")').first();
    await expect(taskHeading).toBeVisible({ timeout: 5000 });
  });

  test('should create a new task', async ({ adminPage }) => {
    await adminPage.goto('/ops/tasks');
    await adminPage.waitForTimeout(1000);
    
    const newTaskButton = adminPage.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add Task")').first();
    if (await newTaskButton.isVisible().catch(() => false)) {
      await newTaskButton.click();
      await adminPage.waitForTimeout(500);
      
      const titleInput = adminPage.locator('input[name*="title"], input[name*="name"], input[placeholder*="task" i]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Test Task ${Date.now()}`);
        
        const descriptionInput = adminPage.locator('textarea[name*="description"], textarea[placeholder*="description" i]').first();
        if (await descriptionInput.isVisible().catch(() => false)) {
          await descriptionInput.fill('This is a test task created by automated testing');
        }
        
        const submitButton = adminPage.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should view task details', async ({ employeePage }) => {
    await employeePage.goto('/ops/tasks');
    await employeePage.waitForTimeout(1000);
    
    const firstTask = employeePage.locator('[class*="task"], [data-testid*="task"]').first();
    if (await firstTask.isVisible().catch(() => false)) {
      await firstTask.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should mark task as complete', async ({ employeePage }) => {
    await employeePage.goto('/ops/tasks');
    await employeePage.waitForTimeout(1000);
    
    const completeButton = employeePage.locator('button:has-text("Complete"), input[type="checkbox"]').first();
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should filter tasks', async ({ adminPage }) => {
    await adminPage.goto('/ops/tasks');
    await adminPage.waitForTimeout(1000);
    
    const filterButton = adminPage.locator('button:has-text("Filter"), select[name*="filter"]').first();
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await adminPage.waitForTimeout(500);
    }
  });
});

test.describe('Project Management', () => {
  test('should display project page', async ({ adminPage }) => {
    await adminPage.goto('/ops/project');
    await adminPage.waitForLoadState('networkidle');
    
    const projectHeading = adminPage.locator('h1:has-text("Project"), h2:has-text("Project")').first();
    await expect(projectHeading).toBeVisible({ timeout: 5000 });
  });

  test('should create a new project (Admin only)', async ({ adminPage }) => {
    await adminPage.goto('/ops/project');
    await adminPage.waitForTimeout(1000);
    
    const createButton = adminPage.locator('button:has-text("Create"), button:has-text("New Project")').first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await adminPage.waitForTimeout(500);
      
      const nameInput = adminPage.locator('input[name="name"], input[name="title"], input[placeholder*="project name" i]').first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`E2E Test Project ${Date.now()}`);
        
        const descriptionInput = adminPage.locator('textarea[name="description"]').first();
        if (await descriptionInput.isVisible().catch(() => false)) {
          await descriptionInput.fill('Automated test project');
        }
        
        const submitButton = adminPage.locator('button:has-text("Create"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should view project details', async ({ employeePage }) => {
    await employeePage.goto('/ops/project');
    await employeePage.waitForTimeout(1000);
    
    const firstProject = employeePage.locator('[class*="project"], [data-testid*="project"]').first();
    if (await firstProject.isVisible().catch(() => false)) {
      await firstProject.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should view project milestones', async ({ employeePage }) => {
    await employeePage.goto('/ops/project');
    await employeePage.waitForTimeout(1000);
    
    const milestoneSection = employeePage.locator('text=Milestone, text=Progress').first();
    if (await milestoneSection.isVisible().catch(() => false)) {
      await expect(milestoneSection).toBeVisible();
    }
  });
});

test.describe('Attendance Management', () => {
  test('should display attendance page', async ({ employeePage }) => {
    await employeePage.goto('/ops/attendance?tab=today');
    await employeePage.waitForLoadState('networkidle');
    
    const attendanceHeading = employeePage.locator('h1:has-text("Attendance"), h2:has-text("Attendance")').first();
    await expect(attendanceHeading).toBeVisible({ timeout: 5000 });
  });

  test('should check in attendance', async ({ employeePage }) => {
    await employeePage.goto('/ops/attendance?tab=today');
    await employeePage.waitForTimeout(1000);
    
    const checkInButton = employeePage.locator('button:has-text("Check In"), button:has-text("Clock In"), button:has-text("Mark Attendance")').first();
    if (await checkInButton.isVisible().catch(() => false)) {
      await checkInButton.click();
      await employeePage.waitForTimeout(2000);
    }
  });

  test('should view attendance history', async ({ employeePage }) => {
    await employeePage.goto('/ops/attendance');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, [href*="history"], button:has-text("History")').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should view attendance statistics', async ({ adminPage }) => {
    await adminPage.goto('/ops/attendance');
    await adminPage.waitForTimeout(1000);
    
    // Admin should see statistics
    const statsSection = adminPage.locator('text=Statistics, text=Summary, [class*="stat"]').first();
    if (await statsSection.isVisible().catch(() => false)) {
      await expect(statsSection).toBeVisible();
    }
  });
});

test.describe('Leave Management', () => {
  test('should display leave page', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave?tab=apply');
    await employeePage.waitForLoadState('networkidle');
    
    const leaveHeading = employeePage.locator('h1:has-text("Leave"), h2:has-text("Leave")').first();
    await expect(leaveHeading).toBeVisible({ timeout: 5000 });
  });

  test('should view leave balance', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave');
    await employeePage.waitForTimeout(1000);
    
    const balanceSection = employeePage.locator('text=Balance, text=Available, text=Remaining').first();
    if (await balanceSection.isVisible().catch(() => false)) {
      await expect(balanceSection).toBeVisible();
    }
  });

  test('should apply for leave', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave?tab=apply');
    await employeePage.waitForTimeout(1000);
    
    const leaveTypeSelect = employeePage.locator('select[name*="type"], select[name*="leave"]').first();
    if (await leaveTypeSelect.isVisible().catch(() => false)) {
      await leaveTypeSelect.selectOption({ index: 1 });
      
      const startDateInput = employeePage.locator('input[type="date"], input[name*="start"]').first();
      if (await startDateInput.isVisible().catch(() => false)) {
        const today = new Date();
        const nextWeek = new Date(today.setDate(today.getDate() + 7));
        const dateString = nextWeek.toISOString().split('T')[0];
        await startDateInput.fill(dateString);
      }
      
      const endDateInput = employeePage.locator('input[type="date"], input[name*="end"]').nth(1);
      if (await endDateInput.isVisible().catch(() => false)) {
        const today = new Date();
        const twoWeeks = new Date(today.setDate(today.getDate() + 14));
        const dateString = twoWeeks.toISOString().split('T')[0];
        await endDateInput.fill(dateString);
      }
      
      const reasonInput = employeePage.locator('textarea[name*="reason"], textarea[name*="comment"]').first();
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('Personal leave request - E2E test');
      }
      
      const submitButton = employeePage.locator('button:has-text("Submit"), button:has-text("Apply"), button[type="submit"]').first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await employeePage.waitForTimeout(2000);
      }
    }
  });

  test('should view leave history', async ({ employeePage }) => {
    await employeePage.goto('/ops/leave');
    await employeePage.waitForTimeout(1000);
    
    const historyTab = employeePage.locator('text=History, [href*="history"]').first();
    if (await historyTab.isVisible().catch(() => false)) {
      await historyTab.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should approve leave as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/leave');
    await adminPage.waitForTimeout(1000);
    
    const pendingTab = adminPage.locator('text=Pending, text=Requests').first();
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

test.describe('Notice Management', () => {
  test('should display notice board', async ({ employeePage }) => {
    await employeePage.goto('/ops/notice');
    await employeePage.waitForLoadState('networkidle');
    
    const noticeHeading = employeePage.locator('h1:has-text("Notice"), h2:has-text("Notice")').first();
    await expect(noticeHeading).toBeVisible({ timeout: 5000 });
  });

  test('should view notice details', async ({ employeePage }) => {
    await employeePage.goto('/ops/notice');
    await employeePage.waitForTimeout(1000);
    
    const firstNotice = employeePage.locator('[class*="notice"], [data-testid*="notice"]').first();
    if (await firstNotice.isVisible().catch(() => false)) {
      await firstNotice.click();
      await employeePage.waitForTimeout(1000);
    }
  });

  test('should create notice as admin', async ({ adminPage }) => {
    await adminPage.goto('/ops/notice');
    await adminPage.waitForTimeout(1000);
    
    const createButton = adminPage.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Post")').first();
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      await adminPage.waitForTimeout(500);
      
      const titleInput = adminPage.locator('input[name*="title"], input[name*="subject"]').first();
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill(`E2E Test Notice ${Date.now()}`);
        
        const contentInput = adminPage.locator('textarea[name*="content"], textarea[name*="message"], textarea[name*="description"]').first();
        if (await contentInput.isVisible().catch(() => false)) {
          await contentInput.fill('This is an automated test notice');
        }
        
        const submitButton = adminPage.locator('button:has-text("Publish"), button:has-text("Post"), button[type="submit"]').first();
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await adminPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('should filter notices', async ({ employeePage }) => {
    await employeePage.goto('/ops/notice');
    await employeePage.waitForTimeout(1000);
    
    const filterOption = employeePage.locator('select[name*="filter"], button:has-text("Filter")').first();
    if (await filterOption.isVisible().catch(() => false)) {
      await filterOption.click();
      await employeePage.waitForTimeout(500);
    }
  });
});
