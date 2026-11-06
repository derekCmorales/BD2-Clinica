import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CATALOGO_EXAMENES, type DefinicionExamen } from '../../dominio/modelo/tipos-clinicos';
import { GuardiaJwt } from '../auth/guardia-jwt';
import { DefinicionExamenDto } from './dto';

/**
 * Catálogo común a las cuatro instituciones. El cliente lo usa para construir el
 * formulario y la tarjeta sin duplicar la lista de campos por tipo de examen.
 */
@ApiTags('catalogos')
@ApiBearerAuth()
@UseGuards(GuardiaJwt)
@Controller('catalogos')
export class CatalogosController {
  @Get('examenes')
  @ApiOkResponse({ type: [DefinicionExamenDto] })
  examenes(): readonly DefinicionExamen[] {
    return CATALOGO_EXAMENES;
  }
}
