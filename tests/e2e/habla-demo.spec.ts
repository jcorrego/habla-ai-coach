import { test, expect } from '@playwright/test';

test('home demo flow creates and analyzes a scenario session', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Habla' })).toBeVisible();
  await expect(page.getByText(/DB:/)).toBeVisible();

  await page.getByRole('button', { name: 'Seed demo' }).click();
  await expect(page.getByText(/Demo seed listo/)).toBeVisible();

  await page.getByLabel('Selecciona demo').selectOption('project-pitch');
  await expect(page.getByText('Pitch a product idea with problem, solution, evidence and next step').first()).toBeVisible();

  await page.getByRole('button', { name: 'Preparar sesión' }).click();
  await expect(page.getByText(/Sesión preparada y persistida/)).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'Estado:' })).toContainText('prepared');

  await page.getByRole('button', { name: 'Iniciar' }).click();
  await expect(page.getByText(/Sesión en progreso/)).toBeVisible();
  await expect(page.locator('p').filter({ hasText: 'Estado:' })).toContainText('in_progress');

  await page.getByRole('button', { name: 'Finalizar y analizar' }).click();
  await expect(page.getByText(/Reporte generado/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '5. Reporte personalizado' })).toBeVisible();
  await expect(page.getByText(/Siguiente foco adaptativo/)).toBeVisible();
  await expect(page.getByText(/score/).first()).toBeVisible();
});

test('status page and JSON health expose the active sqlite test database', async ({ page, request }) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  const healthJson = await health.json();
  expect(healthJson).toEqual(expect.objectContaining({
    ok: true,
    app: 'habla-ai-coach',
    product: 'Habla',
    db: 'sqlite'
  }));

  await page.goto('/status');
  await expect(page.getByRole('heading', { name: 'Habla status' })).toBeVisible();
  await expect(page.getByText('Database')).toBeVisible();
  await expect(page.getByText('sqlite')).toBeVisible();
});
