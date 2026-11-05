import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheLectura {
  obtener(clave: string): Promise<string | null>;
  guardar(clave: string, valor: string, ttlSegundos: number): Promise<void>;
  borrar(clave: string): Promise<void>;
}

export const CACHE_LECTURA = Symbol('CACHE_LECTURA');

@Injectable()
export class CacheEnProceso implements CacheLectura {
  private readonly valores = new Map<string, { valor: string; vence: number }>();

  async obtener(clave: string): Promise<string | null> {
    const entrada = this.valores.get(clave);
    if (!entrada || entrada.vence < Date.now()) {
      this.valores.delete(clave);
      return null;
    }
    return entrada.valor;
  }

  async guardar(clave: string, valor: string, ttlSegundos: number): Promise<void> {
    this.valores.set(clave, { valor, vence: Date.now() + ttlSegundos * 1000 });
  }

  async borrar(clave: string): Promise<void> {
    this.valores.delete(clave);
  }
}

/** Caché transversal (instancia volátil, TTL, sin persistencia). No es el registro pediátrico. */
@Injectable()
export class CacheRedis implements CacheLectura {
  private readonly logger = new Logger(CacheRedis.name);
  private readonly cliente: Redis;

  constructor(config: ConfigService) {
    this.cliente = new Redis({
      host: config.get<string>('REDIS_CACHE_HOST', 'localhost'),
      port: Number(config.get<string>('REDIS_CACHE_PORT', '6391')),
      username: config.get<string>('REDIS_CACHE_USER', 'cache_app'),
      password: config.get<string>('REDIS_CACHE_PASSWORD', 'cache_app_dev'),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    this.cliente.on('error', (error: Error) => {
      this.logger.error(`CacheNoDisponible: ${error.name}`);
    });
  }

  async obtener(clave: string): Promise<string | null> {
    try {
      return await this.cliente.get(clave);
    } catch {
      return null;
    }
  }

  async guardar(clave: string, valor: string, ttlSegundos: number): Promise<void> {
    try {
      await this.cliente.set(clave, valor, 'EX', ttlSegundos);
    } catch {
      // La caché es auxiliar: un fallo no interrumpe la lectura clínica.
    }
  }

  async borrar(clave: string): Promise<void> {
    try {
      await this.cliente.del(clave);
    } catch {
      // Igual que guardar: la próxima lectura reconstruye la vista.
    }
  }

  async cerrar(): Promise<void> {
    this.cliente.disconnect();
  }
}
