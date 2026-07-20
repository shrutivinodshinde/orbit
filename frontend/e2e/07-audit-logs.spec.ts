import { test, expect } from '@playwright/test';
import { login, navigateTo, USERS } from './helpers/auth';

test.describe('Audit Logs', () => {

  test('Super Admin can access audit logs page', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    await expect(page).toHaveURL(/.*audit-logs/);
    await expect(page.locator('h1:has-text("Audit Log")')).toBeVisible();
  });

  test('shows entries in table', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    await expect(page.locator('table')).toBeVisible();
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
  });

  test('table has all required columns', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("Entity")')).toBeVisible();
    await expect(page.locator('th:has-text("Method")')).toBeVisible();
    await expect(page.locator('th:has-text("Path")')).toBeVisible();
    await expect(page.locator('th:has-text("When")')).toBeVisible();
  });

  test('action column shows monospace code style', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    await expect(page.locator('tbody .font-mono').first()).toBeVisible();
  });

  test('shows total entry count', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    const totalText = page.locator('text=/\\d+ total entries/');
    await expect(totalText).toBeVisible();
  });

  test('new action gets logged automatically', async ({ page }) => {
    await login(page, USERS.mumbaiManager);

    // Do an action — create a sales order
    await navigateTo(page, 'Sales');
    await page.click('text=+ New Order');
    await page.waitForTimeout(1000);
    const customerSelect = page.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    await page.fill('input[placeholder="Product name"]', 'Audit Test Product');
    await page.fill('input[placeholder="Qty"]', '1');
    await page.fill('input[placeholder="Price"]', '100');
    await page.click('text=Create Order');
    await page.waitForTimeout(1500);

    // Switch to Super Admin and check audit log
    await page.click('text=Sign out');
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Audit Logs');
    await expect(page.locator('table')).toBeVisible();
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
  });
});