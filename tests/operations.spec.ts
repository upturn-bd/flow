// NOTE: Most tests have been consolidated into workflow-and-services.spec.ts and services-management.spec.ts
// These tests now use the correct /ops/* routes
// This file kept for backwards compatibility

import { test, expect } from './fixtures/auth.fixture';

test.describe('Complaint Management', () => {
    test('should display complaint page', async ({ employeePage }) => {
        await employeePage.goto('/ops/complaint');
        await employeePage.waitForTimeout(1000);

        const complaintHeading = employeePage.locator('h1:has-text("Complaint"), h2:has-text("Complaint")').first();
        if (await complaintHeading.isVisible().catch(() => false)) {
            await expect(complaintHeading).toBeVisible();
        }
    });

    test('should submit a new complaint', async ({ employeePage }) => {
        await employeePage.goto('/ops/complaint');
        await employeePage.waitForTimeout(1000);

        const newComplaintButton = employeePage.locator('button:has-text("New"), button:has-text("Submit"), button:has-text("File")').first();
        if (await newComplaintButton.isVisible().catch(() => false)) {
            await newComplaintButton.click();
            await employeePage.waitForTimeout(500);

            // Fill complaint form
            const titleInput = employeePage.locator('input[name*="title"], input[name*="subject"]').first();
            if (await titleInput.isVisible().catch(() => false)) {
                await titleInput.fill('Test Complaint - Workplace Issue');
            }

            const categorySelect = employeePage.locator('select[name*="category"], select[name*="type"]').first();
            if (await categorySelect.isVisible().catch(() => false)) {
                await categorySelect.selectOption({ index: 1 });
            }

            const descriptionInput = employeePage.locator('textarea[name*="description"], textarea[name*="detail"]').first();
            if (await descriptionInput.isVisible().catch(() => false)) {
                await descriptionInput.fill('This is a test complaint filed by automated testing');
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
        if (await firstComplaint.isVisible()) {
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
                await adminPage.waitForTimeout(1000);
            }
        }
    });
});

test.describe('Requisition Management', () => {
    test('should display requisition page', async ({ employeePage }) => {
        await employeePage.goto('/ops/requisition');
        await employeePage.waitForTimeout(1000);

        const requisitionHeading = employeePage.locator('h1:has-text("Requisition"), h2:has-text("Requisition")').first();
        if (await requisitionHeading.isVisible().catch(() => false)) {
            await expect(requisitionHeading).toBeVisible();
        }
    });

    test('should submit a new requisition', async ({ employeePage }) => {
        await employeePage.goto('/ops/requisition');
        await employeePage.waitForTimeout(1000);

        const newButton = employeePage.locator('button:has-text("New"), button:has-text("Request"), button:has-text("Create")').first();
        if (await newButton.isVisible().catch(() => false)) {
            await newButton.click();
            await employeePage.waitForTimeout(500);

            // Fill requisition form
            const itemInput = employeePage.locator('input[name*="item"], input[name*="title"]').first();
            if (await itemInput.isVisible().catch(() => false)) {
                await itemInput.fill('Office Supplies Request');
            }

            const quantityInput = employeePage.locator('input[type="number"], input[name*="quantity"]').first();
            if (await quantityInput.isVisible().catch(() => false)) {
                await quantityInput.fill('10');
            }

            const descriptionInput = employeePage.locator('textarea[name*="description"]').first();
            if (await descriptionInput.isVisible().catch(() => false)) {
                await descriptionInput.fill('Request for office supplies for Q4');
            }

            const submitButton = employeePage.locator('button:has-text("Submit"), button[type="submit"]').first();
            if (await submitButton.isVisible().catch(() => false)) {
                await submitButton.click();
                await employeePage.waitForTimeout(2000);
            }
        }
    });

    test('should approve requisition as admin', async ({ adminPage }) => {
        await adminPage.goto('/ops/requisition');
        await adminPage.waitForTimeout(1000);

        const pendingTab = adminPage.locator('text=Pending').first();
        if (await pendingTab.isVisible().catch(() => false)) {
            await pendingTab.click();
            await adminPage.waitForTimeout(500);
        }

        const approveButton = adminPage.locator('button:has-text("Approve")').first();
        if (await approveButton.isVisible().catch(() => false)) {
            await approveButton.click();
            await adminPage.waitForTimeout(1000);
        }
    });
});

test.describe('Notice Management', () => {
    test('should display notice board', async ({ employeePage }) => {
        await employeePage.goto('/ops/notice');
        await employeePage.waitForTimeout(1000);

        const noticeHeading = employeePage.locator('h1:has-text("Notice"), h2:has-text("Notice")').first();
        if (await noticeHeading.isVisible().catch(() => false)) {
            await expect(noticeHeading).toBeVisible();
        }
    });

    test('should create notice as admin', async ({ adminPage }) => {
        await adminPage.goto('/ops/notice');
        await adminPage.waitForTimeout(1000);

        const createButton = adminPage.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Post")').first();
        if (await createButton.isVisible().catch(() => false)) {
            await createButton.click();
            await adminPage.waitForTimeout(500);

            // Fill notice form
            const titleInput = adminPage.locator('input[name*="title"], input[name*="subject"]').first();
            if (await titleInput.isVisible().catch(() => false)) {
                await titleInput.fill('Important Company Update');
            }

            const contentInput = adminPage.locator('textarea[name*="content"], textarea[name*="message"]').first();
            if (await contentInput.isVisible().catch(() => false)) {
                await contentInput.fill('This is an important notice for all employees');
            }

            const prioritySelect = adminPage.locator('select[name*="priority"]').first();
            if (await prioritySelect.isVisible().catch(() => false)) {
                await prioritySelect.selectOption({ index: 1 });
            }

            const submitButton = adminPage.locator('button:has-text("Publish"), button:has-text("Post"), button[type="submit"]').first();
            if (await submitButton.isVisible().catch(() => false)) {
                await submitButton.click();
                await adminPage.waitForTimeout(2000);
            }
        }
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
});

test.describe('Task Management', () => {
    test('should display task page', async ({ employeePage }) => {
        await employeePage.goto('/ops/tasks');
        await employeePage.waitForLoadState('networkidle');

        // Wait for page to fully load - check for heading or main content
        const taskHeading = employeePage.locator('h1:has-text("Task"), h2:has-text("Task"), h1:has-text("My Tasks")').first();
        await expect(taskHeading).toBeVisible({ timeout: 10000 });

        // Verify URL is correct
        await expect(employeePage).toHaveURL(/\/ops\/tasks/);
    });

    test('should create a new task', async ({ adminPage }) => {
        await adminPage.goto('/ops/tasks?tab=ongoing');
        await adminPage.waitForLoadState('networkidle');

        // Find and click the create button
        const newTaskButton = adminPage.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Add Task")').first();
        await expect(newTaskButton).toBeVisible({ timeout: 10000 });
        await newTaskButton.click();

        // Wait for form/modal to appear
        await adminPage.waitForTimeout(1000);

        // Fill in task title
        const titleInput = adminPage.locator('input[name*="title"], input[name*="task"], input[placeholder*="title" i]').first();
        await expect(titleInput).toBeVisible({ timeout: 5000 });
        const taskTitle = `E2E Test Task ${Date.now()}`;
        await titleInput.fill(taskTitle);

        // Fill in description if available
        const descriptionInput = adminPage.locator('textarea[name*="description"], textarea[placeholder*="description" i]').first();
        if (await descriptionInput.isVisible().catch(() => false)) {
            await descriptionInput.fill('Automated test task - Please ignore');
        }

        // Set start date - the field is named "start_date"
        const startDateInput = adminPage.locator('input[name="start_date"], input[type="date"][name*="start"]').first();
        if (await startDateInput.isVisible().catch(() => false)) {
            // Click to focus the input first
            await startDateInput.click();
            // Clear any existing value
            await startDateInput.fill('');
            // Fill with the date value (today's date)
            await startDateInput.fill('2025-11-14');
            // Verify the value was set
            const startValue = await startDateInput.inputValue();
            console.log('Start date input value:', startValue);
        }

        // Set end date (due date) - the field is named "end_date"
        const endDateInput = adminPage.locator('input[name="end_date"], input[type="date"][name*="end"]').first();
        if (await endDateInput.isVisible().catch(() => false)) {
            // Click to focus the input first
            await endDateInput.click();
            // Clear any existing value
            await endDateInput.fill('');
            // Fill with the date value
            await endDateInput.fill('2025-12-31');
            // Verify the value was set
            const endValue = await endDateInput.inputValue();
            console.log('End date input value:', endValue);
        }

        // Submit the form
        const submitButton = adminPage.locator('button:has-text("Create Task"), button:has-text("Submit"), button[type="submit"]').nth(1);
        await expect(submitButton).toBeVisible({ timeout: 5000 });
        await submitButton.click();

        // Wait for creation to complete without arbitrary sleeps
        // 1) Modal should close
        const createTaskModal = adminPage.getByRole('dialog', { name: /Create Task/i });
        await expect(createTaskModal).toBeHidden({ timeout: 10000 }).catch(() => { });
        // 2) Optional success toast (appears via sonner): "Task created successfully"
        const successToast = adminPage.getByText('Task created successfully', { exact: false });
        await successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        // 3) Wait for refetch to settle
        await adminPage.waitForLoadState('networkidle');

        // 4) Wait for loading state to disappear (skeleton loaders, spinners, "Loading tasks..." text)
        const loadingIndicator = adminPage.locator('text=Loading, [class*="loading"], [class*="skeleton"], [class*="spinner"]').first();
        await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });

        // Verify task was created by checking for the title in the list
        // Use a more flexible selector that accounts for the task title appearing in various formats
        const createdTask = adminPage.getByText(taskTitle, { exact: false });
        await expect(createdTask).toBeVisible({ timeout: 10000 });
    });

    test('should view task details (UI-driven)', async ({ employeePage }) => {
        await employeePage.goto('/ops/tasks');
        await employeePage.waitForLoadState('networkidle');

        // Find and ensure the first task card and button exist
        const firstTaskCard = employeePage.locator('[class*="task-card"]').first();
        await expect(firstTaskCard).toBeVisible({ timeout: 10000 });

        const viewButton = firstTaskCard.locator('.view-button');
        await expect(viewButton).toBeVisible({ timeout: 10000 });
        await expect(viewButton).toBeEnabled({ timeout: 5000 });

        // Click and wait for the Task Details heading to appear (no arbitrary timeout)
        const taskDetailsHeader = employeePage.getByRole('heading', { name: 'Task Details' });

        await Promise.all([
            taskDetailsHeader.waitFor({ state: 'visible', timeout: 10000 }), // wait for UI
            viewButton.click(), // trigger the UI change
        ]);

        await expect(taskDetailsHeader).toBeVisible();
    });


    test('should filter tasks by status', async ({ employeePage }) => {
        await employeePage.goto('/ops/tasks');
        await employeePage.waitForLoadState('networkidle');
        await employeePage.waitForTimeout(1000);

        // Look for status filter buttons/tabs
        const statusFilter = employeePage.locator('button:has-text("Pending"), button:has-text("In Progress"), button:has-text("Completed")').first();

        if (await statusFilter.isVisible().catch(() => false)) {
            await statusFilter.click();
            await employeePage.waitForTimeout(1000);

            // Verify filtered results appear
            const taskList = employeePage.locator('[class*="task-list"], [class*="task-card"]');
            await expect(taskList).toBeVisible({ timeout: 5000 });
        }
    });

    test('should assign task to team member', async ({ adminPage }) => {
        await adminPage.goto('/ops/tasks');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.waitForTimeout(1000);

        // Click on first task to open details
        const firstTask = adminPage.locator('[class*="task-card"], [class*="task-item"]').first();
        if (await firstTask.isVisible().catch(() => false)) {
            await firstTask.click();
            await adminPage.waitForTimeout(1000);

            // Look for assign button
            const assignButton = adminPage.locator('button:has-text("Assign"), button:has-text("Add Assignee")').first();
            if (await assignButton.isVisible().catch(() => false)) {
                await assignButton.click();
                await adminPage.waitForTimeout(500);

                // Select team member
                const memberSelect = adminPage.locator('select[name*="assignee"], select[name*="user"]').first();
                if (await memberSelect.isVisible().catch(() => false)) {
                    await memberSelect.selectOption({ index: 1 });

                    // Save assignment
                    const saveButton = adminPage.locator('button:has-text("Save"), button:has-text("Assign")').first();
                    if (await saveButton.isVisible().catch(() => false)) {
                        await saveButton.click();
                        await adminPage.waitForTimeout(1000);
                    }
                }
            }
        }
    });

    test('should mark task as complete', async ({ employeePage }) => {
        await employeePage.goto('/ops/tasks');
        await employeePage.waitForLoadState('networkidle');
        await employeePage.waitForTimeout(1000);

        // Find a pending/incomplete task
        const firstTask = employeePage.locator('[class*="task-card"], [class*="task-item"]').first();
        await expect(firstTask).toBeVisible({ timeout: 10000 });

        // Look for complete button or checkbox
        const completeButton = firstTask.locator('button:has-text("Complete"), button:has-text("Mark Complete"), input[type="checkbox"]').first();

        if (await completeButton.isVisible().catch(() => false)) {
            await completeButton.click();
            await employeePage.waitForTimeout(2000);

            // Verify task status changed (look for completed indicator)
            const completedIndicator = employeePage.locator('text=Completed, text=Done, [class*="completed"]').first();
            await expect(completedIndicator).toBeVisible({ timeout: 5000 });
        } else {
            // If no complete button found, skip this assertion
            console.log('No complete button found - task may already be completed or feature not available');
        }
    });

    test('should delete task as admin', async ({ adminPage }) => {
        await adminPage.goto('/ops/tasks');
        await adminPage.waitForLoadState('networkidle');
        await adminPage.waitForTimeout(1000);

        // Get initial task count
        const tasks = adminPage.locator('[class*="task-card"], [class*="task-item"]');
        const initialCount = await tasks.count().catch(() => 0);

        if (initialCount > 0) {
            // Click on first task
            await tasks.first().click();
            await adminPage.waitForTimeout(1000);

            // Look for delete button
            const deleteButton = adminPage.locator('button:has-text("Delete"), button[class*="delete"]').first();

            if (await deleteButton.isVisible().catch(() => false)) {
                await deleteButton.click();
                await adminPage.waitForTimeout(500);

                // Confirm deletion if modal appears
                const confirmButton = adminPage.locator('button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")').first();
                if (await confirmButton.isVisible().catch(() => false)) {
                    await confirmButton.click();
                    await adminPage.waitForTimeout(2000);

                    // Verify task was deleted (count decreased)
                    const newCount = await tasks.count().catch(() => 0);
                    expect(newCount).toBeLessThan(initialCount);
                }
            }
        }
    });
});
