import { marcarActorId, marcarConsultaId, marcarPacienteId } from '../compartido/tipos';
import { Expediente } from '../dominio/modelo/expediente';
import { esCodigoFdi } from '../dominio/modelo/tipos-clinicos';
import { ConflictoDeConcurrencia, ExpedienteArchivado } from '../dominio/errores/errores-dominio';
import { esViolacionUnica } from '../infraestructura/postgres/errores-pg';
import { MemoriasPorInstitucion, MemoriaExpedienteRepository } from '../infraestructura/memoria/memoria-expediente.repository';
import { ArchivarExpediente } from './archivar-expediente';
import { CrearPacienteNuevo } from './crear-paciente-nuevo';
import { RegistrarConsulta } from './registrar-consulta';

const actor = {
  actorId: marcarActorId('11111111-1111-1111-1111-111111111111'),
  institucionId: 'hospital',
};

const datos = {
  dpi: '1234567890999',
  nombres: 'Elena',
  apellidos: 'Prueba',
  fechaNacimiento: '1991-04-04',
  sexo: 'F' as const,
};

describe('casos de uso contra el puerto', () => {
  const repositorios = [
    new MemoriaExpedienteRepository(),
    new MemoriaExpedienteRepository(),
    new MemoriaExpedienteRepository(),
    new MemoriaExpedienteRepository(),
  ];

  it.each(repositorios.map((repositorio, indice) => [indice, repositorio] as const))(
    'registra una consulta en el adaptador %s',
    async (_indice, repositorio) => {
      const crear = new CrearPacienteNuevo(repositorio, repositorio);
      const registrar = new RegistrarConsulta(repositorio, repositorio);
      const creado = await crear.ejecutar(datos, actor);
      const vista = await registrar.ejecutar(marcarPacienteId(creado.pacienteId), { motivo: 'Control' }, actor);
      expect(vista.consultas).toHaveLength(1);
      expect(vista.version).toBe(2);
      expect(repositorio.entradas().some((entrada) => entrada.recurso === 'consulta')).toBe(true);
    },
  );

  it('rechaza un guardado con versión vieja', async () => {
    const repositorio = new MemoriaExpedienteRepository();
    const crear = new CrearPacienteNuevo(repositorio, repositorio);
    const creado = await crear.ejecutar(datos, actor);
    const base = await repositorio.obtener(marcarPacienteId(creado.pacienteId));
    const primera = base!.registrarConsulta(
      {
        id: marcarConsultaId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
        medicoId: actor.actorId,
        ocurridaEn: '2026-10-06T12:00:00.000Z',
        motivo: 'Una',
      },
      actor.actorId,
      '2026-10-06T12:00:00.000Z',
    );
    const segunda = base!.registrarConsulta(
      {
        id: marcarConsultaId('bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee'),
        medicoId: actor.actorId,
        ocurridaEn: '2026-10-06T13:00:00.000Z',
        motivo: 'Otra',
      },
      actor.actorId,
      '2026-10-06T13:00:00.000Z',
    );
    await repositorio.guardar(primera);
    await expect(repositorio.guardar(segunda)).rejects.toBeInstanceOf(ConflictoDeConcurrencia);
  });

  it('no escribe sobre un expediente archivado', async () => {
    const repositorio = new MemoriaExpedienteRepository();
    const crear = new CrearPacienteNuevo(repositorio, repositorio);
    const archivar = new ArchivarExpediente(repositorio, repositorio);
    const creado = await crear.ejecutar(datos, actor);
    const id = marcarPacienteId(creado.pacienteId);
    await archivar.ejecutar(id, 'Fin del seguimiento', actor);
    const registrar = new RegistrarConsulta(repositorio, repositorio);
    await expect(registrar.ejecutar(id, { motivo: 'Tarde' }, actor)).rejects.toBeInstanceOf(ExpedienteArchivado);
  });

  it('reconstruye el aggregate desde eventos', () => {
    const creado = Expediente.crear({
      pacienteId: marcarPacienteId('cccccccc-cccc-cccc-cccc-cccccccccccc'),
      expedienteId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      datos,
      actorId: actor.actorId,
      ahora: '2026-10-01T00:00:00.000Z',
    });
    const conConsulta = creado.registrarConsulta(
      {
        id: marcarConsultaId('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'),
        medicoId: actor.actorId,
        ocurridaEn: '2026-10-02T00:00:00.000Z',
        motivo: 'Replay',
      },
      actor.actorId,
      '2026-10-02T00:00:00.000Z',
    );
    const rehidratado = Expediente.desdeEventos(creado.pacienteId, conConsulta.eventosPendientes).confirmado();
    expect(rehidratado.consultas.map((consulta) => consulta.motivo)).toEqual(['Replay']);
    expect(rehidratado.version).toBe(2);
  });

  it('aísla los datos de cada institución', async () => {
    const memorias = new MemoriasPorInstitucion();
    const hospital = await memorias.para('hospital').buscar({ texto: 'Carlos' });
    const odontologia = await memorias.para('odontologia').buscar({ texto: 'Carlos' });
    expect(hospital).toHaveLength(1);
    expect(odontologia).toHaveLength(0);
  });
});

describe('reglas de soporte', () => {
  it('reconoce la violación única de Postgres y el FDI', () => {
    expect(esViolacionUnica({ code: '23505' })).toBe(true);
    expect(esViolacionUnica({ code: '23503' })).toBe(false);
    expect(esCodigoFdi(11)).toBe(true);
    expect(esCodigoFdi(19)).toBe(false);
  });
});
