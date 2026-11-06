import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const INSTITUCIONES = [
  { id: 'hospital', nombre: 'Hospital general', motor: 'PostgreSQL' },
  { id: 'odontologia', nombre: 'Clínica odontológica', motor: 'MySQL' },
  { id: 'laboratorio', nombre: 'Laboratorio clínico', motor: 'MongoDB' },
  { id: 'pediatrico', nombre: 'Centro pediátrico', motor: 'Redis' },
] as const;

export type Institucion = (typeof INSTITUCIONES)[number];

export interface DatosSinteticos {
  readonly nombres: string;
  readonly apellidos: string;
  readonly dpi: string;
  readonly fechaNacimiento: string;
  readonly sexo: 'F' | 'M';
}

export function datosSinteticos(etiqueta: string): DatosSinteticos {
  const base = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  return {
    nombres: `Paciente ${etiqueta}`,
    apellidos: `Demo ${base}`,
    dpi: `9${base}`.padEnd(13, '0').slice(0, 13),
    fechaNacimiento: '1990-01-01',
    sexo: 'F',
  };
}

export async function ingresar(page: Page, institucion: Institucion): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('radio', { name: new RegExp(institucion.nombre) }).check();
  await page.getByLabel('Clave de acceso').fill('demo');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Pacientes' })).toBeVisible();
}

export async function cerrarSesion(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('heading', { name: 'Historiales clínicos' })).toBeVisible();
}

export async function crearPaciente(page: Page, datos: DatosSinteticos): Promise<void> {
  await page.getByRole('button', { name: 'Nuevo' }).click();
  const dialogo = page.getByRole('dialog');
  await expect(dialogo.getByRole('heading', { name: 'Nuevo paciente' })).toBeVisible();
  await revisarAccesibilidad(page, 'diálogo Nuevo paciente');
  await dialogo.getByLabel('Nombres').fill(datos.nombres);
  await dialogo.getByLabel('Apellidos').fill(datos.apellidos);
  await dialogo.getByLabel('DPI').fill(datos.dpi);
  await dialogo.getByLabel('Fecha de nacimiento').fill(datos.fechaNacimiento);
  await dialogo.getByRole('radio', { name: datos.sexo === 'F' ? 'Femenino' : 'Masculino' }).check();
  await dialogo.getByRole('button', { name: 'Crear expediente' }).click();
  await expect(page.getByText('Expediente creado.')).toBeVisible();
  await expect(page.getByRole('heading', { name: new RegExp(`${datos.nombres} ${datos.apellidos}`) })).toBeVisible();
}

export async function abrirPaciente(page: Page, datos: DatosSinteticos): Promise<void> {
  const cabecera = page.getByRole('heading', { name: new RegExp(`${datos.nombres} ${datos.apellidos}`) });
  if (await cabecera.isVisible().catch(() => false)) {
    return;
  }
  await page
    .getByRole('button', { name: new RegExp(`${datos.apellidos}, ${datos.nombres}`) })
    .first()
    .click();
  await expect(cabecera).toBeVisible();
}

/** Fuerza una lectura nueva del expediente (genera entrada de auditoría). */
export async function reabrirPaciente(page: Page, datos: DatosSinteticos): Promise<void> {
  const volver = page.getByRole('button', { name: '← Pacientes' });
  if (await volver.isVisible().catch(() => false)) {
    await volver.click();
  }
  await page
    .getByRole('button', { name: new RegExp(`${datos.apellidos}, ${datos.nombres}`) })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: new RegExp(`${datos.nombres} ${datos.apellidos}`) })).toBeVisible();
}

export async function irASeccion(page: Page, nombre: string): Promise<void> {
  await page.getByRole('tab', { name: new RegExp(nombre) }).click();
}

export async function registrarConsulta(page: Page, motivo: string): Promise<void> {
  await irASeccion(page, 'Consultas');
  await page.getByRole('button', { name: 'Nueva consulta' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Nueva consulta');
  await dialogo.getByLabel('Motivo de consulta').fill(motivo);
  await dialogo.getByRole('button', { name: 'Registrar consulta' }).click();
  await expect(page.getByText('Consulta registrada.')).toBeVisible();
  await expect(page.getByText(motivo)).toBeVisible();
}

export async function registrarDiagnostico(page: Page, texto: string): Promise<void> {
  await page.getByRole('button', { name: 'Diagnóstico' }).first().click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Diagnóstico');
  await dialogo.getByLabel('Diagnóstico', { exact: true }).fill(texto);
  await dialogo.getByRole('button', { name: 'Agregar' }).click();
  await expect(page.getByText('Diagnóstico agregado.')).toBeVisible();
}

export async function registrarReceta(page: Page, medicamento: string): Promise<void> {
  await page.getByRole('button', { name: 'Receta' }).first().click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Receta');
  await dialogo.getByLabel('Medicamento').fill(medicamento);
  await dialogo.getByLabel('Dosis').fill('1 tableta');
  await dialogo.getByRole('button', { name: 'Recetar' }).click();
  await expect(page.getByText('Medicamento recetado.')).toBeVisible();
}

export async function reservarCita(page: Page, motivo: string): Promise<string> {
  await irASeccion(page, 'Agenda');
  await page.getByRole('button', { name: 'Reservar cita' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Reservar cita');
  const inicio = fechaFutura();
  await dialogo.getByLabel('Inicio').fill(inicio);
  await dialogo.getByLabel('Motivo').fill(motivo);
  await dialogo.getByRole('button', { name: 'Reservar' }).click();
  await expect(page.getByText('Cita reservada.')).toBeVisible();
  return inicio;
}

export async function registrarExamen(page: Page): Promise<void> {
  await irASeccion(page, 'Laboratorio');
  await page.getByRole('button', { name: 'Registrar resultado' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Registrar resultado');
  await dialogo.getByRole('radio', { name: 'Hematología' }).check();
  await dialogo.getByLabel('Hemoglobina').fill('13.5');
  await dialogo.getByLabel('Leucocitos').fill('7200');
  await dialogo.getByRole('button', { name: 'Guardar resultado' }).click();
  await expect(page.getByText('Resultado registrado.')).toBeVisible();
}

export async function registrarMedicion(page: Page): Promise<void> {
  await irASeccion(page, 'Crecimiento');
  await page.getByRole('button', { name: 'Nueva medición' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Nueva medición');
  await dialogo.getByLabel('Peso').fill('12.4');
  await dialogo.getByLabel('Talla').fill('86');
  await dialogo.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Medición registrada.')).toBeVisible();
}

export async function programarVacuna(page: Page, codigo: string): Promise<void> {
  await irASeccion(page, 'Vacunas');
  await page.getByRole('button', { name: 'Programar dosis' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Programar dosis');
  await dialogo.getByLabel('Vacuna').fill(codigo);
  await dialogo.getByRole('button', { name: 'Programar' }).click();
  await expect(page.getByText('Dosis programada.')).toBeVisible();
}

export async function registrarProcedimiento(page: Page): Promise<void> {
  await irASeccion(page, 'Odontograma');
  await page.getByRole('button', { name: /Pieza 16/ }).click();
  await page.getByRole('button', { name: 'caries' }).click();
  await expect(page.getByText(/Pieza 16: caries/)).toBeVisible();
  await page.getByRole('button', { name: 'Procedimiento' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Procedimiento');
  await dialogo.getByLabel('Tipo').fill('Obturación');
  await dialogo.getByLabel('Descripción').fill('Obturación sintética de prueba');
  await dialogo.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.getByText('Procedimiento registrado.')).toBeVisible();
}

export async function archivarExpediente(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Archivar' }).click();
  const dialogo = page.getByRole('dialog');
  await revisarAccesibilidad(page, 'diálogo Archivar');
  await dialogo.getByRole('button', { name: 'Archivar expediente' }).click();
  await expect(page.getByText('Expediente archivado.')).toBeVisible();
  await expect(page.getByText('Archivado', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Motivo de archivo/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva consulta' })).toHaveCount(0);
}

export async function revisarAccesibilidad(page: Page, contexto: string): Promise<void> {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const graves = resultado.violations.filter(
    (violacion) => violacion.impact === 'serious' || violacion.impact === 'critical',
  );
  expect(graves, `${contexto}: ${JSON.stringify(graves, null, 2)}`).toEqual([]);
}

export async function captura(page: Page, nombre: string): Promise<void> {
  const carpeta = path.resolve(__dirname, '../../docs/entrega-2/capturas');
  fs.mkdirSync(carpeta, { recursive: true });
  await page.screenshot({ path: path.join(carpeta, `${nombre}.png`), fullPage: true });
}

function fechaFutura(): string {
  const fecha = new Date(Date.now() + (400 + Math.floor(Math.random() * 300)) * 86_400_000);
  fecha.setMinutes(Math.floor(Math.random() * 12) * 5, 0, 0);
  const dos = (valor: number) => String(valor).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
