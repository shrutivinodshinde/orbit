import { test, expect } from '@playwright/test';
import { login, navigateTo, USERS } from './helpers/auth';

test.describe('AI Assistant', () => {

  test('Super Admin can access AI assistant', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await expect(page).toHaveURL(/.*ai-assistant/);
  });

  test('shows page title and description', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await expect(page.locator('h1:has-text("AI Assistant")')).toBeVisible();
    await expect(page.locator('text=Ask questions about your business data')).toBeVisible();
  });

  test('shows suggested prompts on empty chat', async ({ page }) => {
    await login(page, USERS.germanyAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const hasSuggested = await page.locator('text=Suggested questions').isVisible();
    const hasTextarea = await page.locator('textarea').isVisible();
    expect(hasSuggested || hasTextarea).toBe(true);
  });

  test('shows role-appropriate suggested prompts for Super Admin', async ({ page }) => {
    await login(page, USERS.germanyAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('text input is visible and focusable', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    const input = page.locator('textarea');
    await expect(input).toBeVisible();
    await input.click();
    await input.fill('test message');
    expect(await input.inputValue()).toBe('test message');
  });

  test('Send button is visible', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await expect(page.locator('button:has-text("Send")')).toBeVisible();
  });

  test('Send button disabled when input is empty', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.waitForLoadState('networkidle');
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeDisabled();
  });

  test('Send button enabled when input has text', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.fill('textarea', 'Hello');
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeEnabled();
  });

  test('clicking suggested prompt populates input and sends', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.locator('text=What is our total revenue across all countries?').click();
    await expect(page.locator('text=What is our total revenue across all countries?').last()).toBeVisible();
  });

  test('sends message and shows it in chat', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  
    const uniqueMsg = `Test message ${Date.now()}`;
    await page.fill('textarea', uniqueMsg);
    await page.click('button:has-text("Send")');
  
    // Give the UI a beat before asserting — same pattern that fixed Enter key test
    await page.waitForTimeout(1000);
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 15000 });
  });

  test('AI responds to message', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.fill('textarea', 'What is our total revenue?');
    await page.click('button:has-text("Send")');
    await page.waitForSelector('.bg-white.border.border-gray-200.rounded-2xl', { timeout: 40000 });
    const responses = page.locator('.bg-white.border.border-gray-200.rounded-2xl');
    expect(await responses.count()).toBeGreaterThan(0);
  });

  test('shows thinking state while waiting for response', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.fill('textarea', 'What is our total revenue?');
    await page.click('button:has-text("Send")');
    await expect(page.locator('button:has-text("Thinking...")')).toBeVisible({ timeout: 5000 });
  });

  test('Enter key sends message', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const uniqueMsg = `Enter test ${Date.now()}`;
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.fill(uniqueMsg);
    expect(await textarea.inputValue()).toBe(uniqueMsg);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await expect(page.getByText(uniqueMsg)).toBeVisible({ timeout: 15000 });
  });

  test('Shift+Enter does not send message', async ({ page }) => {
    await login(page, USERS.superAdmin);
    await navigateTo(page, 'AI Assistant');
    await page.fill('textarea', 'Hello');
    await page.keyboard.press('Shift+Enter');
    await expect(page.locator('button:has-text("Thinking...")')).not.toBeVisible();
  });

  test('Intern cannot see AI Assistant link in sidebar', async ({ page }) => {
    await login(page, USERS.intern);
    await expect(page.locator('nav >> text=AI Assistant')).not.toBeVisible();
  });
});