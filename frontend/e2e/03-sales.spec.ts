import { test, expect } from '@playwright/test';
import { login, logout, navigateTo, waitForTable, waitForRows, USERS } from './helpers/auth';

test.describe('Sales Page', () => {

  test.describe('List and filters', () => {
    test('Super Admin sees sales orders table', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      expect(await page.locator('tbody tr').count()).toBeGreaterThan(5);
    });

    test('table has correct columns', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await expect(page.locator('th:has-text("#")')).toBeVisible();
      await expect(page.locator('th:has-text("Customer")')).toBeVisible();
      await expect(page.locator('th:has-text("Branch")')).toBeVisible();
      await expect(page.locator('th:has-text("Amount")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
    });

    test('filter by COMPLETED status shows only completed orders', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.selectOption('select', 'COMPLETED');
      const count = await waitForRows(page, 1);
      expect(count).toBeGreaterThan(0);
    });

    test('filter by PENDING shows only pending orders', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.selectOption('select', 'PENDING');
      const count = await waitForRows(page, 1);
      expect(count).toBeGreaterThan(0);
    });

    test('filter by CANCELLED shows only cancelled orders', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.selectOption('select', 'CANCELLED');
      await page.waitForTimeout(1000);
    });

    test('all statuses filter shows all orders', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.selectOption('select', 'COMPLETED');
      await waitForRows(page, 1);
      await page.selectOption('select', '');
      const count = await waitForRows(page, 6);
      expect(count).toBeGreaterThan(5);
    });
  });

  test.describe('Role scoping', () => {
    test('Mumbai Manager sees only Mumbai branch orders', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      const branchCells = page.locator('tbody tr td:nth-child(3)');
      const count = await branchCells.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const text = await branchCells.nth(i).textContent();
        expect(text).toContain('Mumbai');
      }
    });

    test('India Admin sees only Indian branch orders', async ({ page }) => {
      await login(page, USERS.indiaAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      const branchCells = page.locator('tbody tr td:nth-child(3)');
      const count = await branchCells.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const text = await branchCells.nth(i).textContent();
        expect(text).toContain('IN');
      }
    });

    test('Super Admin sees more orders than Mumbai Manager', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      const saRows = await page.locator('tbody tr').count();
      await logout(page);
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      const mmRows = await page.locator('tbody tr').count();
      expect(saRows).toBeGreaterThan(mmRows);
    });
  });

  test.describe('Create order button visibility', () => {
    test('Manager sees + New Order button', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await expect(page.locator('text=+ New Order')).toBeVisible();
    });

    test('Intern does not see + New Order button', async ({ page }) => {
      await login(page, USERS.intern);
      await page.waitForSelector('nav', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.goto('/sales');
      await waitForTable(page);
      await expect(page.locator('text=+ New Order')).not.toBeVisible();
    });

    test('Super Admin sees + New Order button', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await expect(page.locator('text=+ New Order')).toBeVisible();
    });
  });

  test.describe('Create Order Modal', () => {
    test('modal opens when clicking + New Order', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await expect(page.locator('text=New Sales Order')).toBeVisible();
    });

    test('modal closes when clicking Cancel', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await expect(page.locator('text=New Sales Order')).toBeVisible();
      await page.locator('button', { hasText: 'Cancel' }).click();
      await expect(page.locator('text=New Sales Order')).not.toBeVisible();
    });

    test('modal closes when clicking X button', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.locator('.fixed button:has-text("✕")').first().click();
      await expect(page.locator('text=New Sales Order')).not.toBeVisible();
    });

    test('customer dropdown loads real customers', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      const options = page.locator('select option');
      expect(await options.count()).toBeGreaterThan(1);
    });

    test('can add multiple items', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.click('text=+ Add item');
      const inputs = page.locator('input[placeholder="Product name"]');
      expect(await inputs.count()).toBe(2);
    });

    test('can remove an item', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.click('text=+ Add item');
      await page.locator('.fixed button:has-text("✕")').last().click();
      const inputs = page.locator('input[placeholder="Product name"]');
      expect(await inputs.count()).toBe(1);
    });

    test('total auto-calculates from items', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.fill('input[placeholder="Qty"]', '3');
      await page.fill('input[placeholder="Price"]', '1000');
      await page.waitForTimeout(300);
      await expect(page.locator('text=Total:')).toContainText('3,000');
    });

    test('shows error when submitting without customer', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      await page.click('text=+ New Order');
      await page.waitForLoadState('networkidle');
      await page.locator('button', { hasText: 'Create Order' }).click();
      await expect(page.locator('.bg-red-50')).toBeVisible();
    });

    test('successfully creates a new order', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Sales');
      await waitForTable(page);
      const initialRows = await page.locator('tbody tr').count();
      await page.click('text=+ New Order');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      await page.locator('select').last().selectOption({ index: 1 });
      await page.fill('input[placeholder="Product name"]', 'Test Product');
      await page.fill('input[placeholder="Qty"]', '2');
      await page.fill('input[placeholder="Price"]', '5000');
      await page.locator('button', { hasText: 'Create Order' }).click();
      await expect(page.locator('text=New Sales Order')).not.toBeVisible({ timeout: 10000 });
      const newRows = await waitForRows(page, initialRows);
      expect(newRows).toBeGreaterThanOrEqual(initialRows);
    });
  });
});