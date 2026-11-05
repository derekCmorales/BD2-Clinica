import { esUuid, type PacienteId } from '../compartido/tipos';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import {
  CAMPOS_POR_TIPO_EXAMEN,
  ESTADOS_PIEZA,
  esCodigoFdi,
  type DatosPaciente,
  type EstadoPieza,
  type Sexo,
  type TipoExamen,
} from '../dominio/modelo/tipos-clinicos';

const SEXOS: readonly Sexo[] = ['M', 'F', 'X'];
const TIPOS: readonly TipoExamen[] = ['hematologia', 'orina', 'cultivo', 'otro'];

export function exigirPacienteId(valor: string): PacienteId {
  if (!esUuid(valor)) {
    throw new DatosInvalidos('pacienteId');
  }
  return valor as PacienteId;
}

export function exigirDatosPaciente(entrada: DatosPaciente): DatosPaciente {
  if (!/^\d{13}$/.test(entrada.dpi)) {
    throw new DatosInvalidos('dpi');
  }
  if (!texto(entrada.nombres) || !texto(entrada.apellidos)) {
    throw new DatosInvalidos('nombre');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fechaNacimiento)) {
    throw new DatosInvalidos('fechaNacimiento');
  }
  if (!SEXOS.includes(entrada.sexo)) {
    throw new DatosInvalidos('sexo');
  }
  return {
    dpi: entrada.dpi,
    nombres: entrada.nombres.trim(),
    apellidos: entrada.apellidos.trim(),
    fechaNacimiento: entrada.fechaNacimiento,
    sexo: entrada.sexo,
    telefono: vacio(entrada.telefono),
    direccion: vacio(entrada.direccion),
    correo: vacio(entrada.correo),
    codigoReferencia: vacio(entrada.codigoReferencia),
    tutorNombre: vacio(entrada.tutorNombre),
    tutorTelefono: vacio(entrada.tutorTelefono),
  };
}

export function exigirTexto(valor: string, campo: string): string {
  if (!texto(valor)) {
    throw new DatosInvalidos(campo);
  }
  return valor.trim();
}

export function exigirTipoExamen(valor: string): TipoExamen {
  if (!TIPOS.includes(valor as TipoExamen)) {
    throw new DatosInvalidos('tipoExamen');
  }
  return valor as TipoExamen;
}

export function exigirValoresExamen(tipo: TipoExamen, valores: Readonly<Record<string, string>>): Record<string, string> {
  const requeridos = CAMPOS_POR_TIPO_EXAMEN[tipo];
  const limpio: Record<string, string> = {};
  for (const campo of requeridos) {
    const valor = valores[campo];
    if (!texto(valor)) {
      throw new DatosInvalidos(campo);
    }
    limpio[campo] = valor.trim();
  }
  return limpio;
}

export function exigirEstadoPieza(valor: string): EstadoPieza {
  if (!ESTADOS_PIEZA.includes(valor as EstadoPieza)) {
    throw new DatosInvalidos('estadoPieza');
  }
  return valor as EstadoPieza;
}

export function exigirFdi(codigo: number): number {
  if (!esCodigoFdi(codigo)) {
    throw new DatosInvalidos('codigoFdi');
  }
  return codigo;
}

export function exigirRangoFecha(inicio: string, fin: string): void {
  if (Number.isNaN(Date.parse(inicio)) || Number.isNaN(Date.parse(fin)) || Date.parse(fin) <= Date.parse(inicio)) {
    throw new DatosInvalidos('rangoCita');
  }
}

function texto(valor: string | undefined): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function vacio(valor: string | undefined): string | undefined {
  if (!texto(valor)) {
    return undefined;
  }
  return valor.trim();
}
