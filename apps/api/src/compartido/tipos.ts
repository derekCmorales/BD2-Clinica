/** Tipos y utilidades sin dependencias de Nest ni drivers. */

declare const marca: unique symbol;
type ConMarca<T, M extends string> = T & { readonly [marca]: M };

export type PacienteId = ConMarca<string, 'PacienteId'>;
export type ConsultaId = ConMarca<string, 'ConsultaId'>;
export type ActorId = ConMarca<string, 'ActorId'>;
export type CitaId = ConMarca<string, 'CitaId'>;

export type InstitucionId = 'hospital' | 'odontologia' | 'laboratorio' | 'pediatrico';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: string): boolean {
  return UUID.test(valor);
}

export function esPacienteId(valor: string): valor is PacienteId {
  return esUuid(valor);
}

export function marcarPacienteId(valor: string): PacienteId {
  if (!esPacienteId(valor)) {
    throw new Error('UUID de paciente inválido');
  }
  return valor;
}

export function marcarConsultaId(valor: string): ConsultaId {
  if (!esUuid(valor)) {
    throw new Error('UUID de consulta inválido');
  }
  return valor as ConsultaId;
}

export function marcarActorId(valor: string): ActorId {
  if (!esUuid(valor)) {
    throw new Error('UUID de actor inválido');
  }
  return valor as ActorId;
}

export function marcarCitaId(valor: string): CitaId {
  if (!esUuid(valor)) {
    throw new Error('UUID de cita inválido');
  }
  return valor as CitaId;
}

export function esInstitucionId(valor: string): valor is InstitucionId {
  return valor === 'hospital' || valor === 'odontologia' || valor === 'laboratorio' || valor === 'pediatrico';
}

export function ahoraIso(): string {
  return new Date().toISOString();
}
