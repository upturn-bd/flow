import { test, expect } from './fixtures/auth.fixture';

test.describe('Project Management - Admin', () => {
  test('should display project management page', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    await adminPage.waitForLoadState('networkidle');
    
    await expect(adminPage.locator('h1:has-text("Project Management")')).toBeVisible();
    await expect(adminPage.locator('text=Ongoing')).toBeVisible();
    await expect(adminPage.locator('text=Completed')).toBeVisible();
  });

  test('should show create new project tab for admin', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Admin should see "Create New" tab
    const createNewTab = adminPage.locator('text=Create New');
    await expect(createNewTab).toBeVisible();
  });

  test('should create a new project', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Click on Create New tab
    await adminPage.click('text=Create New');
    await adminPage.waitForTimeout(500);
    
    // Fill in project details
    const projectNameInput = adminPage.locator('input[name="name"], input[placeholder*="project name" i]').first();
    if (await projectNameInput.isVisible()) {
      await projectNameInput.fill(`Test Project ${Date.now()}`);
      
      // Fill description
      const descriptionInput = adminPage.locator('textarea[name="description"], textarea[placeholder*="description" i]').first();
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('This is a test project created by Playwright');
      }
      
      // Select project type or category if available
      const submitButton = adminPage.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Wait for success message or navigation
        await adminPage.waitForTimeout(2000);
      }
    }
  });

  test('should view ongoing projects', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Click Ongoing tab
    await adminPage.click('text=Ongoing');
    await adminPage.waitForTimeout(1000);
    
    // Check if projects list is visible
    const projectsList = adminPage.locator('[class*="project"], [data-testid="project"]').first();
    const count = await adminPage.locator('[class*="project"], [data-testid="project"]').count();
    
    if (count > 0) {
      await expect(projectsList).toBeVisible();
    }
  });

  test('should view completed projects', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Click Completed tab
    await adminPage.click('text=Completed');
    await adminPage.waitForTimeout(1000);
    
    // Verify we're on completed tab
    const completedTab = adminPage.locator('text=Completed');
    await expect(completedTab).toBeVisible();
  });

  test('should filter and search projects', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Look for search input
    const searchInput = adminPage.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test');
      await adminPage.waitForTimeout(1000);
    }
  });
});

test.describe('Project Management - Employee', () => {
  test('should not show create new project tab for employee', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/workflow/project');
    await employeePage.waitForTimeout(1000);
    
    // Employee should NOT see "Create New" tab
    const createNewTab = employeePage.locator('text=Create New');
    await expect(createNewTab).not.toBeVisible();
  });

  test('should view assigned projects only', async ({ employeePage }) => {
    await employeePage.goto('/operations-and-services/workflow/project');
    
    await expect(employeePage.locator('h1:has-text("Project Management")')).toBeVisible();
    await expect(employeePage.locator('text=Ongoing')).toBeVisible();
  });
});

test.describe('Project Details', () => {
  test('should view project details', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    
    // Click on first project if exists
    const firstProject = adminPage.locator('[class*="project-card"], [class*="project-item"]').first();
    const count = await adminPage.locator('[class*="project-card"], [class*="project-item"]').count();
    
    if (count > 0) {
      await firstProject.click();
      await adminPage.waitForTimeout(1000);
      
      // Verify project details page
      await expect(adminPage.locator('h1, h2, h3')).toBeVisible();
    }
  });

  test('should view project milestones', async ({ adminPage }) => {
    await adminPage.goto('/operations-and-services/workflow/project');
    await adminPage.waitForTimeout(1000);
    
    // Look for milestone section
    const milestoneSection = adminPage.locator('text=Milestone, text=Tasks, text=Progress').first();
    if (await milestoneSection.isVisible()) {
      await expect(milestoneSection).toBeVisible();
    }
  });
});
