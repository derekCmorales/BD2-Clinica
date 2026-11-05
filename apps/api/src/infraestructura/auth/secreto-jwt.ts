import { ConfigService } from '@nestjs/config';

/** Secreto de laboratorio. En producción tiene que venir de JWT_SECRET. */
export function secretoJwt(config: ConfigService): string {
  const valor = config.get<string>('JWT_SECRET');
  if (valor) {
    return valor;
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET ausente');
  }
  return 'jwt_dev_cambiar';
}
