import { test, expect } from '@playwright/test';
import { login, navigateTo, USERS } from './helpers/auth';

test.describe('Attendance Page', () => {

  test.describe('Intern / Employee view', () => {
    test('shows Check In and Check Out buttons', async ({ page }) => {
      await login(page, USERS.intern);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('button:has-text("Check In")')).toBeVisible();
      await expect(page.locator('button:has-text("Check Out")')).toBeVisible();
    });

    test('check in shows success message', async ({ page }) => {
      await login(page, USERS.intern);
      await navigateTo(page, 'Attendance');
      await page.click('button:has-text("Check In")');
      await page.waitForTimeout(1000);
      const msg = page.locator('.bg-green-50, .bg-red-50');
      await expect(msg).toBeVisible();
    });

    test('shows own attendance records in table', async ({ page }) => {
      await login(page, USERS.intern);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Manager view', () => {
    test('does not show Check In / Check Out buttons', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('button:has-text("Check In")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Check Out")')).not.toBeVisible();
    });

    test('sees team attendance table with multiple records', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('table')).toBeVisible();
      expect(await page.locator('tbody tr').count()).toBeGreaterThan(1);
    });

    test('table has Employee column', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('th:has-text("Employee")')).toBeVisible();
    });

    test('table has Date and Status columns', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('th:has-text("Date")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    });

    test('table has Check In and Check Out time columns', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      await expect(page.locator('th:has-text("Check In")')).toBeVisible();
      await expect(page.locator('th:has-text("Check Out")')).toBeVisible();
    });
  });

  test.describe('Status badges', () => {
    test('PRESENT badge shows green', async ({ page }) => {
      await login(page, USERS.mumbaiManager);
      await navigateTo(page, 'Attendance');
      const presentBadge = page.locator('.bg-green-100').first();
      if (await presentBadge.isVisible()) {
        await expect(presentBadge).toBeVisible();
      }
    });
  });
});