import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FiltroErroresDeDominio } from './infraestructura/http/filtro-errores-dominio';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({ origin: config.get<string>('WEB_ORIGIN', 'http://localhost:5173') });
  app.useGlobalFilters(new FiltroErroresDeDominio());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  const documento = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Historiales clínicos')
      .setDescription('Misma API para las cuatro instituciones. El motor lo decide el JWT.')
      .setVersion('2')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, documento);
  app.enableShutdownHooks();

  const puerto = config.get<number>('API_PORT', 3000);
  await app.listen(puerto);
  Logger.log(`API escuchando en http://localhost:${puerto}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  // Solo el nombre: un error de arranque de driver puede incluir la cadena de conexión.
  Logger.error(`Fallo al arrancar: ${error instanceof Error ? error.name : 'desconocido'}`, 'Bootstrap');
  process.exit(1);
});
