import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, esUuid, marcarCitaId, type PacienteId } from '../compartido/tipos';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import {
  EXPEDIENTE_QUERY_SERVICE,
  type ExpedienteQueryService,
  type ExpedienteVistaDTO,
  type VacunaPendienteDTO,
} from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import { exigirFdi, exigirTexto } from './validacion';
import { aVista } from './vista';

@Injectable()
export class CerrarCita {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    citaId: string,
    estado: string,
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (estado !== 'cancelada' && estado !== 'inasistencia') {
      throw new DatosInvalidos('estado');
    }
    if (!esUuid(citaId)) {
      throw new DatosInvalidos('citaId');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.cerrarCita(marcarCitaId(citaId), estado, actor.actorId, ahoraIso());
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'cita' });
    return aVista(siguiente);
  }
}

@Injectable()
export class RegistrarProcedimiento {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly codigoFdi: number; readonly consultaId: string; readonly tipo: string; readonly descripcion: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (!esUuid(entrada.consultaId)) {
      throw new DatosInvalidos('consultaId');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.registrarProcedimiento(
      {
        id: randomUUID(),
        codigoFdi: exigirFdi(entrada.codigoFdi),
        consultaId: entrada.consultaId,
        tipo: exigirTexto(entrada.tipo, 'tipo'),
        descripcion: exigirTexto(entrada.descripcion, 'descripcion'),
        realizadoEn: ahoraIso(),
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'procedimiento_dental' });
    return aVista(siguiente);
  }
}

@Injectable()
export class DictaminarExamen {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    examenId: string,
    estado: string,
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (estado !== 'validado' && estado !== 'anulado') {
      throw new DatosInvalidos('estado');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.dictaminarExamen(examenId, estado, actor.actorId, ahoraIso());
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'resultado_examen' });
    return aVista(siguiente);
  }
}

@Injectable()
export class ListarVacunasPendientes {
  constructor(@Inject(EXPEDIENTE_QUERY_SERVICE) private readonly consultas: ExpedienteQueryService) {}

  ejecutar(hasta: string): Promise<VacunaPendienteDTO[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      throw new DatosInvalidos('hasta');
    }
    return this.consultas.vacunasPendientes(hasta);
  }
}
