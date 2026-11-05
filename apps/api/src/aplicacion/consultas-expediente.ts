import { Inject, Injectable } from '@nestjs/common';
import type { PacienteId } from '../compartido/tipos';
import { PacienteNoEncontrado } from '../dominio/errores/errores-dominio';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import {
  EXPEDIENTE_QUERY_SERVICE,
  type ExpedienteQueryService,
  type ExpedienteVistaDTO,
  type ResumenExpedienteDTO,
} from '../dominio/puertos/expediente-query.service';
import { auditar, type ActorEnCaso } from './cargar-expediente';

@Injectable()
export class ObtenerExpediente {
  constructor(
    @Inject(EXPEDIENTE_QUERY_SERVICE) private readonly consultas: ExpedienteQueryService,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(pacienteId: PacienteId, actor: ActorEnCaso): Promise<ExpedienteVistaDTO> {
    const vista = await this.consultas.porPaciente(pacienteId);
    if (!vista) {
      throw new PacienteNoEncontrado(pacienteId);
    }
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'lectura', recurso: 'expediente' });
    return vista;
  }
}

@Injectable()
export class BuscarExpedientes {
  constructor(@Inject(EXPEDIENTE_QUERY_SERVICE) private readonly consultas: ExpedienteQueryService) {}

  ejecutar(texto: string): Promise<ResumenExpedienteDTO[]> {
    return this.consultas.buscar({ texto: texto.trim() });
  }
}
