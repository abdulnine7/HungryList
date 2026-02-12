import { expect, test } from '@playwright/test';

test.describe.serial('HungryList critical flows', () => {
  test('item and settings flows', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel('4-digit PIN').fill('1234');
    await page.getByRole('button', { name: 'Unlock HungryList' }).click();

    await expect(page.getByRole('heading', { name: 'HungryList' })).toBeVisible();

    await page.getByRole('button', { name: 'Add item' }).click();
    await page.getByLabel('Name').fill('Milk');
    await page.getByLabel('Description').fill('2% gallon');
    await page.getByRole('button', { name: 'Add Item' }).click();

    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: 'Edit Milk' }).click();
    await page.getByLabel('Description').fill('Whole milk');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Whole milk')).toBeVisible();

    await page.getByRole('button', { name: /Toggle Milk/i }).click();
    await page.getByRole('button', { name: 'Next Trip' }).click();
    await expect(page.getByText('Milk')).toBeVisible();

    await page.getByRole('button', { name: /Toggle Milk/i }).click();

    await page.getByRole('button', { name: 'Add item' }).click();
    await page.getByLabel('Name').fill('  milk  ');
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.getByText('This item already exists in the selected section.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Settings' }).click();

    await page.getByRole('button', { name: 'Add Section' }).click();
    await page.getByLabel('Name').fill('Bulk Store');
    await page.getByLabel('Icon').fill('📦');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Bulk Store')).toBeVisible();

    await page.getByRole('button', { name: 'Add Section' }).click();
    await page.getByLabel('Name').fill(' bulk   store ');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('A section with this name already exists.')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Edit section Bulk Store' }).click();
    await page.getByLabel('Name').fill('Warehouse');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Warehouse')).toBeVisible();

    await page.getByRole('button', { name: 'Create Backup' }).click();
    await expect(page.getByText('.json')).toBeVisible();

    const themeBefore = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: /Switch to .* theme/ }).click();
    await page.reload();
    const themeAfter = await page.locator('html').getAttribute('data-theme');
    expect(themeAfter).not.toBe(themeBefore);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Restore' }).first().click();
    await page.getByRole('button', { name: 'Create Backup & Restore' }).click();

    await expect(page.getByRole('button', { name: 'Unlock HungryList' })).toBeVisible();
  });

  test('pin lockout after 3 failures', async ({ page }) => {
    await page.goto('/');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.getByLabel('4-digit PIN').fill('0000');
      await page.getByRole('button', { name: 'Unlock HungryList' }).click();
    }

    await expect(page.getByText('Too many failed attempts')).toBeVisible();
  });
});
