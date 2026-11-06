import { expect, test } from '@playwright/test';
import { INSTITUCIONES, cerrarSesion, crearPaciente, datosSinteticos, ingresar } from './apoyo';

test('un usuario de odontología no ve pacientes del hospital', async ({ page }) => {
  const datos = datosSinteticos('aislamiento');

  await ingresar(page, INSTITUCIONES[0]);
  await crearPaciente(page, datos);
  await cerrarSesion(page);

  await ingresar(page, INSTITUCIONES[1]);
  await page.getByLabel('Buscar paciente por nombre o DPI').fill(datos.apellidos);
  await expect(page.getByText('Sin coincidencias')).toBeVisible();
  await expect(page.getByText(`${datos.apellidos}, ${datos.nombres}`)).toHaveCount(0);
});
