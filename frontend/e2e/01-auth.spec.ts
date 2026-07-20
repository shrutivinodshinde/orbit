import { test, expect } from '@playwright/test';
import { login, logout, USERS } from './helpers/auth';

test.describe('Authentication', () => {

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('redirects to login for any protected route', async ({ page }) => {
    for (const route of ['/sales', '/export', '/attendance', '/users']) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('shows login page with correct elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Orbit');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login fails with wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', USERS.superAdmin.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const isStillOnLogin = page.url().includes('login');
    const hasError = await page.locator('[class*="red"]').isVisible();
    expect(isStillOnLogin || hasError).toBe(true);
  });

  test('login fails with non-existent email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'nobody@orbit.test');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const isStillOnLogin = page.url().includes('login');
    const hasError = await page.locator('[class*="red"]').isVisible();
    expect(isStillOnLogin || hasError).toBe(true);
  });

  test('login fails with empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*login/);
  });

  test('Super Admin logs in successfully', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Global Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('shows correct user email in sidebar after login', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=superadmin@orbit.test')).toBeVisible();
  });

  test('shows correct role in sidebar', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await expect(page.locator('text=Super Admin')).toBeVisible();
  });

  test('stays logged in after page refresh', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await page.reload();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('logout redirects to login', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await logout(page);
    await expect(page).toHaveURL(/.*login/);
  });

  test('cannot access dashboard after logout', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await logout(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('all 6 users can login successfully', async ({ page }) => {
    for (const user of Object.values(USERS)) {
      await login(page, user);
      await expect(page).toHaveURL(/.*dashboard/);
      await logout(page);
    }
  });
});