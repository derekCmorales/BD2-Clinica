export interface Sesion {
  token: string;
  institucionId: string;
  nombre: string;
  correo: string;
}

export interface Resumen {
  pacienteId: string;
  nombres: string;
  apellidos: string;
  estado: 'activo' | 'archivado';
}

export interface ExpedienteVista {
  pacienteId: string;
  expedienteId: string;
  version: number;
  estado: 'activo' | 'archivado';
  motivoArchivo?: string;
  paciente: {
    dpi: string;
    nombres: string;
    apellidos: string;
    fechaNacimiento: string;
    sexo: string;
    telefono?: string;
    codigoReferencia?: string;
    tutorNombre?: string;
    tutorTelefono?: string;
  };
  consultas: Array<{
    id: string;
    ocurridaEn: string;
    motivo: string;
    notas?: string;
    citaId?: string;
    diagnosticos: Array<{ id: string; textoLibre: string; esPrincipal: boolean }>;
    recetas: Array<{ id: string; textoLibre: string; dosis: string; frecuencia: string }>;
  }>;
  citas: Array<{ id: string; inicio: string; fin: string; motivo: string; estado: string }>;
  examenes: Array<{ id: string; tipoExamen: string; fecha: string; estado?: string; valores: Record<string, string> }>;
  mediciones: Array<{ fecha: string; pesoKg: number; tallaCm: number }>;
  vacunas: Array<{ codigo: string; proximaEn: string; aplicadaEn?: string }>;
  piezas: Array<{ codigoFdi: number; estado: string }>;
  procedimientos?: Array<{ id: string; codigoFdi: number; consultaId: string; tipo: string; descripcion: string; realizadoEn: string }>;
}

export interface VacunaPendiente {
  pacienteId: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  proximaEn: string;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly estado: number,
  ) {
    super(message);
  }
}

export async function llamar<T>(ruta: string, token: string | null, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set('Content-Type', 'application/json');
  if (token) {
    encabezados.set('Authorization', `Bearer ${token}`);
  }
  const respuesta = await fetch(ruta, { ...init, headers: encabezados });
  const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo?.mensaje ?? 'No se pudo completar la operación', respuesta.status);
  }
  return cuerpo as T;
}
