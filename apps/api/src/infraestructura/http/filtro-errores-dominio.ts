import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CitaSolapada,
  ConflictoDeConcurrencia,
  ConsultaNoEncontrada,
  ErrorDeDominio,
  ExpedienteArchivado,
  PacienteNoEncontrado,
} from '../../dominio/errores/errores-dominio';

const ESTADO_POR_ERROR = new Map<Function, HttpStatus>([
  [PacienteNoEncontrado, HttpStatus.NOT_FOUND],
  [ConsultaNoEncontrada, HttpStatus.NOT_FOUND],
  [ConflictoDeConcurrencia, HttpStatus.CONFLICT],
  [ExpedienteArchivado, HttpStatus.CONFLICT],
  [CitaSolapada, HttpStatus.CONFLICT],
]);

/**
 * Traduce errores de dominio a HTTP. Cualquier otra excepción no-HTTP es un 500 opaco:
 * el cliente nunca ve el mensaje (puede contener SQL, payloads o datos restringidos)
 * y el log registra solo el nombre de la clase.
 */
@Catch()
export class FiltroErroresDeDominio implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErroresDeDominio.name);

  catch(error: unknown, host: ArgumentsHost) {
    const respuesta = host.switchToHttp().getResponse<Response>();

    if (error instanceof HttpException) {
      respuesta.status(error.getStatus()).json(error.getResponse());
      return;
    }

    if (error instanceof ErrorDeDominio) {
      const estado = ESTADO_POR_ERROR.get(error.constructor) ?? HttpStatus.UNPROCESSABLE_ENTITY;
      respuesta.status(estado).json({ error: error.name, mensaje: error.message });
      return;
    }

    this.logger.error(`Error no controlado: ${error instanceof Error ? error.name : typeof error}`);
    respuesta
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'ErrorInterno', mensaje: 'Error interno del servidor' });
  }
}
