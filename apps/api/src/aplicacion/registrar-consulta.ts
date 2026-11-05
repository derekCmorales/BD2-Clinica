import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, esUuid, marcarActorId, marcarCitaId, marcarConsultaId, type PacienteId } from '../compartido/tipos';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import { exigirTexto } from './validacion';
import { aVista } from './vista';

@Injectable()
export class RegistrarConsulta {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly motivo: string; readonly notas?: string; readonly citaId?: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.registrarConsulta(
      {
        id: marcarConsultaId(randomUUID()),
        medicoId: marcarActorId(actor.actorId),
        ocurridaEn: ahoraIso(),
        motivo: exigirTexto(entrada.motivo, 'motivo'),
        notas: entrada.notas?.trim() || undefined,
        citaId: entrada.citaId ? marcarCita(entrada.citaId) : undefined,
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'consulta' });
    return aVista(siguiente);
  }
}

function marcarCita(valor: string) {
  if (!esUuid(valor)) {
    throw new DatosInvalidos('citaId');
  }
  return marcarCitaId(valor);
}
