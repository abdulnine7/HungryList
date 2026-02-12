import { expect, test } from '@playwright/test';

test.describe.serial('HungryList critical flows', () => {
  test('item and settings flows', async ({ page }) => {
    const runId = Date.now();
    const itemName = `Milk ${runId}`;
    const sectionName = `Bulk Store ${runId}`;
    const renamedSectionName = `Warehouse ${runId}`;

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Unlock HungryList' })).toBeVisible();

    const loginResponse = await page
      .context()
      .request.post('/api/auth/login', { data: { pin: '1234', trusted: true } });
    expect(loginResponse.status()).toBe(200);
    const setCookieHeader = loginResponse.headers()['set-cookie'];
    const cookieMatch = /hungrylist_session=([^;]+)/.exec(setCookieHeader || '');
    expect(cookieMatch).toBeTruthy();

    await page.context().addCookies([
      {
        name: 'hungrylist_session',
        value: cookieMatch![1],
        url: page.url(),
      },
    ]);

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Add item', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const addItemModal = page.locator('.modal.modal-open').first();
    await addItemModal.getByPlaceholder('e.g. Basmati Rice').fill(itemName);
    await addItemModal.getByPlaceholder('Optional details').fill('2% gallon');
    await addItemModal.getByRole('button', { name: 'Add Item', exact: true }).click();

    await expect(page.getByRole('button', { name: `Toggle ${itemName}` })).toBeVisible();

    await page.getByRole('button', { name: `Edit ${itemName}` }).click();
    const editItemModal = page.locator('.modal.modal-open').first();
    await editItemModal.getByPlaceholder('Optional details').fill('Whole milk');
    await editItemModal.getByRole('button', { name: 'Save Changes', exact: true }).click();
    await expect(page.getByRole('button', { name: `Toggle ${itemName}` })).toContainText('Whole milk');

    await page.getByRole('button', { name: `Toggle ${itemName}` }).click();
    await page.getByRole('button', { name: 'Next Trip' }).click();
    await expect(page.getByRole('button', { name: `Toggle ${itemName}` })).toBeVisible();

    await page.getByRole('button', { name: `Toggle ${itemName}` }).click();
    await expect(page.getByRole('button', { name: `Delete ${itemName}` })).toHaveCount(0);

    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const duplicateItemModal = page.locator('.modal.modal-open').first();
    await duplicateItemModal.getByPlaceholder('e.g. Basmati Rice').fill(`  ${itemName.toUpperCase()}  `);
    await duplicateItemModal.getByRole('button', { name: 'Add Item', exact: true }).click();
    await expect(page.getByText('This item already exists in the selected section.')).toBeVisible();
    await duplicateItemModal.getByRole('button', { name: 'Cancel', exact: true }).click();

    await page.getByRole('button', { name: 'My List' }).click();

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: `Delete ${itemName}` }).click();

    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const restoreItemModal = page.locator('.modal.modal-open').first();
    await restoreItemModal.getByPlaceholder('e.g. Basmati Rice').fill(itemName.toLowerCase());
    await restoreItemModal.getByPlaceholder('Optional details').fill('restored');
    await restoreItemModal.getByRole('button', { name: 'Add Item', exact: true }).click();
    await expect(page.getByRole('button', { name: `Toggle ${itemName.toLowerCase()}` })).toBeVisible();

    await page.getByRole('button', { name: 'Settings' }).click();

    await page.getByRole('button', { name: 'Add Section' }).click();
    const addSectionModal = page.locator('.modal.modal-open').first();
    await addSectionModal.getByPlaceholder('Section name').fill(sectionName);
    await addSectionModal.getByLabel('Icon').fill('📦');
    await addSectionModal.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByRole('button', { name: `Edit section ${sectionName}`, exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add Section' }).click();
    const duplicateSectionModal = page.locator('.modal.modal-open').first();
    await duplicateSectionModal.getByPlaceholder('Section name').fill(`  ${sectionName.toUpperCase()}  `);
    await duplicateSectionModal.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.getByText('A section with this name already exists.')).toBeVisible();
    await duplicateSectionModal.getByRole('button', { name: 'Cancel', exact: true }).click();

    await page.getByRole('button', { name: `Edit section ${sectionName}` }).click();
    const editSectionModal = page.locator('.modal.modal-open').first();
    await editSectionModal.getByPlaceholder('Section name').fill(renamedSectionName);
    await editSectionModal.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(
      page.getByRole('button', { name: `Edit section ${renamedSectionName}`, exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Create Backup', exact: true }).click();
    await expect(page.locator('text=.json').first()).toBeVisible();

    const themeBefore = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: /Switch to .* theme/ }).click();
    await page.reload();
    const themeAfter = await page.locator('html').getAttribute('data-theme');
    expect(themeAfter).not.toBe(themeBefore);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Restore', exact: true }).first().click();
    await page.getByRole('button', { name: 'Create Backup & Restore', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Unlock HungryList' })).toBeVisible();
  });

  test('pin lockout after 3 failures', async ({ page }) => {
    await page.goto('/');

    const request = page.context().request;

    const first = await request.post('/api/auth/login', { data: { pin: '0000', trusted: true } });
    expect(first.status()).toBe(401);

    const second = await request.post('/api/auth/login', { data: { pin: '0000', trusted: true } });
    expect(second.status()).toBe(401);

    const third = await request.post('/api/auth/login', { data: { pin: '0000', trusted: true } });
    expect(third.status()).toBe(429);

    const blocked = await request.post('/api/auth/login', { data: { pin: '1234', trusted: true } });
    expect(blocked.status()).toBe(429);

    await expect(page.getByRole('button', { name: 'Unlock HungryList' })).toBeVisible();
  });
});
