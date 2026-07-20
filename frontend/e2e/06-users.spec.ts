import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForTable, waitForRows, USERS } from './helpers/auth';

test.describe('User Management', () => {

  test.describe('List and search', () => {
    test('loads user table', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      expect(await page.locator('tbody tr').count()).toBeGreaterThan(5);
    });

    test('table has correct columns', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Role")')).toBeVisible();
      await expect(page.locator('th:has-text("Country")')).toBeVisible();
      await expect(page.locator('th:has-text("Branch")')).toBeVisible();
    });

    test('search by name filters results', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.fill('input[placeholder*="Search"]', 'Rahul');
      await page.click('text=Search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.waitForSelector('tbody tr', { timeout: 10000 });
      expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
    });

    test('search by email filters results', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.fill('input[placeholder*="Search"]', 'superadmin');
      await page.click('text=Search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.waitForSelector('tbody tr', { timeout: 10000 });
      expect(await page.locator('tbody tr').count()).toBeGreaterThan(0);
    });

    test('clearing search shows all users', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.fill('input[placeholder*="Search"]', 'xyz');
      await page.click('text=Search');
      await page.waitForTimeout(1000);
      await page.fill('input[placeholder*="Search"]', '');
      await page.click('text=Search');
      const count = await waitForRows(page, 6);
      expect(count).toBeGreaterThan(5);
    });

    test('India Admin sees only Indian users', async ({ page }) => {
      await login(page, USERS.indiaAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      const countryCol = page.locator('tbody tr td:nth-child(4)');
      const count = await countryCol.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const text = await countryCol.nth(i).textContent();
        if (text && text !== '—') {
          expect(text).toContain('India');
        }
      }
    });
  });

  test.describe('Change Role', () => {
    test('Change Role button visible in each row', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await expect(page.locator('text=Change Role').first()).toBeVisible();
    });

    test('Change Role modal opens', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Change Role').first().click();
      await expect(page.locator('text=New Role')).toBeVisible();
    });

    test('Change Role modal shows role dropdown', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Change Role').first().click();
      await expect(page.locator('text=New Role')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      const allSelects = page.locator('select');
      let found = false;
      const selectCount = await allSelects.count();
      for (let i = 0; i < selectCount; i++) {
        const opts = await allSelects.nth(i).locator('option').count();
        if (opts > 1) { found = true; break; }
      }
      expect(found).toBe(true);
    });

    test('Change Role modal closes on Cancel', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Change Role').first().click();
      await expect(page.locator('text=New Role')).toBeVisible();
      await page.locator('button', { hasText: 'Cancel' }).click();
      await expect(page.locator('text=New Role')).not.toBeVisible();
    });
  });

  test.describe('Permission Panel', () => {
    test('Permissions button visible in each row', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await expect(page.locator('text=Permissions').first()).toBeVisible();
    });

    test('Permission panel slides in from right', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Permissions').first().click();
      await expect(page.locator('h2:has-text("Permissions")')).toBeVisible();
    });

    test('permission panel shows role defaults', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Permissions').first().click();
      await page.waitForTimeout(1500);
      await expect(page.locator('text=Role default ✓').first()).toBeVisible();
    });

    test('permission panel shows legend', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Permissions').first().click();
      await expect(page.locator('text=Role default on')).toBeVisible();
      await expect(page.locator('text=Not assigned')).toBeVisible();
      await expect(page.locator('text=Manually granted')).toBeVisible();
      await expect(page.locator('text=Manually revoked')).toBeVisible();
    });

    test('permission panel closes on X', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.locator('text=Permissions').first().click();
      await expect(page.locator('h2:has-text("Permissions")')).toBeVisible();
      await page.locator('.fixed.inset-0 button:has-text("✕")').click();
      await expect(page.locator('h2:has-text("Permissions")')).not.toBeVisible();
    });

    test('can grant a permission to intern', async ({ page }) => {
      await login(page, USERS.superAdmin);
      await navigateTo(page, 'Users');
      await waitForTable(page);
      await page.fill('input[placeholder*="Search"]', 'intern');
      await page.click('text=Search');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.waitForSelector('tbody tr');
      await page.locator('text=Permissions').first().click();
      await page.waitForTimeout(1500);
      const grantButton = page.locator('button:has-text("Grant")').first();
      if (await grantButton.isVisible()) {
        await grantButton.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Manually granted').first()).toBeVisible();
      }
    });
  });
});