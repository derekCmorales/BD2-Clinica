import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PostgresExpedienteRepository } from './infraestructura/postgres/postgres-expediente.repository';

/**
 * Mantenimiento del Hospital: reconstruye el read model desde clinico.eventos.
 * El script `pnpm hospital:reproyectar` limpia las tablas derivadas antes de llamar aquí.
 */
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const repositorio = app.get(PostgresExpedienteRepository);
  try {
    const resultado = await repositorio.reproyectar();
    console.log(`Reproyectados ${resultado.agregados} agregados y ${resultado.eventos} eventos.`);
  } finally {
    await repositorio.cerrar();
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(`Fallo al reproyectar: ${error instanceof Error ? error.name : 'desconocido'}`);
  process.exit(1);
});
