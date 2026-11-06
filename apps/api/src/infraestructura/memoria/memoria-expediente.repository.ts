import type { InstitucionId, PacienteId } from '../../compartido/tipos';
import { marcarActorId, marcarPacienteId } from '../../compartido/tipos';
import { Expediente } from '../../dominio/modelo/expediente';
import { ConflictoDeConcurrencia } from '../../dominio/errores/errores-dominio';
import type { DatosPaciente } from '../../dominio/modelo/tipos-clinicos';
import type { AuditLog, EntradaAuditoria } from '../../dominio/puertos/audit-log';
import type { ConsultaDeAuditoria } from '../../dominio/puertos/consulta-de-auditoria';
import type { ExpedienteRepository } from '../../dominio/puertos/expediente.repository';
import type {
  CriterioBusqueda,
  ExpedienteQueryService,
  ExpedienteVistaDTO,
  ResumenExpedienteDTO,
  VacunaPendienteDTO,
} from '../../dominio/puertos/expediente-query.service';
import { dosisPendientes } from '../../aplicacion/dosis-pendientes';
import { aResumen, aVista } from '../../aplicacion/vista';

export type RepositorioCompleto = ExpedienteRepository & ExpedienteQueryService & AuditLog & ConsultaDeAuditoria;

/**
 * Misma estrategia observable que los cuatro motores: la escritura entra solo si
 * la versión almacenada coincide con la que leyó el aggregate.
 */
export class MemoriaExpedienteRepository implements RepositorioCompleto {
  private readonly expedientes = new Map<string, Expediente>();
  private readonly auditoria: EntradaAuditoria[] = [];

  async obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    return this.expedientes.get(pacienteId) ?? null;
  }

  async guardar(expediente: Expediente): Promise<void> {
    if (expediente.eventosPendientes.length === 0) {
      return;
    }
    const almacenado = this.expedientes.get(expediente.pacienteId);
    const versionAlmacenada = almacenado?.version ?? 0;
    if (versionAlmacenada !== expediente.version) {
      throw new ConflictoDeConcurrencia(expediente.pacienteId);
    }
    this.expedientes.set(expediente.pacienteId, expediente.confirmado());
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const expediente = this.expedientes.get(pacienteId);
    return expediente ? aVista(expediente) : null;
  }

  async buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    const texto = criterio.texto.toLowerCase();
    return [...this.expedientes.values()]
      .filter((expediente) => {
        if (!texto) {
          return true;
        }
        const bolsa = `${expediente.datos.nombres} ${expediente.datos.apellidos} ${expediente.datos.dpi}`.toLowerCase();
        return bolsa.includes(texto);
      })
      .slice(0, 20)
      .map(aResumen);
  }

  async vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    return dosisPendientes([...this.expedientes.values()], hasta);
  }

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    this.auditoria.push(entrada);
  }

  entradas(): readonly EntradaAuditoria[] {
    return this.auditoria;
  }

  async entradasDe(pacienteId: PacienteId): Promise<readonly EntradaAuditoria[]> {
    return this.auditoria.filter((entrada) => entrada.pacienteId === pacienteId).reverse();
  }

  sembrar(expediente: Expediente): void {
    this.expedientes.set(expediente.pacienteId, expediente);
  }
}

export class MemoriasPorInstitucion {
  private readonly porInstitucion: Record<InstitucionId, MemoriaExpedienteRepository>;

  constructor() {
    this.porInstitucion = {
      hospital: sembrar('hospital'),
      odontologia: sembrar('odontologia'),
      laboratorio: sembrar('laboratorio'),
      pediatrico: sembrar('pediatrico'),
    };
  }

  para(institucion: InstitucionId): MemoriaExpedienteRepository {
    return this.porInstitucion[institucion];
  }
}

function sembrar(institucion: InstitucionId): MemoriaExpedienteRepository {
  const repo = new MemoriaExpedienteRepository();
  const paciente = PACIENTES_DEMO[institucion];
  repo.sembrar(
    Expediente.crear({
      pacienteId: marcarPacienteId(paciente.pacienteId),
      expedienteId: paciente.expedienteId,
      datos: paciente.datos,
      actorId: marcarActorId(paciente.actorId),
      ahora: '2026-09-01T15:00:00.000Z',
    }).confirmado(),
  );
  return repo;
}

const PACIENTES_DEMO: Record<
  InstitucionId,
  { pacienteId: string; expedienteId: string; actorId: string; datos: DatosPaciente }
> = {
  hospital: {
    pacienteId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    expedienteId: 'e1111111-1111-1111-1111-111111111111',
    actorId: '11111111-1111-1111-1111-111111111111',
    datos: {
      dpi: '1234567890101',
      nombres: 'Carlos',
      apellidos: 'Ruiz Demo',
      fechaNacimiento: '1988-03-14',
      sexo: 'M',
    },
  },
  odontologia: {
    pacienteId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    expedienteId: 'e2222222-2222-2222-2222-222222222222',
    actorId: '11111111-1111-1111-1111-111111111111',
    datos: {
      dpi: '2987654321098',
      nombres: 'Sofía',
      apellidos: 'García Demo',
      fechaNacimiento: '1992-07-21',
      sexo: 'F',
    },
  },
  laboratorio: {
    pacienteId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    expedienteId: 'e3333333-3333-3333-3333-333333333333',
    actorId: '33333333-3333-3333-3333-333333333333',
    datos: {
      dpi: '3011223344556',
      nombres: 'Luis',
      apellidos: 'Pérez Demo',
      fechaNacimiento: '1979-01-20',
      sexo: 'M',
    },
  },
  pediatrico: {
    pacienteId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    expedienteId: 'e4444444-4444-4444-4444-444444444444',
    actorId: '44444444-4444-4444-4444-444444444444',
    datos: {
      dpi: '4099887766554',
      nombres: 'Ana',
      apellidos: 'Hernández Demo',
      fechaNacimiento: '2020-05-02',
      sexo: 'F',
    },
  },
};
