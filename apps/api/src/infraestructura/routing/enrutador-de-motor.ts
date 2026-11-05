import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { InstitucionId, PacienteId } from '../../compartido/tipos';
import type { Expediente } from '../../dominio/modelo/expediente';
import type { AuditLog, EntradaAuditoria } from '../../dominio/puertos/audit-log';
import type { ExpedienteRepository } from '../../dominio/puertos/expediente.repository';
import type {
  CriterioBusqueda,
  ExpedienteQueryService,
  ExpedienteVistaDTO,
  ResumenExpedienteDTO,
  VacunaPendienteDTO,
} from '../../dominio/puertos/expediente-query.service';
import type { CacheLectura } from '../cache/cache-lectura';
import { CACHE_LECTURA } from '../cache/cache-lectura';
import type { SolicitudAutenticada } from '../auth/actor';
import { MemoriasPorInstitucion } from '../memoria/memoria-expediente.repository';
import { MongoExpedienteRepository } from '../mongo/mongo-expediente.repository';
import { MysqlExpedienteRepository } from '../mysql/mysql-expediente.repository';
import { PostgresExpedienteRepository } from '../postgres/postgres-expediente.repository';
import { RedisExpedienteRepository } from '../redis/redis-expediente.repository';

type Destino = ExpedienteRepository & ExpedienteQueryService & AuditLog;

/**
 * Resuelve el adaptador a partir de institucionId del JWT.
 * El caso de uso no ve el motor.
 */
@Injectable({ scope: Scope.REQUEST })
export class EnrutadorDeMotor implements ExpedienteRepository, ExpedienteQueryService, AuditLog {
  constructor(
    @Inject(REQUEST) private readonly solicitud: SolicitudAutenticada,
    private readonly config: ConfigService,
    private readonly memorias: MemoriasPorInstitucion,
    private readonly hospital: PostgresExpedienteRepository,
    private readonly odontologia: MysqlExpedienteRepository,
    private readonly laboratorio: MongoExpedienteRepository,
    private readonly pediatrico: RedisExpedienteRepository,
    @Inject(CACHE_LECTURA) private readonly cache: CacheLectura,
  ) {}

  obtener(pacienteId: PacienteId): Promise<Expediente | null> {
    return this.destino().obtener(pacienteId);
  }

  async guardar(expediente: Expediente): Promise<void> {
    await this.destino().guardar(expediente);
    await this.cache.borrar(this.claveVista(expediente.pacienteId));
  }

  async porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null> {
    const clave = this.claveVista(pacienteId);
    const cacheado = await this.cache.obtener(clave);
    if (cacheado) {
      return JSON.parse(cacheado) as ExpedienteVistaDTO;
    }
    const vista = await this.destino().porPaciente(pacienteId);
    if (vista) {
      await this.cache.guardar(clave, JSON.stringify(vista), 60);
    }
    return vista;
  }

  buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]> {
    return this.destino().buscar(criterio);
  }

  vacunasPendientes(hasta: string): Promise<VacunaPendienteDTO[]> {
    return this.destino().vacunasPendientes(hasta);
  }

  registrar(entrada: EntradaAuditoria): Promise<void> {
    return this.destino().registrar(entrada);
  }

  private destino(): Destino {
    const institucion = this.solicitud.actor?.institucionId;
    if (!institucion) {
      throw new UnauthorizedException();
    }
    if (this.config.get<string>('PERSISTENCIA', 'memoria') !== 'motores') {
      return this.memorias.para(institucion);
    }
    return this.porMotor(institucion);
  }

  private porMotor(institucion: InstitucionId): Destino {
    switch (institucion) {
      case 'hospital':
        return this.hospital;
      case 'odontologia':
        return this.odontologia;
      case 'laboratorio':
        return this.laboratorio;
      case 'pediatrico':
        return this.pediatrico;
      default: {
        const nunca: never = institucion;
        return nunca;
      }
    }
  }

  private claveVista(pacienteId: string): string {
    return `vista:${this.solicitud.actor?.institucionId}:${pacienteId}`;
  }
}
