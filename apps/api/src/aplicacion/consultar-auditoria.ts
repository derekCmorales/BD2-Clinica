import { Inject, Injectable } from '@nestjs/common';
import type { PacienteId } from '../compartido/tipos';
import type { EntradaAuditoria } from '../dominio/puertos/audit-log';
import { CONSULTA_DE_AUDITORIA, type ConsultaDeAuditoria } from '../dominio/puertos/consulta-de-auditoria';

/**
 * Lee la bitácora de un paciente. Devuelve solo metadatos; nunca el payload clínico.
 * La lectura de la auditoría no se audita para no crear recursión: la bitácora no es
 * un dato clínico restringido, es evidencia de acceso.
 */
@Injectable()
export class ConsultarAuditoria {
  constructor(@Inject(CONSULTA_DE_AUDITORIA) private readonly auditoria: ConsultaDeAuditoria) {}

  ejecutar(pacienteId: PacienteId): Promise<readonly EntradaAuditoria[]> {
    return this.auditoria.entradasDe(pacienteId);
  }
}
