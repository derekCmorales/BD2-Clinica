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

export interface AntibiogramaEntrada {
  readonly antibiotico: string;
  readonly sensibilidad: 'S' | 'I' | 'R';
}

export type ValorExamen = string | readonly AntibiogramaEntrada[];

export interface ResultadoExamen {
  readonly id: string;
  readonly tipoExamen: TipoExamen;
  readonly fecha: string;
  readonly estado: EstadoResultado;
  readonly valores: Readonly<Record<string, ValorExamen>>;
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

export type TipoCampoExamen = 'texto' | 'numero' | 'lista' | 'antibiograma';

export interface ReferenciaExamen {
  readonly min?: number;
  readonly max?: number;
}

export interface CampoExamen {
  readonly clave: string;
  readonly etiqueta: string;
  readonly unidad?: string;
  readonly requerido: boolean;
  readonly tipo: TipoCampoExamen;
  readonly opciones?: readonly string[];
  readonly referencia?: ReferenciaExamen;
}

export interface DefinicionExamen {
  readonly tipo: TipoExamen;
  readonly etiqueta: string;
  readonly campos: readonly CampoExamen[];
}

/**
 * Fuente única de la estructura de cada examen. El endpoint de catálogo, la validación,
 * el formulario del cliente y la migración de Mongo se derivan de aquí.
 */
export const CATALOGO_EXAMENES: readonly DefinicionExamen[] = [
  {
    tipo: 'hematologia',
    etiqueta: 'Hematología',
    campos: [
      { clave: 'hemoglobina', etiqueta: 'Hemoglobina', unidad: 'g/dL', requerido: true, tipo: 'numero', referencia: { min: 12, max: 17.5 } },
      { clave: 'hematocrito', etiqueta: 'Hematocrito', unidad: '%', requerido: true, tipo: 'numero', referencia: { min: 36, max: 52 } },
      { clave: 'leucocitos', etiqueta: 'Leucocitos', unidad: '×10³/µL', requerido: true, tipo: 'numero', referencia: { min: 4, max: 11 } },
      { clave: 'plaquetas', etiqueta: 'Plaquetas', unidad: '×10³/µL', requerido: true, tipo: 'numero', referencia: { min: 150, max: 450 } },
      { clave: 'eritrocitos', etiqueta: 'Eritrocitos', unidad: '×10⁶/µL', requerido: true, tipo: 'numero', referencia: { min: 4.2, max: 5.9 } },
    ],
  },
  {
    tipo: 'orina',
    etiqueta: 'Orina',
    campos: [
      { clave: 'color', etiqueta: 'Color', requerido: true, tipo: 'lista', opciones: ['amarillo', 'ámbar', 'rojo', 'incoloro'] },
      { clave: 'aspecto', etiqueta: 'Aspecto', requerido: true, tipo: 'lista', opciones: ['claro', 'turbio'] },
      { clave: 'ph', etiqueta: 'pH', requerido: true, tipo: 'numero', referencia: { min: 4.5, max: 8 } },
      { clave: 'densidad', etiqueta: 'Densidad', requerido: true, tipo: 'numero', referencia: { min: 1.005, max: 1.03 } },
      { clave: 'proteinas', etiqueta: 'Proteínas', requerido: true, tipo: 'lista', opciones: ['negativo', 'trazas', 'positivo'] },
      { clave: 'glucosa', etiqueta: 'Glucosa', requerido: true, tipo: 'lista', opciones: ['negativo', 'trazas', 'positivo'] },
      { clave: 'leucocitos', etiqueta: 'Leucocitos', unidad: '/campo', requerido: true, tipo: 'numero', referencia: { min: 0, max: 5 } },
    ],
  },
  {
    tipo: 'cultivo',
    etiqueta: 'Cultivo',
    campos: [
      { clave: 'muestra', etiqueta: 'Muestra', requerido: true, tipo: 'texto' },
      { clave: 'organismo', etiqueta: 'Organismo aislado', requerido: true, tipo: 'texto' },
      { clave: 'recuentoUfc', etiqueta: 'Recuento UFC', unidad: 'UFC/mL', requerido: true, tipo: 'numero' },
      { clave: 'antibiograma', etiqueta: 'Antibiograma', requerido: false, tipo: 'antibiograma' },
    ],
  },
  {
    tipo: 'otro',
    etiqueta: 'Otro',
    campos: [{ clave: 'descripcion', etiqueta: 'Descripción', requerido: true, tipo: 'texto' }],
  },
];

export function definicionExamen(tipo: TipoExamen): DefinicionExamen | undefined {
  return CATALOGO_EXAMENES.find((definicion) => definicion.tipo === tipo);
}

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
