import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { createPool, type Pool as MysqlPool } from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { Pool as PgPool } from 'pg';
import Redis from 'ioredis';
import type { InstitucionId } from '../../compartido/tipos';
import type { EntradaAuditoria } from '../../dominio/puertos/audit-log';
import { MemoriaExpedienteRepository, type RepositorioCompleto } from '../memoria/memoria-expediente.repository';
import { MongoExpedienteRepository } from '../mongo/mongo-expediente.repository';
import { MysqlExpedienteRepository } from '../mysql/mysql-expediente.repository';
import { PostgresExpedienteRepository } from '../postgres/postgres-expediente.repository';
import { RedisExpedienteRepository } from '../redis/redis-expediente.repository';

export interface EntradaAuditoriaLeida {
  readonly actorId: string;
  readonly accion: string;
  readonly recurso: string;
  readonly ocurridoEn?: string;
}

export interface CapacidadesDeContrato {
  /**
   * El adaptador detecta solapamiento de citas entre pacientes distintos.
   * Redis solo valida dentro del mismo expediente (limitación documentada).
   */
  readonly solapeEntrePacientes: boolean;
}

export interface AdaptadorDeContrato {
  readonly institucion: InstitucionId;
  readonly motor: string;
  readonly repositorio: RepositorioCompleto;
  readonly capacidades: CapacidadesDeContrato;
  leerAuditoria(pacienteId: string): Promise<EntradaAuditoriaLeida[]>;
  /** Solo el Hospital (event store) puede reconstruir su read model desde eventos. */
  reproyectar?(pacienteId: string): Promise<void>;
  cerrar(): Promise<void>;
}

/**
 * Fábrica de los adaptadores reales para la suite de contrato.
 * Los escenarios reciben esta lista y no preguntan por el motor.
 */
export function crearAdaptadoresDeContrato(): AdaptadorDeContrato[] {
  const config = new ConfigService(process.env);
  return [
    adaptadorDeMemoria(),
    adaptadorDePostgres(config),
    adaptadorDeMysql(config),
    adaptadorDeMongo(config),
    adaptadorDeRedis(config),
  ];
}

function adaptadorDeMemoria(): AdaptadorDeContrato {
  const repositorio = new MemoriaExpedienteRepository();
  return {
    institucion: 'hospital',
    motor: 'memoria',
    repositorio,
    capacidades: { solapeEntrePacientes: false },
    async leerAuditoria(pacienteId: string) {
      return repositorio
        .entradas()
        .filter((entrada) => entrada.pacienteId === pacienteId)
        .map(aEntradaLeida);
    },
    async cerrar() {
      return undefined;
    },
  };
}

function adaptadorDePostgres(config: ConfigService): AdaptadorDeContrato {
  const repositorio = new PostgresExpedienteRepository(config);
  const pool = new PgPool({
    host: config.get<string>('POSTGRES_HOST', 'localhost'),
    port: Number(config.get<string>('POSTGRES_PORT', '5433')),
    database: config.get<string>('POSTGRES_DB', 'hospital'),
    user: config.get<string>('POSTGRES_USER', 'hospital_app'),
    password: config.get<string>('POSTGRES_PASSWORD', 'hospital_app_dev'),
    max: 2,
  });
  const superPool = new PgPool({
    host: config.get<string>('POSTGRES_HOST', 'localhost'),
    port: Number(config.get<string>('POSTGRES_PORT', '5433')),
    database: config.get<string>('POSTGRES_DB', 'hospital'),
    user: config.get<string>('POSTGRES_SUPERUSER', 'postgres'),
    password: config.get<string>('POSTGRES_SUPERPASS', 'postgres_dev'),
    max: 2,
  });
  return {
    institucion: 'hospital',
    motor: 'PostgreSQL',
    repositorio,
    capacidades: { solapeEntrePacientes: true },
    async leerAuditoria(pacienteId: string) {
      const filas = await pool.query<{
        actor_id: string;
        accion: string;
        recurso: string;
        ocurrido_en: Date;
      }>(
        `SELECT actor_id, accion, recurso, ocurrido_en
         FROM clinico.auditoria_acceso
         WHERE paciente_id = $1
         ORDER BY ocurrido_en`,
        [pacienteId],
      );
      return filas.rows.map((fila) => ({
        actorId: fila.actor_id,
        accion: fila.accion,
        recurso: fila.recurso,
        ocurridoEn: fila.ocurrido_en.toISOString(),
      }));
    },
    async reproyectar(_pacienteId: string) {
      const client = await superPool.connect();
      try {
        await client.query(
          `TRUNCATE TABLE
             clinico.proyeccion_aplicada,
             clinico.receta,
             clinico.diagnostico,
             clinico.consulta,
             clinico.cita,
             clinico.expediente
           CASCADE`,
        );
      } finally {
        client.release();
      }
      await repositorio.reproyectar();
    },
    async cerrar() {
      await repositorio.cerrar();
      await pool.end();
      await superPool.end();
    },
  };
}

function adaptadorDeMysql(config: ConfigService): AdaptadorDeContrato {
  const repositorio = new MysqlExpedienteRepository(config);
  const pool: MysqlPool = createPool({
    host: config.get<string>('MYSQL_HOST', 'localhost'),
    port: Number(config.get<string>('MYSQL_PORT', '3307')),
    database: config.get<string>('MYSQL_DATABASE', 'odontologia'),
    user: config.get<string>('MYSQL_USER', 'odontologia_app'),
    password: config.get<string>('MYSQL_PASSWORD', 'odontologia_app_dev'),
    connectionLimit: 2,
    timezone: 'Z',
  });
  return {
    institucion: 'odontologia',
    motor: 'MySQL',
    repositorio,
    capacidades: { solapeEntrePacientes: true },
    async leerAuditoria(pacienteId: string) {
      const [filas] = await pool.query<import('mysql2/promise').RowDataPacket[]>(
        `SELECT actor_id, accion, recurso, ocurrido_en
         FROM auditoria_acceso
         WHERE paciente_id = ?
         ORDER BY ocurrido_en`,
        [pacienteId],
      );
      return filas.map((fila) => ({
        actorId: String(fila.actor_id),
        accion: String(fila.accion),
        recurso: String(fila.recurso),
        ocurridoEn: new Date(fila.ocurrido_en).toISOString(),
      }));
    },
    async cerrar() {
      await repositorio.cerrar();
      await pool.end();
    },
  };
}

function adaptadorDeMongo(config: ConfigService): AdaptadorDeContrato {
  const repositorio = new MongoExpedienteRepository(config);
  const cliente = new MongoClient(
    config.get<string>(
      'MONGO_URI',
      'mongodb://laboratorio_app:laboratorio_app_dev@localhost:27018/laboratorio?authSource=laboratorio&directConnection=true',
    ),
    { runtimeAdapters: { os } },
  );
  return {
    institucion: 'laboratorio',
    motor: 'MongoDB',
    repositorio,
    capacidades: { solapeEntrePacientes: true },
    async leerAuditoria(pacienteId: string) {
      const filas = await cliente
        .db()
        .collection('auditoria')
        .find({ pacienteId })
        .sort({ ocurridoEn: 1 })
        .toArray();
      return filas.map((fila) => ({
        actorId: String(fila.actorId),
        accion: String(fila.accion),
        recurso: String(fila.recurso),
        ocurridoEn: fila.ocurridoEn ? String(fila.ocurridoEn) : undefined,
      }));
    },
    async cerrar() {
      await repositorio.cerrar();
      await cliente.close();
    },
  };
}

function adaptadorDeRedis(config: ConfigService): AdaptadorDeContrato {
  const repositorio = new RedisExpedienteRepository(config);
  const cliente = new Redis({
    host: config.get<string>('REDIS_PEDIATRICO_HOST', 'localhost'),
    port: Number(config.get<string>('REDIS_PEDIATRICO_PORT', '6390')),
    username: config.get<string>('REDIS_PEDIATRICO_USER', 'pediatrico_app'),
    password: config.get<string>('REDIS_PEDIATRICO_PASSWORD', 'pediatrico_app_dev'),
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    enableOfflineQueue: true,
  });
  return {
    institucion: 'pediatrico',
    motor: 'Redis',
    repositorio,
    capacidades: { solapeEntrePacientes: false },
    async leerAuditoria(pacienteId: string) {
      const crudo = await cliente.xrange(`auditoria:${pacienteId}`, '-', '+', 'COUNT', 100);
      return crudo.map(([, campos]) => {
        const mapa = new Map<string, string>();
        for (let indice = 0; indice < campos.length; indice += 2) {
          mapa.set(campos[indice], campos[indice + 1]);
        }
        return {
          actorId: mapa.get('actorId') ?? '',
          accion: mapa.get('accion') ?? '',
          recurso: mapa.get('recurso') ?? '',
          ocurridoEn: mapa.get('ocurridoEn'),
        };
      });
    },
    async cerrar() {
      await repositorio.cerrar();
      cliente.disconnect();
    },
  };
}

function aEntradaLeida(entrada: EntradaAuditoria): EntradaAuditoriaLeida {
  return {
    actorId: entrada.actorId,
    accion: entrada.accion,
    recurso: entrada.recurso,
    ocurridoEn: entrada.ocurridoEn,
  };
}
