import { Logger } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { FiltroErroresDeDominio } from './filtro-errores-dominio';

const RESTRINGIDO = 'VIH positivo sintético';

describe('logs sin datos restringidos (AGENTS.md §8)', () => {
  it('el filtro de errores no escribe el mensaje del error', () => {
    const espia = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const respuesta = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => respuesta }),
    } as never;

    new FiltroErroresDeDominio().catch(new Error(`fallo con ${RESTRINGIDO}`), host);

    const registrado = espia.mock.calls.map((llamada) => llamada.join(' ')).join(' ');
    expect(registrado).not.toContain(RESTRINGIDO);
    expect(registrado).toContain('Error');
    espia.mockRestore();
  });

  it('ninguna llamada a Logger del API interpola campos restringidos', () => {
    const prohibido = /(dpi|diagnostico|textoLibre|valores|payload|datos\.|tutorNombre|telefono|direccion)/i;
    const infracciones: string[] = [];

    for (const archivo of archivosDeApi(path.resolve(__dirname, '../..'))) {
      const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
      lineas.forEach((linea, indice) => {
        if (!/\b(Logger|logger)\.(log|error|warn|debug|verbose)\s*\(/.test(linea)) {
          return;
        }
        if (prohibido.test(linea)) {
          infracciones.push(`${path.relative(process.cwd(), archivo)}:${indice + 1} ${linea.trim()}`);
        }
      });
    }

    expect(infracciones).toEqual([]);
  });
});

function archivosDeApi(carpeta: string): string[] {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      return archivosDeApi(ruta);
    }
    return entrada.name.endsWith('.ts') && !entrada.name.endsWith('.spec.ts') ? [ruta] : [];
  });
}
