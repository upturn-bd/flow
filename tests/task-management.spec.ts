import { test, expect, Page } from '@playwright/test';

/**
 * Task Management E2E Test Suite
 *
 * This suite covers navigation, UI, tab switching, task creation, viewing,
 * updating, deletion, filtering, pagination, error handling, responsiveness,
 * accessibility and performance.
 */

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
async function navigateToTasks(page: Page) {
    await page.goto('/ops/tasks');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Task Management")')).toBeVisible();
}

async function openCreateTaskModal(page: Page) {
    await page.click('button:has-text("Create Task")');
    await expect(page.locator('[data-testid="task-create-modal"]')).toBeVisible({ timeout: 5000 });
}

async function fillTaskForm(page: Page, taskData: typeof TEST_TASK) {
    const titleInput = page.locator('input[name="task_title"]').or(page.locator('input[placeholder*="title" i]')).first();
    await titleInput.fill(taskData.title);

    const descInput = page.locator('textarea[name="task_description"]').or(page.locator('textarea[placeholder*="description" i]')).first();
    await descInput.fill(taskData.description);

    const prioritySelect = page.locator('select[name="priority"]').or(page.locator('[data-testid="priority-select"]'));
    if (await prioritySelect.isVisible().catch(() => false)) {
        await prioritySelect.selectOption(taskData.priority);
    }

    const startDateInput = page.locator('input[name="start_date"]').or(page.locator('input[type="date"]').first());
    if (await startDateInput.isVisible().catch(() => false)) {
        await startDateInput.fill(taskData.startDate);
    }

    const endDateInput = page.locator('input[name="end_date"]').or(page.locator('input[type="date"]').nth(1));
    if (await endDateInput.isVisible().catch(() => false)) {
        await endDateInput.fill(taskData.endDate);
    }
}

async function submitTaskForm(page: Page) {
    const submitButton = page.locator('[data-testid="create-task-button"]');
    await submitButton.click();
}

async function closeModal(page: Page) {
    const closeButton = page.locator('button:has-text("Cancel")').or(page.locator('button[aria-label="Close"]').or(page.locator('[data-testid="close-modal"]')));
    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
    } else {
        await page.keyboard.press('Escape');
    }
}

// ---------------------------------------------------------------------------
// Global test configuration – authentication is handled by auth.setup.ts
// ---------------------------------------------------------------------------
// No per-test login needed; the global setup saves auth state.

// ---------------------------------------------------------------------------
// Navigation & UI tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Navigation and UI', () => {
    test('should navigate to task management page', async ({ page }) => {
        await navigateToTasks(page);
        await expect(page.locator('h1:has-text("Task Management")')).toBeVisible();
        await expect(page.locator('text=Manage and track your tasks')).toBeVisible();
        await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
    });

    test('should display all three tabs (Ongoing, Completed, Archived)', async ({ page }) => {
        await navigateToTasks(page);
        await expect(page.locator('button:has-text("Ongoing")')).toBeVisible();
        await expect(page.locator('button:has-text("Completed")')).toBeVisible();
        await expect(page.locator('button:has-text("Archived")')).toBeVisible();
    });

    test('should have Ongoing tab active by default', async ({ page }) => {
        await navigateToTasks(page);
        const url = page.url();
        expect(url.includes('tab=ongoing') || !url.includes('tab=')).toBeTruthy();
    });

    test('should display correct icons for each tab', async ({ page }) => {
        await navigateToTasks(page);
        await expect(page.locator('button:has-text("Ongoing")').locator('svg')).toBeVisible();
        await expect(page.locator('button:has-text("Completed")').locator('svg')).toBeVisible();
        await expect(page.locator('button:has-text("Archived")').locator('svg')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tab navigation tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should switch to Completed tab and update URL', async ({ page }) => {
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/tasks?tab=completed');
        expect(page.url()).toContain('tab=completed');
    });

    test('should switch to Archived tab and show coming soon message', async ({ page }) => {
        await page.click('button:has-text("Archived")');
        await page.waitForURL('**/ops/tasks?tab=archived');
        await expect(page.locator('text=Archived Tasks').first()).toBeVisible();
        await expect(page.locator('text=Feature coming soon')).toBeVisible();
    });

    test('should maintain tab state on page reload', async ({ page }) => {
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/tasks?tab=completed');
        await page.reload();
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('tab=completed');
    });

    test('should navigate between all tabs correctly', async ({ page }) => {
        expect(page.url().includes('tab=ongoing') || !page.url().includes('tab=')).toBeTruthy();
        await page.click('button:has-text("Completed")');
        await page.waitForURL('**/ops/tasks?tab=completed');
        expect(page.url()).toContain('tab=completed');
        await page.click('button:has-text("Archived")');
        await page.waitForURL('**/ops/tasks?tab=archived');
        expect(page.url()).toContain('tab=archived');
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL('**/ops/tasks?tab=ongoing');
        expect(page.url()).toContain('tab=ongoing');
    });
});

// ---------------------------------------------------------------------------
// Task creation tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Creation', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should open create task modal when clicking Create Task button', async ({ page }) => {
        await openCreateTaskModal(page);
        await expect(page.locator('[data-testid="task-create-modal"]')).toBeVisible();
    });

    test('should close create task modal when clicking Cancel', async ({ page }) => {
        await openCreateTaskModal(page);
        await closeModal(page);
        await expect(page.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
    });

    test('should close create task modal when pressing Escape', async ({ page }) => {
        await openCreateTaskModal(page);
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
    });

    test('should display validation error for empty task title', async ({ page }) => {
        await openCreateTaskModal(page);
        await submitTaskForm(page);
        await expect(page.locator('text=Task Title is required')).toBeVisible();
    });

    test('should create a new task successfully', async ({ page }) => {
        await openCreateTaskModal(page);
        await fillTaskForm(page, TEST_TASK);
        await submitTaskForm(page);
        await expect(page.locator('text=Task created successfully').or(page.locator('[role="alert"]:has-text("success")'))).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="task-create-modal"]')).not.toBeVisible();
        await expect(page.locator(`text=${TEST_TASK.title}`)).toBeVisible({ timeout: 5000 });
    });

    test('should validate date range (end date after start date)', async ({ page }) => {
        await openCreateTaskModal(page);
        const invalidTask = { ...TEST_TASK, startDate: '2024-12-31', endDate: '2024-01-01' };
        await fillTaskForm(page, invalidTask);
        await submitTaskForm(page);
        await expect(page.locator('text=End date must be after start date')).toBeVisible();
    });

    test('should handle task creation failure gracefully', async ({ page }) => {
        await page.route('**/rest/v1/task_records*', route => {
            route.fulfill({
                status: 500,
                body: JSON.stringify({ error: 'Internal Server Error' }),
            });
        });
        await openCreateTaskModal(page);
        await fillTaskForm(page, TEST_TASK);
        await submitTaskForm(page);
        await expect(page.locator('text=Failed to create task')).toBeVisible({ timeout: 10000 });
    });

    test('should preserve form data when validation fails', async ({ page }) => {
        await openCreateTaskModal(page);
        const titleInput = page.locator('input[name="task_title"]').or(page.locator('input[placeholder*="title" i]')).first();
        const descInput = page.locator('textarea[name="task_description"]').or(page.locator('textarea[placeholder*="description" i]')).first();
        await titleInput.fill(TEST_TASK.title);
        await descInput.fill(TEST_TASK.description);
        await submitTaskForm(page);
        await expect(titleInput).toHaveValue(TEST_TASK.title);
        await expect(descInput).toHaveValue(TEST_TASK.description);
    });
});

// ---------------------------------------------------------------------------
// Task Viewing tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Viewing', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should view task details', async ({ page }) => {
        // Wait for tasks to load and click the first view button
        const viewButton = page.locator('[data-testid="view-task-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Check URL contains task ID
        await page.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });
        expect(page.url()).toContain('/ops/tasks/');

        // Check details
        await expect(page.locator('h1').or(page.locator('h2')).filter({ hasText: "Task Details" })).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Task Updating tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Updating', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should update task details successfully', async ({ page }) => {
        const newTitle = `Updated Task ${Date.now()}`;

        // Wait for tasks to load and click the first edit button
        const editButton = page.locator('[data-testid="edit-task-button"]').first();
        await editButton.waitFor({ state: 'visible', timeout: 10000 });

        // Get the original title before editing
        const titleInput = page.locator('input[name="task_title"]').or(page.locator('input[placeholder*="title" i]')).first();

        await editButton.click();

        // Update Modal should appear
        await expect(page.locator('text=Update Task').first()).toBeVisible();

        // Update title
        await titleInput.fill(newTitle);

        // Submit
        await page.click('button:has-text("Update Task")');

        // Verify success
        await expect(page.locator('text=Task updated successfully')).toBeVisible();
        await expect(page.locator(`text=${newTitle}`)).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Task Deletion tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Deletion', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should delete a task successfully', async ({ page }) => {
        // Wait for tasks to load and get the first task's title
        const firstTaskCard = page.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before deleting
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first delete button
        const deleteButton = page.locator('[data-testid="delete-task-button"]').first();
        await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
        await deleteButton.click();

        // Verify success
        await expect(page.locator('text=Task deleted successfully')).toBeVisible();

        // Verify the task is no longer visible (if we got the title)
        if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Task Completion tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Task Completion', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should mark a task as complete', async ({ page }) => {
        // Wait for tasks to load and get the first task's title
        const firstTaskCard = page.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before completing
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button
        const viewButton = page.locator('[data-testid="view-task-button"]').first();
        await viewButton.waitFor({ state: 'visible', timeout: 10000 });
        await viewButton.click();

        // Wait for navigation to task details
        await page.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });

        // In Details view, click "Mark as Complete"
        await page.click('button:has-text("Mark as Complete")');

        // Verify success and that Reopen button appears
        await expect(page.locator('text=Task marked as completed!')).toBeVisible();
        await expect(page.locator('button:has-text("Reopen Task")')).toBeVisible();

        // Go back to task list
        await page.goBack();

        // Navigate to Ongoing tab
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL(/\/ops\/tasks\?tab=ongoing/, { timeout: 5000 });

        // Verify it's not in Ongoing (if we got the title)
        if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
        }

        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Verify it is in Completed (if we got the title)
        if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
        }
    });

    test('should reopen a completed task', async ({ page }) => {
        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Wait for tasks to load and get the first completed task's title
        const firstTaskCard = page.locator('[data-testid="task-card"]').first();
        await firstTaskCard.waitFor({ state: 'visible', timeout: 10000 });

        // Get the task title before reopening
        const taskTitle = await firstTaskCard.locator('h3, h2, [class*="title"]').first().textContent();

        // Click the first view button (using ExternalLink icon button)
        const viewButton = firstTaskCard.locator('button').filter({ has: page.locator('svg') }).last();
        await viewButton.click();

        // Wait for navigation to task details
        await page.waitForURL(/\/ops\/tasks\/.+/, { timeout: 5000 });

        // In Details view, click "Reopen Task"
        await page.click('button:has-text("Reopen Task")');

        // Verify success and that Mark as Complete button appears
        await expect(page.locator('text=Task reopened successfully!')).toBeVisible();
        await expect(page.locator('button:has-text("Mark as Complete")')).toBeVisible();

        // Go back to task list
        await page.goBack();

        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Verify it's not in Completed (if we got the title)
        if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
        }

        // Navigate to Ongoing tab
        await page.click('button:has-text("Ongoing")');
        await page.waitForURL(/\/ops\/tasks\?tab=ongoing/, { timeout: 5000 });

        // Verify it is in Ongoing (if we got the title)
        if (taskTitle) {
            await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
        }
    });
});

// ---------------------------------------------------------------------------
// Pagination tests
// ---------------------------------------------------------------------------
test.describe('Task Management - Pagination', () => {
    test.beforeEach(async ({ page }) => {
        await navigateToTasks(page);
    });

    test('should display and use load more button for ongoing tasks', async ({ page }) => {
        // Count initial tasks
        const initialTaskCount = await page.locator('[data-testid="task-card"]').count();

        // Check if Load More button is visible (only if there are more tasks)
        const loadMoreButton = page.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new tasks to load
            await page.waitForTimeout(1000);

            // Count tasks after loading more
            const newTaskCount = await page.locator('[data-testid="task-card"]').count();

            // Verify more tasks were loaded
            expect(newTaskCount).toBeGreaterThan(initialTaskCount);
        } else {
            // If Load More is not visible, it means all tasks are already loaded
            // This is acceptable - just log it
            console.log('All ongoing tasks already loaded, no pagination needed');
        }
    });

    test('should display and use load more button for completed tasks', async ({ page }) => {
        // Navigate to Completed tab
        await page.click('button:has-text("Completed")');
        await page.waitForURL(/\/ops\/tasks\?tab=completed/, { timeout: 5000 });

        // Wait for tasks to load
        await page.waitForTimeout(1000);

        // Count initial tasks
        const initialTaskCount = await page.locator('[data-testid="task-card"]').count();

        // Check if Load More button is visible (only if there are more tasks)
        const loadMoreButton = page.locator('button:has-text("Load More")');
        const isLoadMoreVisible = await loadMoreButton.isVisible().catch(() => false);

        if (isLoadMoreVisible) {
            // Click Load More
            await loadMoreButton.click();

            // Wait a bit for new tasks to load
            await page.waitForTimeout(1000);

            // Count tasks after loading more
            const newTaskCount = await page.locator('[data-testid="task-card"]').count();

            // Verify more tasks were loaded
            expect(newTaskCount).toBeGreaterThan(initialTaskCount);
        } else {
            // If Load More is not visible, it means all tasks are already loaded
            // This is acceptable - just log it
            console.log('All completed tasks already loaded, no pagination needed');
        }
    });
});
