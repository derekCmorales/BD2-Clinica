import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AUDIT_LOG } from '../dominio/puertos/audit-log';
import { CONSULTA_DE_AUDITORIA } from '../dominio/puertos/consulta-de-auditoria';
import { EXPEDIENTE_QUERY_SERVICE } from '../dominio/puertos/expediente-query.service';
import { EXPEDIENTE_REPOSITORY } from '../dominio/puertos/expediente.repository';
import { GuardiaJwt } from './auth/guardia-jwt';
import { secretoJwt } from './auth/secreto-jwt';
import { CACHE_LECTURA, CacheEnProceso, CacheRedis } from './cache/cache-lectura';
import { MemoriasPorInstitucion } from './memoria/memoria-expediente.repository';
import { MongoExpedienteRepository } from './mongo/mongo-expediente.repository';
import { MysqlExpedienteRepository } from './mysql/mysql-expediente.repository';
import { PostgresExpedienteRepository } from './postgres/postgres-expediente.repository';
import { RedisExpedienteRepository } from './redis/redis-expediente.repository';
import { EnrutadorDeMotor } from './routing/enrutador-de-motor';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: secretoJwt(config),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [
    MemoriasPorInstitucion,
    PostgresExpedienteRepository,
    MysqlExpedienteRepository,
    MongoExpedienteRepository,
    RedisExpedienteRepository,
    GuardiaJwt,
    {
      provide: CACHE_LECTURA,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('PERSISTENCIA', 'memoria') === 'motores' ? new CacheRedis(config) : new CacheEnProceso(),
    },
    EnrutadorDeMotor,
    { provide: EXPEDIENTE_REPOSITORY, useExisting: EnrutadorDeMotor },
    { provide: EXPEDIENTE_QUERY_SERVICE, useExisting: EnrutadorDeMotor },
    { provide: AUDIT_LOG, useExisting: EnrutadorDeMotor },
    { provide: CONSULTA_DE_AUDITORIA, useExisting: EnrutadorDeMotor },
  ],
  exports: [
    JwtModule,
    GuardiaJwt,
    EXPEDIENTE_REPOSITORY,
    EXPEDIENTE_QUERY_SERVICE,
    AUDIT_LOG,
    CONSULTA_DE_AUDITORIA,
  ],
})
export class PersistenciaModule {}
