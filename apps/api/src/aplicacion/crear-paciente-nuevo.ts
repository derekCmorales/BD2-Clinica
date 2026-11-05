import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, marcarActorId, marcarPacienteId, type PacienteId } from '../compartido/tipos';
import { Expediente } from '../dominio/modelo/expediente';
import type { DatosPaciente } from '../dominio/modelo/tipos-clinicos';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import type { ActorEnCaso } from './cargar-expediente';
import { auditar } from './cargar-expediente';
import { exigirDatosPaciente } from './validacion';
import { aVista } from './vista';

@Injectable()
export class CrearPacienteNuevo {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(datos: DatosPaciente, actor: ActorEnCaso): Promise<ExpedienteVistaDTO> {
    const pacienteId: PacienteId = marcarPacienteId(randomUUID());
    const expediente = Expediente.crear({
      pacienteId,
      expedienteId: randomUUID(),
      datos: exigirDatosPaciente(datos),
      actorId: marcarActorId(actor.actorId),
      ahora: ahoraIso(),
    });
    await this.expedientes.guardar(expediente);
    await auditar(this.auditoria, {
      actorId: actor.actorId,
      pacienteId,
      accion: 'escritura',
      recurso: 'paciente',
    });
    return aVista(expediente);
  }
}
