const fs = require('node:fs');
const path = require('node:path');

/** Escribe docs/entrega-2/evidencia-contrato.md con el resultado por motor. */
class ReporteroContrato {
  constructor() {
    this.filas = [];
    this.inicio = Date.now();
  }

  onTestResult(_prueba, resultado) {
    for (const caso of resultado.testResults) {
      const grupo = (caso.ancestorTitles[0] ?? 'sin grupo').replace('contrato de adaptador: ', '');
      const [institucion, motor] = grupo.split(' · ');
      this.filas.push({
        institucion: institucion ?? grupo,
        motor: motor ?? grupo,
        escenario: caso.title,
        estado: caso.status,
        duracion: Math.round(caso.duration ?? 0),
      });
    }
  }

  onRunComplete(_contextos, resultados) {
    const destino = path.resolve(__dirname, '../../docs/entrega-2/evidencia-contrato.md');
    fs.mkdirSync(path.dirname(destino), { recursive: true });

    const motores = [...new Set(this.filas.map((fila) => fila.motor))];
    const lineas = [
      '# Evidencia de la suite de contrato',
      '',
      `Generado: ${new Date().toISOString()}`,
      `Resultado global: ${resultados.numPassedTests} pasan, ${resultados.numFailedTests} fallan, ${resultados.numPendingTests} pendientes.`,
      '',
      '| Motor | Institución | Escenario | Estado | ms |',
      '|---|---|---|---|---|',
      ...this.filas.map(
        (fila) =>
          `| ${fila.motor} | ${fila.institucion} | ${fila.escenario} | ${icono(fila.estado)} ${fila.estado} | ${fila.duracion} |`,
      ),
      '',
      '## Resumen por motor',
      '',
      '| Motor | Pasan | Fallan | Total |',
      '|---|---|---|---|',
      ...motores.map((motor) => {
        const filas = this.filas.filter((fila) => fila.motor === motor);
        return `| ${motor} | ${filas.filter((f) => f.estado === 'passed').length} | ${filas.filter((f) => f.estado === 'failed').length} | ${filas.length} |`;
      }),
      '',
      '> Redis valida el solape de citas dentro del mismo expediente; el solape entre pacientes',
      '> distintos queda documentado como limitación en el documento comparativo (fase 8).',
      '',
    ];
    fs.writeFileSync(destino, lineas.join('\n'), 'utf8');
  }
}

function icono(estado) {
  if (estado === 'passed') return '✅';
  if (estado === 'failed') return '❌';
  return '⏭️';
}

module.exports = ReporteroContrato;
