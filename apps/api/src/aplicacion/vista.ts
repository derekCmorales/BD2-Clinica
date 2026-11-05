import type { Expediente } from '../dominio/modelo/expediente';
import type { ExpedienteVistaDTO, ResumenExpedienteDTO } from '../dominio/puertos/expediente-query.service';

export function aVista(expediente: Expediente): ExpedienteVistaDTO {
  const confirmado = expediente.confirmado();
  return {
    pacienteId: confirmado.pacienteId,
    expedienteId: confirmado.expedienteId,
    version: confirmado.version,
    estado: confirmado.estado,
    motivoArchivo: confirmado.motivoArchivo,
    paciente: confirmado.datos,
    consultas: confirmado.consultas,
    citas: confirmado.citas,
    examenes: confirmado.examenes,
    mediciones: confirmado.mediciones,
    vacunas: confirmado.vacunas,
    piezas: confirmado.piezas,
    procedimientos: confirmado.procedimientos,
  };
}

export function aResumen(expediente: Expediente): ResumenExpedienteDTO {
  return {
    pacienteId: expediente.pacienteId,
    nombres: expediente.datos.nombres,
    apellidos: expediente.datos.apellidos,
    estado: expediente.estado,
  };
}
