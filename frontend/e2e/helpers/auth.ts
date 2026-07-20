import { Page } from '@playwright/test';

export const USERS = {
  superAdmin:    { email: 'superadmin@orbit.test',     password: 'Password123!' },
  indiaAdmin:    { email: 'india.admin@orbit.test',    password: 'Password123!' },
  germanyAdmin:  { email: 'germany.admin@orbit.test',  password: 'Password123!' },
  mumbaiManager: { email: 'mumbai.manager@orbit.test', password: 'Password123!' },
  berlinManager: { email: 'berlin.manager@orbit.test', password: 'Password123!' },
  intern:        { email: 'mumbai.intern@orbit.test',  password: 'Password123!' },
};

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 60000 });
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('nav', { timeout: 10000 });
}

export async function logout(page: Page) {
  await page.click('text=Sign out');
  await page.waitForURL('**/login');
}

export async function navigateTo(page: Page, section: string) {
  await page.waitForSelector('nav', { timeout: 10000 });
  await page.click(`nav >> text=${section}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

export async function waitForTable(page: Page) {
  await page.waitForSelector('table', { timeout: 15000 });
  await page.waitForSelector('tbody tr', { timeout: 15000 });
}

export async function waitForRows(page: Page, minCount = 1) {
  let count = 0;
  let attempts = 0;
  while (count < minCount && attempts < 20) {
    await page.waitForTimeout(500);
    count = await page.locator('tbody tr').count();
    attempts++;
  }
  return count;
}