import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { esInstitucionId, marcarActorId } from '../../compartido/tipos';
import type { SolicitudAutenticada } from './actor';

interface CuerpoToken {
  readonly sub?: string;
  readonly institucionId?: string;
  readonly correo?: string;
  readonly nombre?: string;
}

@Injectable()
export class GuardiaJwt implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(contexto: ExecutionContext): boolean {
    const solicitud = contexto.switchToHttp().getRequest<SolicitudAutenticada>();
    const encabezado = solicitud.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    try {
      const cuerpo = this.jwt.verify<CuerpoToken>(encabezado.slice('Bearer '.length));
      if (!cuerpo.sub || !cuerpo.institucionId || !esInstitucionId(cuerpo.institucionId) || !cuerpo.correo || !cuerpo.nombre) {
        throw new UnauthorizedException();
      }
      solicitud.actor = {
        actorId: marcarActorId(cuerpo.sub),
        institucionId: cuerpo.institucionId,
        correo: cuerpo.correo,
        nombre: cuerpo.nombre,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }
  }
}
