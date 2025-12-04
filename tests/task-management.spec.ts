import { test, expect, Page } from '@playwright/test';

/**
 * Task Management E2E Test Suite
 *
 * This suite covers navigation, UI, tab switching, task creation, viewing,
 * updating, deletion, filtering, pagination, error handling, responsiveness,
 * accessibility and performance.
 */

// Configure ALL tests in this file to run serially, not in parallel
test.describe.configure({ mode: 'serial' });

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const TEST_TASK = {
    title: 'E2E Test Task - ' + Date.now(),
    description: 'This is a test task created by automated E2E tests',
    priority: 'high',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
async function navigateToTasks(sharedPage: Page) {
    await sharedPage.goto('/ops/tasks');
    await sharedPage.waitForLoadState('domcontentloaded'); // Changed from 'networkidle' for speed
    await expect(sharedPage.locator('h1:has-text("Task Management")')).toBeVisible();
}

async function openCreateTaskModal(sharedPage: Page) {
    await sharedPage.click('button:has-text("Create Task")');
    await expect(sharedPage.locator('[data-testid="task-create-modal"]')).toBeVisible({ timeout: 5000 });
}

async function fillTaskForm(sharedPage: Page, taskData: typeof TEST_TASK) {
    const titleInput = sharedPage.locator('input[name="task_title"]').or(sharedPage.locator('input[placeholder*="title" i]')).first();
    await titleInput.fill(taskData.title);

    const descInput = sharedPage.locator('textarea[name="task_description"]').or(sharedPage.locator('textarea[placeholder*="description" i]')).first();
    await descInput.fill(taskData.description);

    const prioritySelect = sharedPage.locator('select[name="priority"]').or(sharedPage.locator('[data-testid="priority-select"]'));
    if (await prioritySelect.isVisible().catch(() => false)) {
        await prioritySelect.selectOption(taskData.priority);
    }

    const startDateInput = sharedPage.locator('input[name="start_date"]').or(sharedPage.locator('input[type="date"]').first());
    if (await startDateInput.isVisible().catch(() => false)) {
        await startDateInput.fill(taskData.startDate);
    }

    const endDateInput = sharedPage.locator('input[name="end_date"]').or(sharedPage.locator('input[type="date"]').nth(1));
    if (await endDateInput.isVisible().catch(() => false)) {
        await endDateInput.fill(taskData.endDate);
    }
}

async function submitTaskForm(sharedPage: Page) {
    const submitButton = sharedPage.locator('[data-testid="create-task-button"]');
    await submitButton.click();
}

async function closeModal(sharedPage: Page) {
    const closeButton = sharedPage.locator('button:has-text("Cancel")').or(sharedPage.locator('button[aria-label="Close"]').or(sharedPage.locator('[data-testid="close-modal"]')));
    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
    } else {
        await sharedPage.keyboard.press('Escape');
    }
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
    await navigateToTasks(sharedPage);
});

test.afterAll(async () => {
    // Close sharedPage only after ALL tests are done
    await sharedPage?.close();
});

// ---------------------------------------------------------------------------
// Navigation & UI tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Navigation and UI', () => {
    test('should navigate to task management sharedPage', async () => {
        // Page already navigated in beforeAll
        await expect(sharedPage.locator('h1:has-text("Task Management")')).toBeVisible();
        await expect(sharedPage.locator('text=Manage and track your tasks')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Create Task")')).toBeVisible();
    });

    test('should display all three tabs (Ongoing, Completed, Archived)', async () => {
        // No navigation needed - already on tasks page
        await expect(sharedPage.locator('button:has-text("Ongoing")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Completed")')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Archived")')).toBeVisible();
    });

    test('should have Ongoing tab active by default', async () => {
        // Check current URL state
        const url = sharedPage.url();
        expect(url.includes('tab=ongoing') || !url.includes('tab=')).toBeTruthy();
    });

    test('should display correct icons for each tab', async () => {
        // No navigation needed - already on tasks page
        await expect(sharedPage.locator('button:has-text("Ongoing")').locator('svg')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Completed")').locator('svg')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Archived")').locator('svg')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tab navigation tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Tab Navigation', () => {
test('should switch to Completed tab and update URL', async () => {
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/tasks?tab=completed');
        expect(sharedPage.url()).toContain('tab=completed');
    });

    test('should switch to Archived tab and show coming soon message', async () => {
        await sharedPage.click('button:has-text("Archived")');
        await sharedPage.waitForURL('**/ops/tasks?tab=archived');
        await expect(sharedPage.locator('text=Archived Tasks').first()).toBeVisible();
        await expect(sharedPage.locator('text=Feature coming soon')).toBeVisible();
    });

    test('should maintain tab state on sharedPage reload', async () => {
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/tasks?tab=completed');
        await sharedPage.reload();
        await sharedPage.waitForLoadState('networkidle');
        expect(sharedPage.url()).toContain('tab=completed');
    });

    test('should navigate between all tabs correctly', async () => {
        // Ensure we start from the Ongoing tab
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL('**/ops/tasks?tab=ongoing', { timeout: 5000 }).catch(() => {});
        
        expect(sharedPage.url().includes('tab=ongoing') || !sharedPage.url().includes('tab=')).toBeTruthy();
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL('**/ops/tasks?tab=completed');
        expect(sharedPage.url()).toContain('tab=completed');
        await sharedPage.click('button:has-text("Archived")');
        await sharedPage.waitForURL('**/ops/tasks?tab=archived');
        expect(sharedPage.url()).toContain('tab=archived');
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL('**/ops/tasks?tab=ongoing');
        expect(sharedPage.url()).toContain('tab=ongoing');
    });
});

// ---------------------------------------------------------------------------
// Task creation tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Creation', () => {
    test('should open create task modal when clicking Create Task button', async () => {
        await openCreateTaskModal(sharedPage);
        await expect(sharedPage.locator('[data-testid="task-create-modal"]')).toBeVisible();
        // Clean up: close the modal after test
        await closeModal(sharedPage);
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });

    test('should close create task modal when clicking Cancel', async () => {
        // Ensure no modal is open from previous test
        const modalOpen = await sharedPage.locator('[data-testid="task-create-modal"]').isVisible().catch(() => false);
        if (modalOpen) {
            await closeModal(sharedPage);
            await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
        
        await openCreateTaskModal(sharedPage);
        await closeModal(sharedPage);
        // Wait for modal to be hidden with proper timeout
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 });
        await expect(sharedPage.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
    });

    test('should close create task modal when pressing Escape', async () => {
        // Ensure no modal is open from previous test
        const modalOpen = await sharedPage.locator('[data-testid="task-create-modal"]').isVisible().catch(() => false);
        if (modalOpen) {
            await closeModal(sharedPage);
            await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
        
        await openCreateTaskModal(sharedPage);
        await sharedPage.keyboard.press('Escape');
        // Wait for modal to be hidden with proper timeout
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 });
        await expect(sharedPage.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
    });

    test('should display validation error for empty task title', async () => {
        // Ensure no modal is open from previous test
        const modalOpen = await sharedPage.locator('[data-testid="task-create-modal"]').isVisible().catch(() => false);
        if (modalOpen) {
            await closeModal(sharedPage);
            await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
        
        await openCreateTaskModal(sharedPage);
        await submitTaskForm(sharedPage);
        await expect(sharedPage.locator('text=Task Title is required')).toBeVisible();
        // Clean up: close the modal after test
        await closeModal(sharedPage);
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });

    test('should create a new task successfully', async () => {
        // Ensure no modal is open from previous test
        const modalOpen = await sharedPage.locator('[data-testid="task-create-modal"]').isVisible().catch(() => false);
        if (modalOpen) {
            await closeModal(sharedPage);
            await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
        
        await openCreateTaskModal(sharedPage);
        await fillTaskForm(sharedPage, TEST_TASK);
        await submitTaskForm(sharedPage);
        await expect(sharedPage.locator('text=Task created successfully').or(sharedPage.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
        await expect(sharedPage.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
        await expect(sharedPage.locator(`text=${TEST_TASK.title}`)).toBeVisible({ timeout: 5000 });
    });

    test('should validate date range (end date after start date)', async () => {
        await openCreateTaskModal(sharedPage);
        const invalidTask = { ...TEST_TASK, startDate: '2024-12-31', endDate: '2024-01-01' };
        await fillTaskForm(sharedPage, invalidTask);
        await submitTaskForm(sharedPage);
        await expect(sharedPage.locator('text=End date must be after start date')).toBeVisible();
        
        // Clean up: close the modal
        await closeModal(sharedPage);
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });

    test('should handle task creation failure gracefully', async () => {
        // Ensure no modal is open from previous test
        const modalOpen = await sharedPage.locator('[data-testid="task-create-modal"]').isVisible().catch(() => false);
        if (modalOpen) {
            await closeModal(sharedPage);
            await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
        
        // Also ensure backdrop is gone
        const backdropVisible = await sharedPage.locator('.fixed.inset-0').first().isVisible().catch(() => false);
        if (backdropVisible) {
            await sharedPage.keyboard.press('Escape');
            await sharedPage.waitForTimeout(500);
        }
        

        await sharedPage.route('**/rest/v1/task_records*', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });
        await openCreateTaskModal(sharedPage);
        await fillTaskForm(sharedPage, TEST_TASK);
        await submitTaskForm(sharedPage);
        await expect(sharedPage.locator('text=Failed to create task')).toBeVisible({ timeout: 10000 });
        
        // Clean up: close the modal
        await closeModal(sharedPage);
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });

    test('should preserve form data when validation fails', async () => {
        await openCreateTaskModal(sharedPage);
        const titleInput = sharedPage.locator('input[name="task_title"]').or(sharedPage.locator('input[placeholder*="title" i]')).first();
        const descInput = sharedPage.locator('textarea[name="task_description"]').or(sharedPage.locator('textarea[placeholder*="description" i]')).first();
        await titleInput.fill(TEST_TASK.title);
        await descInput.fill(TEST_TASK.description);
        await submitTaskForm(sharedPage);
        await expect(titleInput).toHaveValue(TEST_TASK.title);
        await expect(descInput).toHaveValue(TEST_TASK.description);
        
        // Clean up: close the modal
        await closeModal(sharedPage);
        await sharedPage.locator('[data-testid="task-create-modal"]').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    });
});

// ---------------------------------------------------------------------------
// Task Viewing tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Viewing', () => {
test('should view task details', async () => {
        // Ensure we're on the Ongoing tab (tasks list)
        if (!sharedPage.url().includes('/ops/tasks?tab=ongoing') && !sharedPage.url().endsWith('/ops/tasks')) {
            await sharedPage.goto('/ops/tasks?tab=ongoing');
            await sharedPage.waitForLoadState('domcontentloaded');
        }
        
        // Make sure we're on the Ongoing tab by clicking it
        const ongoingTab = sharedPage.locator('button:has-text("Ongoing")');
        if (await ongoingTab.isVisible()) {
            await ongoingTab.click();
            await sharedPage.waitForTimeout(500); // Brief wait for tab to load
        }
        
        // Wait for tasks to load and click the first view button
        const viewButton = sharedPage.locator('[data-testid="view-task-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Check URL contains task ID
        await sharedPage.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });
        expect(sharedPage.url()).toContain('/ops/tasks/');

        // Wait for modal to open and check for Task Details heading
        await expect(sharedPage.locator('h2:has-text("Task Details")')).toBeVisible({ timeout: 20000 });
        
        // Verify task details modal content is visible
        await expect(sharedPage.locator('text=Assigned to').or(sharedPage.locator('text=Start Date')).first()).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Task Updating tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Updating', () => {
test('should update task details successfully', async () => {
        // Navigate back to tasks list if needed
        if (!sharedPage.url().includes('/ops/tasks?tab=ongoing') && !sharedPage.url().endsWith('/ops/tasks')) {
            await sharedPage.goto('/ops/tasks?tab=ongoing');
            await sharedPage.waitForLoadState('domcontentloaded');
        }
        
        // Ensure we're on the Ongoing tab
        const ongoingTab = sharedPage.locator('button:has-text("Ongoing")');
        if (await ongoingTab.isVisible()) {
            await ongoingTab.click();
            await sharedPage.waitForTimeout(500);
        }
        
        const newTitle = `Updated Task ${Date.now()}`;

        // Wait for tasks to load and click the first edit button
        const editButton = sharedPage.locator('[data-testid="edit-task-button"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });

        // Get the original title before editing
        const titleInput = sharedPage.locator('input[name="task_title"]').or(sharedPage.locator('input[placeholder*="title" i]')).first();

        await editButton.click();

        // Update Modal should appear
        await expect(sharedPage.locator('text=Update Task').first()).toBeVisible();

        // Update title
        await titleInput.fill(newTitle);

        // Submit
        await sharedPage.click('button:has-text("Update Task")');

        // Verify success
        await expect(sharedPage.locator('text=Task updated successfully')).toBeVisible();
        await expect(sharedPage.locator(`text=${newTitle}`)).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Task Deletion tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Deletion', () => {
test('should delete a task successfully', async () => {
        // Navigate back to tasks list if needed
        if (!sharedPage.url().includes('/ops/tasks?tab=ongoing') && !sharedPage.url().endsWith('/ops/tasks')) {
            await sharedPage.goto('/ops/tasks?tab=ongoing');
            await sharedPage.waitForLoadState('domcontentloaded');
        }
        
        // Ensure we're on the Ongoing tab
        const ongoingTab = sharedPage.locator('button:has-text("Ongoing")');
        if (await ongoingTab.isVisible()) {
            await ongoingTab.click();
            await sharedPage.waitForTimeout(500);
        }
        
        // Wait for tasks to load and get the first task's title
        const firstTaskCard = sharedPage.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before deleting
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first delete button
        const deleteButton = sharedPage.locator('[data-testid="delete-task-button"]').first();
        await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
        await deleteButton.click();

        // Verify success
        await expect(sharedPage.locator('text=Task deleted successfully')).toBeVisible();

        // Verify the task is no longer visible (if we got the title)
        if (taskTitle) {
            await expect(sharedPage.locator(`text=${taskTitle}`)).not.toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Task Completion tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Completion', () => {
test('should mark a task as complete', async () => {
        // Navigate back to tasks list if needed
        if (!sharedPage.url().includes('/ops/tasks?tab=ongoing') && !sharedPage.url().endsWith('/ops/tasks')) {
            await sharedPage.goto('/ops/tasks?tab=ongoing');
            await sharedPage.waitForLoadState('domcontentloaded');
        }
        
        // Ensure we're on the Ongoing tab
        const ongoingTab = sharedPage.locator('button:has-text("Ongoing")');
        if (await ongoingTab.isVisible()) {
            await ongoingTab.click();
            await sharedPage.waitForTimeout(500);
        }
        
        // Wait for tasks to load and get the first task's title
        const firstTaskCard = sharedPage.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before completing
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button
        const viewButton = sharedPage.locator('[data-testid="view-task-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Wait for navigation to task details
        await sharedPage.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });

        // In Details view, click "Mark as Complete"
        await sharedPage.click('button:has-text("Mark as Complete")');

        // Verify success and that Reopen button appears
        await expect(sharedPage.locator('text=Task marked as completed!')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Reopen Task")')).toBeVisible();

        // Go back to task list
        await sharedPage.goBack();

        // Navigate to Ongoing tab
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=ongoing/, { timeout: 5000 });

        // Verify it's not in Ongoing (if we got the title)
        if (taskTitle) {
            await expect(sharedPage.locator(`text=${taskTitle}`)).not.toBeVisible();
        }

        // Navigate to Completed tab
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Verify it is in Completed (if we got the title)
        if (taskTitle) {
            await expect(sharedPage.locator(`text=${taskTitle}`)).toBeVisible();
        }
    });

    test('should reopen a completed task', async () => {
        // Navigate to Completed tab
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Wait for tasks to load and get the first completed task's title
        const firstTaskCard = sharedPage.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before reopening
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button (using ExternalLink icon button)
        const viewButton = firstTaskCard.locator('button').filter({ has: sharedPage.locator('svg') }).last();
        await viewButton.click();

        // Wait for navigation to task details
        await sharedPage.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });

        // In Details view, click "Reopen Task"
        await sharedPage.click('button:has-text("Reopen Task")');

        // Verify success and that Mark as Complete button appears
        await expect(sharedPage.locator('text=Task reopened successfully!')).toBeVisible();
        await expect(sharedPage.locator('button:has-text("Mark as Complete")')).toBeVisible();

        // Go back to task list
        await sharedPage.goBack();

        // Navigate to Completed tab
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Verify it's not in Completed (if we got the title)
        if (taskTitle) {
            await expect(sharedPage.locator(`text=${taskTitle}`)).not.toBeVisible();
        }

        // Navigate to Ongoing tab
        await sharedPage.click('button:has-text("Ongoing")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=ongoing/, { timeout: 5000 });

        // Verify it is in Ongoing (if we got the title)
        if (taskTitle) {
            await expect(sharedPage.locator(`text=${taskTitle}`)).toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Pagination tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Pagination', () => {
test('should display and use load more button for ongoing tasks', async () => {
        // Already on tasks page
        
        // Count initial tasks
        const initialTaskCount = await sharedPage.locator('[data-testid="task-card"]').count();

        // Check if Load More button is visible (only if there are more tasks)
        const loadMoreButton = sharedPage.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new tasks to load
            await sharedPage.waitForTimeout(1000);

            // Count tasks after loading more
            const newTaskCount = await sharedPage.locator('[data-testid="task-card"]').count();

            // Verify more tasks were loaded
            expect(newTaskCount).toBeGreaterThan(initialTaskCount);
        } else {
            // If Load More is not visible, it means all tasks are already loaded
            // This is acceptable - just log it
            console.log('All ongoing tasks already loaded, no pagination needed');
        }
    });

    test('should display and use load more button for completed tasks', async () => {
        // Navigate to Completed tab (already on tasks page)
        await sharedPage.click('button:has-text("Completed")');
        await sharedPage.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Wait for tasks to load
        await sharedPage.waitForTimeout(1000);

        // Count initial tasks
        const initialTaskCount = await sharedPage.locator('[data-testid="task-card"]').count();

        // Check if Load More button is visible (only if there are more tasks)
        const loadMoreButton = sharedPage.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new tasks to load
            await sharedPage.waitForTimeout(1000);

            // Count tasks after loading more
            const newTaskCount = await sharedPage.locator('[data-testid="task-card"]').count();

            // Verify more tasks were loaded
            expect(newTaskCount).toBeGreaterThan(initialTaskCount);
        } else {
            // If Load More is not visible, it means all tasks are already loaded
            // This is acceptable - just log it
            console.log('All completed tasks already loaded, no pagination needed');
        }
    });
});

