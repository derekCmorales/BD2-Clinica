import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('salud')
export class SaludController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  obtener() {
    return {
      estado: 'ok',
      servicio: 'historiales-api',
      entrega: 2,
      persistencia: this.config.get<string>('PERSISTENCIA', 'memoria'),
    };
  }
}
