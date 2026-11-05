import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, marcarConsultaId, type PacienteId } from '../compartido/tipos';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import { exigirTexto } from './validacion';
import { aVista } from './vista';

@Injectable()
export class RecetarMedicamento {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    consultaId: string,
    entrada: { readonly textoLibre: string; readonly dosis: string; readonly frecuencia: string; readonly duracionDias?: number },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (entrada.duracionDias !== undefined && (!Number.isInteger(entrada.duracionDias) || entrada.duracionDias < 1)) {
      throw new DatosInvalidos('duracionDias');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.recetar(
      marcarConsultaId(consultaId),
      {
        id: randomUUID(),
        textoLibre: exigirTexto(entrada.textoLibre, 'textoLibre'),
        dosis: exigirTexto(entrada.dosis, 'dosis'),
        frecuencia: exigirTexto(entrada.frecuencia, 'frecuencia'),
        duracionDias: entrada.duracionDias,
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'receta' });
    return aVista(siguiente);
  }
}
