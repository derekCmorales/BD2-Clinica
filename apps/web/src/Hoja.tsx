import { FormEvent, useId, useState } from 'react';
import type { ExpedienteVista } from './api';
import { fechaHora, fechaLegible, parsearFecha, vencida } from './formato';

export type Seccion = 'resumen' | 'consultas' | 'agenda' | 'laboratorio' | 'crecimiento' | 'vacunas' | 'odontograma';

const CAMPOS: Record<string, [string, string]> = {
  hematologia: ['hemoglobina', 'leucocitos'],
  orina: ['color', 'ph'],
  cultivo: ['organismo', 'sensibleA'],
  otro: ['descripcion', 'nota'],
};

const ESTADOS_PIEZA = ['sano', 'caries', 'obturado', 'corona', 'ausente', 'implante', 'endodoncia', 'otro'] as const;

const CUADRANTES = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

export function Hoja({
  seccion,
  expediente,
  ocupado,
  onEnviar,
}: {
  seccion: Seccion;
  expediente: ExpedienteVista;
  ocupado: boolean;
  onEnviar: (ruta: string, cuerpo: unknown) => Promise<void>;
}) {
  const base = `/pacientes/${expediente.pacienteId}`;
  const cerrado = expediente.estado === 'archivado';

  if (seccion === 'resumen') {
    return <Resumen expediente={expediente} />;
  }
  if (seccion === 'consultas') {
    return <Consultas expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
  }
  if (seccion === 'agenda') {
    return <Agenda expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
  }
  if (seccion === 'laboratorio') {
    return <Laboratorio expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
  }
  if (seccion === 'crecimiento') {
    return <Crecimiento expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
  }
  if (seccion === 'vacunas') {
    return <Vacunas expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
  }
  return <Odontograma expediente={expediente} base={base} cerrado={cerrado} ocupado={ocupado} onEnviar={onEnviar} />;
}

function Resumen({ expediente }: { expediente: ExpedienteVista }) {
  const eventos = [
    ...expediente.consultas.map((consulta) => ({
      cuando: consulta.ocurridaEn,
      titulo: consulta.motivo,
      detalle: 'Consulta',
    })),
    ...expediente.citas.map((cita) => ({
      cuando: cita.inicio,
      titulo: cita.motivo,
      detalle: `Cita · ${cita.estado}`,
    })),
    ...expediente.examenes.map((examen) => ({
      cuando: examen.fecha,
      titulo: examen.tipoExamen,
      detalle: 'Laboratorio',
    })),
    ...expediente.mediciones.map((medicion) => ({
      cuando: medicion.fecha,
      titulo: `${medicion.pesoKg} kg · ${medicion.tallaCm} cm`,
      detalle: 'Medición',
    })),
    ...expediente.vacunas.map((vacuna) => ({
      cuando: vacuna.proximaEn,
      titulo: vacuna.codigo,
      detalle: 'Vacuna',
    })),
  ].sort((a, b) => parsearFecha(b.cuando).getTime() - parsearFecha(a.cuando).getTime());

  return (
    <div className="resumen">
      <dl className="cifras">
        <div>
          <dt>Consultas</dt>
          <dd>{expediente.consultas.length}</dd>
        </div>
        <div>
          <dt>Exámenes</dt>
          <dd>{expediente.examenes.length}</dd>
        </div>
        <div>
          <dt>Citas</dt>
          <dd>{expediente.citas.length}</dd>
        </div>
        <div>
          <dt>Vacunas</dt>
          <dd>{expediente.vacunas.length}</dd>
        </div>
      </dl>
      {eventos.length === 0 ? <p className="pista">Todavía no hay notas en esta hoja.</p> : null}
      <ol className="linea">
        {eventos.map((evento) => (
          <li key={`${evento.detalle}-${evento.cuando}-${evento.titulo}`}>
            <span>{evento.detalle}</span>
            <strong>{evento.titulo}</strong>
            <time dateTime={evento.cuando}>{fechaLegible(evento.cuando)}</time>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Consultas({
  expediente,
  base,
  cerrado,
  ocupado,
  onEnviar,
}: AccionProps) {
  const id = useId();
  const [motivo, setMotivo] = useState('Control');
  const [consultaId, setConsultaId] = useState(expediente.consultas[0]?.id ?? '');
  const consultaActiva = expediente.consultas.some((consulta) => consulta.id === consultaId)
    ? consultaId
    : (expediente.consultas[0]?.id ?? '');
  const [texto, setTexto] = useState('');
  const [dosis, setDosis] = useState('1 tableta');
  const [frecuencia, setFrecuencia] = useState('cada 8 horas');
  const [citaId, setCitaId] = useState('');
  const citasAbiertas = expediente.citas.filter((cita) => cita.estado === 'programada');

  return (
    <div className="seccion">
      {expediente.consultas.length === 0 ? <p className="pista">Sin consultas. La primera queda abajo.</p> : null}
      {expediente.consultas.map((consulta) => (
        <article key={consulta.id} className="nota">
          <header>
            <h3>{consulta.motivo}</h3>
            <time dateTime={consulta.ocurridaEn}>{fechaHora(consulta.ocurridaEn)}</time>
          </header>
          {consulta.notas ? <p>{consulta.notas}</p> : null}
          <ul>
            {consulta.diagnosticos.map((item) => (
              <li key={item.id}>
                <span>Diagnóstico</span> {item.textoLibre}
              </li>
            ))}
            {consulta.recetas.map((item) => (
              <li key={item.id}>
                <span>Receta</span> {item.textoLibre} · {item.dosis} · {item.frecuencia}
              </li>
            ))}
          </ul>
        </article>
      ))}
      {cerrado ? null : (
        <div className="composer">
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void onEnviar(`${base}/consultas`, { motivo, citaId: citaId || undefined });
            }}
          >
            <h3>Nueva consulta</h3>
            <label htmlFor={`${id}-motivo`}>Motivo</label>
            <input id={`${id}-motivo`} value={motivo} onChange={(evento) => setMotivo(evento.target.value)} required />
            <label htmlFor={`${id}-cita`}>Cita que se atiende</label>
            <select id={`${id}-cita`} value={citaId} onChange={(evento) => setCitaId(evento.target.value)}>
              <option value="">Sin cita previa</option>
              {citasAbiertas.map((cita) => (
                <option key={cita.id} value={cita.id}>{cita.motivo}</option>
              ))}
            </select>
            <button type="submit" disabled={ocupado}>Registrar</button>
          </form>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              void onEnviar(`${base}/consultas/${consultaActiva}/diagnosticos`, { textoLibre: texto, esPrincipal: true });
            }}
          >
            <h3>Diagnóstico</h3>
            <label htmlFor={`${id}-consulta`}>Consulta</label>
            <select id={`${id}-consulta`} value={consultaActiva} onChange={(evento) => setConsultaId(evento.target.value)}>
              {expediente.consultas.map((consulta) => (
                <option key={consulta.id} value={consulta.id}>
                  {consulta.motivo}
                </option>
              ))}
            </select>
            <label htmlFor={`${id}-texto`}>Texto</label>
            <input id={`${id}-texto`} value={texto} onChange={(evento) => setTexto(evento.target.value)} required />
            <button type="submit" disabled={ocupado || !consultaActiva}>Agregar</button>
          </form>
          <form
            onSubmit={(evento: FormEvent) => {
              evento.preventDefault();
              void onEnviar(`${base}/consultas/${consultaActiva}/recetas`, {
                textoLibre: texto || 'Paracetamol',
                dosis,
                frecuencia,
              });
            }}
          >
            <h3>Receta</h3>
            <label htmlFor={`${id}-dosis`}>Dosis</label>
            <input id={`${id}-dosis`} value={dosis} onChange={(evento) => setDosis(evento.target.value)} required />
            <label htmlFor={`${id}-frecuencia`}>Frecuencia</label>
            <input id={`${id}-frecuencia`} value={frecuencia} onChange={(evento) => setFrecuencia(evento.target.value)} required />
            <button type="submit" disabled={ocupado || !consultaActiva}>Recetar</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Agenda({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const id = useId();
  const [inicio, setInicio] = useState('2026-10-07T09:00');
  const [fin, setFin] = useState('2026-10-07T09:30');
  const [motivo, setMotivo] = useState('Control');

  return (
    <div className="seccion">
      {expediente.citas.length === 0 ? <p className="pista">No hay citas en esta hoja.</p> : null}
      <ul className="citas">
        {expediente.citas.map((cita) => (
          <li key={cita.id}>
            <time dateTime={cita.inicio}>{fechaHora(cita.inicio)}</time>
            <strong>{cita.motivo}</strong>
            <span>{cita.estado}</span>
            {cita.estado === 'programada' && !cerrado ? (
              <span className="acciones-cita">
                <button type="button" className="fantasma" disabled={ocupado} onClick={() => void onEnviar(`${base}/citas/${cita.id}/cerrar`, { estado: 'cancelada' })}>Cancelar</button>
                <button type="button" className="fantasma" disabled={ocupado} onClick={() => void onEnviar(`${base}/citas/${cita.id}/cerrar`, { estado: 'inasistencia' })}>Inasistencia</button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {cerrado ? null : (
        <form
          className="composer solo"
          onSubmit={(evento) => {
            evento.preventDefault();
            void onEnviar(`${base}/citas`, {
              inicio: new Date(inicio).toISOString(),
              fin: new Date(fin).toISOString(),
              motivo,
            });
          }}
        >
          <h3>Reservar cita</h3>
          <label htmlFor={`${id}-inicio`}>Inicio</label>
          <input id={`${id}-inicio`} type="datetime-local" value={inicio} onChange={(evento) => setInicio(evento.target.value)} required />
          <label htmlFor={`${id}-fin`}>Fin</label>
          <input id={`${id}-fin`} type="datetime-local" value={fin} onChange={(evento) => setFin(evento.target.value)} required />
          <label htmlFor={`${id}-motivo`}>Motivo</label>
          <input id={`${id}-motivo`} value={motivo} onChange={(evento) => setMotivo(evento.target.value)} required />
          <button type="submit" disabled={ocupado}>Reservar</button>
        </form>
      )}
    </div>
  );
}

function Laboratorio({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const id = useId();
  const [tipoExamen, setTipoExamen] = useState('hematologia');
  const [fecha, setFecha] = useState('2026-10-06');
  const [valorA, setValorA] = useState('');
  const [valorB, setValorB] = useState('');
  const campos = CAMPOS[tipoExamen] ?? CAMPOS.otro;

  return (
    <div className="seccion">
      {expediente.examenes.length === 0 ? <p className="pista">Sin resultados. Cada tipo de examen pide sus propios campos.</p> : null}
      <div className="resultados">
        {expediente.examenes.map((examen) => (
          <article key={examen.id} className="nota">
            <header>
              <h3>{examen.tipoExamen}</h3>
              <time dateTime={examen.fecha}>{fechaLegible(examen.fecha)} · {examen.estado ?? 'registrado'}</time>
            </header>
            <dl>
              {Object.entries(examen.valores).map(([campo, valor]) => (
                <div key={campo}>
                  <dt>{campo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
            {!cerrado && (examen.estado ?? 'registrado') !== 'anulado' ? (
              <div className="acciones-cita">
                {(examen.estado ?? 'registrado') === 'registrado' ? (
                  <button type="button" disabled={ocupado} onClick={() => void onEnviar(`${base}/examenes/${examen.id}/dictamen`, { estado: 'validado' })}>Validar</button>
                ) : null}
                <button type="button" className="fantasma" disabled={ocupado} onClick={() => void onEnviar(`${base}/examenes/${examen.id}/dictamen`, { estado: 'anulado' })}>Anular</button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {cerrado ? null : (
        <form
          className="composer solo"
          onSubmit={(evento) => {
            evento.preventDefault();
            void onEnviar(`${base}/examenes`, {
              tipoExamen,
              fecha,
              valores: { [campos[0]]: valorA, [campos[1]]: valorB },
            });
          }}
        >
          <h3>Registrar resultado</h3>
          <label htmlFor={`${id}-fecha`}>Fecha</label>
          <input id={`${id}-fecha`} type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} required />
          <label htmlFor={`${id}-tipo`}>Tipo</label>
          <select id={`${id}-tipo`} value={tipoExamen} onChange={(evento) => setTipoExamen(evento.target.value)}>
            <option value="hematologia">Hematología</option>
            <option value="orina">Orina</option>
            <option value="cultivo">Cultivo</option>
            <option value="otro">Otro</option>
          </select>
          <label htmlFor={`${id}-a`}>{campos[0]}</label>
          <input id={`${id}-a`} value={valorA} onChange={(evento) => setValorA(evento.target.value)} required />
          <label htmlFor={`${id}-b`}>{campos[1]}</label>
          <input id={`${id}-b`} value={valorB} onChange={(evento) => setValorB(evento.target.value)} required={campos[0] !== campos[1] && tipoExamen !== 'otro'} />
          <button type="submit" disabled={ocupado}>Guardar resultado</button>
        </form>
      )}
    </div>
  );
}

function Crecimiento({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const id = useId();
  const [fecha, setFecha] = useState('2026-10-06');
  const [peso, setPeso] = useState('12.4');
  const [talla, setTalla] = useState('86');
  const maximo = Math.max(...expediente.mediciones.map((medicion) => medicion.pesoKg), 1);

  return (
    <div className="seccion">
      {expediente.mediciones.length === 0 ? <p className="pista">Aún no hay puntos en la curva.</p> : null}
      <ul className="curva">
        {expediente.mediciones.map((medicion) => (
          <li key={medicion.fecha}>
            <time dateTime={medicion.fecha}>{fechaLegible(medicion.fecha)}</time>
            <span className="barra" style={{ width: `${Math.max(8, (medicion.pesoKg / maximo) * 100)}%` }} />
            <strong>
              {medicion.pesoKg} kg · {medicion.tallaCm} cm
            </strong>
          </li>
        ))}
      </ul>
      {cerrado ? null : (
        <form
          className="composer solo"
          onSubmit={(evento) => {
            evento.preventDefault();
            void onEnviar(`${base}/mediciones`, { fecha, pesoKg: Number(peso), tallaCm: Number(talla) });
          }}
        >
          <h3>Nueva medición</h3>
          <label htmlFor={`${id}-fecha`}>Fecha</label>
          <input id={`${id}-fecha`} type="date" value={fecha} onChange={(evento) => setFecha(evento.target.value)} required />
          <label htmlFor={`${id}-peso`}>Peso (kg)</label>
          <input id={`${id}-peso`} value={peso} onChange={(evento) => setPeso(evento.target.value)} inputMode="decimal" required />
          <label htmlFor={`${id}-talla`}>Talla (cm)</label>
          <input id={`${id}-talla`} value={talla} onChange={(evento) => setTalla(evento.target.value)} inputMode="decimal" required />
          <button type="submit" disabled={ocupado}>Registrar medición</button>
        </form>
      )}
    </div>
  );
}

function Vacunas({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const id = useId();
  const [codigo, setCodigo] = useState('SRP');
  const [proximaEn, setProximaEn] = useState('2026-12-01');
  const [aplicadaEn, setAplicadaEn] = useState('');

  return (
    <div className="seccion">
      {expediente.vacunas.length === 0 ? <p className="pista">El esquema todavía está vacío.</p> : null}
      <ul className="citas">
        {expediente.vacunas.map((vacuna) => (
          <li key={vacuna.codigo}>
            <strong>{vacuna.codigo}</strong>
            <time dateTime={vacuna.proximaEn}>{fechaLegible(vacuna.proximaEn)}</time>
            <span className={vencida(vacuna.proximaEn) ? 'sello' : ''}>{vencida(vacuna.proximaEn) ? 'Vencida' : 'Pendiente'}</span>
          </li>
        ))}
      </ul>
      {cerrado ? null : (
        <form
          className="composer solo"
          onSubmit={(evento) => {
            evento.preventDefault();
            void onEnviar(`${base}/vacunas`, { codigo, proximaEn, aplicadaEn: aplicadaEn || undefined });
          }}
        >
          <h3>Programar dosis</h3>
          <label htmlFor={`${id}-codigo`}>Vacuna</label>
          <input id={`${id}-codigo`} value={codigo} onChange={(evento) => setCodigo(evento.target.value)} required />
          <label htmlFor={`${id}-aplicada`}>Aplicada el</label>
          <input id={`${id}-aplicada`} type="date" value={aplicadaEn} onChange={(evento) => setAplicadaEn(evento.target.value)} />
          <label htmlFor={`${id}-proxima`}>Próxima dosis</label>
          <input id={`${id}-proxima`} type="date" value={proximaEn} onChange={(evento) => setProximaEn(evento.target.value)} required />
          <button type="submit" disabled={ocupado}>Programar</button>
        </form>
      )}
    </div>
  );
}

function Odontograma({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [activa, setActiva] = useState<number | null>(null);
  const [consultaId, setConsultaId] = useState(expediente.consultas[0]?.id ?? '');
  const [tipo, setTipo] = useState('Obturación');
  const [descripcion, setDescripcion] = useState('');
  const estadoDe = (codigo: number) => expediente.piezas.find((pieza) => pieza.codigoFdi === codigo)?.estado ?? 'sano';

  return (
    <div className="seccion">
      <p className="pista">Dentición permanente, notación FDI. Elige una pieza y su estado.</p>
      <div className="boca" role="group" aria-label="Odontograma">
        {CUADRANTES.map((fila) => (
          <div key={fila[0]} className="arcada">
            {fila.map((codigo) => (
              <button
                key={codigo}
                type="button"
                className={`diente ${estadoDe(codigo)} ${activa === codigo ? 'activa' : ''}`}
                aria-pressed={activa === codigo}
                aria-label={`Pieza ${codigo}, ${estadoDe(codigo)}`}
                onClick={() => setActiva(codigo)}
              >
                <span>{codigo}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      {(expediente.procedimientos ?? []).filter((item) => item.codigoFdi === activa).map((item) => (
        <p key={item.id}>{item.tipo}: {item.descripcion}</p>
      ))}
      {activa && !cerrado ? (
        <div className="estados" role="group" aria-label={`Estado de la pieza ${activa}`}>
          {ESTADOS_PIEZA.map((estado) => (
            <button
              key={estado}
              type="button"
              className={estadoDe(activa) === estado ? 'chip activo' : 'chip'}
              disabled={ocupado}
              onClick={() => void onEnviar(`${base}/piezas`, { codigoFdi: activa, estado })}
            >
              {estado}
            </button>
          ))}
        </div>
      ) : null}
      {activa && !cerrado && expediente.consultas.length > 0 ? (
        <form
          className="composer solo"
          onSubmit={(evento) => {
            evento.preventDefault();
            void onEnviar(`${base}/procedimientos`, { codigoFdi: activa, consultaId, tipo, descripcion });
          }}
        >
          <h3>Procedimiento en pieza {activa}</h3>
          <label htmlFor="proc-consulta">Consulta</label>
          <select id="proc-consulta" value={consultaId} onChange={(evento) => setConsultaId(evento.target.value)}>
            {expediente.consultas.map((consulta) => (
              <option key={consulta.id} value={consulta.id}>{consulta.motivo}</option>
            ))}
          </select>
          <label htmlFor="proc-tipo">Tipo</label>
          <input id="proc-tipo" value={tipo} onChange={(evento) => setTipo(evento.target.value)} required />
          <label htmlFor="proc-desc">Descripción</label>
          <input id="proc-desc" value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} required />
          <button type="submit" disabled={ocupado}>Registrar procedimiento</button>
        </form>
      ) : null}
    </div>
  );
}

interface AccionProps {
  expediente: ExpedienteVista;
  base: string;
  cerrado: boolean;
  ocupado: boolean;
  onEnviar: (ruta: string, cuerpo: unknown) => Promise<void>;
}
