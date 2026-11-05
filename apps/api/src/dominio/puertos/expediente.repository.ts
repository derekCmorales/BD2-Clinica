import type { PacienteId } from '../../compartido/tipos';
import type { Expediente } from '../modelo/expediente';

/**
 * Puerto de escritura del aggregate Expediente.
 * Cada adaptador implementa guardar() con una estrategia de consistencia distinta — AGENTS.md §6.
 */
export interface ExpedienteRepository {
  obtener(pacienteId: PacienteId): Promise<Expediente | null>;
  /** @throws ConflictoDeConcurrencia */
  guardar(expediente: Expediente): Promise<void>;
}

export const EXPEDIENTE_REPOSITORY = Symbol('EXPEDIENTE_REPOSITORY');
