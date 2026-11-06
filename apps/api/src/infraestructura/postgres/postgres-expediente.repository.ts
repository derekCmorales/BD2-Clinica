import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { Pool, type PoolClient } from 'pg';
import type { PacienteId } from '../../compartido/tipos';
import { marcarActorId, marcarCitaId, marcarConsultaId, marcarPacienteId } from '../../compartido/tipos';
import { aVista } from '../../aplicacion/vista';
import type { EventoDeDominio } from '../../dominio/eventos/eventos';
import { Expediente } from '../../dominio/modelo/expediente';
import type {
  Cita,
  Consulta,
  DatosPaciente,
  Diagnostico,
  Medicion,
  PiezaDental,
  Receta,
  ResultadoExamen,
  Vacuna,
} from '../../dominio/modelo/tipos-clinicos';
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
import { dosisPendientes } from '../../aplicacion/dosis-pendientes';
import { esSolape, esViolacionUnica } from './errores-pg';

interface Extensiones {
  readonly examenes?: readonly ResultadoExamen[];
  readonly mediciones?: readonly Medicion[];
  readonly vacunas?: readonly Vacuna[];
  readonly piezas?: readonly PiezaDental[];
  readonly procedimientos?: Expediente['procedimientos'];
  readonly tutorNombre?: string;
  readonly tutorTelefono?: string;
  readonly codigoReferencia?: string;
}

/**
 * Hospital: INSERT de eventos con UNIQUE(aggregate_id, version).
 * El read model clinico.* se actualiza en la misma transacción (proyector síncrono e idempotente).
 * Decisión de fase 5: no hay consumidor de Redis Streams; el stream se eliminó para que el
 * código y el diseño digan lo mismo. La reconstrucción se hace desde clinico.eventos.
 */
@Injectable()
export class PostgresExpedienteRepository
  implements ExpedienteRepository, ExpedienteQueryService, AuditLog, ConsultaDeAuditoria
{
  private pool?: Pool;

  constructor(private readonly config: ConfigService) {}

  async obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    const pool = this.conexion();
    const cabecera = await pool.query<{
      expediente_id: string;
      estado: 'activo' | 'archivado';
      motivo_archivo: string | null;
      version: number;
      extensiones: Extensiones;
      dpi: string;
      nombres: string;
      apellidos: string;
      fecha_nacimiento: Date | string;
      sexo: DatosPaciente['sexo'];
      telefono: string | null;
      direccion: string | null;
      correo: string | null;
    }>(
      `SELECT e.id AS expediente_id, e.estado, e.motivo_archivo, e.version, e.extensiones,
              p.dpi, p.nombres, p.apellidos, p.fecha_nacimiento, p.sexo, p.telefono, p.direccion, p.correo
       FROM clinico.expediente e
       JOIN clinico.paciente p ON p.id = e.paciente_id
       WHERE e.paciente_id = $1`,
      [pacienteId],
    );
    const fila = cabecera.rows[0];
    if (!fila) {
      return null;
    }
    const [consultas, citas] = await Promise.all([
      this.consultasDe(pool, pacienteId),
      this.citasDe(pool, pacienteId),
    ]);
    const extra = fila.extensiones ?? {};
    return Expediente.rehidratar({
      pacienteId,
      expedienteId: fila.expediente_id,
      estado: fila.estado,
      motivoArchivo: fila.motivo_archivo ?? undefined,
      version: fila.version,
      datos: {
        dpi: fila.dpi,
        nombres: fila.nombres,
        apellidos: fila.apellidos,
        fechaNacimiento: fecha(fila.fecha_nacimiento),
        sexo: fila.sexo,
        telefono: fila.telefono ?? undefined,
        direccion: fila.direccion ?? undefined,
        correo: fila.correo ?? undefined,
        codigoReferencia: extra.codigoReferencia,
        tutorNombre: extra.tutorNombre,
        tutorTelefono: extra.tutorTelefono,
      },
      consultas,
      citas,
      examenes: (extra.examenes ?? []).map((examen) => ({ ...examen, estado: examen.estado ?? 'registrado' })),
      mediciones: extra.mediciones ?? [],
      vacunas: extra.vacunas ?? [],
      piezas: extra.piezas ?? [],
      procedimientos: extra.procedimientos ?? [],
    });
  }

  async guardar(expediente: Expediente): Promise<void> {
    if (expediente.eventosPendientes.length === 0) {
      return;
    }
    const client = await this.conexion().connect();
    try {
      await client.query('BEGIN');
      for (const evento of expediente.eventosPendientes) {
        try {
          await client.query(
            `INSERT INTO clinico.eventos (aggregate_id, version, tipo, payload, ocurrido_en, actor_id)
             VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
            [expediente.pacienteId, evento.version, evento.tipo, JSON.stringify(evento.payload), evento.ocurridoEn, evento.actorId],
          );
        } catch (error) {
          if (esViolacionUnica(error)) {
            throw new ConflictoDeConcurrencia(expediente.pacienteId);
          }
          throw error;
        }
        await this.proyectar(client, expediente, evento);
        await client.query(
          `INSERT INTO clinico.proyeccion_aplicada (aggregate_id, version) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [expediente.pacienteId, evento.version],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const expediente = await this.obtener(pacienteId);
    return expediente ? aVista(expediente) : null;
  }

  async buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    const texto = `%${criterio.texto}%`;
    const resultado = await this.conexion().query<{
      id: string;
      nombres: string;
      apellidos: string;
      estado: 'activo' | 'archivado';
    }>(
      `SELECT p.id, p.nombres, p.apellidos, e.estado
       FROM clinico.paciente p
       JOIN clinico.expediente e ON e.paciente_id = p.id
       WHERE $1 = '%%' OR p.nombres ILIKE $1 OR p.apellidos ILIKE $1 OR p.dpi ILIKE $1
       ORDER BY p.apellidos, p.nombres
       LIMIT 20`,
      [texto],
    );
    return resultado.rows.map((fila) => ({
      pacienteId: fila.id,
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      estado: fila.estado,
    }));
  }

  async vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    const filas = await this.conexion().query<{
      id: string;
      nombres: string;
      apellidos: string;
      extensiones: Extensiones;
    }>(
      `SELECT p.id, p.nombres, p.apellidos, e.extensiones
       FROM clinico.paciente p JOIN clinico.expediente e ON e.paciente_id = p.id`,
    );
    return dosisPendientes(
      filas.rows.map((fila) => ({
        pacienteId: fila.id,
        datos: { nombres: fila.nombres, apellidos: fila.apellidos },
        vacunas: fila.extensiones?.vacunas ?? [],
      })),
      hasta,
    );
  }

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    await this.asegurarUsuario(this.conexion(), entrada.actorId);
    await this.conexion().query(
      `INSERT INTO clinico.auditoria_acceso (id, actor_id, paciente_id, accion, recurso)
       VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), entrada.actorId, entrada.pacienteId, entrada.accion, entrada.recurso],
    );
  }

  async entradasDe(pacienteId: PacienteId): Promise<readonly EntradaAuditoria[]> {
    const filas = await this.conexion().query<{
      actor_id: string;
      paciente_id: string;
      accion: EntradaAuditoria['accion'];
      recurso: string;
      ocurrido_en: Date;
    }>(
      `SELECT actor_id, paciente_id, accion, recurso, ocurrido_en
       FROM clinico.auditoria_acceso
       WHERE paciente_id = $1
       ORDER BY ocurrido_en DESC
       LIMIT 100`,
      [pacienteId],
    );
    return filas.rows.map((fila) => ({
      actorId: marcarActorId(fila.actor_id),
      pacienteId: marcarPacienteId(fila.paciente_id),
      accion: fila.accion,
      recurso: fila.recurso,
      ocurridoEn: fila.ocurrido_en.toISOString(),
    }));
  }

  async cerrar(): Promise<void> {
    await this.pool?.end();
  }

  /**
   * Reconstruye el read model desde clinico.eventos. Idempotente: las proyecciones usan
   * ON CONFLICT DO NOTHING y el script de mantenimiento limpia las tablas derivadas antes.
   */
  async reproyectar(): Promise<{ agregados: number; eventos: number }> {
    const pool = this.conexion();
    const agregados = await pool.query<{ aggregate_id: string }>(
      'SELECT DISTINCT aggregate_id FROM clinico.eventos ORDER BY aggregate_id',
    );
    let eventos = 0;
    for (const fila of agregados.rows) {
      const pacienteId = marcarPacienteId(fila.aggregate_id);
      const guardados = await pool.query<{
        version: number;
        tipo: string;
        payload: Record<string, unknown>;
        ocurrido_en: Date;
        actor_id: string;
      }>(
        `SELECT version, tipo, payload, ocurrido_en, actor_id
         FROM clinico.eventos
         WHERE aggregate_id = $1
         ORDER BY version`,
        [pacienteId],
      );
      const historial = guardados.rows.map(
        (evento) =>
          ({
            tipo: evento.tipo,
            version: evento.version,
            payload: evento.payload,
            ocurridoEn: evento.ocurrido_en.toISOString(),
            actorId: marcarActorId(evento.actor_id),
          }) as EventoDeDominio,
      );
      const expediente = Expediente.desdeEventos(pacienteId, historial);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const evento of historial) {
          await this.proyectar(client, expediente, evento);
          await client.query(
            `INSERT INTO clinico.proyeccion_aplicada (aggregate_id, version) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [pacienteId, evento.version],
          );
          eventos += 1;
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    return { agregados: agregados.rowCount ?? 0, eventos };
  }

  private async proyectar(client: PoolClient, expediente: Expediente, evento: EventoDeDominio): Promise<void> {
    await this.asegurarUsuario(client, evento.actorId);
    if (evento.tipo === 'ExpedienteCreado') {
      const datos = expediente.datos;
      await client.query(
        `INSERT INTO clinico.paciente (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, correo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
        [expediente.pacienteId, datos.dpi, datos.nombres, datos.apellidos, datos.fechaNacimiento, datos.sexo, datos.telefono ?? null, datos.direccion ?? null, datos.correo ?? null],
      );
      await client.query(
        `INSERT INTO clinico.expediente (id, paciente_id, estado, version, extensiones)
         VALUES ($1, $2, 'activo', $3, $4::jsonb) ON CONFLICT (id) DO NOTHING`,
        [expediente.expedienteId, expediente.pacienteId, evento.version, JSON.stringify(extra(expediente))],
      );
      return;
    }
    if (evento.tipo === 'ConsultaRegistrada') {
      const consulta = evento.payload.consulta;
      await client.query(
        `INSERT INTO clinico.consulta (id, expediente_id, medico_id, cita_id, ocurrida_en, motivo, notas)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [consulta.id, expediente.expedienteId, consulta.medicoId, consulta.citaId ?? null, consulta.ocurridaEn, consulta.motivo, consulta.notas ?? null],
      );
      if (consulta.citaId) {
        await client.query(`UPDATE clinico.cita SET estado = 'atendida', consulta_id = $2 WHERE id = $1`, [consulta.citaId, consulta.id]);
      }
    }
    if (evento.tipo === 'CitaCerrada') {
      await client.query(`UPDATE clinico.cita SET estado = $2 WHERE id = $1`, [evento.payload.citaId, evento.payload.estado]);
    }
    if (evento.tipo === 'DiagnosticoAgregado') {
      const diagnostico = evento.payload.diagnostico;
      await client.query(
        `INSERT INTO clinico.diagnostico (id, consulta_id, catalogo_diagnostico_id, texto_libre, es_principal)
         VALUES ($1, $2, (SELECT id FROM clinico.catalogo_diagnostico WHERE codigo = $3), $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [diagnostico.id, evento.payload.consultaId, diagnostico.catalogoCodigo ?? null, diagnostico.textoLibre, diagnostico.esPrincipal],
      );
    }
    if (evento.tipo === 'MedicamentoRecetado') {
      const receta = evento.payload.receta;
      await client.query(
        `INSERT INTO clinico.receta (id, consulta_id, catalogo_medicamento_id, texto_libre, dosis, frecuencia, duracion_dias)
         VALUES ($1, $2, (SELECT id FROM clinico.catalogo_medicamento WHERE codigo = $3), $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [receta.id, evento.payload.consultaId, null, receta.textoLibre, receta.dosis, receta.frecuencia, receta.duracionDias ?? null],
      );
    }
    if (evento.tipo === 'CitaReservada') {
      const cita = evento.payload.cita;
      try {
        await client.query(
          `INSERT INTO clinico.cita (id, expediente_id, medico_id, inicio, fin, estado, motivo)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
          [cita.id, expediente.expedienteId, cita.medicoId, cita.inicio, cita.fin, cita.estado, cita.motivo],
        );
      } catch (error) {
        if (esSolape(error)) {
          throw new CitaSolapada();
        }
        throw error;
      }
    }
    await client.query(
      `UPDATE clinico.expediente
       SET version = $2, estado = $3::varchar, motivo_archivo = $4,
           archivado_en = CASE WHEN $3::text = 'archivado' THEN COALESCE(archivado_en, $5::timestamptz) ELSE NULL END,
           extensiones = $6::jsonb
       WHERE paciente_id = $1`,
      [
        expediente.pacienteId,
        evento.version,
        expediente.estado === 'archivado' || evento.tipo === 'ExpedienteArchivado' ? 'archivado' : 'activo',
        evento.tipo === 'ExpedienteArchivado' ? evento.payload.motivo : expediente.motivoArchivo ?? null,
        evento.ocurridoEn,
        JSON.stringify(extra(expediente)),
      ],
    );
  }

  private async consultasDe(pool: Pool, pacienteId: PacienteId): Promise<Consulta[]> {
    const consultas = await pool.query<{
      id: string;
      medico_id: string;
      ocurrida_en: Date | string;
      motivo: string;
      notas: string | null;
      cita_id: string | null;
    }>(
      `SELECT c.id, c.medico_id, c.cita_id, c.ocurrida_en, c.motivo, c.notas
       FROM clinico.consulta c
       JOIN clinico.expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = $1
       ORDER BY c.ocurrida_en`,
      [pacienteId],
    );
    const diagnosticos = await pool.query<{
      id: string;
      consulta_id: string;
      texto_libre: string;
      es_principal: boolean;
      codigo: string | null;
    }>(
      `SELECT d.id, d.consulta_id, d.texto_libre, d.es_principal, cat.codigo
       FROM clinico.diagnostico d
       JOIN clinico.consulta c ON c.id = d.consulta_id
       JOIN clinico.expediente e ON e.id = c.expediente_id
       LEFT JOIN clinico.catalogo_diagnostico cat ON cat.id = d.catalogo_diagnostico_id
       WHERE e.paciente_id = $1`,
      [pacienteId],
    );
    const recetas = await pool.query<{
      id: string;
      consulta_id: string;
      texto_libre: string;
      dosis: string;
      frecuencia: string;
      duracion_dias: number | null;
    }>(
      `SELECT r.id, r.consulta_id, r.texto_libre, r.dosis, r.frecuencia, r.duracion_dias
       FROM clinico.receta r
       JOIN clinico.consulta c ON c.id = r.consulta_id
       JOIN clinico.expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = $1`,
      [pacienteId],
    );
    return consultas.rows.map((fila) => ({
      id: marcarConsultaId(fila.id),
      medicoId: marcarActorId(fila.medico_id),
      ocurridaEn: instante(fila.ocurrida_en),
      motivo: fila.motivo,
      notas: fila.notas ?? undefined,
      citaId: fila.cita_id ? marcarCitaId(fila.cita_id) : undefined,
      diagnosticos: diagnosticos.rows.filter((item) => item.consulta_id === fila.id).map(aDiagnostico),
      recetas: recetas.rows.filter((item) => item.consulta_id === fila.id).map(aReceta),
    }));
  }

  private async citasDe(pool: Pool, pacienteId: PacienteId): Promise<Cita[]> {
    const citas = await pool.query<{
      id: string;
      medico_id: string;
      inicio: Date | string;
      fin: Date | string;
      motivo: string | null;
      estado: Cita['estado'];
    }>(
      `SELECT c.id, c.medico_id, c.inicio, c.fin, c.motivo, c.estado
       FROM clinico.cita c
       JOIN clinico.expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = $1
       ORDER BY c.inicio`,
      [pacienteId],
    );
    return citas.rows.map((fila) => ({
      id: marcarCitaId(fila.id),
      medicoId: marcarActorId(fila.medico_id),
      inicio: instante(fila.inicio),
      fin: instante(fila.fin),
      motivo: fila.motivo ?? '',
      estado: fila.estado,
    }));
  }

  private async asegurarUsuario(ejecutor: Pool | PoolClient, actorId: string): Promise<void> {
    await ejecutor.query(
      `INSERT INTO clinico.usuario (id, nombre, correo, rol)
       VALUES ($1, 'Profesional', $2, 'medico')
       ON CONFLICT (id) DO NOTHING`,
      [actorId, `${actorId}@historiales.demo`],
    );
  }

  private conexion(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: this.config.get<string>('POSTGRES_HOST', 'localhost'),
        port: Number(this.config.get<string>('POSTGRES_PORT', '5433')),
        database: this.config.get<string>('POSTGRES_DB', 'hospital'),
        user: this.config.get<string>('POSTGRES_USER', 'hospital_app'),
        password: this.config.get<string>('POSTGRES_PASSWORD', 'hospital_app_dev'),
        max: 5,
      });
    }
    return this.pool;
  }
}

function extra(expediente: Expediente): Extensiones {
  return {
    examenes: expediente.examenes,
    mediciones: expediente.mediciones,
    vacunas: expediente.vacunas,
    piezas: expediente.piezas,
    procedimientos: expediente.procedimientos,
    tutorNombre: expediente.datos.tutorNombre,
    tutorTelefono: expediente.datos.tutorTelefono,
    codigoReferencia: expediente.datos.codigoReferencia,
  };
}

function aDiagnostico(fila: {
  id: string;
  texto_libre: string;
  es_principal: boolean;
  codigo: string | null;
}): Diagnostico {
  return {
    id: fila.id,
    textoLibre: fila.texto_libre,
    esPrincipal: fila.es_principal,
    catalogoCodigo: fila.codigo ?? undefined,
  };
}

function aReceta(fila: {
  id: string;
  texto_libre: string;
  dosis: string;
  frecuencia: string;
  duracion_dias: number | null;
}): Receta {
  return {
    id: fila.id,
    textoLibre: fila.texto_libre,
    dosis: fila.dosis,
    frecuencia: fila.frecuencia,
    duracionDias: fila.duracion_dias ?? undefined,
  };
}

function fecha(valor: Date | string): string {
  if (typeof valor === 'string') {
    return valor.slice(0, 10);
  }
  return valor.toISOString().slice(0, 10);
}

function instante(valor: Date | string): string {
  if (typeof valor === 'string') {
    return new Date(valor).toISOString();
  }
  return valor.toISOString();
}
