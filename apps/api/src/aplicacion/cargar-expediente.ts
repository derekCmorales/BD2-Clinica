import { ahoraIso, type ActorId, type PacienteId } from '../compartido/tipos';
import type { Expediente } from '../dominio/modelo/expediente';
import { PacienteNoEncontrado } from '../dominio/errores/errores-dominio';
import type { AuditLog, EntradaAuditoria } from '../dominio/puertos/audit-log';
import type { ExpedienteRepository } from '../dominio/puertos/expediente.repository';

export interface ActorEnCaso {
  readonly actorId: ActorId;
  readonly institucionId: string;
}

export async function cargarExpediente(
  repositorio: ExpedienteRepository,
  pacienteId: PacienteId,
): Promise<Expediente> {
  const expediente = await repositorio.obtener(pacienteId);
  if (!expediente) {
    throw new PacienteNoEncontrado(pacienteId);
  }
  return expediente;
}

export async function auditar(
  auditoria: AuditLog,
  entrada: Omit<EntradaAuditoria, 'ocurridoEn'>,
): Promise<void> {
  await auditoria.registrar({ ...entrada, ocurridoEn: ahoraIso() });
}
