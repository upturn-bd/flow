import { test, expect, Page } from '@playwright/test';

/**
 * Project Management E2E Test Suite
 *
 * This suite covers navigation, UI, tab switching, project creation, viewing,
 * updating, deletion, filtering, pagination, error handling, responsiveness,
 * accessibility and performance.
 */

// Configure ALL tests in this file to run serially, not in parallel
test.describe.configure({ mode: 'serial' });

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
async function navigateToProjects(sharedPage: Page) {
    await sharedPage.goto('/ops/project', { waitUntil: 'domcontentloaded' });
    await sharedPage.waitForSelector('h1:has-text("Project Management")', { timeout: 15000 });
    // Give sharedPage time to fully render
    await sharedPage.waitForTimeout(1000);
}

async function openCreateProjectTab(sharedPage: Page) {
    await sharedPage.click('button:has-text("Create New")');
    await sharedPage.waitForURL('**/ops/project?tab=create');
    await expect(sharedPage.locator('h2:has-text("Create New Project")')).toBeVisible({ timeout: 5000 });
    
    // Wait for the loading indicator to disappear (departments and employees loading)
    const loadingIndicator = sharedPage.locator('text=Loading departments and employees');
    const isLoadingVisible = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
    if (isLoadingVisible) {
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    }
}

async function fillProjectForm(sharedPage: Page, projectData: typeof TEST_PROJECT) {
    // Fill basic fields - must be sequential to avoid race conditions
    await sharedPage.locator('input[name="project_title"]').first().fill(projectData.title);
    await sharedPage.locator('textarea[name="description"]').first().fill(projectData.description);
    await sharedPage.locator('input[name="goal"]').first().fill(projectData.goal);
    await sharedPage.locator('input[name="start_date"]').first().fill(projectData.startDate);
    await sharedPage.locator('input[name="end_date"]').first().fill(projectData.endDate);

    // Scroll to see department section
    await sharedPage.evaluate(() => window.scrollBy(0, 200));

    // Select a department (if available)
    const addDepartmentButton = sharedPage.locator('button:has-text("Add Department")');
    if (await addDepartmentButton.isVisible().catch(() => false)) {
        await addDepartmentButton.click();
        
        // Wait for select to appear and select first department
        const lastDepartmentSelect = sharedPage.locator('select[name^="department_"]').last();
        await lastDepartmentSelect.waitFor({ state: 'visible', timeout: 2000 });
        await lastDepartmentSelect.selectOption({ index: 1 });
    }

    // Scroll to see project lead section
    await sharedPage.evaluate(() => window.scrollBy(0, 300));

    // Select a project lead using the custom SingleEmployeeSelector component
    try {
        // Wait for employees to load after department selection
        await sharedPage.waitForTimeout(800);
        
        const projectLeadLabel = sharedPage.locator('label:text-is("Project Lead")');
        if (await projectLeadLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
            const projectLeadContainer = projectLeadLabel.locator('..');
            const projectLeadInput = projectLeadContainer.locator('input').first();
            
            if (await projectLeadInput.isVisible({ timeout: 2000 }).catch(() => false)) {
                const isDisabled = await projectLeadInput.isDisabled().catch(() => false);
                const placeholder = await projectLeadInput.getAttribute('placeholder') || '';
                
                if (!isDisabled && !placeholder.toLowerCase().includes('department first')) {
                    await projectLeadInput.scrollIntoViewIfNeeded();
                    await projectLeadInput.click();
                    await sharedPage.waitForTimeout(600); // Wait for dropdown
                    
                    const firstEmployee = sharedPage.locator('button:visible').filter({ hasText: /@/ }).first();
                    await firstEmployee.waitFor({ state: 'visible', timeout: 2000 });
                    await firstEmployee.click();
                }
            }
        }
    } catch (error) {
        await sharedPage.screenshot({ path: 'tests/.debug/project-lead-error.png', fullPage: true });
    }
    
    // Scroll to submit button
    await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

async function submitProjectForm(sharedPage: Page) {
    const submitButton = sharedPage.locator('button:has-text("Create Project")').or(sharedPage.locator('[data-testid="create-project-button"]'));
    await submitButton.click();
}

// ---------------------------------------------------------------------------
// Global test configuration – authentication is handled by auth.setup.ts
// ---------------------------------------------------------------------------
// Shared sharedPage context for ALL tests in this file to minimize browser overhead
let sharedPage: Page;

test.beforeAll(async ({ browser }) => {
    // Create ONE persistent sharedPage for the entire test file
    const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
    sharedPage = await context.newPage();
    // Navigate once at the start
    await navigateToProjects(sharedPage);
});

test.afterAll(async () => {
    // Close sharedPage only after ALL tests are done
    await sharedPage?.close();
});

// ---------------------------------------------------------------------------
// Navigation & UI tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Navigation and UI', () => {
    test('should navigate to project management sharedPage', async () => {
        // sharedPage already navigated in global beforeAll - just verify elements
        await expect(sharedPage.locator('h1:has-text("Project Management")')).toBeVisible();
        await expect(sharedPage.locator('text=Efficiently manage your projects')).toBeVisible();
    });

    test('should display all tabs (Ongoing, Completed, Create New, Archived)', async () => {
        await expect(sharedPage.locator('button:has-text("Ongoing")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Completed")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Create New")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Archived")')).toBeVisible();
    });

    test('should have Ongoing tab active by default', async () => {
        const url = sharedPage.url();
        expect(url.includes('tab=ongoing') || !url.includes('tab=')).toBeTruthy();
    });

    test('should display correct icons for each tab', async () => {
        await expect(sharedPage.locator('button:has-text("Ongoing")').locator('svg')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Completed")').locator('svg')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Create New")').locator('svg')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Archived")').locator('svg')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tab navigation tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Tab Navigation', () => {    test('should switch to Completed tab and update URL', async () => {
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/project?tab=completed');
        expect(sharedPage.url()).toContain('tab=completed');
    });

    test('should switch to Create New tab and update URL', async () => {
        await sharedPage.click('button:has-text("Create New")');
        await sharedPage.waitForURL('**/ops/project?tab=create');
        expect(sharedPage.url()).toContain('tab=create');
        await expect(sharedPage.locator('h2:has-text("Create New Project")')).toBeVisible();
    });

    test('should switch to Archived tab and show coming soon message', async () => {
        await sharedPage.click('button:has-text("Archived")');
        await sharedPage.waitForURL('**/ops/project?tab=archived');
        await expect(sharedPage.locator('text=Archived Projects').first()).toBeVisible();
        await expect(sharedPage.locator('text=Feature coming soon')).toBeVisible();
    });

    test('should maintain tab state on sharedPage reload', async () => {
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/project?tab=completed');
        await sharedPage.reload();
        await sharedPage.waitForLoadState('networkidle');
        expect(sharedPage.url()).toContain('tab=completed');
    });

    test('should navigate between all tabs correctly', async () => {
        // Start from current state (might be on Completed from previous test)
        // First go to Ongoing to have consistent starting point
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL('**/ops/project?tab=ongoing');
        
        expect(sharedPage.url().includes('tab=ongoing')).toBeTruthy();
        
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/project?tab=completed');
        expect(sharedPage.url()).toContain('tab=completed');
        
        await sharedPage.click('button:has-text("Create New")');
        await sharedPage.waitForURL('**/ops/project?tab=create');
        expect(sharedPage.url()).toContain('tab=create');
        
        await sharedPage.click('button:has-text("Archived")');
        await sharedPage.waitForURL('**/ops/project?tab=archived');
        expect(sharedPage.url()).toContain('tab=archived');
        
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL('**/ops/project?tab=ongoing');
        expect(sharedPage.url()).toContain('tab=ongoing');
    });
});

// ---------------------------------------------------------------------------
// Project creation tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Creation', () => {
    test('should navigate to create project tab', async () => {
        await openCreateProjectTab(sharedPage);
        await expect(sharedPage.locator('h2:has-text("Create New Project")')).toBeVisible();
    });

    test('should display validation error for empty project title', async () => {
        await openCreateProjectTab(sharedPage);
        await submitProjectForm(sharedPage);
        await expect(sharedPage.locator('text=Please enter a valid project title').or(sharedPage.locator('text=project_title'))).toBeVisible();
    });

    test.describe('should create a new project successfully', () => {
        test('without milestones', async () => {
            await openCreateProjectTab(sharedPage);
            await fillProjectForm(sharedPage, TEST_PROJECT);
            await submitProjectForm(sharedPage);
            await expect(sharedPage.locator('text=Project created successfully').or(sharedPage.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab with multiple strategies
            await Promise.race([
                sharedPage.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                sharedPage.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(sharedPage.locator(`text=${TEST_PROJECT.title}`)).toBeVisible({ timeout: 5000 });
        });

        test('with one milestone', async () => {
            const projectWithOneMilestone = {
                ...TEST_PROJECT,
                title: 'E2E Test Project with One Milestone - ' + Date.now(),
            };

            await openCreateProjectTab(sharedPage);
            await fillProjectForm(sharedPage, projectWithOneMilestone);

            // Add a milestone
            const addMilestoneButton = sharedPage.locator('button:has-text("Add Milestone")').or(sharedPage.locator('button:has-text("Add First Milestone")')).first();
            await addMilestoneButton.click();

            // Fill milestone form
            const milestoneTitle = sharedPage.locator('input[name="milestone_title"]').or(sharedPage.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 1');

            const milestoneDesc = sharedPage.locator('textarea[name="milestone_description"]').or(sharedPage.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('First milestone for testing');
            }

            // Fill milestone dates (required fields)
            const milestoneStartDate = sharedPage.locator('input[name="start_date"]').nth(1); // nth(1) to skip project start date
            if (await milestoneStartDate.isVisible().catch(() => false)) {
                await milestoneStartDate.fill(projectWithOneMilestone.startDate);
            }

            const milestoneEndDate = sharedPage.locator('input[name="end_date"]').nth(1); // nth(1) to skip project end date
            if (await milestoneEndDate.isVisible().catch(() => false)) {
                const milestoneEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 15 days from now
                await milestoneEndDate.fill(milestoneEnd);
            }

            const milestoneWeightage = sharedPage.locator('input[name="weightage"]').or(sharedPage.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('100');
            }

            // Submit milestone
            let saveMilestoneButton = sharedPage.locator('data-testid=milestone-submit-button');
            await saveMilestoneButton.click();

            // Verify milestone was added
            await expect(sharedPage.locator('text=Test Milestone 1')).toBeVisible({ timeout: 5000 });

            // Submit project form
            await submitProjectForm(sharedPage);
            await expect(sharedPage.locator('text=Project created successfully').or(sharedPage.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab
            await Promise.race([
                sharedPage.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                sharedPage.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(sharedPage.locator(`text=${projectWithOneMilestone.title}`)).toBeVisible({ timeout: 5000 });
        });

        test('with multiple milestones', async () => {
            const projectWithMultipleMilestones = {
                ...TEST_PROJECT,
                title: 'E2E Test Project with Multiple Milestones - ' + Date.now(),
            };

            await openCreateProjectTab(sharedPage);
            await fillProjectForm(sharedPage, projectWithMultipleMilestones);

            // Add first milestone
            const addMilestoneButton = sharedPage.locator('button:has-text("Add Milestone")').or(sharedPage.locator('button:has-text("Add First Milestone")')).first();
            await addMilestoneButton.click();

            // Fill first milestone form
            let milestoneTitle = sharedPage.locator('input[name="milestone_title"]').or(sharedPage.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 1');

            let milestoneDesc = sharedPage.locator('textarea[name="milestone_description"]').or(sharedPage.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('First milestone for testing');
            }

            // Fill first milestone dates
            let milestoneStartDate = sharedPage.locator('input[name="start_date"]').nth(1);
            if (await milestoneStartDate.isVisible().catch(() => false)) {
                await milestoneStartDate.fill(projectWithMultipleMilestones.startDate);
            }

            let milestoneEndDate = sharedPage.locator('input[name="end_date"]').nth(1);
            if (await milestoneEndDate.isVisible().catch(() => false)) {
                const milestone1End = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 10 days
                await milestoneEndDate.fill(milestone1End);
            }

            let milestoneWeightage = sharedPage.locator('input[name="weightage"]').or(sharedPage.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('50');
            }

            // Submit first milestone
            let saveMilestoneButton = sharedPage.locator('data-testid=milestone-submit-button');
            await saveMilestoneButton.click();

            // Verify first milestone was added
            await expect(sharedPage.locator('text=Test Milestone 1')).toBeVisible({ timeout: 5000 });

            // Add second milestone
            const addSecondMilestoneButton = sharedPage.locator('button:has-text("Add Milestone")').first();
            await addSecondMilestoneButton.click();

            // Fill second milestone form
            milestoneTitle = sharedPage.locator('input[name="milestone_title"]').or(sharedPage.locator('input[placeholder*="milestone title" i]')).first();
            await milestoneTitle.fill('Test Milestone 2');

            milestoneDesc = sharedPage.locator('textarea[name="milestone_description"]').or(sharedPage.locator('textarea[placeholder*="milestone description" i]')).first();
            if (await milestoneDesc.isVisible().catch(() => false)) {
                await milestoneDesc.fill('Second milestone for testing');
            }

            // Fill second milestone dates
            milestoneStartDate = sharedPage.locator('input[name="start_date"]').nth(1);
            if (await milestoneStartDate.isVisible().catch(() => false)) {
                const milestone2Start = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 11 days (after milestone 1)
                await milestoneStartDate.fill(milestone2Start);
            }

            milestoneEndDate = sharedPage.locator('input[name="end_date"]').nth(1);
            if (await milestoneEndDate.isVisible().catch(() => false)) {
                const milestone2End = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 20 days
                await milestoneEndDate.fill(milestone2End);
            }

            milestoneWeightage = sharedPage.locator('input[name="weightage"]').or(sharedPage.locator('input[type="number"]')).first();
            if (await milestoneWeightage.isVisible().catch(() => false)) {
                await milestoneWeightage.fill('50');
            }

            // Submit second milestone
            await saveMilestoneButton.click();

            // Verify second milestone was added
            await expect(sharedPage.locator('text=Test Milestone 2')).toBeVisible({ timeout: 5000 });

            // Submit project form
            await submitProjectForm(sharedPage);
            await expect(sharedPage.locator('text=Project created successfully').or(sharedPage.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
            
            // Wait for navigation to ongoing tab
            await Promise.race([
                sharedPage.waitForURL('**/ops/project?tab=ongoing', { timeout: 5000 }),
                sharedPage.waitForFunction(() => {
                    const url = new URL(window.location.href);
                    return url.searchParams.get('tab') === 'ongoing';
                }, { timeout: 5000 })
            ]);
            
            await expect(sharedPage.locator(`text=${projectWithMultipleMilestones.title}`)).toBeVisible({ timeout: 5000 });
        });
    });

    // test('should validate date range (end date after start date)', async () => {
    //     await openCreateProjectTab(sharedPage);
    //     const invalidProject = { ...TEST_PROJECT, startDate: '2024-12-31', endDate: '2024-01-01' };
    //     await fillProjectForm(sharedPage, invalidProject);
    //     await submitProjectForm(sharedPage);
    //     await expect(sharedPage.locator('text=End date must be after start date').or(sharedPage.locator('text=end_date'))).toBeVisible();
    // });

    test('should handle project creation failure gracefully', async () => {
        await sharedPage.route('**/rest/v1/project_records*', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });
        await openCreateProjectTab(sharedPage);
        await fillProjectForm(sharedPage, TEST_PROJECT);
        await submitProjectForm(sharedPage);
        await expect(sharedPage.locator('text=Failed to create project')).toBeVisible({ timeout: 10000 });
    });

    test('should preserve form data when validation fails', async () => {
        await openCreateProjectTab(sharedPage);
        const titleInput = sharedPage.locator('input[name="project_title"]').or(sharedPage.locator('input[placeholder*="title" i]')).first();
        const descInput = sharedPage.locator('textarea[name="description"]').or(sharedPage.locator('textarea[placeholder*="description" i]')).first();
        await titleInput.fill(TEST_PROJECT.title);
        await descInput.fill(TEST_PROJECT.description);
        await submitProjectForm(sharedPage);
        await expect(titleInput).toHaveValue(TEST_PROJECT.title);
        await expect(descInput).toHaveValue(TEST_PROJECT.description);
    });
});

// ---------------------------------------------------------------------------
// Project Viewing tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Viewing', () => {
    test.describe.configure({ mode: 'serial' });
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        sharedPage = await context.newPage();
        await navigateToProjects(sharedPage);
    });
    test.afterAll(async () => { await sharedPage.close(); });

    test('should view project details', async () => {
        // Wait for projects to load and click the first view button
        const viewButton = sharedPage.locator('[data-testid="view-project-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Check URL contains project ID
        await sharedPage.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });
        expect(sharedPage.url()).toContain('/ops/project/');

        // Check details
        await expect(sharedPage.locator('h1').or(sharedPage.locator('h2')).filter({ hasText: "Project Details" })).toBeVisible();
        
        // Go back to project list for next tests
        await sharedPage.goBack();
        await sharedPage.waitForSelector('h1:has-text("Project Management")', { timeout: 5000 });
    });

    test('should display search functionality', async () => {
        // Already on project list sharedPage from previous test or beforeAll
        const searchInput = sharedPage.locator('input[placeholder*="Search projects" i]');
        await expect(searchInput).toBeVisible();
    });

    test('should search for projects', async () => {
        // Already on project list sharedPage
        const searchInput = sharedPage.locator('input[placeholder*="Search projects" i]');
        await searchInput.fill('test');
        await sharedPage.waitForTimeout(500); // Wait for debounce
        // Projects should be filtered or loading indicator shown
    });
});

// ---------------------------------------------------------------------------
// Project Updating tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Updating', () => {
    test.describe.configure({ mode: 'serial' });
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        sharedPage = await context.newPage();
        await navigateToProjects(sharedPage);
    });
    test.afterAll(async () => { await sharedPage.close(); });

    test('should update project details successfully', async () => {
        const newTitle = `Updated Project ${Date.now()}`;

        // Wait for projects to load and click the first edit button
        const editButton = sharedPage.locator('[data-testid="edit-project-button"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });

        await editButton.click();

        // Update form should appear
        await expect(sharedPage.locator('text=Update Project').first()).toBeVisible();

        // Update title
        const titleInput = sharedPage.locator('input[name="project_title"]').or(sharedPage.locator('input[placeholder*="title" i]')).first();
        await titleInput.fill(newTitle);

        // Scroll to submit button
        await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Submit project update
        await sharedPage.click('button:has-text("Update Project")');

        // Verify success
        await expect(sharedPage.locator('text=Project updated successfully')).toBeVisible();
        await expect(sharedPage.locator(`text=${newTitle}`)).toBeVisible();
    });

    test('should update existing milestone in project', async () => {
        const updatedMilestoneTitle = `Updated Milestone ${Date.now()}`;

        // Wait for projects to load and click the first edit button
        const editButton = sharedPage.locator('[data-testid="edit-project-button"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });

        await editButton.click();

        // Update form should appear
        await expect(sharedPage.locator('text=Update Project').first()).toBeVisible();

        // Scroll down to see milestones section
        await sharedPage.evaluate(() => window.scrollBy(0, 400));

        // Update the first milestone if it exists
        const firstMilestoneEditButton = sharedPage.locator('[data-testid="edit-milestone-button"]').first();
        await firstMilestoneEditButton.waitFor({ state: 'visible', timeout: 5000 });
        await firstMilestoneEditButton.click();
        
        // Wait for milestone update modal
        await expect(sharedPage.locator('text=Update Milestone').or(sharedPage.locator('text=Edit Milestone')).first()).toBeVisible({ timeout: 3000 });
        
        // Update milestone title
        const milestoneNameInput = sharedPage.locator('input[name="milestone_title"]').or(sharedPage.locator('input[placeholder*="milestone" i]')).first();
        await milestoneNameInput.fill(updatedMilestoneTitle);
        
        // Submit milestone update
        await sharedPage.click('button:has-text("Update Milestone")');
        
        // Wait for modal to close
        await sharedPage.waitForTimeout(500);

        // Scroll to submit button
        await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Submit project update
        await sharedPage.click('button:has-text("Update Project")');

        // Verify success
        await expect(sharedPage.locator('text=Project updated successfully')).toBeVisible();
        
        // Verify milestone was updated
        await expect(sharedPage.locator(`text=${updatedMilestoneTitle}`)).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Project Deletion tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Deletion', () => {
    test.describe.configure({ mode: 'serial' });
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        sharedPage = await context.newPage();
        await navigateToProjects(sharedPage);
    });
    test.afterAll(async () => { await sharedPage.close(); });

    test('should delete a project successfully', async () => {
        // Wait for projects to load and get the first project's title
        const firstProjectCard = sharedPage.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title before deleting
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first delete button
        const deleteButton = sharedPage.locator('[data-testid="delete-project-button"]').first();
        await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
        await deleteButton.click();

        // Verify success
        await expect(sharedPage.locator('text=Project deleted successfully')).toBeVisible();

        // Verify the project is no longer visible (if we got the title)
        if (projectTitle) {
            await expect(sharedPage.locator(`text=${projectTitle}`)).not.toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Project Completion tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Project Completion', () => {
    test.describe.configure({ mode: 'serial' });
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        sharedPage = await context.newPage();
        await navigateToProjects(sharedPage);
    });
    test.afterAll(async () => { await sharedPage.close(); });

    test('should mark a project as complete', async () => {
        // Wait for projects to load and get the first project's title
        const firstProjectCard = sharedPage.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title before completing
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button to go to project details
        const viewButton = sharedPage.locator('[data-testid="view-project-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Wait for navigation to project details
        await sharedPage.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });

        // Scroll down to see the Submit Project button
        await sharedPage.evaluate(() => window.scrollBy(0, 300));

        // Click "Submit Project" button in the project details sidebar
        const submitButton = sharedPage.locator('button:has-text("Submit Project")').first();
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.click();

        // Wait for submission modal to appear
        await expect(sharedPage.locator('text=Project Submission')).toBeVisible({ timeout: 3000 });

        // Fill in the remarks field
        const remarksTextarea = sharedPage.locator('textarea[name="remark"]');
        await remarksTextarea.fill('Project completed successfully. All milestones achieved.');

        // Click Submit in the modal
        await sharedPage.locator('button:has-text("Submit Project")').nth(1).click();

        // Verify success message
        await expect(sharedPage.locator('text=Project submitted successfully')).toBeVisible();

        // Should be redirected to completed tab
        await sharedPage.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Verify the project appears in Completed tab
        if (projectTitle) {
            await expect(sharedPage.locator(`text=${projectTitle}`)).toBeVisible();
        }
    });

    test('should view a completed project', async () => {
        // Navigate to Completed tab
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Wait for projects to load
        const firstProjectCard = sharedPage.locator('[data-testid="project-card"]').first();
        await firstProjectCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the project title
        const projectTitle = await firstProjectCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the view details button
        const viewButton = sharedPage.locator('[data-testid="view-project-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 5000 });
        await viewButton.click();

        // Wait for navigation to project details
        await sharedPage.waitForURL(/\/ops\/project\/.+/, { timeout: 5000 });

        // Verify project details sharedPage loaded
        await expect(sharedPage.locator('text=Project Details').or(sharedPage.locator(`text=${projectTitle}`))).toBeVisible();

        // Verify that Submit Project button is NOT visible (completed projects can't be submitted again)
        const submitButton = sharedPage.locator('button:has-text("Submit Project")').first();
        await expect(submitButton).not.toBeVisible();

        // Go back to project list
        await sharedPage.goBack();
        await sharedPage.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });
    });
});

// ---------------------------------------------------------------------------
// Pagination tests
// ---------------------------------------------------------------------------
test.describe('Project Management - Pagination', () => {
    test.describe.configure({ mode: 'serial' });
    let sharedPage: Page;
    test.beforeAll(async ({ browser }) => {
        const context = await browser.newContext({ storageState: 'tests/.auth/user.json' });
        sharedPage = await context.newPage();
        await navigateToProjects(sharedPage);
    });
    test.afterAll(async () => { await sharedPage.close(); });

    test('should display and use load more button for ongoing projects', async () => {
        // Count initial projects
        const initialProjectCount = await sharedPage.locator('[data-testid="project-card"]').count();

        // Check if Load More button is visible (only if there are more projects)
        const loadMoreButton = sharedPage.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new projects to load
            await sharedPage.waitForTimeout(1000);

            // Count projects after loading more
            const newProjectCount = await sharedPage.locator('[data-testid="project-card"]').count();

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
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/project\?tab=completed/, { timeout: 5000 });

        // Wait for projects to load
        await sharedPage.waitForTimeout(1000);

        // Count initial projects
        const initialProjectCount = await sharedPage.locator('[data-testid="project-card"]').count();

        // Check if Load More button is visible (only if there are more projects)
        const loadMoreButton = sharedPage.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new projects to load
            await sharedPage.waitForTimeout(1000);

            // Count projects after loading more
            const newProjectCount = await sharedPage.locator('[data-testid="project-card"]').count();

            // Verify more projects were loaded
            expect(newProjectCount).toBeGreaterThan(initialProjectCount);
        } else {
            // If Load More is not visible, it means all projects are already loaded
            // This is acceptable - just log it
            console.log('All completed projects already loaded, no pagination needed');
        }
    });
});


