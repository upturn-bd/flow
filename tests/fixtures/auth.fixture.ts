import { test as base, Page } from '@playwright/test';
import path from 'path';

// Path to stored auth state
const authFile = path.join(__dirname, '../.auth/user.json');

// Test user credentials - Update these with your test data
export const TEST_USERS = {
  admin: {
    email: 'annonymous.sakibulhasan@gmail.com',
    password: 'Test@flow1234',
    role: 'Admin',
    name: 'Admin User'
  },
  manager: {
    email: 'annonymous.sakibulhasan@gmail.com',
    password: 'Test@flow1234',
    role: 'Manager',
    name: 'Manager User'
  },
  employee: {
    email: 'annonymous.sakibulhasan@gmail.com',
    password: 'Test@flow1234',
    role: 'Employee',
    name: 'Employee User'
  }
};

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  managerPage: Page;
  employeePage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Use stored authentication state instead of logging in each time
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  employeePage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});

export { expect } from '@playwright/test';
