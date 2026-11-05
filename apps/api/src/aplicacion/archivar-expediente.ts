import { Inject, Injectable } from '@nestjs/common';
import { ahoraIso, type PacienteId } from '../compartido/tipos';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import { exigirTexto } from './validacion';
import { aVista } from './vista';

@Injectable()
export class ArchivarExpediente {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(pacienteId: PacienteId, motivo: string, actor: ActorEnCaso): Promise<ExpedienteVistaDTO> {
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.archivar(exigirTexto(motivo, 'motivo'), actor.actorId, ahoraIso());
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'expediente' });
    return aVista(siguiente);
  }
}
