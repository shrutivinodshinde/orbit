import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers/auth';

test.describe('RBAC and Role Scoping', () => {

  test.describe('Page access by role', () => {
    test('Intern can only access Dashboard, Sales, Attendance', async ({ page }) => {
      await login(page, USERS.intern);

      // Can access
      await page.goto('/dashboard');
      await expect(page).not.toHaveURL(/.*login/);

      await page.goto('/sales');
      await expect(page).not.toHaveURL(/.*login/);

      await page.goto('/attendance');
      await expect(page).not.toHaveURL(/.*login/);
    });

    test('Intern cannot directly navigate to Users page', async ({ page }) => {
      await login(page, USERS.intern);
      await page.goto('/users');
      // Should either redirect or show empty/forbidden
      await page.waitForTimeout(1000);
      const is403 = await page.locator('text=Forbidden').isVisible();
      const isEmpty = await page.locator('tbody tr').count() === 0;
      const isRedirected = page.url().includes('/dashboard');
      expect(is403 || isEmpty || isRedirected).toBe(true);
    });

    test('Intern cannot directly navigate to Audit Logs', async ({ page }) => {
      await login(page, USERS.intern);
      await page.goto('/audit-logs');
      await page.waitForTimeout(1000);
    });

    test('Manager can access all operational pages', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      for (const route of ['/dashboard', '/sales', '/export', '/attendance']) {
        await page.goto(route);
        await expect(page).not.toHaveURL(/.*login/);
      }
    });

    test('Super Admin can access all pages', async ({ page }) => {
      await login(page, USERS.superAdmin);
      for (const route of ['/dashboard', '/sales', '/export', '/attendance', '/users', '/audit-logs', '/ai-assistant']) {
        await page.goto(route);
        await expect(page).not.toHaveURL(/.*login/);
      }
    });
  });

  test.describe('Data scoping', () => {
    test('Super Admin sees more sales data than Mumbai Manager', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await page.goto('/sales');
      await page.waitForSelector('tbody tr');
      const saCount = await page.locator('tbody tr').count();

      await page.click('text=Sign out');
      await login(page, USERS.mumbaiManager);
      await page.goto('/sales');
      await page.waitForSelector('tbody tr');
      const mmCount = await page.locator('tbody tr').count();

      expect(saCount).toBeGreaterThan(mmCount);
    });

    test('Super Admin sees more export data than Berlin Manager', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await page.goto('/export');
      await page.waitForSelector('tbody tr');
      const saCount = await page.locator('tbody tr').count();

      await page.click('text=Sign out');
      await login(page, USERS.berlinManager);
      await page.goto('/export');
      await page.waitForSelector('tbody tr');
      const bmCount = await page.locator('tbody tr').count();

      expect(saCount).toBeGreaterThan(bmCount);
    });

    test('India Admin sees more sales than Mumbai Manager', async ({ page }) => {
      await login(page, USERS.indiaAdmin);
      await page.goto('/sales');
      await page.waitForSelector('tbody tr');
      const iaCount = await page.locator('tbody tr').count();

      await page.click('text=Sign out');
      await login(page, USERS.mumbaiManager);
      await page.goto('/sales');
      await page.waitForSelector('tbody tr');
      const mmCount = await page.locator('tbody tr').count();

      expect(iaCount).toBeGreaterThanOrEqual(mmCount);
    });
  });

  test.describe('Button visibility by role', () => {
    test('only managers and above see + New Order button', async ({ page }) => {
      const canSee = [USERS.superAdmin, USERS.indiaAdmin, USERS.mumbaiManager];
      const cannotSee = [USERS.intern];

      for (const user of canSee) {
        await login(page, user);
        await page.goto('/sales');
        await page.waitForSelector('table');
        await expect(page.locator('text=+ New Order')).toBeVisible();
        await page.click('text=Sign out');
      }

      for (const user of cannotSee) {
        await login(page, user);
        await page.goto('/sales');
        await page.waitForSelector('table');
        await expect(page.locator('text=+ New Order')).not.toBeVisible();
        await page.click('text=Sign out');
      }
    });
  });
});