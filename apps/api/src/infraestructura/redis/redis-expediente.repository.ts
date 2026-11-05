import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { PacienteId } from '../../compartido/tipos';
import { aVista } from '../../aplicacion/vista';
import { Expediente } from '../../dominio/modelo/expediente';
import { ConflictoDeConcurrencia } from '../../dominio/errores/errores-dominio';
import type { AuditLog, EntradaAuditoria } from '../../dominio/puertos/audit-log';
import type { ExpedienteRepository } from '../../dominio/puertos/expediente.repository';
import type {
  CriterioBusqueda,
  ExpedienteQueryService,
  ExpedienteVistaDTO,
  ResumenExpedienteDTO,
  VacunaPendienteDTO,
} from '../../dominio/puertos/expediente-query.service';

interface DocumentoRedis {
  readonly pacienteId: string;
  readonly expedienteId: string;
  readonly version: number;
  readonly estado: 'activo' | 'archivado';
  readonly motivoArchivo?: string;
  readonly datos: Expediente['datos'];
  readonly consultas: Expediente['consultas'];
  readonly citas: Expediente['citas'];
  readonly examenes: Expediente['examenes'];
  readonly mediciones: Expediente['mediciones'];
  readonly vacunas: Expediente['vacunas'];
  readonly piezas: Expediente['piezas'];
  readonly procedimientos?: Expediente['procedimientos'];
}

/**
 * Pediatría: Redis es el sistema de registro (AOF everysec + RDB en Compose).
 * El script Lua hace el read-modify-write atómico del JSON, la curva (ZSET) y las vacunas (ZSET).
 * Se puede perder hasta ~1s de escrituras si el proceso cae: trade-off documentado en AGENTS.md.
 * No hay búsqueda ad-hoc nativa; `indice:pacientes` se reescribe en el mismo script.
 */
const LUA_GUARDAR = `
local key = KEYS[1]
local indice = KEYS[2]
local curva = KEYS[3]
local vacunasKey = KEYS[4]
local pendientes = KEYS[5]
local expected = tonumber(ARGV[1])
local documento = ARGV[2]
local pacienteId = ARGV[3]
local nombre = ARGV[4]
local actual = 0
local crudo = redis.call('JSON.GET', key, '.version')
if crudo then
  actual = tonumber(crudo)
end
if actual ~= expected then
  return 'CONFLICT'
end
redis.call('JSON.SET', key, '$', documento)
redis.call('HSET', indice, pacienteId, nombre)
redis.call('DEL', curva, vacunasKey)
local todos = redis.call('ZRANGE', pendientes, 0, -1)
for _, member in ipairs(todos) do
  if string.sub(member, 1, string.len(pacienteId) + 1) == pacienteId .. '|' then
    redis.call('ZREM', pendientes, member)
  end
end
local meds = cjson.decode(ARGV[5])
for _, medicion in ipairs(meds) do
  redis.call('ZADD', curva, medicion.score, medicion.member)
end
local vacs = cjson.decode(ARGV[6])
for _, vacuna in ipairs(vacs) do
  redis.call('ZADD', vacunasKey, vacuna.score, vacuna.member)
  redis.call('ZADD', pendientes, vacuna.score, vacuna.pendiente)
end
return 'OK'
`;

@Injectable()
export class RedisExpedienteRepository implements ExpedienteRepository, ExpedienteQueryService, AuditLog {
  private readonly logger = new Logger(RedisExpedienteRepository.name);
  private cliente?: Redis;

  constructor(private readonly config: ConfigService) {}

  async obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    const crudo = await this.conexion().call('JSON.GET', this.clave(pacienteId), '$');
    if (!crudo || typeof crudo !== 'string') {
      return null;
    }
    const lista = JSON.parse(crudo) as DocumentoRedis[];
    const documento = lista[0];
    if (!documento) {
      return null;
    }
    return Expediente.rehidratar({
      ...documento,
      pacienteId,
      examenes: (documento.examenes ?? []).map((examen) => ({ ...examen, estado: examen.estado ?? 'registrado' })),
      procedimientos: documento.procedimientos ?? [],
    });
  }

  async guardar(expediente: Expediente): Promise<void> {
    if (expediente.eventosPendientes.length === 0) {
      return;
    }
    const confirmado = expediente.confirmado();
    const documento: DocumentoRedis = {
      pacienteId: confirmado.pacienteId,
      expedienteId: confirmado.expedienteId,
      version: confirmado.version,
      estado: confirmado.estado,
      motivoArchivo: confirmado.motivoArchivo,
      datos: confirmado.datos,
      consultas: confirmado.consultas,
      citas: confirmado.citas,
      examenes: confirmado.examenes,
      mediciones: confirmado.mediciones,
      vacunas: confirmado.vacunas,
      piezas: confirmado.piezas,
      procedimientos: confirmado.procedimientos,
    };
    const mediciones = confirmado.mediciones.map((medicion) => ({
      score: Date.parse(medicion.fecha),
      member: JSON.stringify(medicion),
    }));
    const vacunas = confirmado.vacunas.map((vacuna) => ({
      score: Date.parse(vacuna.proximaEn),
      member: vacuna.codigo,
      pendiente: `${confirmado.pacienteId}|${vacuna.codigo}`,
    }));
    const respuesta = await this.conexion().eval(
      LUA_GUARDAR,
      5,
      this.clave(expediente.pacienteId),
      'indice:pacientes',
      `curva:${expediente.pacienteId}`,
      `vacunas:${expediente.pacienteId}`,
      'vacunas:pendientes',
      String(expediente.version),
      JSON.stringify(documento),
      expediente.pacienteId,
      `${confirmado.datos.nombres} ${confirmado.datos.apellidos} ${confirmado.datos.dpi}`,
      JSON.stringify(mediciones),
      JSON.stringify(vacunas),
    );
    if (respuesta === 'CONFLICT') {
      throw new ConflictoDeConcurrencia(expediente.pacienteId);
    }
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const expediente = await this.obtener(pacienteId);
    return expediente ? aVista(expediente) : null;
  }

  async buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    const indice = await this.conexion().hgetall('indice:pacientes');
    const texto = criterio.texto.toLowerCase();
    const ids = Object.entries(indice)
      .filter(([, nombre]) => !texto || nombre.toLowerCase().includes(texto))
      .slice(0, 20)
      .map(([id]) => id);
    const vistas = await Promise.all(ids.map((id) => this.obtener(id as PacienteId)));
    return vistas.flatMap((expediente) =>
      expediente
        ? [{ pacienteId: expediente.pacienteId, nombres: expediente.datos.nombres, apellidos: expediente.datos.apellidos, estado: expediente.estado }]
        : [],
    );
  }

  async vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    const limite = Date.parse(`${hasta}T23:59:59`);
    const miembros = await this.conexion().zrangebyscore('vacunas:pendientes', '-inf', limite);
    const pendientes: VacunaPendienteDTO[] = [];
    for (const miembro of miembros) {
      const corte = miembro.indexOf('|');
      if (corte < 0) {
        continue;
      }
      const pacienteId = miembro.slice(0, corte) as PacienteId;
      const codigo = miembro.slice(corte + 1);
      const expediente = await this.obtener(pacienteId);
      if (!expediente) {
        continue;
      }
      const vacuna = expediente.vacunas.find((item) => item.codigo === codigo);
      pendientes.push({
        pacienteId,
        nombres: expediente.datos.nombres,
        apellidos: expediente.datos.apellidos,
        codigo,
        proximaEn: vacuna?.proximaEn ?? hasta,
      });
    }
    return pendientes;
  }

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    await this.conexion().xadd(
      `auditoria:${entrada.pacienteId}`,
      '*',
      'actorId',
      entrada.actorId,
      'accion',
      entrada.accion,
      'recurso',
      entrada.recurso,
      'ocurridoEn',
      entrada.ocurridoEn,
    );
  }

  async cerrar(): Promise<void> {
    this.cliente?.disconnect();
  }

  private clave(pacienteId: string): string {
    return `paciente:${pacienteId}`;
  }

  private conexion(): Redis {
    if (!this.cliente) {
      this.cliente = new Redis({
        host: this.config.get<string>('REDIS_PEDIATRICO_HOST', 'localhost'),
        port: Number(this.config.get<string>('REDIS_PEDIATRICO_PORT', '6390')),
        username: this.config.get<string>('REDIS_PEDIATRICO_USER', 'pediatrico_app'),
        password: this.config.get<string>('REDIS_PEDIATRICO_PASSWORD', 'pediatrico_app_dev'),
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.cliente.on('error', (error: Error) => {
        this.logger.error(`RedisNoDisponible: ${error.name}`);
      });
    }
    return this.cliente;
  }
}
