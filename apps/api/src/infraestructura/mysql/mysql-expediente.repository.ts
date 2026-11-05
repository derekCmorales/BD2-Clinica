import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { createPool, type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';
import type { PacienteId } from '../../compartido/tipos';
import { marcarActorId, marcarCitaId, marcarConsultaId } from '../../compartido/tipos';
import { dosisPendientes } from '../../aplicacion/dosis-pendientes';
import { aVista } from '../../aplicacion/vista';
import type { EventoDeDominio } from '../../dominio/eventos/eventos';
import { Expediente } from '../../dominio/modelo/expediente';
import type { Cita, Consulta, Medicion, PiezaDental, ResultadoExamen, Vacuna } from '../../dominio/modelo/tipos-clinicos';
import { CitaSolapada, ConflictoDeConcurrencia, DatosInvalidos } from '../../dominio/errores/errores-dominio';
import type { AuditLog, EntradaAuditoria } from '../../dominio/puertos/audit-log';
import type { ExpedienteRepository } from '../../dominio/puertos/expediente.repository';
import type {
  CriterioBusqueda,
  ExpedienteQueryService,
  ExpedienteVistaDTO,
  ResumenExpedienteDTO,
  VacunaPendienteDTO,
} from '../../dominio/puertos/expediente-query.service';

interface ExtraJson {
  readonly examenes?: readonly ResultadoExamen[];
  readonly mediciones?: readonly Medicion[];
  readonly vacunas?: readonly Vacuna[];
  readonly procedimientos?: Expediente['procedimientos'];
  readonly tutorNombre?: string;
  readonly tutorTelefono?: string;
  readonly codigoReferencia?: string;
}

/**
 * Odontología: UPDATE dentro de una transacción InnoDB en REPEATABLE READ.
 * La fila del médico se bloquea con SELECT ... FOR UPDATE antes de reservar una cita.
 */
@Injectable()
export class MysqlExpedienteRepository implements ExpedienteRepository, ExpedienteQueryService, AuditLog {
  private pool?: Pool;

  constructor(private readonly config: ConfigService) {}

  async obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    const pool = this.conexion();
    const [cabeceras] = await pool.query<RowDataPacket[]>(
      `SELECT e.id AS expediente_id, e.estado, e.motivo_archivo, e.version, e.extensiones,
              p.dpi, p.nombres, p.apellidos, p.fecha_nacimiento, p.sexo, p.telefono, p.direccion, p.correo
       FROM expediente e JOIN paciente p ON p.id = e.paciente_id
       WHERE e.paciente_id = ?`,
      [pacienteId],
    );
    const fila = cabeceras[0];
    if (!fila) {
      return null;
    }
    const extra = parsearExtra(fila.extensiones);
    return Expediente.rehidratar({
      pacienteId,
      expedienteId: String(fila.expediente_id),
      estado: fila.estado,
      motivoArchivo: fila.motivo_archivo ?? undefined,
      version: Number(fila.version),
      datos: {
        dpi: String(fila.dpi),
        nombres: String(fila.nombres),
        apellidos: String(fila.apellidos),
        fechaNacimiento: fecha(fila.fecha_nacimiento),
        sexo: fila.sexo,
        telefono: fila.telefono ?? undefined,
        direccion: fila.direccion ?? undefined,
        correo: fila.correo ?? undefined,
        codigoReferencia: extra.codigoReferencia,
        tutorNombre: extra.tutorNombre,
        tutorTelefono: extra.tutorTelefono,
      },
      consultas: await this.consultasDe(pool, pacienteId),
      citas: await this.citasDe(pool, pacienteId),
      examenes: (extra.examenes ?? []).map((examen) => ({ ...examen, estado: examen.estado ?? 'registrado' })),
      mediciones: extra.mediciones ?? [],
      vacunas: extra.vacunas ?? [],
      piezas: await this.piezasDe(pool, String(fila.expediente_id)),
      procedimientos: extra.procedimientos ?? [],
    });
  }

  async guardar(expediente: Expediente): Promise<void> {
    if (expediente.eventosPendientes.length === 0) {
      return;
    }
    const conn = await this.conexion().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      const [bloqueadas] = await conn.query<RowDataPacket[]>(
        'SELECT version FROM expediente WHERE paciente_id = ? FOR UPDATE',
        [expediente.pacienteId],
      );
      const almacenada = bloqueadas[0] ? Number(bloqueadas[0].version) : 0;
      if (almacenada !== expediente.version) {
        throw new ConflictoDeConcurrencia(expediente.pacienteId);
      }
      for (const evento of expediente.eventosPendientes) {
        await this.aplicar(conn, expediente, evento);
      }
      await conn.query(
        `UPDATE expediente SET version = ?, estado = ?, motivo_archivo = ?, archivado_en = ?, extensiones = ?
         WHERE paciente_id = ?`,
        [
          expediente.versionNueva,
          expediente.estado,
          expediente.motivoArchivo ?? null,
          expediente.estado === 'archivado' ? new Date() : null,
          JSON.stringify({
            examenes: expediente.examenes,
            mediciones: expediente.mediciones,
            vacunas: expediente.vacunas,
            procedimientos: expediente.procedimientos,
            tutorNombre: expediente.datos.tutorNombre,
            tutorTelefono: expediente.datos.tutorTelefono,
            codigoReferencia: expediente.datos.codigoReferencia,
          }),
          expediente.pacienteId,
        ],
      );
      await conn.commit();
    } catch (error) {
      await conn.rollback();
      if (esDuplicado(error)) {
        throw new DatosInvalidos('dpi');
      }
      throw error;
    } finally {
      conn.release();
    }
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const expediente = await this.obtener(pacienteId);
    return expediente ? aVista(expediente) : null;
  }

  async buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    const texto = `%${criterio.texto}%`;
    const [filas] = await this.conexion().query<RowDataPacket[]>(
      `SELECT p.id, p.nombres, p.apellidos, e.estado
       FROM paciente p JOIN expediente e ON e.paciente_id = p.id
       WHERE ? = '%%' OR p.nombres LIKE ? OR p.apellidos LIKE ? OR p.dpi LIKE ?
       ORDER BY p.apellidos LIMIT 20`,
      [texto, texto, texto, texto],
    );
    return filas.map((fila) => ({
      pacienteId: String(fila.id),
      nombres: String(fila.nombres),
      apellidos: String(fila.apellidos),
      estado: fila.estado,
    }));
  }

  async vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    const [filas] = await this.conexion().query<RowDataPacket[]>(
      `SELECT p.id, p.nombres, p.apellidos, e.extensiones
       FROM paciente p JOIN expediente e ON e.paciente_id = p.id`,
    );
    return dosisPendientes(
      filas.map((fila) => {
        const extra = parsearExtra(fila.extensiones);
        return {
          pacienteId: String(fila.id),
          datos: { nombres: String(fila.nombres), apellidos: String(fila.apellidos) },
          vacunas: extra.vacunas ?? [],
        };
      }),
      hasta,
    );
  }

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    const pool = this.conexion();
    await this.asegurarUsuario(pool, entrada.actorId);
    await pool.query(
      `INSERT INTO auditoria_acceso (id, actor_id, paciente_id, accion, recurso) VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), entrada.actorId, entrada.pacienteId, entrada.accion, entrada.recurso],
    );
  }

  async cerrar(): Promise<void> {
    await this.pool?.end();
  }

  private async aplicar(conn: PoolConnection, expediente: Expediente, evento: EventoDeDominio): Promise<void> {
    await this.asegurarUsuario(conn, evento.actorId);
    if (evento.tipo === 'ExpedienteCreado') {
      const datos = expediente.datos;
      await conn.query(
        `INSERT INTO paciente (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, correo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [expediente.pacienteId, datos.dpi, datos.nombres, datos.apellidos, datos.fechaNacimiento, datos.sexo, datos.telefono ?? null, datos.direccion ?? null, datos.correo ?? null],
      );
      await conn.query(
        `INSERT INTO expediente (id, paciente_id, estado, version, extensiones) VALUES (?, ?, 'activo', 0, ?)`,
        [expediente.expedienteId, expediente.pacienteId, JSON.stringify({})],
      );
      return;
    }
    if (evento.tipo === 'ConsultaRegistrada') {
      const consulta = evento.payload.consulta;
      await conn.query(
        `INSERT INTO consulta (id, expediente_id, medico_id, cita_id, ocurrida_en, motivo, notas) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [consulta.id, expediente.expedienteId, consulta.medicoId, consulta.citaId ?? null, consulta.ocurridaEn.slice(0, 19).replace('T', ' '), consulta.motivo, consulta.notas ?? null],
      );
      if (consulta.citaId) {
        await conn.query(`UPDATE cita SET estado = 'atendida', consulta_id = ? WHERE id = ?`, [consulta.id, consulta.citaId]);
      }
    }
    if (evento.tipo === 'CitaCerrada') {
      await conn.query(`UPDATE cita SET estado = ? WHERE id = ?`, [evento.payload.estado, evento.payload.citaId]);
    }
    if (evento.tipo === 'DiagnosticoAgregado') {
      const diagnostico = evento.payload.diagnostico;
      await conn.query(
        `INSERT INTO diagnostico (id, consulta_id, catalogo_diagnostico_id, texto_libre, es_principal)
         VALUES (?, ?, (SELECT id FROM catalogo_diagnostico WHERE codigo = ?), ?, ?)`,
        [diagnostico.id, evento.payload.consultaId, diagnostico.catalogoCodigo ?? null, diagnostico.textoLibre, diagnostico.esPrincipal ? 1 : 0],
      );
    }
    if (evento.tipo === 'MedicamentoRecetado') {
      const receta = evento.payload.receta;
      await conn.query(
        `INSERT INTO receta (id, consulta_id, texto_libre, dosis, frecuencia, duracion_dias) VALUES (?, ?, ?, ?, ?, ?)`,
        [receta.id, evento.payload.consultaId, receta.textoLibre, receta.dosis, receta.frecuencia, receta.duracionDias ?? null],
      );
    }
    if (evento.tipo === 'CitaReservada') {
      await this.reservarCita(conn, expediente, evento.payload.cita);
    }
    if (evento.tipo === 'PiezaActualizada') {
      const pieza = evento.payload.pieza;
      await conn.query(
        `INSERT INTO pieza_dental (id, expediente_id, codigo_fdi, estado) VALUES (?, ?, ?, ?) AS nueva
         ON DUPLICATE KEY UPDATE estado = nueva.estado`,
        [randomUUID(), expediente.expedienteId, pieza.codigoFdi, pieza.estado],
      );
    }
  }

  private async reservarCita(conn: PoolConnection, expediente: Expediente, cita: Cita): Promise<void> {
    await conn.query('SELECT id FROM usuario WHERE id = ? FOR UPDATE', [cita.medicoId]);
    const [choques] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM cita
       WHERE medico_id = ? AND estado IN ('programada', 'atendida') AND inicio < ? AND fin > ?
       LIMIT 1`,
      [cita.medicoId, cita.fin, cita.inicio],
    );
    if (choques.length > 0) {
      throw new CitaSolapada();
    }
    await conn.query(
      `INSERT INTO cita (id, expediente_id, medico_id, inicio, fin, estado, motivo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cita.id, expediente.expedienteId, cita.medicoId, cita.inicio.slice(0, 19).replace('T', ' '), cita.fin.slice(0, 19).replace('T', ' '), cita.estado, cita.motivo],
    );
  }

  private async consultasDe(pool: Pool, pacienteId: PacienteId): Promise<Consulta[]> {
    const [consultas] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.medico_id, c.cita_id, c.ocurrida_en, c.motivo, c.notas
       FROM consulta c JOIN expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = ? ORDER BY c.ocurrida_en`,
      [pacienteId],
    );
    const [diagnosticos] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.consulta_id, d.texto_libre, d.es_principal, cat.codigo
       FROM diagnostico d
       JOIN consulta c ON c.id = d.consulta_id
       JOIN expediente e ON e.id = c.expediente_id
       LEFT JOIN catalogo_diagnostico cat ON cat.id = d.catalogo_diagnostico_id
       WHERE e.paciente_id = ?`,
      [pacienteId],
    );
    const [recetas] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.consulta_id, r.texto_libre, r.dosis, r.frecuencia, r.duracion_dias
       FROM receta r JOIN consulta c ON c.id = r.consulta_id
       JOIN expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = ?`,
      [pacienteId],
    );
    return consultas.map((fila) => ({
      id: marcarConsultaId(String(fila.id)),
      medicoId: marcarActorId(String(fila.medico_id)),
      ocurridaEn: instante(fila.ocurrida_en),
      motivo: String(fila.motivo),
      notas: fila.notas ? String(fila.notas) : undefined,
      citaId: fila.cita_id ? marcarCitaId(String(fila.cita_id)) : undefined,
      diagnosticos: diagnosticos
        .filter((item) => item.consulta_id === fila.id)
        .map((item) => ({
          id: String(item.id),
          textoLibre: String(item.texto_libre),
          esPrincipal: Boolean(item.es_principal),
          catalogoCodigo: item.codigo ? String(item.codigo) : undefined,
        })),
      recetas: recetas
        .filter((item) => item.consulta_id === fila.id)
        .map((item) => ({
          id: String(item.id),
          textoLibre: String(item.texto_libre),
          dosis: String(item.dosis),
          frecuencia: String(item.frecuencia),
          duracionDias: item.duracion_dias === null ? undefined : Number(item.duracion_dias),
        })),
    }));
  }

  private async citasDe(pool: Pool, pacienteId: PacienteId): Promise<Cita[]> {
    const [citas] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.medico_id, c.inicio, c.fin, c.motivo, c.estado
       FROM cita c JOIN expediente e ON e.id = c.expediente_id
       WHERE e.paciente_id = ? ORDER BY c.inicio`,
      [pacienteId],
    );
    return citas.map((fila) => ({
      id: marcarCitaId(String(fila.id)),
      medicoId: marcarActorId(String(fila.medico_id)),
      inicio: instante(fila.inicio),
      fin: instante(fila.fin),
      motivo: fila.motivo ? String(fila.motivo) : '',
      estado: fila.estado,
    }));
  }

  private async piezasDe(pool: Pool, expedienteId: string): Promise<PiezaDental[]> {
    const [piezas] = await pool.query<RowDataPacket[]>(
      'SELECT codigo_fdi, estado FROM pieza_dental WHERE expediente_id = ?',
      [expedienteId],
    );
    return piezas.map((fila) => ({ codigoFdi: Number(fila.codigo_fdi), estado: fila.estado }));
  }

  private async asegurarUsuario(ejecutor: Pool | PoolConnection, actorId: string): Promise<void> {
    await ejecutor.query(
      `INSERT INTO usuario (id, nombre, correo, rol) VALUES (?, 'Profesional', ?, 'medico')
       ON DUPLICATE KEY UPDATE id = id`,
      [actorId, `${actorId}@historiales.demo`],
    );
  }

  private conexion(): Pool {
    if (!this.pool) {
      this.pool = createPool({
        host: this.config.get<string>('MYSQL_HOST', 'localhost'),
        port: Number(this.config.get<string>('MYSQL_PORT', '3307')),
        database: this.config.get<string>('MYSQL_DATABASE', 'odontologia'),
        user: this.config.get<string>('MYSQL_USER', 'odontologia_app'),
        password: this.config.get<string>('MYSQL_PASSWORD', 'odontologia_app_dev'),
        connectionLimit: 5,
        timezone: 'Z',
      });
    }
    return this.pool;
  }
}

function parsearExtra(valor: unknown): ExtraJson {
  if (!valor) {
    return {};
  }
  if (typeof valor === 'string') {
    return JSON.parse(valor) as ExtraJson;
  }
  return valor as ExtraJson;
}

function esDuplicado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';
}

function fecha(valor: unknown): string {
  if (valor instanceof Date) {
    return valor.toISOString().slice(0, 10);
  }
  return String(valor).slice(0, 10);
}

function instante(valor: unknown): string {
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  return new Date(String(valor)).toISOString();
}
