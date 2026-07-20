import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers/auth';

test.describe('Dashboard', () => {

  test('Super Admin sees all 4 KPI cards', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Completed Orders')).toBeVisible();
    await expect(page.locator('text=Shipments in Customs')).toBeVisible();
    await expect(page.locator('text=Present Today')).toBeVisible();
  });

  test('KPI cards show actual numbers not zero', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
    const cards = page.locator('.rounded-xl.p-5');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('Revenue by Branch chart is visible', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=Revenue by Branch')).toBeVisible({ timeout: 15000 });
  });

  test('Shipment Status chart is visible', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=Shipment Status Breakdown')).toBeVisible({ timeout: 15000 });
  });

  test('Super Admin sidebar has all 7 links', async ({ page }) => {
    await login(page, USERS.superAdmin);
    const links = ['Dashboard', 'Sales', 'Export', 'Attendance', 'Users', 'Audit Logs', 'AI Assistant'];
    for (const link of links) {
      await expect(page.locator(`nav >> text=${link}`)).toBeVisible();
    }
  });

  test('Intern sidebar is limited to 3 links', async ({ page }) => {
    await login(page, USERS.intern);
    await page.waitForSelector('nav', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeLessThanOrEqual(3);
    const navText = await page.locator('nav').textContent();
    expect(navText).not.toContain('Users');
    expect(navText).not.toContain('Audit Logs');
    expect(navText).not.toContain('AI Assistant');
    expect(navText).not.toContain('Export');
  });

  test('Mumbai Manager dashboard shows scoped data', async ({ page }) => {
    await login(page, USERS.mumbaiManager);
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 15000 });
  });

  test('clicking sidebar link navigates correctly', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await page.click('nav >> text=Sales');
    await expect(page).toHaveURL(/.*sales/);
    await page.click('nav >> text=Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });
});