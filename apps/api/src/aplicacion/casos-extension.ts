import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ahoraIso, marcarActorId, marcarCitaId, type PacienteId } from '../compartido/tipos';
import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import { AUDIT_LOG, type AuditLog } from '../dominio/puertos/audit-log';
import { EXPEDIENTE_REPOSITORY, type ExpedienteRepository } from '../dominio/puertos/expediente.repository';
import type { ExpedienteVistaDTO } from '../dominio/puertos/expediente-query.service';
import { auditar, cargarExpediente, type ActorEnCaso } from './cargar-expediente';
import {
  exigirEstadoPieza,
  exigirFdi,
  exigirRangoFecha,
  exigirTexto,
  exigirTipoExamen,
  exigirValoresExamen,
} from './validacion';
import { aVista } from './vista';

@Injectable()
export class ReservarCita {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly inicio: string; readonly fin: string; readonly motivo: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    exigirRangoFecha(entrada.inicio, entrada.fin);
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.reservarCita(
      {
        id: marcarCitaId(randomUUID()),
        medicoId: marcarActorId(actor.actorId),
        inicio: entrada.inicio,
        fin: entrada.fin,
        motivo: exigirTexto(entrada.motivo, 'motivo'),
        estado: 'programada',
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'cita' });
    return aVista(siguiente);
  }
}

@Injectable()
export class RegistrarResultadoExamen {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly tipoExamen: string; readonly fecha: string; readonly valores: Readonly<Record<string, unknown>> },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    const tipo = exigirTipoExamen(entrada.tipoExamen);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fecha)) {
      throw new DatosInvalidos('fecha');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.registrarExamen(
      { id: randomUUID(), tipoExamen: tipo, fecha: entrada.fecha, estado: 'registrado', valores: exigirValoresExamen(tipo, entrada.valores) },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'resultado_examen' });
    return aVista(siguiente);
  }
}

@Injectable()
export class RegistrarMedicion {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly fecha: string; readonly pesoKg: number; readonly tallaCm: number },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fecha)) {
      throw new DatosInvalidos('fecha');
    }
    if (!(entrada.pesoKg > 0) || !(entrada.tallaCm > 0)) {
      throw new DatosInvalidos('medicion');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.registrarMedicion(
      { fecha: entrada.fecha, pesoKg: entrada.pesoKg, tallaCm: entrada.tallaCm },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'medicion' });
    return aVista(siguiente);
  }
}

@Injectable()
export class RegistrarVacuna {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly codigo: string; readonly proximaEn: string; readonly aplicadaEn?: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.proximaEn)) {
      throw new DatosInvalidos('proximaEn');
    }
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.registrarVacuna(
      {
        codigo: exigirTexto(entrada.codigo, 'codigo'),
        proximaEn: entrada.proximaEn,
        aplicadaEn: entrada.aplicadaEn?.trim() || undefined,
      },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'vacuna' });
    return aVista(siguiente);
  }
}

@Injectable()
export class ActualizarPieza {
  constructor(
    @Inject(EXPEDIENTE_REPOSITORY) private readonly expedientes: ExpedienteRepository,
    @Inject(AUDIT_LOG) private readonly auditoria: AuditLog,
  ) {}

  async ejecutar(
    pacienteId: PacienteId,
    entrada: { readonly codigoFdi: number; readonly estado: string },
    actor: ActorEnCaso,
  ): Promise<ExpedienteVistaDTO> {
    const actual = await cargarExpediente(this.expedientes, pacienteId);
    const siguiente = actual.actualizarPieza(
      { codigoFdi: exigirFdi(entrada.codigoFdi), estado: exigirEstadoPieza(entrada.estado) },
      actor.actorId,
      ahoraIso(),
    );
    await this.expedientes.guardar(siguiente);
    await auditar(this.auditoria, { actorId: actor.actorId, pacienteId, accion: 'escritura', recurso: 'pieza_dental' });
    return aVista(siguiente);
  }
}
