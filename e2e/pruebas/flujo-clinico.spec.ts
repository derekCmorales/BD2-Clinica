import { test } from '@playwright/test';
import {
  INSTITUCIONES,
  abrirPaciente,
  archivarExpediente,
  captura,
  crearPaciente,
  datosSinteticos,
  ingresar,
  irASeccion,
  programarVacuna,
  registrarConsulta,
  registrarDiagnostico,
  registrarExamen,
  registrarMedicion,
  registrarProcedimiento,
  registrarReceta,
  reservarCita,
  revisarAccesibilidad,
} from './apoyo';

for (const institucion of INSTITUCIONES) {
  test(`flujo clínico completo · ${institucion.nombre} (${institucion.motor})`, async ({ page }, info) => {
    const datos = datosSinteticos(`${institucion.id}-${info.project.name}`);
    const sufijo = `${institucion.id}-${info.project.name}`;

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await revisarAccesibilidad(page, 'ingreso');
    await captura(page, `ingreso-${sufijo}`);

    await ingresar(page, institucion);
    await revisarAccesibilidad(page, 'censo');
    await captura(page, `censo-${sufijo}`);

    await crearPaciente(page, datos);
    await abrirPaciente(page, datos);

    await registrarConsulta(page, `Control de ${institucion.nombre}`);
    await revisarAccesibilidad(page, 'pestaña Consultas');
    await captura(page, `consultas-${sufijo}`);

    await registrarDiagnostico(page, 'Diagnóstico sintético de prueba');
    await registrarReceta(page, 'Paracetamol 500 mg');

    await reservarCita(page, 'Cita sintética de control');
    await revisarAccesibilidad(page, 'pestaña Agenda');

    await registrarExamen(page);
    await revisarAccesibilidad(page, 'pestaña Laboratorio');
    await captura(page, `laboratorio-${sufijo}`);

    await registrarMedicion(page);
    await revisarAccesibilidad(page, 'pestaña Crecimiento');

    await programarVacuna(page, 'SRP');
    await revisarAccesibilidad(page, 'pestaña Vacunas');
    await captura(page, `vacunas-${sufijo}`);

    await registrarProcedimiento(page);
    await revisarAccesibilidad(page, 'pestaña Odontograma');
    await captura(page, `odontograma-${sufijo}`);

    await irASeccion(page, 'Resumen');
    await revisarAccesibilidad(page, 'pestaña Resumen');

    await archivarExpediente(page);
    await revisarAccesibilidad(page, 'expediente archivado');
    await captura(page, `archivado-${sufijo}`);
  });
}
