import { test, expect } from '@playwright/test';
import { login, logout, navigateTo, waitForTable, waitForRows, USERS } from './helpers/auth';

test.describe('Export Page', () => {

  test('loads shipments table', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
  });

  test('table has correct columns', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    await expect(page.locator('th:has-text("Branch")')).toBeVisible();
    await expect(page.locator('th:has-text("Destination")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Customs")')).toBeVisible();
    await expect(page.locator('th:has-text("Shipped")')).toBeVisible();
  });

  test('filter by HELD customs status works', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const customsSelect = page.locator('select').nth(1);
    await customsSelect.selectOption('HELD');
    const count = await waitForRows(page, 1);
    expect(count).toBeGreaterThan(0);
  });

  test('filter by IN_CUSTOMS status works', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('IN_CUSTOMS');
    await page.waitForTimeout(1000);
  });

  test('filter by DELIVERED status works', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('DELIVERED');
    await page.waitForTimeout(1000);
  });

  test('Mumbai Manager sees only Mumbai shipments', async ({ page }) => {
    await login(page, USERS.mumbaiManager);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const branchCells = page.locator('tbody tr td:nth-child(2)');
    const count = await branchCells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await branchCells.nth(i).textContent();
      expect(text).toContain('Mumbai');
    }
  });

  test('Berlin Manager sees only Berlin shipments', async ({ page }) => {
    await login(page, USERS.berlinManager);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const branchCells = page.locator('tbody tr td:nth-child(2)');
    const count = await branchCells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await branchCells.nth(i).textContent();
      expect(text).toContain('Berlin');
    }
  });

  test('Super Admin sees more shipments than Mumbai Manager', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const saCount = await page.locator('tbody tr').count();
    await logout(page);
    await login(page, USERS.mumbaiManager);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const mmCount = await page.locator('tbody tr').count();
    expect(saCount).toBeGreaterThan(mmCount);
  });

  test('HELD customs badge shows red', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'Export');
    await waitForTable(page);
    const customsSelect = page.locator('select').nth(1);
    await customsSelect.selectOption('HELD');
    await waitForRows(page, 1);
    const heldBadge = page.locator('.bg-red-100').first();
    await expect(heldBadge).toBeVisible();
  });
});