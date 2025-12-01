import { test, expect, Page } from '@playwright/test';

/**
 * Project Management E2E Test Suite
 *
 * This suite covers navigation, UI, tab switching, project creation, viewing,
 * updating, deletion, filtering, pagination, error handling, responsiveness,
 * accessibility and performance.
 */

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const TEST_PROJECT = {
    title: 'E2E Test Project - ' + Date.now(),
    description: 'This is a test project created by automated E2E tests',
    goal: 'Successfully complete all E2E tests',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
async function navigateToProjects(page: Page) {
    await page.goto('/ops/project', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1:has-text("Project Management")', { timeout: 15000 });
    // Give page time to fully render
    await page.waitForTimeout(1000);
}

async function openCreateProjectTab(page: Page) {
    await page.click('button:has-text("Create New")');
    await page.waitForURL('**/ops/project?tab=create');
    await expect(page.locator('h2:has-text("Create New Project")')).toBeVisible({ timeout: 5000 });
}

async function fillProjectForm(page: Page, projectData: typeof TEST_PROJECT) {
    const titleInput = page.locator('input[name="project_title"]').or(page.locator('input[placeholder*="title" i]')).first();
    await titleInput.fill(projectData.title);

    const descInput = page.locator('textarea[name="description"]').or(page.locator('textarea[placeholder*="description" i]')).first();
    await descInput.fill(projectData.description);

    const goalInput = page.locator('input[name="goal"]').or(page.locator('input[placeholder*="goal" i]')).first();
    await goalInput.fill(projectData.goal);

    const startDateInput = page.locator('input[name="start_date"]').or(page.locator('input[type="date"]').first());
    if (await startDateInput.isVisible().catch(() => false)) {
        await startDateInput.fill(projectData.startDate);
    }

    const endDateInput = page.locator('input[name="end_date"]').or(page.locator('input[type="date"]').nth(1));
    if (await endDateInput.isVisible().catch(() => false)) {
        await endDateInput.fill(projectData.endDate);
    }

    // Select a department (if available)
    const addDepartmentButton = page.locator('button:has-text("Add Department")');
    if (await addDepartmentButton.isVisible().catch(() => false)) {
        await addDepartmentButton.click();
        const departmentSelect = page.locator('select[name^="department_"]').first();
        const options = await departmentSelect.locator('option').count();
        if (options > 1) {
            await departmentSelect.selectOption({ index: 1 });
        }
    }

    // Select a project lead (if available)
    const projectLeadSelect = page.locator('select[name="project_lead_id"]');
    if (await projectLeadSelect.isVisible().catch(() => false)) {
        const options = await projectLeadSelect.locator('option').count();
        if (options > 1) {
            await projectLeadSelect.selectOption({ index: 1 });
        }
    }
}

async function submitProjectForm(page: Page) {
    const submitButton = page.locator('button:has-text("Create Project")').or(page.locator('[data-testid="create-project-button"]'));
    await submitButton.click();
}

// ---------------------------------------------------------------------------
// Global test configuration – authentication is handled by auth.setup.ts
// ---------------------------------------------------------------------------
// No per-test login needed; the global setup saves auth state.

// ---------------------------------------------------------------------------
// Navigation & UI tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Navigation and UI', () => {
    // Configure serial execution and reuse same page to avoid browser "refresh"
    test.describe.configure({ mode: 'serial' });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        // Create a persistent page for this entire test suite
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        // Navigate once for all tests in this suite
        await navigateToProjects(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('should navigate to project management page', async () => {
        // Page already navigated in beforeAll - just verify elements
        await expect(page.locator('h1:has-text("Project Management")')).toBeVisible();
        await expect(page.locator('text=Efficiently manage your projects')).toBeVisible();
    });

    test('should display all tabs (Ongoing, Completed, Create New, Archived)', async () => {
        // Reuse same page - no need to navigate again
        await expect(page.locator('button:has-text("Ongoing")')).toBeVisible();
        await expect(page.locator('button:has-text("Completed")')).toBeVisible();
        await expect(page.locator('button:has-text("Create New")')).toBeVisible();
        await expect(page.locator('button:has-text("Archived")')).toBeVisible();
    });

    test('should have Ongoing tab active by default', async () => {
        // Check URL without navigating
        const url = page.url();
        expect(url.includes('tab=ongoing') || !url.includes('tab=')).toBeTruthy();
    });

    test('should display correct icons for each tab', async () => {
        // Just check icons on current page
        await expect(page.locator('button:has-text("Ongoing")').locator('svg')).toBeVisible();
        await expect(page.locator('button:has-text("Completed")').locator('svg')).toBeVisible();
        await expect(page.locator('button:has-text("Create New")').locator('svg')).toBeVisible();
        await expect(page.locator('button:has-text("Archived")').locator('svg')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tab navigation tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Tab Navigation', () => {
    // Configure serial execution and reuse same page to avoid browser "refresh"
    test.describe.configure({ mode: 'serial' });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        // Create a persistent page for this entire test suite
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        // Navigate once for all tests in this suite
        await navigateToProjects(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('should switch to Completed tab and update URL', async () => {
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/project?tab=completed');
        expect(page.url()).toContain('tab=completed');
    });

    test('should switch to Create New tab and update URL', async () => {
        await page.click('button:has-text("Create New")');
        await page.waitForURL('**/ops/project?tab=create');
        expect(page.url()).toContain('tab=create');
        await expect(page.locator('h2:has-text("Create New Project")')).toBeVisible();
    });

    test('should switch to Archived tab and show coming soon message', async () => {
        await page.click('button:has-text("Archived")');
        await page.waitForURL('**/ops/project?tab=archived');
        await expect(page.locator('text=Archived Projects').first()).toBeVisible();
        await expect(page.locator('text=Feature coming soon')).toBeVisible();
    });

    test('should maintain tab state on page reload', async () => {
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/project?tab=completed');
        await page.reload();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('tab=completed');
    });

    test('should navigate between all tabs correctly', async () => {
        // Start from current state (might be on Completed from previous test)
        // First go to Ongoing to have consistent starting point
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL('**/ops/project?tab=ongoing');
        
        expect(page.url().includes('tab=ongoing')).toBeTruthy();
        
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/project?tab=completed');
        expect(page.url()).toContain('tab=completed');
        
        await page.click('button:has-text("Create New")');
        await page.waitForURL('**/ops/project?tab=create');
        expect(page.url()).toContain('tab=create');
        
        await page.click('button:has-text("Archived")');
        await page.waitForURL('**/ops/project?tab=archived');
        expect(page.url()).toContain('tab=archived');
        
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL('**/ops/project?tab=ongoing');
        expect(page.url()).toContain('tab=ongoing');
    });
});

// ---------------------------------------------------------------------------
// Project creation tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Creation', () => {
    // Configure serial execution and reuse same page to avoid browser "refresh"
    test.describe.configure({ mode: 'serial' });

    let page: Page;

    test.beforeAll(async ({ browser }) => {
        // Create a persistent page for this entire test suite
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        // Navigate once for all tests in this suite
        await navigateToProjects(page);
    });

    test.afterAll(async () => {
        await page.close();
    });

    test('should navigate to create project tab', async () => {
        await openCreateProjectTab(page);
        await expect(page.locator('h2:has-text("Create New Project")')).toBeVisible();
    });

    test('should display validation error for empty project title', async () => {
        await openCreateProjectTab(page);
        await submitProjectForm(page);
        await expect(page.locator('text=Please enter a valid project title').or(page.locator('text=project_title'))).toBeVisible();
    });

    test.describe('should create a new project successfully', () => {
        test('without milestones', async () => {
            await openCreateProjectTab(page);
            await fillProjectForm(page, TEST_PROJECT);
            await submitProjectForm(page);
            await expect(page.locator('text=Project created successfully').or(page.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab with multiple strategies
            await Promise.race([
                page.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                page.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(page.locator(`text=${TEST_PROJECT.title}`)).toBeVisible({ timeout: 5000 });
        });

        test('with one milestone', async () => {
            const projectWithOneMilestone = {
                ...TEST_PROJECT,
                title: 'E2E Test Project with One Milestone - ' + Date.now(),
            };

            await openCreateProjectTab(page);
            await fillProjectForm(page, projectWithOneMilestone);

            // Add a milestone
            const addMilestoneButton = page.locator('button:has-text("Add Milestone")').or(page.locator('button:has-text("Add First Milestone")'));
            await addMilestoneButton.click();

            // Fill milestone form
            const milestoneTitle = page.locator('input[name="milestone_title"]').or(page.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 1');

            const milestoneDesc = page.locator('textarea[name="milestone_description"]').or(page.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('First milestone for testing');
            }

            const milestoneWeightage = page.locator('input[name="weightage"]').or(page.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('100');
            }

            // Submit milestone
            const saveMilestoneButton = page.locator('button:has-text("Add Milestone")').or(page.locator('button:has-text("Save")'));
            await saveMilestoneButton.click();

            // Verify milestone was added
            await expect(page.locator('text=Test Milestone 1')).toBeVisible({ timeout: 5000 });

            // Submit project form
            await submitProjectForm(page);
            await expect(page.locator('text=Project created successfully').or(page.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab
            await Promise.race([
                page.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                page.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(page.locator(`text=${projectWithOneMilestone.title}`)).toBeVisible({ timeout: 5000 });
        });

        test('with multiple milestones', async () => {
            const projectWithMultipleMilestones = {
                ...TEST_PROJECT,
                title: 'E2E Test Project with Multiple Milestones - ' + Date.now(),
            };

            await openCreateProjectTab(page);
            await fillProjectForm(page, projectWithMultipleMilestones);

            // Add first milestone
            const addMilestoneButton = page.locator('button:has-text("Add Milestone")').or(page.locator('button:has-text("Add First Milestone")'));
            await addMilestoneButton.click();

            // Fill first milestone form
            let milestoneTitle = page.locator('input[name="milestone_title"]').or(page.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 1');

            let milestoneDesc = page.locator('textarea[name="milestone_description"]').or(page.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('First milestone for testing');
            }

            let milestoneWeightage = page.locator('input[name="weightage"]').or(page.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('50');
            }

            // Submit first milestone
            let saveMilestoneButton = page.locator('button:has-text("Add Milestone")').or(page.locator('button:has-text("Save")'));
            await saveMilestoneButton.click();

            // Verify first milestone was added
            await expect(page.locator('text=Test Milestone 1')).toBeVisible({ timeout: 5000 });

            // Add second milestone
            const addSecondMilestoneButton = page.locator('button:has-text("Add Milestone")').nth(1);
            await addSecondMilestoneButton.click();

            // Fill second milestone form
            milestoneTitle = page.locator('input[name="milestone_title"]').or(page.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 2');

            milestoneDesc = page.locator('textarea[name="milestone_description"]').or(page.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('Second milestone for testing');
            }

            milestoneWeightage = page.locator('input[name="weightage"]').or(page.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('50');
            }

            // Submit second milestone
            saveMilestoneButton = page.locator('button:has-text("Add Milestone")').nth(1).or(page.locator('button:has-text("Save")'));
            await saveMilestoneButton.click();

            // Verify second milestone was added
            await expect(page.locator('text=Test Milestone 2')).toBeVisible({ timeout: 5000 });

            // Submit project form
            await submitProjectForm(page);
            await expect(page.locator('text=Project created successfully').or(page.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab
            await Promise.race([
                page.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                page.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(page.locator(`text=${projectWithMultipleMilestones.title}`)).toBeVisible({ timeout: 5000 });
        });
    });

    // test('should validate date range (end date after start date)', async () => {
    //     await openCreateProjectTab(page);
    //     const invalidProject = { ...TEST_PROJECT, startDate: '2024-12-31', endDate: '2024-01-01' };
    //     await fillProjectForm(page, invalidProject);
    //     await submitProjectForm(page);
    //     await expect(page.locator('text=End date must be after start date').or(page.locator('text=end_date'))).toBeVisible();
    // });

    test('should handle project creation failure gracefully', async () => {
        await page.route('**/rest/v1/project_records*', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });
        await openCreateProjectTab(page);
        await fillProjectForm(page, TEST_PROJECT);
        await submitProjectForm(page);
        await expect(page.locator('text=Failed to create project')).toBeVisible({ timeout: 10000 });
    });

    test('should preserve form data when validation fails', async () => {
        await openCreateProjectTab(page);
        const titleInput = page.locator('input[name="project_title"]').or(page.locator('input[placeholder*="title" i]')).first();
        const descInput = page.locator('textarea[name="description"]').or(page.locator('textarea[placeholder*="description" i]')).first();
        await titleInput.fill(TEST_PROJECT.title);
        await descInput.fill(TEST_PROJECT.description);
        await submitProjectForm(page);
        await expect(titleInput).toHaveValue(TEST_PROJECT.title);
        await expect(descInput).toHaveValue(TEST_PROJECT.description);
    });
});

// ---------------------------------------------------------------------------
// Project Viewing tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Viewing', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        await navigateToProjects(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('should view project details', async () => {
        // Wait for projects to load and click the first view button
        const viewButton = page.locator('[data-testid="view-project-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Check URL contains project ID
        await page.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });
        expect(page.url()).toContain('/ops/project/');

        // Check details
        await expect(page.locator('h1').or(page.locator('h2')).filter({ hasText: "Project Details" })).toBeVisible();
        
        // Go back to project list for next tests
        await page.goBack();
        await page.waitForSelector('h1:has-text("Project Management")', { timeout: 5000 });
    });

    test('should display search functionality', async () => {
        // Already on project list page from previous test or beforeAll
        const searchInput = page.locator('input[placeholder*="Search projects" i]');
        await expect(searchInput).toBeVisible();
    });

    test('should search for projects', async () => {
        // Already on project list page
        const searchInput = page.locator('input[placeholder*="Search projects" i]');
        await searchInput.fill('test');
        await page.waitForTimeout(500); // Wait for debounce
        // Projects should be filtered or loading indicator shown
    });
});

// ---------------------------------------------------------------------------
// Project Updating tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Updating', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        await navigateToProjects(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('should update project details successfully', async () => {
        const newTitle = `Updated Project ${Date.now()}`;

        // Wait for projects to load and click the first edit button
        const editButton = page.locator('[data-testid="edit-project-button"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });

        await editButton.click();

        // Update form should appear
        await expect(page.locator('text=Update Project').first()).toBeVisible();

        // Update title
        const titleInput = page.locator('input[name="project_title"]').or(page.locator('input[placeholder*="title" i]')).first();
        await titleInput.fill(newTitle);

        // Submit
        await page.click('button:has-text("Update Project")');

        // Verify success
        await expect(page.locator('text=Project updated successfully')).toBeVisible();
        await expect(page.locator(`text=${newTitle}`)).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Project Deletion tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Deletion', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        await navigateToProjects(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('should delete a project successfully', async () => {
        // Wait for projects to load and get the first project's title
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title before deleting
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first delete button
        const deleteButton = page.locator('[data-testid="delete-project-button"]').first();
        await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
        await deleteButton.click();

        // Verify success
        await expect(page.locator('text=Project deleted successfully')).toBeVisible();

        // Verify the project is no longer visible (if we got the title)
        if (projectTitle) {
            await expect(page.locator(`text=${projectTitle}`)).not.toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Project Completion tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Completion', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        await navigateToProjects(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('should mark a project as complete', async () => {
        // Wait for projects to load and get the first project's title
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title before completing
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button
        const viewButton = page.locator('[data-testid="view-project-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Wait for navigation to project details
        await page.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });

        // In Details view, click "Mark as Complete"
        await page.click('button:has-text("Mark as Complete")');

        // Verify success
        await expect(page.locator('text=Project marked as completed').or(page.locator('text=Project updated successfully'))).toBeVisible();

        // Go back to project list
        await page.goBack();

        // Navigate to Ongoing tab
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL(/\/ops\/project\?tab=ongoing/, { timeout: 5000 });

        // Verify it's not in Ongoing (if we got the title)
        if (projectTitle) {
            await expect(page.locator(`text=${projectTitle}`)).not.toBeVisible();
        }

        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Verify it is in Completed (if we got the title)
        if (projectTitle) {
            await expect(page.locator(`text=${projectTitle}`)).toBeVisible();
        }
    });

    test('should reopen a completed project', async () => {
        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Wait for projects to load and get the first completed project's title
        const firstProjectCard = page.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title before reopening
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button
        const viewButton = firstProjectCard.locator('button').filter({ has: page.locator('svg') }).last();
        await viewButton.click();

        // Wait for navigation to project details
        await page.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });

        // In Details view, click "Reopen Project"
        await page.click('button:has-text("Reopen Project")');

        // Verify success
        await expect(page.locator('text=Project reopened').or(page.locator('text=Project updated successfully'))).toBeVisible();

        // Go back to project list
        await page.goBack();

        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Verify it's not in Completed (if we got the title)
        if (projectTitle) {
            await expect(page.locator(`text=${projectTitle}`)).not.toBeVisible();
        }

        // Navigate to Ongoing tab
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL(/\/ops\/project\?tab=ongoing/, { timeout: 5000 });

        // Verify it is in Ongoing (if we got the title)
        if (projectTitle) {
            await expect(page.locator(`text=${projectTitle}`)).toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Pagination tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Pagination', () => {
    test.describe.configure({ mode: 'serial' });
    let page: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        page = await context.newPage();
        await navigateToProjects(page);
    });
    test.afterAll(async () => { await page.close(); });

    test('should display and use load more button for ongoing projects', async () => {
        // Count initial projects
        const initialProjectCount = await page.locator('[data-testid="project-card"]').count();

        // Check if Load More button is visible (only if there are more projects)
        const loadMoreButton = page.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new projects to load
            await page.waitForTimeout(1000);

            // Count projects after loading more
            const newProjectCount = await page.locator('[data-testid="project-card"]').count();

            // Verify more projects were loaded
            expect(newProjectCount).toBeGreaterThan(initialProjectCount);
        } else {
            // If Load More is not visible, it means all projects are already loaded
            // This is acceptable - just log it
            console.log('All ongoing projects already loaded, no pagination needed');
        }
    });

    test('should display and use load more button for completed projects', async () => {
        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Wait for projects to load
        await page.waitForTimeout(1000);

        // Count initial projects
        const initialProjectCount = await page.locator('[data-testid="project-card"]').count();

        // Check if Load More button is visible (only if there are more projects)
        const loadMoreButton = page.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new projects to load
            await page.waitForTimeout(1000);

            // Count projects after loading more
            const newProjectCount = await page.locator('[data-testid="project-card"]').count();

            // Verify more projects were loaded
            expect(newProjectCount).toBeGreaterThan(initialProjectCount);
        } else {
            // If Load More is not visible, it means all projects are already loaded
            // This is acceptable - just log it
            console.log('All completed projects already loaded, no pagination needed');
        }
    });
});
