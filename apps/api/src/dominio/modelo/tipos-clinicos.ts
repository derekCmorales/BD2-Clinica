import type { ActorId, CitaId, ConsultaId } from '../../compartido/tipos';

export type Sexo = 'M' | 'F' | 'X';
export type EstadoExpediente = 'activo' | 'archivado';
export type EstadoCita = 'programada' | 'atendida' | 'cancelada' | 'inasistencia';
export type TipoExamen = 'hematologia' | 'orina' | 'cultivo' | 'otro';
export type EstadoResultado = 'registrado' | 'validado' | 'anulado';
export type MotivoCierreCita = 'cancelada' | 'inasistencia';
export type EstadoPieza =
  | 'sano'
  | 'caries'
  | 'obturado'
  | 'corona'
  | 'ausente'
  | 'implante'
  | 'endodoncia'
  | 'otro';

export interface DatosPaciente {
  readonly dpi: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly fechaNacimiento: string;
  readonly sexo: Sexo;
  readonly telefono?: string;
  readonly direccion?: string;
  readonly correo?: string;
  readonly codigoReferencia?: string;
  readonly tutorNombre?: string;
  readonly tutorTelefono?: string;
}

export interface Diagnostico {
  readonly id: string;
  readonly textoLibre: string;
  readonly esPrincipal: boolean;
  readonly catalogoCodigo?: string;
}

export interface Receta {
  readonly id: string;
  readonly textoLibre: string;
  readonly dosis: string;
  readonly frecuencia: string;
  readonly duracionDias?: number;
}

export interface Consulta {
  readonly id: ConsultaId;
  readonly medicoId: ActorId;
  readonly ocurridaEn: string;
  readonly motivo: string;
  readonly notas?: string;
  readonly citaId?: CitaId;
  readonly diagnosticos: readonly Diagnostico[];
  readonly recetas: readonly Receta[];
}

export interface Cita {
  readonly id: CitaId;
  readonly medicoId: ActorId;
  readonly inicio: string;
  readonly fin: string;
  readonly motivo: string;
  readonly estado: EstadoCita;
}

export interface ResultadoExamen {
  readonly id: string;
  readonly tipoExamen: TipoExamen;
  readonly fecha: string;
  readonly estado: EstadoResultado;
  readonly valores: Readonly<Record<string, string>>;
}

export interface ProcedimientoDental {
  readonly id: string;
  readonly codigoFdi: number;
  readonly consultaId: string;
  readonly tipo: string;
  readonly descripcion: string;
  readonly realizadoEn: string;
}

export interface Medicion {
  readonly fecha: string;
  readonly pesoKg: number;
  readonly tallaCm: number;
}

export interface Vacuna {
  readonly codigo: string;
  readonly proximaEn: string;
  readonly aplicadaEn?: string;
}

export interface PiezaDental {
  readonly codigoFdi: number;
  readonly estado: EstadoPieza;
}

export const CAMPOS_POR_TIPO_EXAMEN: Readonly<Record<TipoExamen, readonly string[]>> = {
  hematologia: ['hemoglobina', 'leucocitos'],
  orina: ['color', 'ph'],
  cultivo: ['organismo', 'sensibleA'],
  otro: ['descripcion'],
};

export const ESTADOS_PIEZA: readonly EstadoPieza[] = [
  'sano',
  'caries',
  'obturado',
  'corona',
  'ausente',
  'implante',
  'endodoncia',
  'otro',
];

/** FDI permanente: cuadrante 1–4 y posición 1–8. Misma regla que chk_pieza_fdi. */
export function esCodigoFdi(codigo: number): boolean {
  if (!Number.isInteger(codigo)) {
    return false;
  }
  const cuadrante = Math.floor(codigo / 10);
  const posicion = codigo % 10;
  return cuadrante >= 1 && cuadrante <= 4 && posicion >= 1 && posicion <= 8;
}
