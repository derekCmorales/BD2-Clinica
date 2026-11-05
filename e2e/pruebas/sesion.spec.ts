import { expect, test } from '@playwright/test';
import { INSTITUCIONES, ingresar } from './apoyo';

test('una sesión expirada vuelve al ingreso con aviso', async ({ page }) => {
  await ingresar(page, INSTITUCIONES[0]);

  await page.evaluate(() => {
    const cruda = sessionStorage.getItem('sesion');
    if (!cruda) return;
    const sesion = JSON.parse(cruda) as { token: string };
    sesion.token = 'token-expirado-de-prueba';
    sessionStorage.setItem('sesion', JSON.stringify(sesion));
  });

  await page.reload();
  await expect(page.getByText('Tu sesión expiró')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Historiales clínicos' })).toBeVisible();
});
