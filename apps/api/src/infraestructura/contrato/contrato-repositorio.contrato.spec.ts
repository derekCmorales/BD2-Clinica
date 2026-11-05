import { randomInt, randomUUID } from 'crypto';
import { marcarActorId, marcarConsultaId, marcarPacienteId, type InstitucionId } from '../../compartido/tipos';
import { AgregarDiagnostico } from '../../aplicacion/agregar-diagnostico';
import { ArchivarExpediente } from '../../aplicacion/archivar-expediente';
import { ObtenerExpediente } from '../../aplicacion/consultas-expediente';
import { CrearPacienteNuevo } from '../../aplicacion/crear-paciente-nuevo';
import { RecetarMedicamento } from '../../aplicacion/recetar-medicamento';
import { RegistrarConsulta } from '../../aplicacion/registrar-consulta';
import { ReservarCita } from '../../aplicacion/casos-extension';
import { ConflictoDeConcurrencia, ExpedienteArchivado, CitaSolapada } from '../../dominio/errores/errores-dominio';
import { crearAdaptadoresDeContrato, type AdaptadorDeContrato } from './adaptadores-de-contrato';

const adaptadores = crearAdaptadoresDeContrato().map(
  (adaptador) => [`${adaptador.institucion} · ${adaptador.motor}`, adaptador] as const,
);

afterAll(async () => {
  await Promise.all(adaptadores.map(([, adaptador]) => adaptador.cerrar()));
});

describe.each(adaptadores)('contrato de adaptador: %s', (_nombre, adaptador) => {
  // Médico distinto por ejecución: la agenda no choca con corridas anteriores ni con los seeds.
  const actor = {
    actorId: marcarActorId(randomUUID()),
    institucionId: adaptador.institucion,
  };

  it('crea un paciente y lo devuelve por su id', async () => {
    const vista = await crearPaciente(adaptador, actor);
    const recuperado = await adaptador.repositorio.obtener(marcarPacienteId(vista.pacienteId));

    expect(recuperado).not.toBeNull();
    expect(recuperado?.pacienteId).toBe(vista.pacienteId);
    expect(recuperado?.version).toBe(1);
    expect(recuperado?.datos.nombres).toBe(vista.paciente.nombres);
    expect(recuperado?.estado).toBe('activo');
  });

  it('registra consulta, diagnóstico y receta en el mismo expediente', async () => {
    const vista = await crearPaciente(adaptador, actor);
    const pacienteId = marcarPacienteId(vista.pacienteId);
    const registrarConsulta = new RegistrarConsulta(adaptador.repositorio, adaptador.repositorio);
    const agregarDiagnostico = new AgregarDiagnostico(adaptador.repositorio, adaptador.repositorio);
    const recetar = new RecetarMedicamento(adaptador.repositorio, adaptador.repositorio);

    const conConsulta = await registrarConsulta.ejecutar(pacienteId, { motivo: 'Control de contrato' }, actor);
    const consultaId = conConsulta.consultas[0].id;
    await agregarDiagnostico.ejecutar(pacienteId, consultaId, { textoLibre: 'Diagnóstico sintético', esPrincipal: true }, actor);
    const final = await recetar.ejecutar(
      pacienteId,
      consultaId,
      { textoLibre: 'Medicamento sintético', dosis: '1 tableta', frecuencia: 'cada 8 horas', duracionDias: 3 },
      actor,
    );

    expect(final.consultas).toHaveLength(1);
    expect(final.consultas[0].diagnosticos).toHaveLength(1);
    expect(final.consultas[0].diagnosticos[0].textoLibre).toBe('Diagnóstico sintético');
    expect(final.consultas[0].recetas).toHaveLength(1);
    expect(final.version).toBe(4);
  });

  it('archiva el expediente y rechaza escrituras posteriores', async () => {
    const vista = await crearPaciente(adaptador, actor);
    const pacienteId = marcarPacienteId(vista.pacienteId);
    const archivar = new ArchivarExpediente(adaptador.repositorio, adaptador.repositorio);
    const registrarConsulta = new RegistrarConsulta(adaptador.repositorio, adaptador.repositorio);

    const archivado = await archivar.ejecutar(pacienteId, 'Traslado sintético de contrato', actor);
    expect(archivado.estado).toBe('archivado');
    expect(archivado.motivoArchivo).toBe('Traslado sintético de contrato');

    await expect(registrarConsulta.ejecutar(pacienteId, { motivo: 'No debe entrar' }, actor)).rejects.toBeInstanceOf(
      ExpedienteArchivado,
    );
  });

  it('rechaza dos citas del mismo médico en el mismo intervalo', async () => {
    const reservar = new ReservarCita(adaptador.repositorio, adaptador.repositorio);
    const primero = await crearPaciente(adaptador, actor);
    const inicio = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const fin = new Date(Date.parse(inicio) + 30 * 60 * 1000).toISOString();

    await reservar.ejecutar(marcarPacienteId(primero.pacienteId), { inicio, fin, motivo: 'Cita sintética' }, actor);

    if (adaptador.capacidades.solapeEntrePacientes) {
      const segundo = await crearPaciente(adaptador, actor);
      await expect(
        reservar.ejecutar(marcarPacienteId(segundo.pacienteId), { inicio, fin, motivo: 'Cita que se cruza' }, actor),
      ).rejects.toBeInstanceOf(CitaSolapada);
    } else {
      // Redis solo valida el solape dentro del mismo expediente; la limitación se documenta en fase 8.
      await expect(
        reservar.ejecutar(marcarPacienteId(primero.pacienteId), { inicio, fin, motivo: 'Cita que se cruza' }, actor),
      ).rejects.toBeInstanceOf(CitaSolapada);
    }
  });

  it('rechaza la segunda escritura sobre la misma versión', async () => {
    const vista = await crearPaciente(adaptador, actor);
    const pacienteId = marcarPacienteId(vista.pacienteId);
    const base = await adaptador.repositorio.obtener(pacienteId);
    expect(base).not.toBeNull();

    const primera = base!.registrarConsulta(
      {
        id: marcarConsultaId(randomUUID()),
        medicoId: actor.actorId,
        ocurridaEn: new Date().toISOString(),
        motivo: 'Primera escritura concurrente',
      },
      actor.actorId,
      new Date().toISOString(),
    );
    const segunda = base!.registrarConsulta(
      {
        id: marcarConsultaId(randomUUID()),
        medicoId: actor.actorId,
        ocurridaEn: new Date().toISOString(),
        motivo: 'Segunda escritura concurrente',
      },
      actor.actorId,
      new Date().toISOString(),
    );

    await adaptador.repositorio.guardar(primera);
    await expect(adaptador.repositorio.guardar(segunda)).rejects.toBeInstanceOf(ConflictoDeConcurrencia);
  });

  it('deja una entrada de auditoría por lectura restringida', async () => {
    const vista = await crearPaciente(adaptador, actor);
    const pacienteId = marcarPacienteId(vista.pacienteId);
    const obtener = new ObtenerExpediente(adaptador.repositorio, adaptador.repositorio);

    await obtener.ejecutar(pacienteId, actor);
    const entradas = await adaptador.leerAuditoria(pacienteId);

    expect(entradas.some((entrada) => entrada.recurso === 'paciente' && entrada.accion === 'escritura')).toBe(true);
    expect(entradas.some((entrada) => entrada.recurso === 'expediente' && entrada.accion === 'lectura')).toBe(true);
    expect(entradas.every((entrada) => entrada.actorId === actor.actorId)).toBe(true);
  });
});

async function crearPaciente(
  adaptador: AdaptadorDeContrato,
  actor: { readonly actorId: ReturnType<typeof marcarActorId>; readonly institucionId: InstitucionId },
) {
  const crear = new CrearPacienteNuevo(adaptador.repositorio, adaptador.repositorio);
  return crear.ejecutar(
    {
      dpi: dpiSintetico(),
      nombres: 'Paciente',
      apellidos: `Contrato ${adaptador.motor}`,
      fechaNacimiento: '1990-01-01',
      sexo: 'F',
    },
    actor,
  );
}

/** 13 dígitos, sin datos reales. */
function dpiSintetico(): string {
  return `${String(Date.now()).slice(-9)}${String(randomInt(1000, 9999))}`;
}
