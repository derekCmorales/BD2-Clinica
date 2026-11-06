import type { PacienteId } from '../../compartido/tipos';
import type { EntradaAuditoria } from './audit-log';

/**
 * Puerto de lectura de la bitácora. Separado de AuditLog (escritura) para no mezclar
 * responsabilidades: el adaptador puede implementar ambos, pero los casos de uso
 * dependen solo del que necesitan.
 *
 * Devuelve metadatos (actor, acción, recurso, fecha), nunca el payload clínico.
 */
export interface ConsultaDeAuditoria {
  entradasDe(pacienteId: PacienteId): Promise<readonly EntradaAuditoria[]>;
}

export const CONSULTA_DE_AUDITORIA = Symbol('CONSULTA_DE_AUDITORIA');
