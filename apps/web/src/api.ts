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
    readonly codigo?: string,
  ) {
    super(message);
  }
}

/** Mensajes en lenguaje del médico para los errores de dominio que expone el API. */
const MENSAJES: Record<string, string> = {
  ConflictoDeConcurrencia: 'Alguien más modificó este expediente mientras lo editabas. Se recargó la versión más reciente; revisa y vuelve a intentarlo.',
  ExpedienteArchivado: 'El expediente está archivado: solo se puede consultar.',
  PacienteNoEncontrado: 'No se encontró el paciente.',
  ConsultaNoEncontrada: 'La consulta ya no existe en el expediente.',
  CitaSolapada: 'Ese horario se cruza con otra cita.',
};

export const SESION_EXPIRADA = 'sesion-expirada';

export async function llamar<T>(ruta: string, token: string | null, init?: RequestInit): Promise<T> {
  const encabezados = new Headers(init?.headers);
  encabezados.set('Content-Type', 'application/json');
  if (token) {
    encabezados.set('Authorization', `Bearer ${token}`);
  }
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, { ...init, headers: encabezados });
  } catch {
    throw new ErrorApi('No hay conexión con el servidor.', 0);
  }
  const cuerpo = (await respuesta.json().catch(() => null)) as
    | { mensaje?: string; error?: string; message?: string | string[] }
    | null;
  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      window.dispatchEvent(new Event(SESION_EXPIRADA));
      throw new ErrorApi('Tu sesión expiró. Vuelve a ingresar.', 401);
    }
    if (respuesta.status === 401) {
      throw new ErrorApi('Clave incorrecta para esta institución.', 401);
    }
    const codigo = cuerpo?.error;
    const validacion = Array.isArray(cuerpo?.message) ? 'Revisa los campos del formulario.' : undefined;
    const texto = (codigo && MENSAJES[codigo]) ?? cuerpo?.mensaje ?? validacion ?? 'No se pudo completar la operación.';
    throw new ErrorApi(texto, respuesta.status, codigo);
  }
  return cuerpo as T;
}
