import { type ReactNode, useMemo, useState } from 'react';
import type { EntradaAuditoria, ExpedienteVista } from './api';
import { fechaHora, fechaLegible, fechaRelativa, hoyHora, hoyIso, parsearFecha, vencida } from './formato';
import { Grafica } from './Grafica';
import {
  Alerta,
  Boton,
  Campo,
  Dialogo,
  Esqueleto,
  EtiquetaClasificacion,
  Icono,
  Insignia,
  Vacio,
  type NombreIcono,
  type Tono,
} from './ui';

export type Seccion =
  | 'resumen'
  | 'consultas'
  | 'agenda'
  | 'laboratorio'
  | 'crecimiento'
  | 'vacunas'
  | 'odontograma'
  | 'accesos';

export interface AuditoriaVista {
  readonly entradas: readonly EntradaAuditoria[];
  readonly cargando: boolean;
  readonly error: string;
}

type Enviar = (ruta: string, cuerpo: unknown, exito?: string) => Promise<boolean>;

interface AccionProps {
  expediente: ExpedienteVista;
  base: string;
  cerrado: boolean;
  ocupado: boolean;
  onEnviar: Enviar;
}

/** Campos mínimos por tipo de examen: espejo de CAMPOS_POR_TIPO_EXAMEN del dominio. */
const TIPOS_EXAMEN: Record<string, { etiqueta: string; campos: Array<{ clave: string; etiqueta: string; pista?: string }> }> = {
  hematologia: {
    etiqueta: 'Hematología',
    campos: [
      { clave: 'hemoglobina', etiqueta: 'Hemoglobina', pista: 'g/dL' },
      { clave: 'leucocitos', etiqueta: 'Leucocitos', pista: '×10³/µL' },
    ],
  },
  orina: {
    etiqueta: 'Orina',
    campos: [
      { clave: 'color', etiqueta: 'Color' },
      { clave: 'ph', etiqueta: 'pH' },
    ],
  },
  cultivo: {
    etiqueta: 'Cultivo',
    campos: [
      { clave: 'organismo', etiqueta: 'Organismo aislado' },
      { clave: 'sensibleA', etiqueta: 'Sensible a' },
    ],
  },
  otro: { etiqueta: 'Otro', campos: [{ clave: 'descripcion', etiqueta: 'Descripción' }] },
};

const ESTADOS_PIEZA = ['sano', 'caries', 'obturado', 'corona', 'ausente', 'implante', 'endodoncia', 'otro'] as const;

const ARCADAS = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

export function Hoja({
  seccion,
  expediente,
  ocupado,
  onEnviar,
  auditoria,
}: {
  seccion: Seccion;
  expediente: ExpedienteVista;
  ocupado: boolean;
  onEnviar: Enviar;
  auditoria: AuditoriaVista;
}) {
  const props: AccionProps = {
    expediente,
    base: `/pacientes/${expediente.pacienteId}`,
    cerrado: expediente.estado === 'archivado',
    ocupado,
    onEnviar,
  };
  switch (seccion) {
    case 'resumen':
      return <Resumen expediente={expediente} />;
    case 'consultas':
      return <Consultas {...props} />;
    case 'agenda':
      return <Agenda {...props} />;
    case 'laboratorio':
      return <Laboratorio {...props} />;
    case 'crecimiento':
      return <Crecimiento {...props} />;
    case 'vacunas':
      return <Vacunas {...props} />;
    case 'accesos':
      return <Accesos auditoria={auditoria} />;
    default:
      return <Odontograma {...props} />;
  }
}

/* ───────────── Piezas compartidas ───────────── */

function Barra({
  titulo,
  descripcion,
  clasificacion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  clasificacion?: 'confidencial' | 'restringido';
  accion?: ReactNode;
}) {
  return (
    <div className="seccion__barra">
      <div>
        <h3>
          {titulo} {clasificacion ? <EtiquetaClasificacion nivel={clasificacion} /> : null}
        </h3>
        {descripcion ? <p>{descripcion}</p> : null}
      </div>
      {accion}
    </div>
  );
}

function SoloLectura({ cerrado }: { cerrado: boolean }) {
  return cerrado ? (
    <Alerta tono="info" titulo="Expediente archivado">
      Puedes consultar el historial, pero ya no admite registros nuevos.
    </Alerta>
  ) : null;
}

function BotonAgregar({ cerrado, onClick, children }: { cerrado: boolean; onClick: () => void; children: ReactNode }) {
  if (cerrado) return null;
  return (
    <Boton variante="primary" icono="mas" onClick={onClick}>
      {children}
    </Boton>
  );
}

function PieDialogo({ onCancelar, ocupado, texto }: { onCancelar: () => void; ocupado: boolean; texto: string }) {
  return (
    <>
      <Boton variante="ghost" onClick={onCancelar}>
        Cancelar
      </Boton>
      <Boton type="submit" variante="primary" cargando={ocupado}>
        {texto}
      </Boton>
    </>
  );
}

/* ───────────── Resumen ───────────── */

function Resumen({ expediente }: { expediente: ExpedienteVista }) {
  const proximas = expediente.citas
    .filter((cita) => cita.estado === 'programada')
    .sort((a, b) => parsearFecha(a.inicio).getTime() - parsearFecha(b.inicio).getTime());
  const dosis = expediente.vacunas
    .filter((vacuna) => !vacuna.aplicadaEn || parsearFecha(vacuna.proximaEn) > parsearFecha(vacuna.aplicadaEn))
    .sort((a, b) => parsearFecha(a.proximaEn).getTime() - parsearFecha(b.proximaEn).getTime());
  const diagnosticos = expediente.consultas.flatMap((consulta) =>
    consulta.diagnosticos.map((diagnostico) => ({ ...diagnostico, cuando: consulta.ocurridaEn })),
  );

  const actividad = useMemo(
    () =>
      [
        ...expediente.consultas.map((c) => ({ cuando: c.ocurridaEn, titulo: c.motivo, tipo: 'Consulta', icono: 'estetoscopio' as NombreIcono })),
        ...expediente.citas.map((c) => ({ cuando: c.inicio, titulo: c.motivo, tipo: `Cita ${c.estado}`, icono: 'calendario' as NombreIcono })),
        ...expediente.examenes.map((e) => ({ cuando: e.fecha, titulo: TIPOS_EXAMEN[e.tipoExamen]?.etiqueta ?? e.tipoExamen, tipo: 'Laboratorio', icono: 'matraz' as NombreIcono })),
        ...expediente.mediciones.map((m) => ({ cuando: m.fecha, titulo: `${m.pesoKg} kg · ${m.tallaCm} cm`, tipo: 'Medición', icono: 'regla' as NombreIcono })),
        ...(expediente.procedimientos ?? []).map((p) => ({ cuando: p.realizadoEn, titulo: `${p.tipo} · pieza ${p.codigoFdi}`, tipo: 'Procedimiento', icono: 'diente' as NombreIcono })),
      ]
        .sort((a, b) => parsearFecha(b.cuando).getTime() - parsearFecha(a.cuando).getTime())
        .slice(0, 8),
    [expediente],
  );

  return (
    <div className="seccion">
      <dl className="stats">
        <div className="stat">
          <dt>Consultas</dt>
          <dd>{expediente.consultas.length}</dd>
        </div>
        <div className="stat">
          <dt>Citas próximas</dt>
          <dd>{proximas.length}</dd>
        </div>
        <div className="stat">
          <dt>Exámenes</dt>
          <dd>{expediente.examenes.length}</dd>
        </div>
        <div className="stat">
          <dt>Dosis pendientes</dt>
          <dd>{dosis.length}</dd>
        </div>
      </dl>

      <div className="graficas">
        <section className="card">
          <div className="card__header">
            <h4>Diagnósticos</h4>
            <EtiquetaClasificacion nivel="restringido" />
          </div>
          <div className="card__body">
            {diagnosticos.length === 0 ? (
              <p className="muted">Sin diagnósticos registrados.</p>
            ) : (
              <ul style={{ display: 'grid', gap: 8 }}>
                {diagnosticos.slice(0, 5).map((d) => (
                  <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>
                      {d.textoLibre} {d.esPrincipal ? <Insignia tono="neutral">Principal</Insignia> : null}
                    </span>
                    <time className="muted">{fechaLegible(d.cuando)}</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        <section className="card">
          <div className="card__header">
            <h4>Próximo</h4>
          </div>
          <div className="card__body">
            {proximas.length === 0 && dosis.length === 0 ? (
              <p className="muted">Nada programado.</p>
            ) : (
              <ul style={{ display: 'grid', gap: 8 }}>
                {proximas.slice(0, 3).map((cita) => (
                  <li key={cita.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>
                      <Icono nombre="calendario" className="muted" /> {cita.motivo}
                    </span>
                    <time className="muted">{fechaHora(cita.inicio)}</time>
                  </li>
                ))}
                {dosis.slice(0, 3).map((vacuna) => (
                  <li key={vacuna.codigo} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span className="mono">{vacuna.codigo}</span>
                    <EstadoDosis fecha={vacuna.proximaEn} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card__header">
          <h4>Actividad reciente</h4>
        </div>
        <div className="card__body" style={{ paddingBlock: 4 }}>
          {actividad.length === 0 ? (
            <Vacio icono="nota" titulo="Expediente nuevo">
              Todavía no hay registros. Empieza por una consulta.
            </Vacio>
          ) : (
            <ol className="timeline">
              {actividad.map((evento, indice) => (
                <li key={`${evento.tipo}-${evento.cuando}-${indice}`} className="timeline__item">
                  <span className="timeline__dot">
                    <Icono nombre={evento.icono} />
                  </span>
                  <span>
                    <span className="timeline__title">{evento.titulo}</span>
                    <span className="timeline__meta" style={{ display: 'block' }}>
                      {evento.tipo}
                    </span>
                  </span>
                  <time dateTime={evento.cuando}>{fechaLegible(evento.cuando)}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

/* ───────────── Consultas ───────────── */

type DialogoConsulta = { tipo: 'consulta' } | { tipo: 'diagnostico' | 'receta'; consultaId: string; motivo: string } | null;

function Consultas({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [dialogo, setDialogo] = useState<DialogoConsulta>(null);
  const consultas = [...expediente.consultas].sort(
    (a, b) => parsearFecha(b.ocurridaEn).getTime() - parsearFecha(a.ocurridaEn).getTime(),
  );

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra
        titulo="Consultas"
        descripcion="Cada consulta agrupa sus diagnósticos y recetas."
        clasificacion="restringido"
        accion={
          <BotonAgregar cerrado={cerrado} onClick={() => setDialogo({ tipo: 'consulta' })}>
            Nueva consulta
          </BotonAgregar>
        }
      />
      {consultas.length === 0 ? (
        <div className="card">
          <Vacio
            icono="estetoscopio"
            titulo="Sin consultas"
            accion={
              cerrado ? undefined : (
                <Boton icono="mas" onClick={() => setDialogo({ tipo: 'consulta' })}>
                  Registrar la primera
                </Boton>
              )
            }
          >
            Las consultas son la base del expediente: diagnósticos y recetas cuelgan de ellas.
          </Vacio>
        </div>
      ) : (
        consultas.map((consulta) => (
          <article key={consulta.id} className="card">
            <div className="card__body consulta">
              <div className="consulta__cabeza">
                <div>
                  <h3>{consulta.motivo}</h3>
                  <time dateTime={consulta.ocurridaEn}>{fechaHora(consulta.ocurridaEn)}</time>
                </div>
                {cerrado ? null : (
                  <div className="consulta__acciones">
                    <Boton
                      tamano="sm"
                      icono="nota"
                      onClick={() => setDialogo({ tipo: 'diagnostico', consultaId: consulta.id, motivo: consulta.motivo })}
                    >
                      Diagnóstico
                    </Boton>
                    <Boton
                      tamano="sm"
                      icono="pastilla"
                      onClick={() => setDialogo({ tipo: 'receta', consultaId: consulta.id, motivo: consulta.motivo })}
                    >
                      Receta
                    </Boton>
                  </div>
                )}
              </div>
              {consulta.notas ? <p className="consulta__notas">{consulta.notas}</p> : null}
              {consulta.diagnosticos.length + consulta.recetas.length > 0 ? (
                <ul className="consulta__items">
                  {consulta.diagnosticos.map((item) => (
                    <li key={item.id} className="item-clinico">
                      <span className="item-clinico__tipo">DIAGNÓSTICO</span>
                      <span>
                        {item.textoLibre} {item.esPrincipal ? <Insignia>Principal</Insignia> : null}
                      </span>
                    </li>
                  ))}
                  {consulta.recetas.map((item) => (
                    <li key={item.id} className="item-clinico">
                      <span className="item-clinico__tipo">RECETA</span>
                      <span>
                        {item.textoLibre}{' '}
                        <span className="item-clinico__detalle">
                          · {item.dosis} · {item.frecuencia}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                  Sin diagnósticos ni recetas.
                </p>
              )}
            </div>
          </article>
        ))
      )}

      <DialogoNuevaConsulta
        abierto={dialogo?.tipo === 'consulta'}
        expediente={expediente}
        ocupado={ocupado}
        onCerrar={() => setDialogo(null)}
        onEnviar={async (cuerpo) => (await onEnviar(`${base}/consultas`, cuerpo, 'Consulta registrada.')) && setDialogo(null)}
      />
      {dialogo && dialogo.tipo === 'diagnostico' ? (
        <DialogoDiagnostico
          motivo={dialogo.motivo}
          ocupado={ocupado}
          onCerrar={() => setDialogo(null)}
          onEnviar={async (cuerpo) =>
            (await onEnviar(`${base}/consultas/${dialogo.consultaId}/diagnosticos`, cuerpo, 'Diagnóstico agregado.')) && setDialogo(null)
          }
        />
      ) : null}
      {dialogo && dialogo.tipo === 'receta' ? (
        <DialogoReceta
          motivo={dialogo.motivo}
          ocupado={ocupado}
          onCerrar={() => setDialogo(null)}
          onEnviar={async (cuerpo) =>
            (await onEnviar(`${base}/consultas/${dialogo.consultaId}/recetas`, cuerpo, 'Medicamento recetado.')) && setDialogo(null)
          }
        />
      ) : null}
    </div>
  );
}

function DialogoNuevaConsulta({
  abierto,
  expediente,
  ocupado,
  onCerrar,
  onEnviar,
}: {
  abierto: boolean;
  expediente: ExpedienteVista;
  ocupado: boolean;
  onCerrar: () => void;
  onEnviar: (cuerpo: unknown) => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [citaId, setCitaId] = useState('');
  const citas = expediente.citas.filter((cita) => cita.estado === 'programada');
  return (
    <Dialogo
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva consulta"
      descripcion="Se registra con la fecha y hora actuales."
      onEnviar={() => motivo.trim() && onEnviar({ motivo: motivo.trim(), notas: notas.trim() || undefined, citaId: citaId || undefined })}
      pie={<PieDialogo onCancelar={onCerrar} ocupado={ocupado} texto="Registrar consulta" />}
    >
      <div className="form-grid">
        <Campo etiqueta="Motivo de consulta">
          {(p) => <input {...p} className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Control de presión arterial" maxLength={250} required autoFocus />}
        </Campo>
        <Campo etiqueta="Notas" opcional>
          {(p) => <textarea {...p} className="textarea" value={notas} onChange={(e) => setNotas(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Cita que se atiende" opcional pista={citas.length === 0 ? 'No hay citas programadas.' : 'La cita queda marcada como atendida.'}>
          {(p) => (
            <select {...p} className="select" value={citaId} onChange={(e) => setCitaId(e.target.value)} disabled={citas.length === 0}>
              <option value="">Sin cita previa</option>
              {citas.map((cita) => (
                <option key={cita.id} value={cita.id}>
                  {fechaHora(cita.inicio)} · {cita.motivo}
                </option>
              ))}
            </select>
          )}
        </Campo>
      </div>
    </Dialogo>
  );
}

function DialogoDiagnostico({
  motivo,
  ocupado,
  onCerrar,
  onEnviar,
}: {
  motivo: string;
  ocupado: boolean;
  onCerrar: () => void;
  onEnviar: (cuerpo: unknown) => void;
}) {
  const [texto, setTexto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [principal, setPrincipal] = useState(true);
  return (
    <Dialogo
      abierto
      onCerrar={onCerrar}
      titulo="Agregar diagnóstico"
      descripcion={`Consulta: ${motivo}`}
      onEnviar={() => texto.trim() && onEnviar({ textoLibre: texto.trim(), esPrincipal: principal, catalogoCodigo: codigo.trim() || undefined })}
      pie={<PieDialogo onCancelar={onCerrar} ocupado={ocupado} texto="Agregar" />}
    >
      <div className="form-grid">
        <Alerta tono="warning">Dato restringido: el acceso queda en la auditoría y nunca se escribe en logs.</Alerta>
        <Campo etiqueta="Diagnóstico">
          {(p) => <input {...p} className="input" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={350} required autoFocus />}
        </Campo>
        <Campo etiqueta="Código CIE-10" opcional>
          {(p) => <input {...p} className="input mono" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej. I10" />}
        </Campo>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} />
          Diagnóstico principal de la consulta
        </label>
      </div>
    </Dialogo>
  );
}

function DialogoReceta({
  motivo,
  ocupado,
  onCerrar,
  onEnviar,
}: {
  motivo: string;
  ocupado: boolean;
  onCerrar: () => void;
  onEnviar: (cuerpo: unknown) => void;
}) {
  const [medicamento, setMedicamento] = useState('');
  const [dosis, setDosis] = useState('');
  const [frecuencia, setFrecuencia] = useState('Cada 8 horas');
  const [dias, setDias] = useState('');
  return (
    <Dialogo
      abierto
      onCerrar={onCerrar}
      titulo="Recetar medicamento"
      descripcion={`Consulta: ${motivo}`}
      onEnviar={() =>
        medicamento.trim() &&
        dosis.trim() &&
        onEnviar({ textoLibre: medicamento.trim(), dosis: dosis.trim(), frecuencia, duracionDias: dias ? Number(dias) : undefined })
      }
      pie={<PieDialogo onCancelar={onCerrar} ocupado={ocupado} texto="Recetar" />}
    >
      <div className="form-grid form-grid--2">
        <Campo etiqueta="Medicamento" className="span-2">
          {(p) => <input {...p} className="input" value={medicamento} onChange={(e) => setMedicamento(e.target.value)} placeholder="Ej. Paracetamol 500 mg" required autoFocus />}
        </Campo>
        <Campo etiqueta="Dosis">
          {(p) => <input {...p} className="input" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="1 tableta" required />}
        </Campo>
        <Campo etiqueta="Frecuencia">
          {(p) => (
            <select {...p} className="select" value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
              {['Cada 4 horas', 'Cada 6 horas', 'Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dosis única', 'Según necesidad'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Duración (días)" opcional>
          {(p) => <input {...p} className="input" type="number" min={1} value={dias} onChange={(e) => setDias(e.target.value)} />}
        </Campo>
      </div>
    </Dialogo>
  );
}

/* ───────────── Agenda ───────────── */

const TONO_CITA: Record<string, Tono> = { programada: 'info', atendida: 'success', cancelada: 'neutral', inasistencia: 'warning' };

function Agenda({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [abierto, setAbierto] = useState(false);
  const [inicio, setInicio] = useState(hoyHora(9));
  const [duracion, setDuracion] = useState('30');
  const [motivo, setMotivo] = useState('');
  const citas = [...expediente.citas].sort((a, b) => parsearFecha(b.inicio).getTime() - parsearFecha(a.inicio).getTime());

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra
        titulo="Agenda"
        descripcion="Las citas no pueden solaparse; el motor lo garantiza."
        accion={
          <BotonAgregar cerrado={cerrado} onClick={() => setAbierto(true)}>
            Reservar cita
          </BotonAgregar>
        }
      />
      {citas.length === 0 ? (
        <div className="card">
          <Vacio icono="calendario" titulo="Sin citas">
            Reserva una cita para este paciente.
          </Vacio>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Duración</th>
                <th scope="col">Motivo</th>
                <th scope="col">Estado</th>
                <th scope="col" className="acciones">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <td>
                    <time dateTime={cita.inicio}>{fechaHora(cita.inicio)}</time>
                  </td>
                  <td className="muted">{Math.round((parsearFecha(cita.fin).getTime() - parsearFecha(cita.inicio).getTime()) / 60000)} min</td>
                  <td>{cita.motivo}</td>
                  <td>
                    <Insignia tono={TONO_CITA[cita.estado] ?? 'neutral'} punto>
                      <span style={{ textTransform: 'capitalize' }}>{cita.estado}</span>
                    </Insignia>
                  </td>
                  <td className="acciones">
                    {cita.estado === 'programada' && !cerrado ? (
                      <span style={{ display: 'inline-flex', gap: 4 }}>
                        <Boton variante="ghost" tamano="sm" disabled={ocupado} onClick={() => void onEnviar(`${base}/citas/${cita.id}/cerrar`, { estado: 'inasistencia' }, 'Inasistencia registrada.')}>
                          No asistió
                        </Boton>
                        <Boton variante="ghost" tamano="sm" disabled={ocupado} onClick={() => void onEnviar(`${base}/citas/${cita.id}/cerrar`, { estado: 'cancelada' }, 'Cita cancelada.')}>
                          Cancelar
                        </Boton>
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Reservar cita"
        onEnviar={async () => {
          if (!motivo.trim()) return;
          const desde = new Date(inicio);
          const hasta = new Date(desde.getTime() + Number(duracion) * 60000);
          if (await onEnviar(`${base}/citas`, { inicio: desde.toISOString(), fin: hasta.toISOString(), motivo: motivo.trim() }, 'Cita reservada.')) {
            setAbierto(false);
            setMotivo('');
          }
        }}
        pie={<PieDialogo onCancelar={() => setAbierto(false)} ocupado={ocupado} texto="Reservar" />}
      >
        <div className="form-grid form-grid--2">
          <Campo etiqueta="Inicio">
            {(p) => <input {...p} className="input" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} required />}
          </Campo>
          <Campo etiqueta="Duración">
            {(p) => (
              <select {...p} className="select" value={duracion} onChange={(e) => setDuracion(e.target.value)}>
                {['15', '30', '45', '60', '90'].map((m) => (
                  <option key={m} value={m}>
                    {m} minutos
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo etiqueta="Motivo" className="span-2">
            {(p) => <input {...p} className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. Control mensual" required />}
          </Campo>
        </div>
      </Dialogo>
    </div>
  );
}

/* ───────────── Laboratorio ───────────── */

const TONO_EXAMEN: Record<string, Tono> = { registrado: 'info', validado: 'success', anulado: 'neutral' };

function Laboratorio({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('hematologia');
  const [fecha, setFecha] = useState(hoyIso());
  const [valores, setValores] = useState<Record<string, string>>({});
  const definicion = TIPOS_EXAMEN[tipo];
  const examenes = [...expediente.examenes].sort((a, b) => parsearFecha(b.fecha).getTime() - parsearFecha(a.fecha).getTime());
  const completo = definicion.campos.every((campo) => valores[campo.clave]?.trim());

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra
        titulo="Resultados de laboratorio"
        descripcion="Cada tipo de examen tiene su propia estructura."
        clasificacion="restringido"
        accion={
          <BotonAgregar cerrado={cerrado} onClick={() => setAbierto(true)}>
            Registrar resultado
          </BotonAgregar>
        }
      />
      {examenes.length === 0 ? (
        <div className="card">
          <Vacio icono="matraz" titulo="Sin resultados">
            Hematología, orina y cultivo piden campos distintos.
          </Vacio>
        </div>
      ) : (
        <div className="grid-cards">
          {examenes.map((examen) => {
            const estado = examen.estado ?? 'registrado';
            return (
              <article key={examen.id} className="card" style={estado === 'anulado' ? { opacity: 0.65 } : undefined}>
                <div className="card__header">
                  <div>
                    <h4>{TIPOS_EXAMEN[examen.tipoExamen]?.etiqueta ?? examen.tipoExamen}</h4>
                    <time className="muted" style={{ fontSize: 'var(--text-sm)' }} dateTime={examen.fecha}>
                      {fechaLegible(examen.fecha)}
                    </time>
                  </div>
                  <Insignia tono={TONO_EXAMEN[estado] ?? 'neutral'} punto>
                    <span style={{ textTransform: 'capitalize' }}>{estado}</span>
                  </Insignia>
                </div>
                <div className="card__body">
                  <dl className="kv">
                    {Object.entries(examen.valores).map(([campo, valor]) => (
                      <div key={campo}>
                        <dt>{etiquetaCampo(examen.tipoExamen, campo)}</dt>
                        <dd>{valor}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {!cerrado && estado === 'registrado' ? (
                  <div className="card__footer">
                    <Boton variante="ghost" tamano="sm" disabled={ocupado} onClick={() => void onEnviar(`${base}/examenes/${examen.id}/dictamen`, { estado: 'anulado' }, 'Resultado anulado.')}>
                      Anular
                    </Boton>
                    <Boton variante="primary" tamano="sm" icono="check" disabled={ocupado} onClick={() => void onEnviar(`${base}/examenes/${examen.id}/dictamen`, { estado: 'validado' }, 'Resultado validado.')}>
                      Validar
                    </Boton>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Registrar resultado"
        descripcion="Los campos cambian según el tipo de examen."
        onEnviar={async () => {
          if (!completo) return;
          const cuerpo = Object.fromEntries(definicion.campos.map((c) => [c.clave, valores[c.clave].trim()]));
          if (await onEnviar(`${base}/examenes`, { tipoExamen: tipo, fecha, valores: cuerpo }, 'Resultado registrado.')) {
            setAbierto(false);
            setValores({});
          }
        }}
        pie={<PieDialogo onCancelar={() => setAbierto(false)} ocupado={ocupado} texto="Guardar resultado" />}
      >
        <div className="form-grid form-grid--2">
          <div className="field span-2">
            <span className="field__label" id="tipo-examen">
              Tipo de examen
            </span>
            <div className="segmented" role="radiogroup" aria-labelledby="tipo-examen">
              {Object.entries(TIPOS_EXAMEN).map(([clave, def]) => (
                <label key={clave}>
                  <input
                    type="radio"
                    name="tipo-examen"
                    checked={tipo === clave}
                    onChange={() => {
                      setTipo(clave);
                      setValores({});
                    }}
                  />
                  {def.etiqueta}
                </label>
              ))}
            </div>
          </div>
          <Campo etiqueta="Fecha de toma">
            {(p) => <input {...p} className="input" type="date" max={hoyIso()} value={fecha} onChange={(e) => setFecha(e.target.value)} required />}
          </Campo>
          <span />
          {definicion.campos.map((campo) => (
            <Campo key={`${tipo}-${campo.clave}`} etiqueta={campo.etiqueta} pista={campo.pista} className={definicion.campos.length === 1 ? 'span-2' : ''}>
              {(p) => (
                <input
                  {...p}
                  className="input"
                  value={valores[campo.clave] ?? ''}
                  onChange={(e) => setValores((actual) => ({ ...actual, [campo.clave]: e.target.value }))}
                  required
                />
              )}
            </Campo>
          ))}
        </div>
      </Dialogo>
    </div>
  );
}

function etiquetaCampo(tipo: string, clave: string): string {
  const campo = TIPOS_EXAMEN[tipo]?.campos.find((c) => c.clave === clave);
  return campo ? `${campo.etiqueta}${campo.pista ? ` (${campo.pista})` : ''}` : clave;
}

/* ───────────── Crecimiento ───────────── */

function Crecimiento({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(hoyIso());
  const [peso, setPeso] = useState('');
  const [talla, setTalla] = useState('');
  const [verTabla, setVerTabla] = useState(false);
  const mediciones = [...expediente.mediciones].sort((a, b) => parsearFecha(a.fecha).getTime() - parsearFecha(b.fecha).getTime());

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra
        titulo="Curva de crecimiento"
        descripcion="Peso y talla en el tiempo."
        clasificacion="restringido"
        accion={
          <span style={{ display: 'flex', gap: 8 }}>
            {mediciones.length > 0 ? (
              <Boton variante="ghost" aria-pressed={verTabla} onClick={() => setVerTabla((v) => !v)}>
                {verTabla ? 'Ver gráfica' : 'Ver tabla'}
              </Boton>
            ) : null}
            <BotonAgregar cerrado={cerrado} onClick={() => setAbierto(true)}>
              Nueva medición
            </BotonAgregar>
          </span>
        }
      />
      {mediciones.length === 0 ? (
        <div className="card">
          <Vacio icono="grafica" titulo="Sin mediciones">
            Registra peso y talla para trazar la curva.
          </Vacio>
        </div>
      ) : verTabla ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Peso (kg)</th>
                <th scope="col">Talla (cm)</th>
              </tr>
            </thead>
            <tbody>
              {[...mediciones].reverse().map((m) => (
                <tr key={m.fecha}>
                  <td>{fechaLegible(m.fecha)}</td>
                  <td>{m.pesoKg}</td>
                  <td>{m.tallaCm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="graficas">
          <Grafica titulo="Peso" unidad="kg" puntos={mediciones.map((m) => ({ fecha: m.fecha, valor: m.pesoKg }))} />
          <Grafica titulo="Talla" unidad="cm" puntos={mediciones.map((m) => ({ fecha: m.fecha, valor: m.tallaCm }))} />
        </div>
      )}

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Nueva medición"
        pequeno
        onEnviar={async () => {
          const kg = Number(peso.replace(',', '.'));
          const cm = Number(talla.replace(',', '.'));
          if (!(kg > 0 && cm > 0)) return;
          if (await onEnviar(`${base}/mediciones`, { fecha, pesoKg: kg, tallaCm: cm }, 'Medición registrada.')) {
            setAbierto(false);
            setPeso('');
            setTalla('');
          }
        }}
        pie={<PieDialogo onCancelar={() => setAbierto(false)} ocupado={ocupado} texto="Registrar" />}
      >
        <div className="form-grid form-grid--2">
          <Campo etiqueta="Fecha" className="span-2">
            {(p) => <input {...p} className="input" type="date" max={hoyIso()} value={fecha} onChange={(e) => setFecha(e.target.value)} required />}
          </Campo>
          <Campo etiqueta="Peso" pista="kg">
            {(p) => <input {...p} className="input num" value={peso} onChange={(e) => setPeso(e.target.value)} inputMode="decimal" placeholder="12.4" required autoFocus />}
          </Campo>
          <Campo etiqueta="Talla" pista="cm">
            {(p) => <input {...p} className="input num" value={talla} onChange={(e) => setTalla(e.target.value)} inputMode="decimal" placeholder="86" required />}
          </Campo>
        </div>
      </Dialogo>
    </div>
  );
}

/* ───────────── Vacunas ───────────── */

function EstadoDosis({ fecha }: { fecha: string }) {
  if (vencida(fecha)) {
    return (
      <Insignia tono="danger" punto>
        Vencida · {fechaRelativa(fecha)}
      </Insignia>
    );
  }
  return (
    <Insignia tono="info" punto>
      {fechaRelativa(fecha)}
    </Insignia>
  );
}

function Vacunas({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [proximaEn, setProximaEn] = useState(hoyIso(30));
  const [aplicadaEn, setAplicadaEn] = useState('');
  const vacunas = [...expediente.vacunas].sort((a, b) => parsearFecha(a.proximaEn).getTime() - parsearFecha(b.proximaEn).getTime());
  const vencidas = vacunas.filter((v) => vencida(v.proximaEn)).length;

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra
        titulo="Esquema de vacunación"
        descripcion="Ordenado por próxima dosis."
        clasificacion="restringido"
        accion={
          <BotonAgregar cerrado={cerrado} onClick={() => setAbierto(true)}>
            Programar dosis
          </BotonAgregar>
        }
      />
      {vencidas > 0 ? (
        <Alerta tono="warning" titulo={`${vencidas} ${vencidas === 1 ? 'dosis vencida' : 'dosis vencidas'}`}>
          Revisa el esquema y reprograma.
        </Alerta>
      ) : null}
      {vacunas.length === 0 ? (
        <div className="card">
          <Vacio icono="jeringa" titulo="Esquema vacío">
            Programa la primera dosis.
          </Vacio>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Vacuna</th>
                <th scope="col">Última aplicación</th>
                <th scope="col">Próxima dosis</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {vacunas.map((vacuna) => (
                <tr key={vacuna.codigo}>
                  <td className="mono">{vacuna.codigo}</td>
                  <td className="muted">{vacuna.aplicadaEn ? fechaLegible(vacuna.aplicadaEn) : '—'}</td>
                  <td>{fechaLegible(vacuna.proximaEn)}</td>
                  <td>
                    <EstadoDosis fecha={vacuna.proximaEn} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Programar dosis"
        pequeno
        onEnviar={async () => {
          if (!codigo.trim()) return;
          if (await onEnviar(`${base}/vacunas`, { codigo: codigo.trim(), proximaEn, aplicadaEn: aplicadaEn || undefined }, 'Dosis programada.')) {
            setAbierto(false);
            setCodigo('');
            setAplicadaEn('');
          }
        }}
        pie={<PieDialogo onCancelar={() => setAbierto(false)} ocupado={ocupado} texto="Programar" />}
      >
        <div className="form-grid">
          <Campo etiqueta="Vacuna" pista="Código del esquema nacional, ej. SRP, DPT, BCG">
            {(p) => <input {...p} className="input mono" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required autoFocus />}
          </Campo>
          <Campo etiqueta="Aplicada el" opcional>
            {(p) => <input {...p} className="input" type="date" max={hoyIso()} value={aplicadaEn} onChange={(e) => setAplicadaEn(e.target.value)} />}
          </Campo>
          <Campo etiqueta="Próxima dosis">
            {(p) => <input {...p} className="input" type="date" value={proximaEn} onChange={(e) => setProximaEn(e.target.value)} required />}
          </Campo>
        </div>
      </Dialogo>
    </div>
  );
}

/* ───────────── Odontograma ───────────── */

function Odontograma({ expediente, base, cerrado, ocupado, onEnviar }: AccionProps) {
  const [activa, setActiva] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [consultaId, setConsultaId] = useState(expediente.consultas[0]?.id ?? '');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const estadoDe = (codigo: number) => expediente.piezas.find((pieza) => pieza.codigoFdi === codigo)?.estado ?? 'sano';
  const procedimientos = (expediente.procedimientos ?? []).filter((item) => item.codigoFdi === activa);
  const conteo = ESTADOS_PIEZA.filter((e) => e !== 'sano')
    .map((estado) => [estado, expediente.piezas.filter((p) => p.estado === estado).length] as const)
    .filter(([, n]) => n > 0);

  return (
    <div className="seccion">
      <SoloLectura cerrado={cerrado} />
      <Barra titulo="Odontograma" descripcion="Dentición permanente, notación FDI. Selecciona una pieza." clasificacion="restringido" />
      <section className="card">
        <div className="odontograma" role="group" aria-label="Odontograma">
          {ARCADAS.map((fila, indice) => (
            <div key={fila[0]}>
              {indice === 1 ? <div className="arcada__sep" aria-hidden="true" /> : null}
              <div className="arcada">
                {fila.map((codigo) => (
                  <button
                    key={codigo}
                    type="button"
                    className={`diente estado-${estadoDe(codigo)}`}
                    aria-pressed={activa === codigo}
                    aria-label={`Pieza ${codigo}, ${estadoDe(codigo)}`}
                    onClick={() => setActiva(activa === codigo ? null : codigo)}
                  >
                    <span className="diente__marca" />
                    {codigo}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card__footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div className="leyenda" aria-label="Leyenda">
            {ESTADOS_PIEZA.map((estado) => (
              <span key={estado} className={`estado-${estado}`}>
                <span className="diente__marca" /> {estado}
              </span>
            ))}
          </div>
          <span className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            {conteo.length === 0 ? 'Todas las piezas sanas' : conteo.map(([e, n]) => `${n} ${e}`).join(' · ')}
          </span>
        </div>
      </section>

      {activa ? (
        <section className="card aparece">
          <div className="card__header">
            <h4>
              Pieza {activa} · <span style={{ textTransform: 'capitalize' }}>{estadoDe(activa)}</span>
            </h4>
            {!cerrado ? (
              <Boton tamano="sm" icono="mas" disabled={expediente.consultas.length === 0} onClick={() => setAbierto(true)}>
                Procedimiento
              </Boton>
            ) : null}
          </div>
          <div className="card__body" style={{ display: 'grid', gap: 16 }}>
            {!cerrado ? (
              <div>
                <p className="field__label" style={{ marginBottom: 8 }}>
                  Estado de la pieza
                </p>
                <div className="chips" role="group" aria-label={`Estado de la pieza ${activa}`}>
                  {ESTADOS_PIEZA.map((estado) => (
                    <button
                      key={estado}
                      type="button"
                      className={`chip estado-${estado}`}
                      aria-pressed={estadoDe(activa) === estado}
                      disabled={ocupado}
                      onClick={() => void onEnviar(`${base}/piezas`, { codigoFdi: activa, estado }, `Pieza ${activa}: ${estado}.`)}
                    >
                      <span className="diente__marca" />
                      {estado}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="field__label" style={{ marginBottom: 8 }}>
                Procedimientos
              </p>
              {procedimientos.length === 0 ? (
                <p className="muted">
                  {expediente.consultas.length === 0 ? 'Registra una consulta antes de anotar procedimientos.' : 'Sin procedimientos en esta pieza.'}
                </p>
              ) : (
                <ul className="consulta__items">
                  {procedimientos.map((item) => (
                    <li key={item.id} className="item-clinico">
                      <span className="item-clinico__tipo">{fechaLegible(item.realizadoEn)}</span>
                      <span>
                        <strong style={{ fontWeight: 500 }}>{item.tipo}</strong> <span className="item-clinico__detalle">· {item.descripcion}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activa ? (
        <Dialogo
          abierto={abierto}
          onCerrar={() => setAbierto(false)}
          titulo={`Procedimiento en pieza ${activa}`}
          onEnviar={async () => {
            if (!tipo.trim() || !descripcion.trim()) return;
            if (
              await onEnviar(
                `${base}/procedimientos`,
                { codigoFdi: activa, consultaId: consultaId || expediente.consultas[0]?.id, tipo: tipo.trim(), descripcion: descripcion.trim() },
                'Procedimiento registrado.',
              )
            ) {
              setAbierto(false);
              setTipo('');
              setDescripcion('');
            }
          }}
          pie={<PieDialogo onCancelar={() => setAbierto(false)} ocupado={ocupado} texto="Registrar" />}
        >
          <div className="form-grid">
            <Campo etiqueta="Consulta">
              {(p) => (
                <select {...p} className="select" value={consultaId} onChange={(e) => setConsultaId(e.target.value)}>
                  {expediente.consultas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {fechaLegible(c.ocurridaEn)} · {c.motivo}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            <Campo etiqueta="Tipo">
              {(p) => (
                <>
                  <input {...p} className="input" list="tipos-procedimiento" value={tipo} onChange={(e) => setTipo(e.target.value)} required autoFocus />
                  <datalist id="tipos-procedimiento">
                    {['Obturación', 'Extracción', 'Endodoncia', 'Corona', 'Limpieza', 'Sellante'].map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </>
              )}
            </Campo>
            <Campo etiqueta="Descripción">
              {(p) => <textarea {...p} className="textarea" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />}
            </Campo>
          </div>
        </Dialogo>
      ) : null}
    </div>
  );
}

/* ───────────── Accesos (bitácora de auditoría) ───────────── */

const TONO_ACCION: Record<string, Tono> = { lectura: 'info', escritura: 'warning' };

function Accesos({ auditoria }: { auditoria: AuditoriaVista }) {
  return (
    <div className="seccion">
      <Barra
        titulo="Accesos al expediente"
        descripcion="Quién consultó o modificó este historial. Solo metadatos: nunca el contenido clínico."
        clasificacion="restringido"
      />
      {auditoria.error ? <Alerta tono="danger" titulo="No se pudo leer la bitácora">{auditoria.error}</Alerta> : null}
      {auditoria.cargando ? (
        <div className="card">
          <div className="card__body" style={{ display: 'grid', gap: 10 }} aria-busy="true">
            {[0, 1, 2, 3].map((indice) => (
              <Esqueleto key={indice} ancho={indice % 2 === 0 ? '80%' : '60%'} />
            ))}
          </div>
        </div>
      ) : auditoria.entradas.length === 0 ? (
        <div className="card">
          <Vacio icono="escudo" titulo="Sin accesos registrados">
            La bitácora se llena con cada lectura o escritura del expediente.
          </Vacio>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Actor</th>
                <th scope="col">Acción</th>
                <th scope="col">Recurso</th>
              </tr>
            </thead>
            <tbody>
              {auditoria.entradas.map((entrada, indice) => (
                <tr key={`${entrada.ocurridoEn}-${entrada.actorId}-${indice}`}>
                  <td>
                    <time dateTime={entrada.ocurridoEn}>{fechaHora(entrada.ocurridoEn)}</time>
                  </td>
                  <td className="mono" title={entrada.actorId}>
                    {entrada.actorId.slice(0, 8)}
                  </td>
                  <td>
                    <Insignia tono={TONO_ACCION[entrada.accion] ?? 'neutral'} punto>
                      <span style={{ textTransform: 'capitalize' }}>{entrada.accion}</span>
                    </Insignia>
                  </td>
                  <td className="mono">{entrada.recurso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
