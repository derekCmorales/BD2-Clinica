import { expect, test } from '@playwright/test';
import {
  INSTITUCIONES,
  abrirPaciente,
  crearPaciente,
  datosSinteticos,
  ingresar,
  irASeccion,
  registrarConsulta,
} from './apoyo';

/**
 * El conflicto real de versión se prueba contra los cuatro adaptadores en
 * `apps/api/src/infraestructura/contrato`. Aquí se verifica la reacción de la UI:
 * mensaje visible y recarga de la versión más reciente.
 */
test('una pestaña con versión vieja muestra el conflicto y recarga', async ({ page, context }) => {
  const datos = datosSinteticos('concurrencia');

  await ingresar(page, INSTITUCIONES[0]);
  await crearPaciente(page, datos);
  await abrirPaciente(page, datos);

  const otra = await context.newPage();
  await ingresar(otra, INSTITUCIONES[0]);
  await abrirPaciente(otra, datos);

  await registrarConsulta(page, 'Consulta de la pestaña A');

  await otra.route('**/pacientes/*/consultas', async (ruta) => {
    if (ruta.request().method() === 'POST') {
      await ruta.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'ConflictoDeConcurrencia',
          mensaje: 'Conflicto de concurrencia al guardar expediente',
        }),
      });
      return;
    }
    await ruta.continue();
  });

  await irASeccion(otra, 'Consultas');
  await otra.getByRole('button', { name: 'Nueva consulta' }).click();
  const dialogo = otra.getByRole('dialog');
  await dialogo.getByLabel('Motivo de consulta').fill('Consulta de la pestaña B');

  const respuesta = otra.waitForResponse(
    (respuesta) => respuesta.url().includes('/consultas') && respuesta.request().method() === 'POST',
  );
  await dialogo.getByRole('button', { name: 'Registrar consulta' }).click();

  expect((await respuesta).status()).toBe(409);
  await expect(otra.getByText(/Alguien más modificó este expediente/)).toBeVisible();
  await expect(otra.getByText('Consulta de la pestaña A')).toBeVisible();
});
