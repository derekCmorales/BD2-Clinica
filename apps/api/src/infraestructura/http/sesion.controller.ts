import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { marcarActorId } from '../../compartido/tipos';
import { USUARIOS_DEMO } from '../auth/actor';
import { IniciarSesionDto } from './dto';

@ApiTags('sesion')
@Controller('sesion')
export class SesionController {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  iniciar(@Body() dto: IniciarSesionDto) {
    const esperada = this.config.get<string>('DEMO_CLAVE', 'demo');
    if (!mismaClave(dto.clave, esperada)) {
      throw new UnauthorizedException();
    }
    const usuario = USUARIOS_DEMO[dto.institucionId];
    const actorId = marcarActorId(usuario.actorId);
    const token = this.jwt.sign({
      sub: actorId,
      institucionId: dto.institucionId,
      correo: usuario.correo,
      nombre: usuario.nombre,
    });
    return {
      token,
      institucionId: dto.institucionId,
      nombre: usuario.nombre,
      correo: usuario.correo,
    };
  }
}

function mismaClave(recibida: string, esperada: string): boolean {
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
