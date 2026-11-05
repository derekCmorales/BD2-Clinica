import type { PacienteId } from '../../compartido/tipos';

export interface ResumenExpedienteDTO {
  readonly pacienteId: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly estado: 'activo' | 'archivado';
}

export interface CriterioBusqueda {
  readonly texto: string;
}

/**
 * Puerto de lectura. El DTO no incluye teléfono, dirección, diagnósticos ni resultados.
 * Esos campos solo salen en la vista completa, y esa lectura queda auditada.
 */
export interface ExpedienteQueryService {
  porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null>;
  buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]>;
  vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]>;
}

export interface VacunaPendienteDTO {
  readonly pacienteId: string;
  readonly nombres: string;
  readonly apellidos: string;
  readonly codigo: string;
  readonly proximaEn: string;
}

export interface ExpedienteVistaDTO {
  readonly pacienteId: string;
  readonly expedienteId: string;
  readonly version: number;
  readonly estado: 'activo' | 'archivado';
  readonly motivoArchivo?: string;
  readonly paciente: {
    readonly dpi: string;
    readonly nombres: string;
    readonly apellidos: string;
    readonly fechaNacimiento: string;
    readonly sexo: string;
    readonly telefono?: string;
    readonly direccion?: string;
    readonly correo?: string;
    readonly codigoReferencia?: string;
    readonly tutorNombre?: string;
    readonly tutorTelefono?: string;
  };
  readonly consultas: readonly {
    readonly id: string;
    readonly medicoId: string;
    readonly ocurridaEn: string;
    readonly motivo: string;
    readonly notas?: string;
    readonly citaId?: string;
    readonly diagnosticos: readonly {
      readonly id: string;
      readonly textoLibre: string;
      readonly esPrincipal: boolean;
      readonly catalogoCodigo?: string;
    }[];
    readonly recetas: readonly {
      readonly id: string;
      readonly textoLibre: string;
      readonly dosis: string;
      readonly frecuencia: string;
      readonly duracionDias?: number;
    }[];
  }[];
  readonly citas: readonly {
    readonly id: string;
    readonly medicoId: string;
    readonly inicio: string;
    readonly fin: string;
    readonly motivo: string;
    readonly estado: string;
  }[];
  readonly examenes: readonly {
    readonly id: string;
    readonly tipoExamen: string;
    readonly fecha: string;
    readonly estado: string;
    readonly valores: Readonly<Record<string, string>>;
  }[];
  readonly mediciones: readonly {
    readonly fecha: string;
    readonly pesoKg: number;
    readonly tallaCm: number;
  }[];
  readonly vacunas: readonly {
    readonly codigo: string;
    readonly proximaEn: string;
    readonly aplicadaEn?: string;
  }[];
  readonly piezas: readonly {
    readonly codigoFdi: number;
    readonly estado: string;
  }[];
  readonly procedimientos: readonly {
    readonly id: string;
    readonly codigoFdi: number;
    readonly consultaId: string;
    readonly tipo: string;
    readonly descripcion: string;
    readonly realizadoEn: string;
  }[];
}

export const EXPEDIENTE_QUERY_SERVICE = Symbol('EXPEDIENTE_QUERY_SERVICE');
