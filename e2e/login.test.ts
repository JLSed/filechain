import { test, expect } from '@playwright/test';

test.describe('Login Form', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
	});

	test('should render login form elements', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible();
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
	});

	test('should show validation errors on empty submit', async ({ page }) => {
		await page.getByRole('button', { name: /log in/i }).click();
		await expect(page.locator('span.text-red-500').first()).toBeVisible();
	});

	test('should show error message on invalid credentials', async ({ page }) => {
		await page.locator('input[name="email"]').fill('invalid@example.com');
		await page.locator('input[name="password"]').fill('wrongpassword');
		await page.getByRole('button', { name: /log in/i }).click();
		await expect(page.locator('.text-red-500')).toBeVisible();
	});

	test('should have a forgot password link', async ({ page }) => {
		await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
	});
});
