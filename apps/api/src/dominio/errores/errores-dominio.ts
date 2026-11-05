import type { PacienteId } from '../../compartido/tipos';

/**
 * Base de todos los errores de dominio. Permite a la capa HTTP distinguirlos de fallos
 * de infraestructura sin conocer cada clase, y al dominio no depender de HTTP.
 * Los mensajes solo llevan identificadores o el nombre del campo, nunca datos restringidos.
 */
export abstract class ErrorDeDominio extends Error {
  protected constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class PacienteNoEncontrado extends ErrorDeDominio {
  constructor(readonly pacienteId: PacienteId) {
    super(`Paciente no encontrado: ${pacienteId}`);
  }
}

export class ConsultaNoEncontrada extends ErrorDeDominio {
  constructor(readonly consultaId: string) {
    super(`Consulta no encontrada: ${consultaId}`);
  }
}

export class ExpedienteArchivado extends ErrorDeDominio {
  constructor(readonly pacienteId: PacienteId) {
    super(`El expediente está archivado: ${pacienteId}`);
  }
}

export class ConflictoDeConcurrencia extends ErrorDeDominio {
  constructor(readonly pacienteId: PacienteId) {
    super(`Conflicto de concurrencia al guardar expediente: ${pacienteId}`);
  }
}

export class CitaSolapada extends ErrorDeDominio {
  constructor() {
    super('La cita se solapa con otra del mismo médico');
  }
}

export class DatosInvalidos extends ErrorDeDominio {
  constructor(readonly campo: string) {
    super(`Dato inválido: ${campo}`);
  }
}

export class HistorialInconsistente extends ErrorDeDominio {
  constructor(readonly pacienteId: PacienteId) {
    super(`Historial de eventos inconsistente: ${pacienteId}`);
  }
}
