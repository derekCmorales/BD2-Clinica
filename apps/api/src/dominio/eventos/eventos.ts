import type { ActorId, PacienteId } from '../../compartido/tipos';
import type {
  Cita,
  Consulta,
  DatosPaciente,
  Diagnostico,
  Medicion,
  PiezaDental,
  ProcedimientoDental,
  Receta,
  ResultadoExamen,
  Vacuna,
} from '../modelo/tipos-clinicos';

interface EventoBase<T extends string, P> {
  readonly tipo: T;
  readonly version: number;
  readonly ocurridoEn: string;
  readonly actorId: ActorId;
  readonly payload: P;
}

export type ConsultaRegistradaPayload = Omit<Consulta, 'diagnosticos' | 'recetas'>;

export type EventoDeDominio =
  | EventoBase<'ExpedienteCreado', { readonly expedienteId: string; readonly datos: DatosPaciente }>
  | EventoBase<'ConsultaRegistrada', { readonly consulta: ConsultaRegistradaPayload }>
  | EventoBase<'DiagnosticoAgregado', { readonly consultaId: string; readonly diagnostico: Diagnostico }>
  | EventoBase<'MedicamentoRecetado', { readonly consultaId: string; readonly receta: Receta }>
  | EventoBase<'ExpedienteArchivado', { readonly motivo: string }>
  | EventoBase<'CitaReservada', { readonly cita: Cita }>
  | EventoBase<'ResultadoExamenRegistrado', { readonly examen: ResultadoExamen }>
  | EventoBase<'MedicionRegistrada', { readonly medicion: Medicion }>
  | EventoBase<'VacunaRegistrada', { readonly vacuna: Vacuna }>
  | EventoBase<'PiezaActualizada', { readonly pieza: PiezaDental }>
  | EventoBase<'CitaCerrada', { readonly citaId: string; readonly estado: 'cancelada' | 'inasistencia' }>
  | EventoBase<'ProcedimientoRegistrado', { readonly procedimiento: ProcedimientoDental }>
  | EventoBase<'ResultadoExamenDictaminado', { readonly examenId: string; readonly estado: 'validado' | 'anulado' }>;

export type TipoEvento = EventoDeDominio['tipo'];

export interface EventoPersistido {
  readonly pacienteId: PacienteId;
  readonly evento: EventoDeDominio;
}
