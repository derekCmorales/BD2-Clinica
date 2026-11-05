import type { ActorId, PacienteId } from '../../compartido/tipos';

/** Bitácora append-only. `detalle` no lleva datos restringidos: solo la acción y el recurso. */
export interface EntradaAuditoria {
  readonly actorId: ActorId;
  readonly pacienteId: PacienteId;
  readonly accion: 'lectura' | 'escritura';
  readonly recurso: string;
  readonly ocurridoEn: string;
}

export interface AuditLog {
  registrar(entrada: EntradaAuditoria): Promise<void>;
}

export const AUDIT_LOG = Symbol('AUDIT_LOG');
