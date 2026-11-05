import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, marcarConsultaId, type PacienteId } from '../compartido/tipos';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import { exigirTexto } from './validacion';
import { aVista } from './vista';

@Injectable()
export class AgregarDiagnostico {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    consultaId: string,
    entrada: { readonly textoLibre: string; readonly esPrincipal?: boolean; readonly catalogoCodigo?: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.agregarDiagnostico(
      marcarConsultaId(consultaId),
      {
        id: randomUUID(),
        textoLibre: exigirTexto(entrada.textoLibre, 'textoLibre'),
        esPrincipal: entrada.esPrincipal === true,
        catalogoCodigo: entrada.catalogoCodigo?.trim() || undefined,
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'diagnostico' });
    return aVista(siguiente);
  }
}
