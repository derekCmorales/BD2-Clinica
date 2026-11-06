import { esUuid, type PacienteId } from '../compartido/tipos';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import {
  definicionExamen,
  ESTADOS_PIEZA,
  esCodigoFdi,
  type AntibiogramaEntrada,
  type DatosPaciente,
  type EstadoPieza,
  type Sexo,
  type TipoExamen,
  type ValorExamen,
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

export function exigirValoresExamen(
  tipo: TipoExamen,
  valores: Readonly<Record<string, unknown>>,
): Record<string, ValorExamen> {
  const definicion = definicionExamen(tipo);
  if (!definicion) {
    throw new DatosInvalidos('tipoExamen');
  }
  const limpio: Record<string, ValorExamen> = {};
  for (const campo of definicion.campos) {
    const valor = valores[campo.clave];

    if (campo.tipo === 'antibiograma') {
      if (valor === undefined || valor === null || valor === '') {
        if (campo.requerido) {
          throw new DatosInvalidos(campo.clave);
        }
        continue;
      }
      if (!Array.isArray(valor)) {
        throw new DatosInvalidos(campo.clave);
      }
      const filas = valor.map((fila): AntibiogramaEntrada => {
        if (typeof fila !== 'object' || fila === null) {
          throw new DatosInvalidos(campo.clave);
        }
        const antibiotico = (fila as { antibiotico?: unknown }).antibiotico;
        const sensibilidad = (fila as { sensibilidad?: unknown }).sensibilidad;
        if (!texto(antibiotico) || (sensibilidad !== 'S' && sensibilidad !== 'I' && sensibilidad !== 'R')) {
          throw new DatosInvalidos(campo.clave);
        }
        return { antibiotico: antibiotico.trim(), sensibilidad };
      });
      if (filas.length > 0) {
        limpio[campo.clave] = filas;
      }
      continue;
    }

    if (!texto(valor)) {
      if (campo.requerido) {
        throw new DatosInvalidos(campo.clave);
      }
      continue;
    }
    const textoValor = valor.trim();
    if (campo.tipo === 'numero' && !Number.isFinite(Number(textoValor))) {
      throw new DatosInvalidos(campo.clave);
    }
    if (campo.tipo === 'lista' && campo.opciones && !campo.opciones.includes(textoValor)) {
      throw new DatosInvalidos(campo.clave);
    }
    limpio[campo.clave] = textoValor;
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

function texto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function vacio(valor: string | undefined): string | undefined {
  if (!texto(valor)) {
    return undefined;
  }
  return valor.trim();
}
