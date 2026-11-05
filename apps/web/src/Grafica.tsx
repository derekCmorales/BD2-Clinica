import { useId, useState } from 'react';
import { fechaLegible, parsearFecha } from './formato';

/**
 * Serie única en el tiempo (peso o talla). Una gráfica por medida: nunca doble eje.
 * Línea 2px, marcadores 8px con anillo de superficie, rejilla recesiva,
 * tooltip con guía vertical; la tabla equivalente vive en la sección (botón «Ver tabla»).
 */
export function Grafica({
  titulo,
  unidad,
  puntos,
}: {
  titulo: string;
  unidad: string;
  puntos: Array<{ fecha: string; valor: number }>;
}) {
  const tituloId = useId();
  const [activo, setActivo] = useState<number | null>(null);
  const ancho = 480;
  const alto = 200;
  const margen = { arriba: 12, derecha: 12, abajo: 26, izquierda: 36 };
  const w = ancho - margen.izquierda - margen.derecha;
  const h = alto - margen.arriba - margen.abajo;

  const tiempos = puntos.map((p) => parsearFecha(p.fecha).getTime());
  const valores = puntos.map((p) => p.valor);
  const tMin = Math.min(...tiempos);
  const tMax = Math.max(...tiempos);
  const vMinCrudo = Math.min(...valores);
  const vMaxCrudo = Math.max(...valores);
  const holgura = (vMaxCrudo - vMinCrudo || vMaxCrudo || 1) * 0.15;
  const vMin = Math.max(0, Math.floor(vMinCrudo - holgura));
  const vMax = Math.ceil(vMaxCrudo + holgura);

  const x = (t: number) => margen.izquierda + (tMax === tMin ? w / 2 : ((t - tMin) / (tMax - tMin)) * w);
  const y = (v: number) => margen.arriba + h - ((v - vMin) / (vMax - vMin || 1)) * h;

  const marcas = [0, 0.5, 1].map((f) => vMin + (vMax - vMin) * f);
  const ruta = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(tiempos[i]).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const ultimo = puntos[puntos.length - 1];
  const previo = puntos[puntos.length - 2];
  const delta = previo ? ultimo.valor - previo.valor : null;
  const punto = activo !== null ? puntos[activo] : null;

  return (
    <section className="card" aria-labelledby={tituloId}>
      <div className="card__header">
        <h4 id={tituloId}>{titulo}</h4>
        <div className="ultimo-valor">
          <strong className="num">
            {ultimo.valor} <span className="muted" style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}>{unidad}</span>
          </strong>
          {delta !== null ? (
            <span className="muted num" style={{ fontSize: 'var(--text-xs)' }}>
              {delta >= 0 ? '+' : '−'}
              {Math.abs(delta).toFixed(1)} vs. anterior
            </span>
          ) : null}
        </div>
      </div>
      <div className="card__body grafica" onMouseLeave={() => setActivo(null)}>
        <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`${titulo} en ${unidad}, ${puntos.length} mediciones; última ${ultimo.valor} ${unidad}`}>
          {marcas.map((valor) => (
            <g key={valor}>
              <line className="rejilla" x1={margen.izquierda} x2={ancho - margen.derecha} y1={y(valor)} y2={y(valor)} />
              <text className="etiqueta" x={margen.izquierda - 8} y={y(valor) + 4} textAnchor="end">
                {Math.round(valor)}
              </text>
            </g>
          ))}
          <line className="eje" x1={margen.izquierda} x2={ancho - margen.derecha} y1={margen.arriba + h} y2={margen.arriba + h} />
          <text className="etiqueta" x={margen.izquierda} y={alto - 6}>
            {fechaLegible(puntos[0].fecha)}
          </text>
          {puntos.length > 1 ? (
            <text className="etiqueta" x={ancho - margen.derecha} y={alto - 6} textAnchor="end">
              {fechaLegible(ultimo.fecha)}
            </text>
          ) : null}
          {activo !== null ? <line className="guia" x1={x(tiempos[activo])} x2={x(tiempos[activo])} y1={margen.arriba} y2={margen.arriba + h} /> : null}
          <path className="serie" d={ruta} />
          {puntos.map((p, i) => (
            <circle key={p.fecha} className={`punto${activo === i ? ' punto--activo' : ''}`} cx={x(tiempos[i])} cy={y(p.valor)} r={4} />
          ))}
          {puntos.map((p, i) => {
            const izquierda = i === 0 ? margen.izquierda : (x(tiempos[i - 1]) + x(tiempos[i])) / 2;
            const derecha = i === puntos.length - 1 ? ancho - margen.derecha : (x(tiempos[i]) + x(tiempos[i + 1])) / 2;
            return (
              <rect
                key={`hit-${p.fecha}`}
                className="hit"
                x={izquierda}
                y={margen.arriba}
                width={Math.max(derecha - izquierda, 1)}
                height={h}
                onMouseEnter={() => setActivo(i)}
              />
            );
          })}
        </svg>
        {punto && activo !== null ? (
          <div
            className="tooltip"
            style={{
              left: `calc(16px + (100% - 32px) * ${x(tiempos[activo]) / ancho})`,
              top: `calc(16px + (100% - 32px) * ${y(punto.valor) / alto})`,
            }}
          >
            <strong className="num">
              {punto.valor} {unidad}
            </strong>{' '}
            · {fechaLegible(punto.fecha)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
