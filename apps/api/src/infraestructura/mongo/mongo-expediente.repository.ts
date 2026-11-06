import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as os from 'os';
import { MongoClient, type ClientSession, type Collection, type Document } from 'mongodb';
import { marcarActorId, marcarPacienteId, type PacienteId } from '../../compartido/tipos';
import { dosisPendientes } from '../../aplicacion/dosis-pendientes';
import { aVista } from '../../aplicacion/vista';
import { Expediente } from '../../dominio/modelo/expediente';
import type { Cita, DatosPaciente, ResultadoExamen, ValorExamen } from '../../dominio/modelo/tipos-clinicos';
import { CitaSolapada, ConflictoDeConcurrencia } from '../../dominio/errores/errores-dominio';
import type { AuditLog, EntradaAuditoria } from '../../dominio/puertos/audit-log';
import type { ConsultaDeAuditoria } from '../../dominio/puertos/consulta-de-auditoria';
import type { ExpedienteRepository } from '../../dominio/puertos/expediente.repository';
import type {
  CriterioBusqueda,
  ExpedienteQueryService,
  ExpedienteVistaDTO,
  ResumenExpedienteDTO,
  VacunaPendienteDTO,
} from '../../dominio/puertos/expediente-query.service';

interface DocumentoExpediente extends Document {
  readonly pacienteId: string;
  readonly expedienteId: string;
  readonly version: number;
  readonly estado: 'activo' | 'archivado';
  readonly motivoArchivo?: string;
  readonly datos: DatosPaciente;
  readonly consultas: Expediente['consultas'];
  readonly citas: readonly Cita[];
  readonly mediciones: Expediente['mediciones'];
  readonly vacunas: Expediente['vacunas'];
  readonly piezas: Expediente['piezas'];
  readonly procedimientos?: Expediente['procedimientos'];
}

/**
 * Laboratorio: replaceOne con la versión en el filtro (concurrencia optimista sobre el documento).
 * Los exámenes no van embebidos: colección `examenes`, validada por tipo.
 */
@Injectable()
export class MongoExpedienteRepository
  implements ExpedienteRepository, ExpedienteQueryService, AuditLog, ConsultaDeAuditoria
{
  private cliente?: MongoClient;

  constructor(private readonly config: ConfigService) {}

  async obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    const documento = await this.expedientes().findOne({ pacienteId });
    if (!documento) {
      return null;
    }
    const examenes = await this.examenes().find({ pacienteId }).sort({ fecha: -1 }).toArray();
    return Expediente.rehidratar({
      pacienteId,
      expedienteId: documento.expedienteId,
      version: documento.version,
      estado: documento.estado,
      motivoArchivo: documento.motivoArchivo,
      datos: documento.datos,
      consultas: documento.consultas ?? [],
      citas: documento.citas ?? [],
      examenes: examenes.map((examen) => ({
        id: String(examen.id),
        tipoExamen: examen.tipoExamen,
        fecha: String(examen.fecha),
        estado: (examen.estado as ResultadoExamen['estado']) ?? 'registrado',
        valores: examen.valores as Record<string, ValorExamen>,
      })),
      mediciones: documento.mediciones ?? [],
      vacunas: documento.vacunas ?? [],
      piezas: documento.piezas ?? [],
      procedimientos: documento.procedimientos ?? [],
    });
  }

  async guardar(expediente: Expediente): Promise<void> {
    if (expediente.eventosPendientes.length === 0) {
      return;
    }
    const esperado = expediente.version;
    const confirmado = expediente.confirmado();
    const documento: DocumentoExpediente = {
      pacienteId: confirmado.pacienteId,
      expedienteId: confirmado.expedienteId,
      version: confirmado.version,
      estado: confirmado.estado,
      motivoArchivo: confirmado.motivoArchivo,
      datos: confirmado.datos,
      consultas: confirmado.consultas,
      citas: confirmado.citas,
      mediciones: confirmado.mediciones,
      vacunas: confirmado.vacunas,
      piezas: confirmado.piezas,
      procedimientos: confirmado.procedimientos,
    };
    const sesion = this.conexion().startSession();
    try {
      await sesion.withTransaction(async () => {
        await this.exigirAgendaLibre(expediente, sesion);
        const resultado = await this.expedientes().replaceOne(
          { pacienteId: expediente.pacienteId, version: esperado },
          documento,
          { upsert: esperado === 0, session: sesion },
        );
        if (resultado.matchedCount === 0 && resultado.upsertedCount === 0) {
          throw new ConflictoDeConcurrencia(expediente.pacienteId);
        }
        await this.examenes().deleteMany({ pacienteId: expediente.pacienteId }, { session: sesion });
        if (confirmado.examenes.length > 0) {
          await this.examenes().insertMany(
            confirmado.examenes.map((examen) => ({ ...examen, pacienteId: expediente.pacienteId })),
            { session: sesion },
          );
        }
      });
    } catch (error) {
      if (esDuplicado(error)) {
        throw new ConflictoDeConcurrencia(expediente.pacienteId);
      }
      throw error;
    } finally {
      await sesion.endSession();
    }
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const expediente = await this.obtener(pacienteId);
    return expediente ? aVista(expediente) : null;
  }

  async buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    const texto = criterio.texto.trim();
    const filtro = texto
      ? {
          $or: [
            { 'datos.nombres': { $regex: escapar(texto), $options: 'i' } },
            { 'datos.apellidos': { $regex: escapar(texto), $options: 'i' } },
            { 'datos.dpi': { $regex: escapar(texto), $options: 'i' } },
          ],
        }
      : {};
    const filas = await this.expedientes().find(filtro).limit(20).toArray();
    return filas.map((fila) => ({
      pacienteId: fila.pacienteId,
      nombres: fila.datos.nombres,
      apellidos: fila.datos.apellidos,
      estado: fila.estado,
    }));
  }

  async vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    const filas = await this.expedientes().find({}, { projection: { pacienteId: 1, datos: 1, vacunas: 1 } }).toArray();
    return dosisPendientes(
      filas.map((fila) => ({
        pacienteId: fila.pacienteId,
        datos: fila.datos,
        vacunas: fila.vacunas ?? [],
      })),
      hasta,
    );
  }

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    await this.conexion().db().collection('auditoria').insertOne({
      id: randomUUID(),
      actorId: entrada.actorId,
      pacienteId: entrada.pacienteId,
      accion: entrada.accion,
      recurso: entrada.recurso,
      ocurridoEn: entrada.ocurridoEn,
    });
  }

  async entradasDe(pacienteId: PacienteId): Promise<readonly EntradaAuditoria[]> {
    const filas = await this.conexion()
      .db()
      .collection('auditoria')
      .find({ pacienteId })
      .sort({ ocurridoEn: -1 })
      .limit(100)
      .toArray();
    return filas.map((fila) => ({
      actorId: marcarActorId(String(fila.actorId)),
      pacienteId: marcarPacienteId(String(fila.pacienteId)),
      accion: fila.accion,
      recurso: String(fila.recurso),
      ocurridoEn: String(fila.ocurridoEn),
    }));
  }

  async cerrar(): Promise<void> {
    await this.cliente?.close();
  }

  private async exigirAgendaLibre(expediente: Expediente, sesion: ClientSession): Promise<void> {
    const cita = [...expediente.eventosPendientes].reverse().find((evento) => evento.tipo === 'CitaReservada');
    if (!cita || cita.tipo !== 'CitaReservada') {
      return;
    }
    const reservada = cita.payload.cita;
    const ajenos = await this.expedientes().find(
      { pacienteId: { $ne: expediente.pacienteId }, 'citas.medicoId': reservada.medicoId },
      { session: sesion },
    ).toArray();
    const choca = ajenos.some((documento) =>
      documento.citas.some(
        (existente) =>
          existente.medicoId === reservada.medicoId &&
          existente.estado !== 'cancelada' &&
          existente.estado !== 'inasistencia' &&
          new Date(existente.inicio).getTime() < new Date(reservada.fin).getTime() &&
          new Date(reservada.inicio).getTime() < new Date(existente.fin).getTime(),
      ),
    );
    if (choca) {
      throw new CitaSolapada();
    }
  }

  private expedientes(): Collection<DocumentoExpediente> {
    return this.conexion().db().collection<DocumentoExpediente>('expedientes');
  }

  private examenes(): Collection<Document> {
    return this.conexion().db().collection('examenes');
  }

  private conexion(): MongoClient {
    if (!this.cliente) {
      const uri = this.config.get<string>(
        'MONGO_URI',
        'mongodb://laboratorio_app:laboratorio_app_dev@localhost:27018/laboratorio?authSource=laboratorio&directConnection=true',
      );
      // `runtimeAdapters.os` evita el import() dinámico del driver, que se cuelga bajo Jest.
      this.cliente = new MongoClient(uri, { runtimeAdapters: { os } });
    }
    return this.cliente;
  }
}

function esDuplicado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
